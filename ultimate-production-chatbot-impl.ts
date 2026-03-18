/**
 * Ultimate Production Chatbot - Implementation
 * 
 * Mandatory dual dependency system with Gemini and Context7
 * No disable flags - both components are always required
 */

import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import { LRUCache } from 'lru-cache';
import { z } from 'zod';

// Import types from contract
import {
  ChatbotConfig,
  ResolvedChatbotConfig,
  QuestionOptions,
  ChatbotResponse,
  Context7Document,
  DocumentationSource,
  TokenUsage,
  ChatbotError,
  ResponseMetadata,
  HealthStatus,
  ChatbotMetrics,
  CacheStats,
  UltimateChatbot,
  InputNormalization
} from './ultimate-production-chatbot';

// ===== CONFIGURATION VALIDATION =====

const ConfigSchema = z.object({
  googleApiKey: z.string().min(1, "Google API key is required").refine(val => val.trim().length > 0, "Google API key cannot be empty or whitespace only"),
  context7ApiKey: z.string().min(1, "Context7 API key is required").refine(val => val.trim().length > 0, "Context7 API key cannot be empty or whitespace only"),
  cacheMaxSize: z.number().min(1).default(100),
  cacheTTL: z.number().min(1000).default(1000 * 60 * 30), // 30 minutes
  rateLimitPerMinute: z.number().min(1).default(10),
  logLevel: z.enum(['error', 'warn', 'info', 'debug']).default('info')
});

const QuestionSchema = z.object({
  question: z.string()
    .min(1, 'Question cannot be empty')
    .max(10000, 'Question too long')
    .regex(/^[^<>]{1,10000}$/, 'Invalid characters in question'),
  options: z.object({
    useCache: z.boolean().optional(),
    timeoutMs: z.number().min(1000).max(60000).optional(),
    userId: z.string().min(1).max(100).optional(),
    sessionId: z.string().min(1).max(100).optional(),
    context7Library: z.string().optional(),
    context7MaxDocuments: z.number().min(1).max(50).optional()
  }).optional()
});

// ===== CONTEXT7 CLIENT =====

class Context7Client {
  private apiKey: string;
  private baseUrl: string = 'https://context7.com/api/v2';
  
  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }
  
  async searchLibrary(query: string, libraryName: string): Promise<{id: string; name: string; description: string}[]> {
    const url = new URL(`${this.baseUrl}/libs/search`);
    url.searchParams.append('query', query);
    url.searchParams.append('libraryName', libraryName);
    
    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('Context7 rate limit exceeded');
      }
      throw new Error(`Context7 API error: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
  }
  
  async getContext(query: string, libraryId: string): Promise<Context7Document[]> {
    const url = new URL(`${this.baseUrl}/context`);
    url.searchParams.append('query', query);
    url.searchParams.append('libraryId', libraryId);
    url.searchParams.append('type', 'json');
    
    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('Context7 rate limit exceeded');
      }
      throw new Error(`Context7 API error: ${response.status} ${response.statusText}`);
    }
    
    const docs = await response.json();
    return docs.map((doc: any, index: number) => ({
      id: `${libraryId}_${index}`,
      title: doc.title || 'Document',
      content: doc.content || '',
      sourceUrl: doc.source || libraryId,
      relevance: doc.relevance,
      lastUpdated: doc.lastUpdated
    }));
  }
}

// ===== RATE LIMITING =====

class TokenBucket {
  private tokens: number;
  private lastRefill: number;
  private readonly capacity: number;
  private readonly refillRate: number;

  constructor(capacity: number, refillRate: number) {
    this.capacity = capacity;
    this.refillRate = refillRate;
    this.tokens = capacity;
    this.lastRefill = Date.now();
  }

  consume(tokens: number = 1): boolean {
    this.refill();
    
    if (this.tokens >= tokens) {
      this.tokens -= tokens;
      return true;
    }
    
    return false;
  }

  private refill(): void {
    const now = Date.now();
    const timePassed = (now - this.lastRefill) / 1000;
    const tokensToAdd = Math.floor(timePassed * this.refillRate);
    
    if (tokensToAdd > 0) {
      this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
      this.lastRefill = now;
    }
  }

  timeUntilAvailable(tokens: number = 1): number {
    const available = this.getAvailableTokens();
    if (available >= tokens) return 0;
    
    const needed = tokens - available;
    return Math.ceil(needed / this.refillRate * 1000);
  }

  getAvailableTokens(): number {
    this.refill();
    return this.tokens;
  }
}

// ===== MAIN CHATBOT IMPLEMENTATION =====

export class UltimateProductionChatbot implements UltimateChatbot {
  private model: ReturnType<typeof google>;
  private context7Client: Context7Client;
  private cache: LRUCache<string, ChatbotResponse>;
  private requestBuckets: Map<string, TokenBucket>;
  private metrics: Map<string, number>;
  private config: ResolvedChatbotConfig;
  private startTime: number;

  constructor(config: ChatbotConfig) {
    // Validate and resolve configuration
    const envConfig = {
      googleApiKey: config.googleApiKey || process.env.GOOGLE_GENERATIVE_AI_API_KEY,
      context7ApiKey: config.context7ApiKey || process.env.CONTEXT7_API_KEY,
      cacheMaxSize: config.cacheMaxSize || 100,
      cacheTTL: config.cacheTTL || 1000 * 60 * 30,
      rateLimitPerMinute: config.rateLimitPerMinute || 10,
      logLevel: config.logLevel || 'info'
    };

    const validatedConfig = ConfigSchema.parse(envConfig);
    this.config = validatedConfig as ResolvedChatbotConfig;

    // Initialize Gemini model
    this.model = google("gemini-3.1-pro-preview", {
      apiKey: this.config.googleApiKey,
    });

    // Initialize Context7 client
    this.context7Client = new Context7Client(this.config.context7ApiKey);

    // Initialize cache
    this.cache = new LRUCache<string, ChatbotResponse>({
      max: this.config.cacheMaxSize,
      ttl: this.config.cacheTTL,
      allowStale: false,
      updateAgeOnGet: true,
    });

    // Initialize rate limiting
    this.requestBuckets = new Map();

    // Initialize metrics
    this.metrics = new Map([
      ['total_requests', 0],
      ['successful_requests', 0],
      ['failed_requests', 0],
      ['cache_hits', 0],
      ['cache_misses', 0],
      ['rate_limit_hits', 0],
      ['context7_calls', 0],
      ['context7_errors', 0],
      ['total_tokens', 0],
      ['total_response_time', 0]
    ]);

    this.startTime = Date.now();
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  private normalizeInput(question: string): string {
    return question
      .trim()
      .replace(/\s+/g, ' ')
      .normalize('NFC');
  }

  private getCacheKey(question: string): string {
    const normalized = this.normalizeInput(question);
    const components = {
      question: normalized,
      modelId: 'gemini-3.1-pro-preview',
      systemPromptVersion: 'v1',
      retrievalPipelineVersion: 'v1',
      groundingPolicyVersion: 'v1',
      schemaVersionHash: 'v1'
    };
    
    const keyString = JSON.stringify(components);
    return Buffer.from(keyString).toString('base64').substring(0, 50);
  }

  private getRateLimiter(identifier: string): TokenBucket {
    if (!this.requestBuckets.has(identifier)) {
      this.requestBuckets.set(identifier, new TokenBucket(
        this.config.rateLimitPerMinute,
        this.config.rateLimitPerMinute / 60
      ));
    }
    
    return this.requestBuckets.get(identifier)!;
  }

  private createError(
    code: string, 
    message: string, 
    type: ChatbotError['type'], 
    retryable: boolean = false,
    details?: Record<string, unknown>
  ): ChatbotError {
    return { code, message, type, retryable, details };
  }

  private async fetchContext7Documentation(
    question: string,
    libraryName?: string
  ): Promise<Context7Document[]> {
    try {
      this.metrics.set('context7_calls', (this.metrics.get('context7_calls') || 0) + 1);
      
      let libraryId: string | undefined;
      
      if (libraryName) {
        const libraries = await this.context7Client.searchLibrary(question, libraryName);
        if (libraries.length > 0) {
          libraryId = libraries[0].id;
        }
      }
      
      if (!libraryId) {
        // Common library detection
        const commonLibs: Record<string, string> = {
          'react': '/facebook/react',
          'next': '/vercel/next.js',
          'nextjs': '/vercel/next.js',
          'vue': '/vuejs/core',
          'angular': '/angular/angular',
          'node': '/nodejs/node',
          'express': '/expressjs/express',
          'typescript': '/microsoft/TypeScript',
          'javascript': '/mdn/javascript'
        };
        
        const lowerQuestion = question.toLowerCase();
        for (const [name, id] of Object.entries(commonLibs)) {
          if (lowerQuestion.includes(name)) {
            libraryId = id;
            break;
          }
        }
      }
      
      if (libraryId) {
        return await this.context7Client.getContext(question, libraryId);
      }
      
      return [];
    } catch (error) {
      this.metrics.set('context7_errors', (this.metrics.get('context7_errors') || 0) + 1);
      throw error;
    }
  }

  private formatTokenUsage(usage: any): TokenUsage {
    return {
      inputTokens: usage?.inputTokens || 0,
      outputTokens: usage?.outputTokens || 0,
      totalTokens: usage?.totalTokens || 0,
      reasoningTokens: usage?.reasoningTokens,
      cachedInputTokens: usage?.cachedInputTokens
    };
  }

  async askQuestion(
    question: string, 
    options: QuestionOptions = {}
  ): Promise<ChatbotResponse> {
    const startTime = Date.now();
    const requestId = this.generateRequestId();
    
    // Update metrics
    this.metrics.set('total_requests', (this.metrics.get('total_requests') || 0) + 1);
    
    // Validate input first - before any other processing
    try {
      const validated = QuestionSchema.parse({ question, options });
      const normalizedQuestion = this.normalizeInput(validated.question);
      
      // Additional validation for empty after normalization
      if (normalizedQuestion.trim().length === 0) {
        throw new Error('Question cannot be empty or whitespace only');
      }
      
      // Get user identifier for rate limiting
      const userId = options.userId || 'anonymous';
      const sessionId = options.sessionId || 'nosession';
      const identifier = `${userId}_${sessionId}`;

      // Rate limiting check
      const rateLimiter = this.getRateLimiter(identifier);
      
      if (!rateLimiter.consume()) {
        const timeUntilAvailable = rateLimiter.timeUntilAvailable();
        this.metrics.set('rate_limit_hits', (this.metrics.get('rate_limit_hits') || 0) + 1);
        
        return {
          success: false,
          responseTime: Date.now() - startTime,
          cached: false,
          timestamp: new Date().toISOString(),
          model: 'gemini-3.1-pro-preview',
          error: this.createError(
            'RATE_LIMIT_EXCEEDED',
            `Rate limit exceeded. Try again in ${Math.ceil(timeUntilAvailable / 1000)} seconds.`,
            'RATE_LIMIT',
            false,
            { timeUntilAvailable, identifier }
          ),
          metadata: {
            requestId,
            toolsUsed: false,
            context7Used: false,
            cacheHit: false,
            processingTime: Date.now() - startTime
          },
          pipeline: {
            context7Retrieval: 'failed',
            geminiGeneration: 'failed'
          }
        };
      }

      // Check cache
      const cacheKey = options.useCache !== false ? this.getCacheKey(normalizedQuestion) : '';
      
      if (cacheKey && this.cache.has(cacheKey)) {
        const cached = this.cache.get(cacheKey)!;
        this.metrics.set('cache_hits', (this.metrics.get('cache_hits') || 0) + 1);
        
        return {
          ...cached,
          cached: true,
          responseTime: Date.now() - startTime,
          metadata: {
            ...cached.metadata,
            requestId,
            processingTime: Date.now() - startTime
          }
        };
      }

      this.metrics.set('cache_misses', (this.metrics.get('cache_misses') || 0) + 1);

      // Stage 1: Context7 Retrieval (always required)
      let context7Docs: Context7Document[] = [];
      let retrievalSuccess = 'success' as const;
      
      try {
        context7Docs = await this.fetchContext7Documentation(
          normalizedQuestion, 
          options.context7Library
        );
      } catch (error) {
        retrievalSuccess = 'failed';
        throw error;
      }

      // Stage 2: Gemini Grounded Generation (always required)
      let generationSuccess = 'success' as const;
      
      // Build enhanced prompt with Context7 documentation
      let enhancedPrompt = normalizedQuestion;
      if (context7Docs.length > 0) {
        const contextText = context7Docs
          .map(doc => `## ${doc.title}\n${doc.content}\nSource: ${doc.sourceUrl}`)
          .join('\n\n');
        
        enhancedPrompt = `Based on the following documentation, answer the question:\n\n${contextText}\n\nQuestion: ${normalizedQuestion}`;
      }

      // Generate response
      const result = await generateText({
        model: this.model,
        prompt: enhancedPrompt,
        temperature: 0.1,
        maxSteps: 5,
        timeout: options.timeoutMs || 30000,
      });

      // Format response
      const response: ChatbotResponse = {
        success: true,
        answer: result.text,
        sources: [], // Will be populated from context7Docs if needed
        context7Sources: context7Docs,
        usage: this.formatTokenUsage(result.usage),
        responseTime: Date.now() - startTime,
        cached: false,
        timestamp: new Date().toISOString(),
        model: 'gemini-3.1-pro-preview',
        metadata: {
          requestId,
          userId: options.userId,
          sessionId: options.sessionId,
          toolsUsed: false,
          context7Used: context7Docs.length > 0,
          cacheHit: false,
          processingTime: Date.now() - startTime
        },
        pipeline: {
          context7Retrieval: retrievalSuccess,
          geminiGeneration: generationSuccess
        }
      };

      // Cache response
      if (cacheKey) {
        this.cache.set(cacheKey, response);
      }

      // Update metrics
      this.metrics.set('successful_requests', (this.metrics.get('successful_requests') || 0) + 1);
      this.metrics.set('total_tokens', (this.metrics.get('total_tokens') || 0) + (response.usage?.totalTokens || 0));
      this.metrics.set('total_response_time', (this.metrics.get('total_response_time') || 0) + response.responseTime);

      return response;

    } catch (error) {
      this.metrics.set('failed_requests', (this.metrics.get('failed_requests') || 0) + 1);
      
      // Check if this is a validation error
      if (error instanceof Error && (
        error.message.includes('Question cannot be empty') ||
        error.message.includes('Question too long') ||
        error.message.includes('Invalid characters') ||
        error.message.includes('Question cannot be empty or whitespace only')
      )) {
        return {
          success: false,
          responseTime: Date.now() - startTime,
          cached: false,
          timestamp: new Date().toISOString(),
          model: 'gemini-3.1-pro-preview',
          error: this.createError(
            'VALIDATION_ERROR',
            error.message,
            'VALIDATION',
            false,
            { requestId }
          ),
          metadata: {
            requestId,
            toolsUsed: false,
            context7Used: false,
            cacheHit: false,
            processingTime: Date.now() - startTime
          },
          pipeline: {
            context7Retrieval: 'failed',
            geminiGeneration: 'failed'
          }
        };
      }
      
      const errorResponse: ChatbotResponse = {
        success: false,
        responseTime: Date.now() - startTime,
        cached: false,
        timestamp: new Date().toISOString(),
        model: 'gemini-3.1-pro-preview',
        error: this.createError(
          'GENERATION_FAILED',
          error instanceof Error ? error.message : 'Unknown error occurred',
          'UPSTREAM',
          true,
          { requestId }
        ),
        metadata: {
          requestId,
          toolsUsed: false,
          context7Used: false,
          cacheHit: false,
          processingTime: Date.now() - startTime
        },
        pipeline: {
          context7Retrieval: 'failed',
          geminiGeneration: 'failed'
        }
      };
      
      return errorResponse;
    }
  }

  async healthCheck(): Promise<HealthStatus> {
    const checks = {
      google: false as boolean,
      context7: false as boolean,
      cache: false as boolean
    };

    try {
      // Test Google AI
      await generateText({
        model: this.model,
        prompt: 'health check',
        maxSteps: 1
      });
      checks.google = true;
    } catch (error) {
      // Google check failed
    }

    try {
      // Test Context7
      await this.context7Client.searchLibrary('test', 'react');
      checks.context7 = true;
    } catch (error) {
      // Context7 check failed
    }

    try {
      // Test cache
      const testKey = 'health_test';
      const testValue = { success: true, timestamp: Date.now() } as ChatbotResponse;
      this.cache.set(testKey, testValue);
      const retrieved = this.cache.get(testKey);
      checks.cache = retrieved?.success === true;
      this.cache.delete(testKey);
    } catch (error) {
      // Cache check failed
    }

    const healthyCount = Object.values(checks).filter(Boolean).length;
    const totalChecks = Object.keys(checks).length;
    
    let status: 'healthy' | 'degraded' | 'unhealthy';
    if (healthyCount === totalChecks) status = 'healthy';
    else if (healthyCount >= totalChecks * 0.7) status = 'degraded';
    else status = 'unhealthy';

    return {
      status,
      liveness: true,
      readiness: checks.google && checks.context7,
      dependencies: {
        google: checks.google ? 'healthy' : 'unhealthy',
        context7: checks.context7 ? 'healthy' : 'unhealthy',
        cache: checks.cache ? 'healthy' : 'unhealthy'
      },
      minimal_operational_signals: {
        uptime: Date.now() - this.startTime,
        active_requests: 0 // Could be tracked if needed
      },
      timestamp: new Date().toISOString()
    };
  }

  getMetrics(): ChatbotMetrics {
    return Object.fromEntries(this.metrics) as ChatbotMetrics;
  }

  getCacheStatistics(): CacheStats {
    const total = (this.metrics.get('cache_hits') || 0) + (this.metrics.get('cache_misses') || 0);
    
    return {
      size: this.cache.size,
      maxSize: this.config.cacheMaxSize,
      hitRate: total > 0 ? Math.round(((this.metrics.get('cache_hits') || 0) / total) * 100) : 0,
      missRate: total > 0 ? Math.round(((this.metrics.get('cache_misses') || 0) / total) * 100) : 0,
      memoryUsage: `${Math.round(this.cache.size * 0.001)}KB`, // Rough estimate
      evictions: 0 // Could be tracked if needed
    };
  }

  clearCache(): void {
    this.cache.clear();
  }

  cleanup(): void {
    // Cleanup rate limiters for inactive users
    const now = Date.now();
    const inactiveThreshold = 1000 * 60 * 60; // 1 hour
    
    for (const [identifier, bucket] of this.requestBuckets.entries()) {
      if (now - bucket.getAvailableTokens() > inactiveThreshold) {
        this.requestBuckets.delete(identifier);
      }
    }
  }
}

// ===== FACTORY FUNCTION =====

export function createUltimateChatbot(config?: ChatbotConfig): UltimateChatbot {
  return new UltimateProductionChatbot(config || {});
}
