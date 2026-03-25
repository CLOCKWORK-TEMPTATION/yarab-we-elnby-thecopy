import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import { LRUCache } from 'lru-cache';
import { z } from 'zod';

// ===== CONTEXT7 TYPES (from official docs) =====

interface Context7Library {
  id: string;
  name: string;
  description: string;
  totalSnippets: number;
  trustScore: number;
  benchmarkScore: number;
  versions: string[];
}

interface Context7Document {
  title: string;
  content: string;
  source: string;
}

// ===== PRODUCTION TYPES =====

export interface RealProductionResponse {
  success: boolean;
  answer?: string;
  sources?: DocumentationSource[];
  context7Sources?: Context7Document[];
  usage?: TokenUsage;
  responseTime: number;
  cached: boolean;
  timestamp: string;
  model: string;
  error?: ProductionError;
  metadata?: ResponseMetadata;
}

export interface DocumentationSource {
  id: string;
  title: string;
  url: string;
  snippet: string;
  relevance: number;
  lastUpdated?: string;
}

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  reasoningTokens?: number;
  cachedInputTokens?: number;
  cost?: number;
}

export interface ProductionError {
  code: string;
  message: string;
  type: 'CONFIGURATION' | 'RATE_LIMIT' | 'VALIDATION' | 'UPSTREAM' | 'TIMEOUT' | 'CONTEXT7' | 'UNKNOWN';
  retryable: boolean;
  details?: Record<string, any>;
}

export interface ResponseMetadata {
  requestId: string;
  userId?: string;
  sessionId?: string;
  toolsUsed: boolean;
  context7Used: boolean;
  cacheHit: boolean;
  processingTime: number;
}

// ===== CONTEXT7 CLIENT (based on official SDK docs) =====

class Context7Client {
  private apiKey: string;
  private baseUrl: string = 'https://context7.com/api/v2';
  
  constructor(apiKey?: string) {
    // Priority: constructor param > environment variable
    this.apiKey = apiKey || process.env.CONTEXT7_API_KEY || '';
    
    if (!this.apiKey) {
      throw new Error('Context7 API key is required. Set CONTEXT7_API_KEY environment variable or pass apiKey to constructor');
    }
  }
  
  async searchLibrary(query: string, libraryName: string): Promise<Context7Library[]> {
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
  
  async getContext(query: string, libraryId: string, type: 'json' | 'txt' = 'json'): Promise<Context7Document[]> {
    const url = new URL(`${this.baseUrl}/context`);
    url.searchParams.append('query', query);
    url.searchParams.append('libraryId', libraryId);
    url.searchParams.append('type', type);
    
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
    
    if (type === 'txt') {
      // For text format, return as single document
      const text = await response.text();
      return [{
        title: 'Documentation Context',
        content: text,
        source: libraryId
      }];
    }
    
    return response.json();
  }
}

// ===== BROWSER-COMPATIBLE LOGGER =====

export interface BrowserLogger {
  error(message: string, error?: Error, meta?: Record<string, any>): void;
  warn(message: string, meta?: Record<string, any>): void;
  info(message: string, meta?: Record<string, any>): void;
  debug(message: string, meta?: Record<string, any>): void;
}

class BrowserCompatibleLogger implements BrowserLogger {
  constructor(
    private context: string = 'RealProductionChatbot',
    private logLevel: 'error' | 'warn' | 'info' | 'debug' = 'info'
  ) {}

  private shouldLog(level: 'error' | 'warn' | 'info' | 'debug'): boolean {
    const levels = ['error', 'warn', 'info', 'debug'];
    return levels.indexOf(level) <= levels.indexOf(this.logLevel);
  }

  private formatLog(level: string, message: string, meta?: Record<string, any>): any {
    return {
      timestamp: new Date().toISOString(),
      level,
      context: this.context,
      message,
      meta: meta || {},
      service: 'real-production-chatbot'
    };
  }

  error(message: string, error?: Error, meta: Record<string, any> = {}): void {
    if (this.shouldLog('error')) {
      const logEntry = this.formatLog('error', message, meta);
      if (error) {
        logEntry.error = {
          name: error.name,
          message: error.message,
          stack: error.stack
        };
      }
      console.error(JSON.stringify(logEntry));
    }
  }

  warn(message: string, meta: Record<string, any> = {}): void {
    if (this.shouldLog('warn')) {
      console.warn(JSON.stringify(this.formatLog('warn', message, meta)));
    }
  }

  info(message: string, meta: Record<string, any> = {}): void {
    if (this.shouldLog('info')) {
      console.log(JSON.stringify(this.formatLog('info', message, meta)));
    }
  }

  debug(message: string, meta: Record<string, any> = {}): void {
    if (this.shouldLog('debug')) {
      console.log(JSON.stringify(this.formatLog('debug', message, meta)));
    }
  }
}

// ===== RATE LIMITING WITH TOKEN BUCKET =====

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

  getAvailableTokens(): number {
    this.refill();
    return this.tokens;
  }

  getCapacity(): number {
    return this.capacity;
  }

  timeUntilAvailable(tokens: number = 1): number {
    const available = this.getAvailableTokens();
    if (available >= tokens) return 0;
    
    const needed = tokens - available;
    return Math.ceil(needed / this.refillRate * 1000);
  }
}

// ===== INPUT VALIDATION =====

const QuestionSchema = z.object({
  question: z.string()
    .min(1, 'Question cannot be empty')
    .max(10000, 'Question too long')
    .regex(/^[^<>]{1,10000}$/, 'Invalid characters in question'),
  options: z.object({
    useCache: z.boolean().optional(),
    enableContext7: z.boolean().optional(),
    maxSteps: z.number().min(1).max(10).optional(),
    timeout: z.number().min(1000).max(60000).optional(),
    userId: z.string().min(1).max(100).optional(),
    sessionId: z.string().min(1).max(100).optional(),
    context7Library: z.string().optional()
  }).optional()
});

// ===== MAIN PRODUCTION CHATBOT =====

export class RealProductionChatbot {
  private model: ReturnType<typeof google>;
  private cache: LRUCache<string, RealProductionResponse>;
  private requestBuckets: Map<string, TokenBucket>;
  private logger: BrowserLogger;
  private context7Client?: Context7Client;
  private metrics: Map<string, number>;
  private cacheStats = { hits: 0, misses: 0, evictions: 0 };

  constructor(config: {
    googleApiKey?: string;
    context7ApiKey?: string;
    cacheMaxSize?: number;
    cacheTTL?: number;
    rateLimitPerMinute?: number;
    logLevel?: 'error' | 'warn' | 'info' | 'debug';
    enableContext7?: boolean;
  } = {}) {
    // Validate and initialize Google AI
    const googleApiKey = config.googleApiKey || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!googleApiKey) {
      throw new Error('GOOGLE_GENERATIVE_AI_API_KEY environment variable is required');
    }
    
    this.model = google("gemini-3.1-pro-preview", {
      apiKey: googleApiKey,
    });
    
    // Initialize Context7 if enabled
    if (config.enableContext7 !== false) {
      try {
        this.context7Client = new Context7Client(config.context7ApiKey);
      } catch (error) {
        this.getLogger(config.logLevel).warn('Context7 initialization failed', {
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    // Initialize logger
    this.logger = this.getLogger(config.logLevel);
    
    // Initialize cache (browser-compatible)
    this.cache = new LRUCache<string, RealProductionResponse>({
      max: config.cacheMaxSize || 100,
      ttl: config.cacheTTL || 1000 * 60 * 30, // 30 minutes
      allowStale: false,
      updateAgeOnGet: true,
      dispose: (value, key) => {
        this.cacheStats.evictions++;
        this.logger.debug('Cache entry evicted', { key, reason: 'LRU' });
      }
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
    
    this.logger.info('Real production chatbot initialized', {
      model: 'gemini-3.1-pro-preview',
      cacheMaxSize: config.cacheMaxSize || 100,
      cacheTTL: config.cacheTTL || 1800000,
      rateLimitRPM: config.rateLimitPerMinute || 10,
      context7Enabled: !!this.context7Client
    });
  }

  private getLogger(logLevel?: 'error' | 'warn' | 'info' | 'debug'): BrowserLogger {
    return new BrowserCompatibleLogger('RealProductionChatbot', logLevel || 'info');
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  private getCacheKey(question: string, context7Enabled: boolean): string {
    // Browser-compatible hash (no Node.js crypto)
    const normalized = question.toLowerCase().trim();
    const context7Flag = context7Enabled ? '_c7' : '_no_c7';
    return `cache_${normalized.length}_${normalized.substring(0, 50)}${context7Flag}`;
  }

  private getRateLimiter(identifier: string, rateLimitPerMinute: number): TokenBucket {
    if (!this.requestBuckets.has(identifier)) {
      this.requestBuckets.set(identifier, new TokenBucket(
        rateLimitPerMinute,
        rateLimitPerMinute / 60
      ));
    }
    
    return this.requestBuckets.get(identifier)!;
  }

  private validateInput(question: string, options: any): void {
    if (question.length < 1) {
      throw new Error('Question cannot be empty');
    }
    
    if (question.length > 10000) {
      throw new Error('Question too long (max 10000 characters)');
    }
    
    if (/<[^>]*>/.test(question)) {
      throw new Error('Question contains invalid HTML tags');
    }
  }

  private createError(
    code: string, 
    message: string, 
    type: ProductionError['type'], 
    retryable: boolean = false,
    details?: Record<string, any>
  ): ProductionError {
    return { code, message, type, retryable, details };
  }

  private async fetchContext7Documentation(
    question: string,
    libraryName?: string
  ): Promise<Context7Document[]> {
    if (!this.context7Client) {
      return [];
    }

    try {
      this.metrics.set('context7_calls', (this.metrics.get('context7_calls') || 0) + 1);
      
      // If library is specified, search for it first
      let libraryId: string | undefined;
      if (libraryName) {
        const libraries = await this.context7Client.searchLibrary(question, libraryName);
        if (libraries.length > 0) {
          libraryId = libraries[0].id;
          this.logger.debug('Found Context7 library', { libraryName, libraryId });
        }
      }
      
      // If no library found or specified, try to infer from question
      if (!libraryId) {
        // Simple library detection from common patterns
        const commonLibs = {
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
        const docs = await this.context7Client.getContext(question, libraryId);
        this.logger.debug('Retrieved Context7 documentation', { 
          libraryId, 
          docCount: docs.length 
        });
        return docs;
      }
      
      return [];
    } catch (error) {
      this.metrics.set('context7_errors', (this.metrics.get('context7_errors') || 0) + 1);
      this.logger.warn('Context7 documentation fetch failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        libraryName
      });
      return [];
    }
  }

  async askQuestion(
    question: string, 
    options: {
      useCache?: boolean;
      enableContext7?: boolean;
      maxSteps?: number;
      timeout?: number;
      userId?: string;
      sessionId?: string;
      context7Library?: string;
    } = {}
  ): Promise<RealProductionResponse> {
    const startTime = Date.now();
    const requestId = this.generateRequestId();
    
    // Update metrics
    this.metrics.set('total_requests', (this.metrics.get('total_requests') || 0) + 1);
    
    // Get user identifier for rate limiting
    const userId = options.userId || 'anonymous';
    const sessionId = options.sessionId || 'nosession';
    const identifier = `${userId}_${sessionId}`;
    
    this.logger.info('Processing question', { 
      requestId,
      questionLength: question.length,
      identifier,
      useCache: options.useCache,
      enableContext7: options.enableContext7
    });

    try {
      // Validate input
      this.validateInput(question, options);
      
      // Rate limiting check
      const rateLimitPerMinute = 10; // Default rate limit
      const rateLimiter = this.getRateLimiter(identifier, rateLimitPerMinute);
      
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
          }
        };
      }

      // Check cache
      const context7Enabled = options.enableContext7 !== false && !!this.context7Client;
      const cacheKey = options.useCache !== false ? this.getCacheKey(question, context7Enabled) : '';
      
      if (cacheKey && this.cache.has(cacheKey)) {
        const cached = this.cache.get(cacheKey)!;
        this.cacheStats.hits++;
        this.metrics.set('cache_hits', (this.metrics.get('cache_hits') || 0) + 1);
        
        this.logger.info('Cache hit', { requestId, cacheKey });
        
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

      this.cacheStats.misses++;
      this.metrics.set('cache_misses', (this.metrics.get('cache_misses') || 0) + 1);

      // Fetch Context7 documentation if enabled
      let context7Docs: Context7Document[] = [];
      if (context7Enabled) {
        context7Docs = await this.fetchContext7Documentation(question, options.context7Library);
      }

      // Build enhanced prompt with Context7 documentation
      let enhancedPrompt = question;
      if (context7Docs.length > 0) {
        const contextText = context7Docs
          .map(doc => `## ${doc.title}\n${doc.content}\nSource: ${doc.source}`)
          .join('\n\n');
        
        enhancedPrompt = `Based on the following documentation, answer the question:\n\n${contextText}\n\nQuestion: ${question}`;
      }

      // Generate response
      const result = await generateText({
        model: this.model,
        prompt: enhancedPrompt,
        temperature: 0.1,
        maxSteps: options.maxSteps || 5,
        timeout: options.timeout || 30000,
      });

      // Format response
      const response: RealProductionResponse = {
        success: true,
        answer: result.text,
        sources: [], // Can be enhanced based on result structure
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
        }
      };

      // Cache response
      if (cacheKey) {
        this.cache.set(cacheKey, response);
        this.logger.debug('Response cached', { requestId, cacheKey });
      }

      // Update metrics
      this.metrics.set('successful_requests', (this.metrics.get('successful_requests') || 0) + 1);
      this.metrics.set('total_tokens', (this.metrics.get('total_tokens') || 0) + (response.usage?.totalTokens || 0));
      this.metrics.set('total_response_time', (this.metrics.get('total_response_time') || 0) + response.responseTime);

      this.logger.info('Question answered successfully', {
        requestId,
        responseTime: response.responseTime,
        context7Used: response.metadata?.context7Used,
        answerLength: response.answer?.length || 0,
        usage: response.usage
      });

      return response;

    } catch (error) {
      this.metrics.set('failed_requests', (this.metrics.get('failed_requests') || 0) + 1);
      
      const errorResponse: RealProductionResponse = {
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
          { requestId, identifier }
        ),
        metadata: {
          requestId,
          toolsUsed: false,
          context7Used: false,
          cacheHit: false,
          processingTime: Date.now() - startTime
        }
      };
      
      this.logger.error('Question processing failed', error as Error, {
        requestId,
        identifier,
        responseTime: errorResponse.responseTime
      });
      
      return errorResponse;
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

  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    checks: {
      google: boolean;
      context7: boolean;
      cache: boolean;
      rateLimiting: boolean;
    };
    uptime: number;
    timestamp: string;
  }> {
    const checks = {
      google: false,
      context7: false,
      cache: false,
      rateLimiting: false
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
      this.logger.error('Google AI health check failed', error as Error);
    }

    try {
      // Test Context7
      if (this.context7Client) {
        await this.context7Client.searchLibrary('test', 'react');
        checks.context7 = true;
      } else {
        checks.context7 = true; // Not enabled, so considered healthy
      }
    } catch (error) {
      this.logger.error('Context7 health check failed', error as Error);
    }

    try {
      // Test cache
      const testKey = 'health_test';
      const testValue = { success: true, timestamp: Date.now() } as RealProductionResponse;
      this.cache.set(testKey, testValue);
      const retrieved = this.cache.get(testKey);
      checks.cache = retrieved?.success === true;
      this.cache.delete(testKey);
    } catch (error) {
      this.logger.error('Cache health check failed', error as Error);
    }

    try {
      // Test rate limiting
      const testBucket = new TokenBucket(10, 10/60);
      checks.rateLimiting = testBucket.consume() && testBucket.getAvailableTokens() >= 0;
    } catch (error) {
      this.logger.error('Rate limiting health check failed', error as Error);
    }

    const healthyCount = Object.values(checks).filter(Boolean).length;
    const totalChecks = Object.keys(checks).length;
    
    let status: 'healthy' | 'degraded' | 'unhealthy';
    if (healthyCount === totalChecks) status = 'healthy';
    else if (healthyCount >= totalChecks * 0.7) status = 'degraded';
    else status = 'unhealthy';

    return {
      status,
      checks,
      uptime: typeof performance !== 'undefined' ? performance.now() : Date.now(),
      timestamp: new Date().toISOString()
    };
  }

  getCacheStatistics() {
    const total = this.cacheStats.hits + this.cacheStats.misses;
    const entries = Array.from(this.cache.entries());
    
    return {
      size: this.cache.size,
      maxSize: 100,
      hitRate: total > 0 ? Math.round((this.cacheStats.hits / total) * 100) : 0,
      missRate: total > 0 ? Math.round((this.cacheStats.misses / total) * 100) : 0,
      memoryUsage: `${Math.round(entries.reduce((total, [key, value]) => 
        total + JSON.stringify(value).length + key.length, 0) / 1024)}KB`,
      evictions: this.cacheStats.evictions
    };
  }

  getMetrics(): Record<string, number> {
    return Object.fromEntries(this.metrics);
  }

  clearCache(): void {
    this.cache.clear();
    this.cacheStats = { hits: 0, misses: 0, evictions: 0 };
    this.logger.info('Cache cleared');
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
    
    this.logger.debug('Rate limiter cleanup completed', {
      activeBuckets: this.requestBuckets.size
    });
  }
}

// ===== FACTORY FUNCTION =====

export function createRealProductionChatbot(config: {
  googleApiKey?: string;
  context7ApiKey?: string;
  cacheMaxSize?: number;
  cacheTTL?: number;
  rateLimitPerMinute?: number;
  logLevel?: 'error' | 'warn' | 'info' | 'debug';
  enableContext7?: boolean;
} = {}): RealProductionChatbot {
  return new RealProductionChatbot(config);
}

// ===== EXPORTS =====

export default RealProductionChatbot;
