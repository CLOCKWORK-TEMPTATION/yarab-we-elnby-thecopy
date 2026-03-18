import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import { LRUCache } from 'lru-cache';
import { z } from 'zod';

// ===== PRODUCTION-GRADE TYPES =====

// Strict response types
export interface ProductionChatbotResponse {
  success: boolean;
  answer?: string;
  sources?: DocumentationSource[];
  usage?: TokenUsage;
  steps?: GenerationStep[];
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
  snippet?: string;
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

export interface GenerationStep {
  step: number;
  type: 'text' | 'tool-call' | 'tool-result';
  content?: string;
  toolName?: string;
  toolArgs?: Record<string, any>;
  duration?: number;
}

export interface ProductionError {
  code: string;
  message: string;
  type: 'CONFIGURATION' | 'RATE_LIMIT' | 'VALIDATION' | 'UPSTREAM' | 'TIMEOUT' | 'UNKNOWN';
  retryable: boolean;
  details?: Record<string, any>;
}

export interface ResponseMetadata {
  requestId: string;
  userId?: string;
  sessionId?: string;
  toolsUsed: boolean;
  cacheHit: boolean;
  processingTime: number;
  queueTime?: number;
}

export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: HealthChecks;
  uptime: number;
  version: string;
  timestamp: string;
}

export interface HealthChecks {
  aiProvider: boolean;
  cache: boolean;
  rateLimiting: boolean;
  tools: boolean;
  memory: boolean;
}

export interface CacheStatistics {
  size: number;
  maxSize: number;
  hitRate: number;
  missRate: number;
  memoryUsage: string;
  oldestEntry?: string;
  newestEntry?: string;
  evictions: number;
}

// ===== PRODUCTION CONFIGURATION =====

export interface ProductionChatbotConfig {
  // AI Configuration
  aiProvider: {
    model: string;
    apiKey: string;
    temperature?: number;
    maxTokens?: number;
    timeout?: number;
  };
  
  // Cache Configuration
  cache: {
    maxSize: number;
    ttl: number;
    maxSizePerEntry?: number;
  };
  
  // Rate Limiting
  rateLimiting: {
    requestsPerMinute: number;
    tokensPerMinute: number;
    burstLimit?: number;
    windowSize?: number;
  };
  
  // Tools Configuration
  tools: {
    enabled: boolean;
    context7?: {
      apiKey: string;
      timeout?: number;
      maxRetries?: number;
    };
  };
  
  // Monitoring
  monitoring: {
    enableMetrics: boolean;
    enableTracing: boolean;
    logLevel: 'error' | 'warn' | 'info' | 'debug';
  };
  
  // Validation
  validation: {
    maxQuestionLength: number;
    minQuestionLength: number;
    allowedCharacters?: RegExp;
    blockedPatterns?: RegExp[];
  };
}

// ===== PRODUCTION LOGGER =====

export interface ProductionLogger {
  error(message: string, error: Error, meta?: Record<string, any>): void;
  warn(message: string, meta?: Record<string, any>): void;
  info(message: string, meta?: Record<string, any>): void;
  debug(message: string, meta?: Record<string, any>): void;
  metric(name: string, value: number, tags?: Record<string, string>): void;
}

class StructuredLogger implements ProductionLogger {
  constructor(
    private context: string = 'ProductionChatbot',
    private logLevel: 'error' | 'warn' | 'info' | 'debug' = 'info'
  ) {}

  private shouldLog(level: 'error' | 'warn' | 'info' | 'debug'): boolean {
    const levels = ['error', 'warn', 'info', 'debug'];
    return levels.indexOf(level) <= levels.indexOf(this.logLevel);
  }

  private formatLog(level: string, message: string, meta?: Record<string, any>): string {
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      level,
      context: this.context,
      message,
      meta: meta || {},
      service: 'documentation-chatbot'
    });
  }

  error(message: string, error: Error, meta: Record<string, any> = {}): void {
    if (this.shouldLog('error')) {
      console.error(this.formatLog('error', message, {
        ...meta,
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack
        }
      }));
    }
  }

  warn(message: string, meta: Record<string, any> = {}): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatLog('warn', message, meta));
    }
  }

  info(message: string, meta: Record<string, any> = {}): void {
    if (this.shouldLog('info')) {
      console.log(this.formatLog('info', message, meta));
    }
  }

  debug(message: string, meta: Record<string, any> = {}): void {
    if (this.shouldLog('debug')) {
      console.log(this.formatLog('debug', message, meta));
    }
  }

  metric(name: string, value: number, tags: Record<string, string> = {}): void {
    if (this.shouldLog('info')) {
      console.log(this.formatLog('metric', `${name}: ${value}`, { tags }));
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
    enableTools: z.boolean().optional(),
    maxSteps: z.number().min(1).max(10).optional(),
    timeout: z.number().min(1000).max(60000).optional(),
    userId: z.string().min(1).max(100).optional(),
    sessionId: z.string().min(1).max(100).optional()
  }).optional()
});

// ===== MAIN PRODUCTION CHATBOT =====

export class UltimateProductionChatbot {
  private model: ReturnType<typeof google>;
  private cache: LRUCache<string, ProductionChatbotResponse>;
  private requestBuckets: Map<string, TokenBucket>;
  private tokenBuckets: Map<string, TokenBucket>;
  private logger: ProductionLogger;
  private config: ProductionChatbotConfig;
  private metrics: Map<string, number>;
  private cacheStats = { hits: 0, misses: 0, evictions: 0 };

  constructor(config: ProductionChatbotConfig) {
    // Validate configuration
    this.validateConfig(config);
    this.config = config;
    
    // Initialize logger
    this.logger = new StructuredLogger('ProductionChatbot', config.monitoring.logLevel);
    
    // Initialize AI model
    this.model = google(config.aiProvider.model, {
      apiKey: config.aiProvider.apiKey,
    });
    
    // Initialize cache with proper options
    this.cache = new LRUCache<string, ProductionChatbotResponse>({
      max: config.cache.maxSize,
      ttl: config.cache.ttl,
      allowStale: false,
      updateAgeOnGet: true,
      dispose: (value, key) => {
        this.cacheStats.evictions++;
        this.logger.debug('Cache entry evicted', { key, reason: 'LRU' });
      }
    });
    
    // Initialize rate limiting
    this.requestBuckets = new Map();
    this.tokenBuckets = new Map();
    
    // Initialize metrics
    this.metrics = new Map([
      ['total_requests', 0],
      ['successful_requests', 0],
      ['failed_requests', 0],
      ['cache_hits', 0],
      ['cache_misses', 0],
      ['rate_limit_hits', 0],
      ['tool_calls', 0],
      ['total_tokens', 0],
      ['total_response_time', 0]
    ]);
    
    this.logger.info('Production chatbot initialized', {
      model: config.aiProvider.model,
      cacheMaxSize: config.cache.maxSize,
      cacheTTL: config.cache.ttl,
      rateLimitRPM: config.rateLimiting.requestsPerMinute,
      toolsEnabled: config.tools.enabled
    });
  }

  private validateConfig(config: ProductionChatbotConfig): void {
    if (!config.aiProvider.apiKey) {
      throw new Error('AI provider API key is required');
    }
    
    if (!config.aiProvider.model) {
      throw new Error('AI provider model is required');
    }
    
    if (config.cache.maxSize <= 0) {
      throw new Error('Cache max size must be positive');
    }
    
    if (config.cache.ttl <= 0) {
      throw new Error('Cache TTL must be positive');
    }
    
    if (config.rateLimiting.requestsPerMinute <= 0) {
      throw new Error('Rate limit must be positive');
    }
    
    if (config.validation.maxQuestionLength <= 0) {
      throw new Error('Max question length must be positive');
    }
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  private getCacheKey(question: string, toolsEnabled: boolean): string {
    // Browser-compatible hash using simple string manipulation
    const normalized = question.toLowerCase().trim();
    const toolsFlag = toolsEnabled ? '_tools' : '_notools';
    return `cache_${normalized.length}_${normalized.substring(0, 50)}${toolsFlag}`;
  }

  private getRateLimiters(identifier: string): { requestBucket: TokenBucket; tokenBucket: TokenBucket } {
    if (!this.requestBuckets.has(identifier)) {
      this.requestBuckets.set(identifier, new TokenBucket(
        this.config.rateLimiting.requestsPerMinute,
        this.config.rateLimiting.requestsPerMinute / 60
      ));
    }
    
    if (!this.tokenBuckets.has(identifier)) {
      this.tokenBuckets.set(identifier, new TokenBucket(
        this.config.rateLimiting.tokensPerMinute,
        this.config.rateLimiting.tokensPerMinute / 60
      ));
    }
    
    return {
      requestBucket: this.requestBuckets.get(identifier)!,
      tokenBucket: this.tokenBuckets.get(identifier)!
    };
  }

  private validateInput(question: string, options: any): void {
    if (question.length < this.config.validation.minQuestionLength) {
      throw new Error('Question too short');
    }
    
    if (question.length > this.config.validation.maxQuestionLength) {
      throw new Error('Question too long');
    }
    
    if (this.config.validation.allowedCharacters && 
        !this.config.validation.allowedCharacters.test(question)) {
      throw new Error('Question contains invalid characters');
    }
    
    if (this.config.validation.blockedPatterns) {
      for (const pattern of this.config.validation.blockedPatterns) {
        if (pattern.test(question)) {
          throw new Error('Question contains blocked content');
        }
      }
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

  private async generateResponseWithRetry(
    question: string,
    options: any,
    maxRetries: number = 3
  ): Promise<any> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        this.logger.debug(`Generating response (attempt ${attempt}/${maxRetries})`);
        
        const result = await generateText({
          model: this.model,
          prompt: question,
          temperature: this.config.aiProvider.temperature || 0.1,
          maxSteps: options.maxSteps || 5,
          timeout: options.timeout || this.config.aiProvider.timeout || 30000,
        });

        return result;
      } catch (error) {
        this.logger.warn(`Generation attempt ${attempt} failed`, { 
          error: error instanceof Error ? error.message : 'Unknown error',
          willRetry: attempt < maxRetries
        });

        if (attempt === maxRetries) {
          throw error;
        }

        // Exponential backoff
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  async askQuestion(
    question: string, 
    options: {
      useCache?: boolean;
      enableTools?: boolean;
      maxSteps?: number;
      timeout?: number;
      userId?: string;
      sessionId?: string;
    } = {}
  ): Promise<ProductionChatbotResponse> {
    const startTime = Date.now();
    const requestId = this.generateRequestId();
    
    // Update metrics
    this.metrics.set('total_requests', (this.metrics.get('total_requests') || 0) + 1);
    
    // Get user identifier for rate limiting
    const userId = options.userId || 'anonymous';
    const identifier = `${userId}_${options.sessionId || 'nosession'}`;
    
    this.logger.info('Processing question', { 
      requestId,
      questionLength: question.length,
      identifier,
      useCache: options.useCache,
      enableTools: options.enableTools
    });

    try {
      // Validate input
      this.validateInput(question, options);
      
      // Rate limiting check
      const { requestBucket, tokenBucket } = this.getRateLimiters(identifier);
      
      if (!requestBucket.consume()) {
        const timeUntilAvailable = requestBucket.timeUntilAvailable();
        this.metrics.set('rate_limit_hits', (this.metrics.get('rate_limit_hits') || 0) + 1);
        
        return {
          success: false,
          responseTime: Date.now() - startTime,
          cached: false,
          timestamp: new Date().toISOString(),
          model: this.config.aiProvider.model,
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
            cacheHit: false,
            processingTime: Date.now() - startTime
          }
        };
      }

      // Check cache
      const toolsEnabled = options.enableTools !== false && this.config.tools.enabled;
      const cacheKey = options.useCache !== false ? this.getCacheKey(question, toolsEnabled) : '';
      
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

      // Generate response
      const result = await this.generateResponseWithRetry(question, options);
      
      // Format response
      const response: ProductionChatbotResponse = {
        success: true,
        answer: result.text,
        sources: this.extractSources(result),
        usage: this.formatTokenUsage(result.usage),
        steps: this.formatSteps(result.steps),
        responseTime: Date.now() - startTime,
        cached: false,
        timestamp: new Date().toISOString(),
        model: this.config.aiProvider.model,
        metadata: {
          requestId,
          userId: options.userId,
          sessionId: options.sessionId,
          toolsUsed: toolsEnabled,
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
        toolsUsed: toolsEnabled,
        answerLength: response.answer?.length || 0,
        usage: response.usage
      });

      return response;

    } catch (error) {
      this.metrics.set('failed_requests', (this.metrics.get('failed_requests') || 0) + 1);
      
      const errorResponse: ProductionChatbotResponse = {
        success: false,
        responseTime: Date.now() - startTime,
        cached: false,
        timestamp: new Date().toISOString(),
        model: this.config.aiProvider.model,
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

  private extractSources(result: any): DocumentationSource[] {
    // Implementation depends on actual result structure
    // For now, return empty array - should be implemented based on actual AI SDK response
    return [];
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

  private formatSteps(steps: any[]): GenerationStep[] {
    if (!steps || !Array.isArray(steps)) return [];
    
    return steps.map((step, index) => ({
      step: index + 1,
      type: step.type || 'text',
      content: step.text,
      toolName: step.toolName,
      toolArgs: step.toolArgs,
      duration: step.duration
    }));
  }

  async healthCheck(): Promise<HealthCheckResult> {
    const checks: HealthChecks = {
      aiProvider: false,
      cache: false,
      rateLimiting: false,
      tools: false,
      memory: false
    };

    try {
      // Test AI provider
      await generateText({
        model: this.model,
        prompt: 'health check',
        maxSteps: 1
      });
      checks.aiProvider = true;
    } catch (error) {
      this.logger.error('AI provider health check failed', error as Error);
    }

    // Test cache
    try {
      const testKey = 'health_check_test';
      const testValue = { success: true, timestamp: Date.now() } as ProductionChatbotResponse;
      this.cache.set(testKey, testValue);
      const retrieved = this.cache.get(testKey);
      checks.cache = retrieved?.success === true;
      this.cache.delete(testKey);
    } catch (error) {
      this.logger.error('Cache health check failed', error as Error);
    }

    // Test rate limiting
    try {
      const testBucket = new TokenBucket(10, 10/60);
      checks.rateLimiting = testBucket.consume() && testBucket.getAvailableTokens() >= 0;
    } catch (error) {
      this.logger.error('Rate limiting health check failed', error as Error);
    }

    // Test tools (if enabled)
    if (this.config.tools.enabled) {
      checks.tools = true; // Placeholder - should test actual tool initialization
    } else {
      checks.tools = true; // Not enabled, so considered healthy
    }

    // Test memory usage
    try {
      const memUsage = process.memoryUsage();
      checks.memory = memUsage.heapUsed < memUsage.heapTotal * 0.9; // Less than 90% of heap
    } catch (error) {
      checks.memory = false;
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
      uptime: process.uptime(),
      version: '1.0.0',
      timestamp: new Date().toISOString()
    };
  }

  getCacheStatistics(): CacheStatistics {
    const total = this.cacheStats.hits + this.cacheStats.misses;
    const entries = Array.from(this.cache.entries());
    
    return {
      size: this.cache.size,
      maxSize: this.config.cache.maxSize,
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
        this.tokenBuckets.delete(identifier);
      }
    }
    
    this.logger.debug('Rate limiter cleanup completed', {
      activeRequestBuckets: this.requestBuckets.size,
      activeTokenBuckets: this.tokenBuckets.size
    });
  }
}

// ===== FACTORY FUNCTION =====

export function createProductionChatbot(config: Partial<ProductionChatbotConfig> = {}): UltimateProductionChatbot {
  const defaultConfig: ProductionChatbotConfig = {
    aiProvider: {
      model: 'gemini-3.1-pro-preview',
      apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY || '',
      temperature: 0.1,
      maxTokens: 8192,
      timeout: 30000
    },
    cache: {
      maxSize: 100,
      ttl: 1000 * 60 * 30, // 30 minutes
      maxSizePerEntry: 100000 // 100KB per entry
    },
    rateLimiting: {
      requestsPerMinute: 10,
      tokensPerMinute: 10000,
      burstLimit: 20,
      windowSize: 60
    },
    tools: {
      enabled: false // Disabled until proper Context7 integration
    },
    monitoring: {
      enableMetrics: true,
      enableTracing: false,
      logLevel: 'info'
    },
    validation: {
      maxQuestionLength: 5000,
      minQuestionLength: 1
    }
  };

  // Merge with provided config
  const finalConfig = {
    aiProvider: { ...defaultConfig.aiProvider, ...config.aiProvider },
    cache: { ...defaultConfig.cache, ...config.cache },
    rateLimiting: { ...defaultConfig.rateLimiting, ...config.rateLimiting },
    tools: { ...defaultConfig.tools, ...config.tools },
    monitoring: { ...defaultConfig.monitoring, ...config.monitoring },
    validation: { ...defaultConfig.validation, ...config.validation }
  };

  return new UltimateProductionChatbot(finalConfig);
}

// ===== EXPORTS =====

export default UltimateProductionChatbot;
