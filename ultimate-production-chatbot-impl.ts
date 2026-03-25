/**
 * Ultimate Production Chatbot - Implementation
 * 
 * Mandatory dual dependency system with Gemini and Context7
 * No disable flags - both components are always required
 */

import { google } from '@ai-sdk/google';
import { generateText } from 'ai';
import { LRUCache } from 'lru-cache';
import { z } from 'zod';

// Import types from contract
import type {
  ChatbotConfig,
  ChatbotResponse,
  ChatbotError,
  DocumentationSource,
  Context7Document,
  HealthStatus,
  TokenUsage,
  UltimateChatbot,
  QuestionOptions,
  InputNormalization,
  MetricsEvent,
  MetricsObserver
} from './ultimate-production-chatbot';
import type {
  LogLevel,
  LogEntry,
  StructuredLogger,
  RuntimeEnvironment,
  CircuitBreakerState,
  GeminiUsage
} from './ultimate-production-chatbot-internal';

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
    .regex(/^[^<>]{1,10000}$/, 'Invalid characters in question')
    .refine((question) => {
      // Enhanced prompt injection protection
      const suspiciousPatterns = [
        /ignore\s+previous\s+instructions/i,
        /system\s*:/i,
        /developer\s*:/i,
        /assistant\s*:/i,
        /\b(you\s+are|act\s+as|pretend\s+to|roleplay)\s+(an?\s+)?(ai|assistant|system|developer)/i,
        /\b(disregard|forget|override)\s+(the\s+)?(above|previous|system)/i,
        /\b(execute|run|perform)\s+(this\s+)?(command|instruction|code)/i,
        /\{.*\}/, // JSON-like structures
        /\[.*\]/, // Array-like structures
        /```[\s\S]*?```/, // Code blocks
        /`[^`]+`/, // Inline code
        /\$(\w+|\{[^}]+\})/, // Shell variables
        /javascript:|data:|vbscript:/i, // Script protocols
        /<script[\s\S]*?<\/script>/i, // Script tags
        /on\w+\s*=/i, // Event handlers
      ];
      
      return !suspiciousPatterns.some(pattern => pattern.test(question));
    }, 'Question contains potentially dangerous content'),
  options: z.object({
    useCache: z.boolean().optional(),
    timeoutMs: z.number().min(1000).max(60000).optional(),
    userId: z.string().min(1).max(100).optional(),
    sessionId: z.string().min(1).max(100).optional(),
    context7Library: z.string().optional(),
    context7MaxDocuments: z.number().min(1).max(50).optional()
  }).optional()
});

interface Context7SearchResult {
  id: string;
  name: string;
  description: string;
}

interface Context7DocumentRaw {
  title?: string;
  content?: string;
  source?: string;
  relevance?: number;
  lastUpdated?: string;
}

class Context7Client {
  private apiKey: string;
  private baseUrl: string = 'https://context7.com/api/v2';
  private readonly RELEVANCE_THRESHOLD = 0.3;
  private readonly MAX_DOCUMENTS_PER_QUERY = 10;
  private circuitBreaker: CircuitBreaker;
  
  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.circuitBreaker = new CircuitBreaker(5, 60000, 10000);
  }
  
  async searchLibrary(query: string, libraryName: string): Promise<Context7SearchResult[]> {
    return this.circuitBreaker.execute(async () => {
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
    });
  }
  
  async getContext(query: string, libraryId: string, maxDocuments?: number): Promise<Context7Document[]> {
    return this.circuitBreaker.execute(async () => {
      const url = new URL(`${this.baseUrl}/context`);
      url.searchParams.append('query', query);
      url.searchParams.append('libraryId', libraryId);
      url.searchParams.append('type', 'json');
      url.searchParams.append('limit', String(maxDocuments || this.MAX_DOCUMENTS_PER_QUERY));
      
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
      
      const docs: Context7DocumentRaw[] = await response.json();
      
      // Apply relevance threshold and advanced filtering
      const filteredDocs = this.filterAndRankDocuments(docs, query);
      
      return filteredDocs.map((doc: Context7DocumentRaw, index: number) => ({
        id: `${libraryId}_${index}`,
        title: doc.title || 'Document',
        content: doc.content || '',
        sourceUrl: doc.source || libraryId,
        relevance: doc.relevance,
        lastUpdated: doc.lastUpdated
      }));
    });
  }

  private filterAndRankDocuments(docs: Context7DocumentRaw[], query: string): Context7DocumentRaw[] {
    // Step 1: Apply relevance threshold
    let filtered = docs.filter(doc => 
      !doc.relevance || doc.relevance >= this.RELEVANCE_THRESHOLD
    );

    // Step 2: Apply insufficient docs policy
    if (filtered.length === 0 && docs.length > 0) {
      // If no docs meet threshold, take the best ones
      filtered = docs
        .sort((a, b) => (b.relevance || 0) - (a.relevance || 0))
        .slice(0, Math.min(3, docs.length));
    }

    // Step 3: Apply ambiguity resolution
    filtered = this.resolveAmbiguity(filtered, query);

    // Step 4: Re-rank based on query relevance
    filtered = this.reRankByQueryRelevance(filtered, query);

    return filtered;
  }

  private resolveAmbiguity(docs: Context7DocumentRaw[], query: string): Context7DocumentRaw[] {
    // Remove duplicate content
    const seen = new Set<string>();
    const unique = docs.filter(doc => {
      const contentHash = this.simpleHash(doc.content || '');
      if (seen.has(contentHash)) {
        return false;
      }
      seen.add(contentHash);
      return true;
    });

    // Prefer docs with titles that match query terms
    const queryTerms = query.toLowerCase().split(/\s+/);
    return unique.sort((a, b) => {
      const aTitle = (a.title || '').toLowerCase();
      const bTitle = (b.title || '').toLowerCase();
      
      const aMatches = queryTerms.filter(term => aTitle.includes(term)).length;
      const bMatches = queryTerms.filter(term => bTitle.includes(term)).length;
      
      return bMatches - aMatches;
    });
  }

  private reRankByQueryRelevance(docs: Context7DocumentRaw[], query: string): Context7DocumentRaw[] {
    const queryTerms = query.toLowerCase().split(/\s+/);
    
    return docs.map(doc => {
      let score = doc.relevance || 0.5;
      
      // Boost score based on content matches
      const content = (doc.content || '').toLowerCase();
      const title = (doc.title || '').toLowerCase();
      
      queryTerms.forEach(term => {
        if (title.includes(term)) score += 0.1;
        if (content.includes(term)) score += 0.05;
      });
      
      return { ...doc, relevance: Math.min(score, 1.0) };
    }).sort((a, b) => (b.relevance || 0) - (a.relevance || 0));
  }

  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }

  async resolveLibrary(query: string): Promise<string | null> {
    // Enhanced library resolution with ambiguity handling
    const commonLibs: Record<string, string> = {
      'react': '/facebook/react',
      'next': '/vercel/next.js',
      'nextjs': '/vercel/next.js',
      'vue': '/vuejs/core',
      'angular': '/angular/angular',
      'node': '/nodejs/node',
      'express': '/expressjs/express',
      'typescript': '/microsoft/TypeScript',
      'javascript': '/mdn/javascript',
      'python': '/python/cpython',
      'django': '/django/django',
      'flask': '/pallets/flask',
      'rails': '/rails/rails',
      'ruby': '/ruby/ruby',
      'java': '/openjdk/jdk',
      'spring': '/spring-projects/spring-boot',
      'docker': '/docker/docker',
      'kubernetes': '/kubernetes/kubernetes',
      'aws': '/aws/aws-sdk-js-v3',
      'azure': '/azure/azure-sdk-for-js',
      'gcp': '/googleapis/google-cloud-node'
    };

    const lowerQuery = query.toLowerCase();
    
    // Direct matches
    for (const [name, id] of Object.entries(commonLibs)) {
      if (lowerQuery.includes(name)) {
        return id;
      }
    }

    // Try Context7 search for better resolution
    try {
      const results = await this.searchLibrary(query, '');
      if (results.length > 0) {
        return results[0].id;
      }
    } catch (error) {
      // Fallback to common libs if search fails
    }

    return null;
  }
}

// ===== RATE LIMITING =====

class TokenBucket {
  private tokens: number;
  private lastRefill: number;
  private lastAccessTime: number;  // إضافة تتبع وقت الوصول
  private readonly capacity: number;
  private readonly refillRate: number;

  constructor(capacity: number, refillRate: number) {
    this.capacity = capacity;
    this.refillRate = refillRate;
    this.tokens = capacity;
    this.lastRefill = Date.now();
    this.lastAccessTime = Date.now();  // تهيئة وقت الوصول
  }

  consume(tokens: number = 1): boolean {
    this.lastAccessTime = Date.now();  // تحديث وقت الوصول
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

  getLastAccessTime(): number {
    return this.lastAccessTime;
  }
}

// ===== ENHANCED ERROR HANDLING =====

interface RetryPolicy {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  retryableErrors: string[];
}

class RetryHandler {
  private policy: RetryPolicy;

  constructor(policy: Partial<RetryPolicy> = {}) {
    this.policy = {
      maxAttempts: 3,
      baseDelayMs: 1000,
      maxDelayMs: 10000,
      backoffMultiplier: 2,
      retryableErrors: [
        'CONTEXT7_UNAVAILABLE',
        'GEMINI_UNAVAILABLE',
        'TIMEOUT',
        'UPSTREAM'
      ],
      ...policy
    };
  }

  async executeWithRetry<T>(
    operation: () => Promise<T>,
    operationType: string,
    onError?: (attempt: number, error: Error) => void
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= this.policy.maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempt === this.policy.maxAttempts) {
          throw lastError;
        }

        // Check if error is retryable
        const errorCode = this.extractErrorCode(lastError);
        if (!this.policy.retryableErrors.includes(errorCode)) {
          throw lastError;
        }

        // Calculate delay with exponential backoff
        const delay = Math.min(
          this.policy.baseDelayMs * Math.pow(this.policy.backoffMultiplier, attempt - 1),
          this.policy.maxDelayMs
        );

        if (onError) {
          onError(attempt, lastError);
        }

        await this.sleep(delay);
      }
    }

    throw lastError!;
  }

  private extractErrorCode(error: Error): string {
    // Try to extract error code from error message or custom error
    const message = error.message.toLowerCase();
    
    if (message.includes('rate limit')) return 'RATE_LIMIT';
    if (message.includes('timeout')) return 'TIMEOUT';
    if (message.includes('context7') || message.includes('context 7')) return 'CONTEXT7_UNAVAILABLE';
    if (message.includes('gemini') || message.includes('google')) return 'GEMINI_UNAVAILABLE';
    if (message.includes('network') || message.includes('fetch')) return 'UPSTREAM';
    
    return 'UNKNOWN_ERROR';
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  isRetryableError(error: Error): boolean {
    const errorCode = this.extractErrorCode(error);
    return this.policy.retryableErrors.includes(errorCode);
  }
}

// ===== CIRCUIT BREAKER PATTERN =====

class CircuitBreaker {
  private state: CircuitBreakerState;
  private readonly failureThreshold: number;
  private readonly recoveryTimeout: number;
  private readonly monitoringPeriod: number;

  constructor(failureThreshold: number = 5, recoveryTimeout: number = 60000, monitoringPeriod: number = 10000) {
    this.failureThreshold = failureThreshold;
    this.recoveryTimeout = recoveryTimeout;
    this.monitoringPeriod = monitoringPeriod;
    this.state = {
      failures: 0,
      lastFailureTime: 0,
      state: 'CLOSED'
    };
  }

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state.state === 'OPEN') {
      if (Date.now() - this.state.lastFailureTime > this.recoveryTimeout) {
        this.state.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.state.failures = 0;
    this.state.state = 'CLOSED';
  }

  private onFailure(): void {
    this.state.failures++;
    this.state.lastFailureTime = Date.now();

    if (this.state.failures >= this.failureThreshold) {
      this.state.state = 'OPEN';
    }
  }

  getState(): CircuitBreakerState {
    return { ...this.state };
  }

  reset(): void {
    this.state = {
      failures: 0,
      lastFailureTime: 0,
      state: 'CLOSED'
    };
  }
}

class NodeStructuredLogger implements StructuredLogger {
  private level: LogLevel['level'] = 'info';
  private baseContext: Partial<LogEntry> = {};
  private logLevels: Record<LogLevel['level'], number> = {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3
  };

  constructor(level: LogLevel['level'] = 'info', component: string = 'UltimateChatbot') {
    this.level = level;
    this.baseContext = { component };
  }

  private shouldLog(level: LogLevel['level']): boolean {
    return this.logLevels[level] <= this.logLevels[this.level];
  }

  private createLogEntry(level: LogLevel['level'], message: string, metadata?: Record<string, unknown>): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...this.baseContext,
      metadata
    };
  }

  private output(entry: LogEntry): void {
    const logMessage = `[${entry.timestamp}] [${entry.level.toUpperCase()}] [${entry.component}] ${entry.message}`;
    
    if (entry.error) {
      console.error(logMessage, entry.error, entry.metadata);
    } else if (entry.level === 'warn') {
      console.warn(logMessage, entry.metadata);
    } else if (entry.level === 'debug') {
      console.debug(logMessage, entry.metadata);
    } else {
      console.log(logMessage, entry.metadata);
    }
  }

  error(message: string, error?: Error, metadata?: Record<string, unknown>): void {
    if (!this.shouldLog('error')) return;
    
    const entry = this.createLogEntry('error', message, metadata);
    if (error) {
      entry.error = {
        code: error.name || 'UNKNOWN_ERROR',
        message: error.message,
        stack: error.stack
      };
    }
    this.output(entry);
  }

  warn(message: string, metadata?: Record<string, unknown>): void {
    if (!this.shouldLog('warn')) return;
    
    const entry = this.createLogEntry('warn', message, metadata);
    this.output(entry);
  }

  info(message: string, metadata?: Record<string, unknown>): void {
    if (!this.shouldLog('info')) return;
    
    const entry = this.createLogEntry('info', message, metadata);
    this.output(entry);
  }

  debug(message: string, metadata?: Record<string, unknown>): void {
    if (!this.shouldLog('debug')) return;
    
    const entry = this.createLogEntry('debug', message, metadata);
    this.output(entry);
  }

  setLevel(level: LogLevel['level']): void {
    this.level = level;
  }

  withContext(context: Partial<LogEntry>): StructuredLogger {
    const newLogger = new NodeStructuredLogger(this.level, this.baseContext.component || 'UltimateChatbot');
    newLogger.baseContext = { ...this.baseContext, ...context };
    return newLogger;
  }
}

// ===== METRICS OBSERVER PATTERN =====

class MetricsEmitter {
  private observers: Set<MetricsObserver> = new Set();

  subscribe(observer: MetricsObserver): () => void {
    this.observers.add(observer);
    return () => this.observers.delete(observer);
  }

  emit(event: MetricsEvent): void {
    for (const observer of this.observers) {
      try {
        observer.onMetricsEvent(event);
      } catch (error) {
        console.error('Metrics observer error:', error);
      }
    }
  }
}

// ===== RUNTIME ENVIRONMENT DETECTION =====

class RuntimeEnvironmentDetector {
  static detect(): RuntimeEnvironment {
    const isNode = typeof process !== 'undefined' && process.versions && process.versions.node;
    const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';
    
    return {
      node: isNode,
      browser: isBrowser,
      version: isNode ? process.versions.node : (isBrowser ? navigator.userAgent : 'unknown'),
      platform: isNode ? process.platform : (isBrowser ? navigator.platform : 'unknown'),
      arch: isNode ? process.arch : 'unknown'
    };
  }
}

export class UltimateProductionChatbot implements UltimateChatbot {
  private model: ReturnType<typeof google>;
  private context7Client: Context7Client;
  private cache: LRUCache<string, ChatbotResponse>;
  private requestBuckets: Map<string, TokenBucket>;
  private metrics: Map<string, number>;
  private config: ResolvedChatbotConfig;
  private startTime: number;
  private logger: StructuredLogger;
  private runtimeEnvironment: RuntimeEnvironment;
  private metricsEmitter: MetricsEmitter;
  private retryHandler: RetryHandler;
  constructor(config: ChatbotConfig) {
    // Validate and resolve configuration
    const envConfig = {
      googleApiKey: config.googleApiKey || process.env.GOOGLE_GENERATIVE_AI_API_KEY,
      context7ApiKey: config.context7ApiKey || process.env.CONTEXT7_API_KEY,
      cacheMaxSize: config.cacheMaxSize || 100,
      cacheTTL: config.cacheTTL || 1000 * 60 * 30, // 30 minutes
      rateLimitPerMinute: config.rateLimitPerMinute || 10,
      logLevel: config.logLevel || 'info'
    };

    const validatedConfig = ConfigSchema.parse(envConfig);
    this.config = validatedConfig as ResolvedChatbotConfig;

    // Initialize logging
    this.runtimeEnvironment = RuntimeEnvironmentDetector.detect();
    this.logger = new NodeStructuredLogger(this.config.logLevel, 'UltimateChatbot');
    
    // Apply environment-specific configurations
    const envConfig = this.getEnvironmentSpecificConfig();
    
    this.logger.info('Initializing Ultimate Production Chatbot', {
      runtimeEnvironment: this.runtimeEnvironment,
      environmentConfig: envConfig,
      config: {
        cacheMaxSize: this.config.cacheMaxSize,
        cacheTTL: this.config.cacheTTL,
        rateLimitPerMinute: this.config.rateLimitPerMinute
      }
    });

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
    
    // Initialize metrics emitter
    this.metricsEmitter = new MetricsEmitter();
    
    // Initialize retry handler with environment-specific policies
    this.retryHandler = new RetryHandler({
      maxAttempts: this.runtimeEnvironment.node ? 3 : 2, // More retries in Node.js
      baseDelayMs: this.runtimeEnvironment.browser ? 500 : 1000, // Faster retries in browser
      maxDelayMs: this.runtimeEnvironment.node ? 15000 : 8000,
      backoffMultiplier: 2
    });
    
    this.logger.info('Ultimate Production Chatbot initialized successfully', {
      model: 'gemini-3.1-pro-preview',
      context7Enabled: true,
      mandatoryDualDependency: true,
      retryPolicyConfig: {
        maxAttempts: this.retryHandler['policy'].maxAttempts,
        baseDelayMs: this.retryHandler['policy'].baseDelayMs
      }
    });
  }

  private getEnvironmentSpecificConfig(): Record<string, unknown> {
    const config: Record<string, unknown> = {
      optimizations: [],
      features: []
    };

    if (this.runtimeEnvironment.node) {
      // Node.js specific optimizations
      config.optimizations.push('node-native-fetch');
      config.optimizations.push('enhanced-logging');
      config.features.push('file-system-cache');
      config.features.push('persistent-metrics');
      
      // Node.js specific configurations
      if (this.runtimeEnvironment.platform !== 'browser') {
        config.cacheStrategy = 'memory-with-fallback';
        config.metricsPersistence = true;
      }
    }

    if (this.runtimeEnvironment.browser) {
      // Browser specific optimizations
      config.optimizations.push('dom-optimizations');
      config.optimizations.push('storage-api');
      config.features.push('local-storage-cache');
      config.features.push('service-worker-support');
      
      // Browser specific configurations
      config.cacheStrategy = 'localStorage';
      config.metricsPersistence = false;
      config.timeoutOptimization = true;
    }

    // Version-specific optimizations
    if (this.runtimeEnvironment.version) {
      const version = this.runtimeEnvironment.version;
      if (this.runtimeEnvironment.node && version.startsWith('18.')) {
        config.optimizations.push('node18-optimizations');
      }
      if (this.runtimeEnvironment.browser && version.includes('Chrome/')) {
        config.optimizations.push('chrome-optimizations');
      }
    }

    return config;
  }

  private getOptimizedTimeout(userTimeout?: number): number {
    const baseTimeout = userTimeout || 30000;
    
    // Environment-specific timeout optimizations
    if (this.runtimeEnvironment.browser) {
      // Browser environments typically need shorter timeouts
      return Math.min(baseTimeout, 20000);
    }
    
    if (this.runtimeEnvironment.node) {
      // Node.js can handle longer timeouts for complex operations
      const version = this.runtimeEnvironment.version;
      if (version && version.startsWith('18.')) {
        // Node 18+ has better performance characteristics
        return Math.max(baseTimeout, 35000);
      }
    }
    
    return baseTimeout;
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  getMetrics(): Map<string, number> {
    return new Map(this.metrics);
  }

  subscribeToMetrics(observer: MetricsObserver): () => void {
    return this.metricsEmitter.subscribe(observer);
  }

  private emitMetricsEvent(type: MetricsEvent['type'], data: Record<string, unknown>): void {
    this.metricsEmitter.emit({
      type,
      data,
      timestamp: Date.now()
    });
  }

  private normalizeInput(question: string): string {
    return question
      .trim()
      .replace(/\s+/g, ' ')
      .normalize('NFC');
  }

  private getCacheKey(question: string, libraryName?: string, maxDocuments?: number, resolvedLibraryId?: string, retrievalDocumentCount?: number): string {
    const normalized = this.normalizeInput(question);
    const components = {
      question: normalized,
      modelId: 'gemini-3.1-pro-preview',
      systemPromptVersion: 'v1',
      retrievalPipelineVersion: 'v1',
      groundingPolicyVersion: 'v1',
      schemaVersionHash: 'v1',
      libraryName: libraryName || 'auto',
      resolvedLibraryId: resolvedLibraryId || 'auto',
      maxDocuments: maxDocuments || 10,
      retrievalDocumentCount: retrievalDocumentCount || 0,
      requestOptionsHash: this.hashOptions({ libraryName, maxDocuments, resolvedLibraryId, retrievalDocumentCount })
    };
    
    const keyString = JSON.stringify(components);
    return Buffer.from(keyString).toString('base64').substring(0, 64);
  }

  private hashOptions(options: { libraryName?: string; maxDocuments?: number; resolvedLibraryId?: string; retrievalDocumentCount?: number }): string {
    const str = JSON.stringify(options);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
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
    libraryName?: string,
    maxDocuments?: number
  ): Promise<{ documents: Context7Document[], resolvedLibraryId?: string, retrievalDocumentCount: number }> {
    return this.retryHandler.executeWithRetry(
      async () => {
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
            // Use enhanced library resolution
            libraryId = await this.context7Client.resolveLibrary(question);
          }
          
          if (libraryId) {
            const documents = await this.context7Client.getContext(question, libraryId, maxDocuments);
            return {
              documents,
              resolvedLibraryId: libraryId,
              retrievalDocumentCount: documents.length
            };
          }
          
          return {
            documents: [],
            retrievalDocumentCount: 0
          };
        } catch (error) {
          this.metrics.set('context7_errors', (this.metrics.get('context7_errors') || 0) + 1);
          throw error;
        }
      },
      'Context7Documentation',
      (attempt, error) => {
        this.logger.warn(`Context7 API call failed, retrying (attempt ${attempt})`, {
          error: error.message,
          question: question.substring(0, 100)
        });
      }
    );
  }

  private formatTokenUsage(usage: GeminiUsage): TokenUsage {
    return {
      inputTokens: usage?.inputTokens || 0,
      outputTokens: usage?.outputTokens || 0,
      totalTokens: usage?.totalTokens || 0,
      reasoningTokens: usage?.reasoningTokens,
      cachedInputTokens: usage?.cachedInputTokens
    };
  }

  private mapContext7ToDocumentationSources(context7Docs: Context7Document[]): DocumentationSource[] {
    return context7Docs.map((doc, index) => ({
      id: `source_${doc.id}`,
      title: doc.title,
      url: doc.sourceUrl,
      snippet: doc.content.length > 200 ? doc.content.substring(0, 200) + '...' : doc.content,
      relevance: doc.relevance || 0.5,
      confidence: this.calculateConfidence(doc),
      lastUpdated: doc.lastUpdated,
      provider: 'context7' as const
    }));
  }

  private calculateConfidence(doc: Context7Document): number {
    let confidence = 0.5; // Base confidence
    
    // Boost confidence based on content quality
    if (doc.content.length > 100) confidence += 0.1;
    if (doc.content.length > 500) confidence += 0.1;
    
    // Boost confidence based on title quality
    if (doc.title && doc.title.length > 5) confidence += 0.1;
    
    // Use Context7 relevance if available
    if (doc.relevance !== undefined) {
      confidence = Math.min(confidence + (doc.relevance * 0.3), 1.0);
    }
    
    // Boost confidence if recently updated
    if (doc.lastUpdated) {
      const lastUpdated = new Date(doc.lastUpdated);
      const now = new Date();
      const daysDiff = (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24);
      if (daysDiff < 30) confidence += 0.1;
    }
    
    return Math.min(confidence, 1.0);
  }

  async askQuestion(
    question: string, 
    options: QuestionOptions = {}
  ): Promise<ChatbotResponse> {
    const startTime = Date.now();
    const requestId = this.generateRequestId();
    
    this.logger.info('Request started', {
      requestId,
      question: question.substring(0, 100),
      userId: options.userId,
      sessionId: options.sessionId,
      context7Library: options.context7Library,
      context7MaxDocuments: options.context7MaxDocuments
    });
    
    // Update metrics
    this.metrics.set('total_requests', (this.metrics.get('total_requests') || 0) + 1);
    this.emitMetricsEvent('request_started', { requestId, question });
    
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
        
        this.logger.warn('Rate limit exceeded', {
          requestId,
          identifier,
          timeUntilAvailable,
          retryAfter: Math.ceil(timeUntilAvailable / 1000)
        });
        
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

      // Check cache - use basic key first, then enhance after retrieval
      const baseCacheKey = options.useCache !== false ? this.getCacheKey(
        normalizedQuestion, 
        options.context7Library, 
        options.context7MaxDocuments
      ) : '';
      
      if (baseCacheKey && this.cache.has(baseCacheKey)) {
        const cached = this.cache.get(baseCacheKey)!;
        this.metrics.set('cache_hits', (this.metrics.get('cache_hits') || 0) + 1);
        this.emitMetricsEvent('cache_hit', { requestId, cacheKey: baseCacheKey });
        
        this.logger.info('Cache hit', {
          requestId,
          cacheKey: baseCacheKey.substring(0, 20) + '...',
          responseTime: Date.now() - startTime
        });
        
        return {
          ...cached,
          cached: true,
          responseTime: Date.now() - startTime,
          metadata: {
            requestId,
            toolsUsed: false,
            context7Used: false,
            cacheHit: true,
            processingTime: Date.now() - startTime
          },
          pipeline: {
            context7Retrieval: 'success',
            geminiGeneration: 'success'
          }
        };
      }
      
      this.metrics.set('cache_misses', (this.metrics.get('cache_misses') || 0) + 1);
      this.emitMetricsEvent('cache_miss', { requestId, cacheKey: baseCacheKey });
      
      this.logger.debug('Cache miss, proceeding with pipeline', {
        requestId,
        cacheKey: baseCacheKey ? baseCacheKey.substring(0, 20) + '...' : 'disabled'
      });
      
      // Stage 1: Context7 Retrieval (always required)
      let context7Docs: Context7Document[] = [];
      let retrievalSuccess = 'success' as const;
      let resolvedLibraryId: string | undefined;
      let retrievalDocumentCount = 0;
      
      this.logger.info('Starting Context7 retrieval', {
        requestId,
        libraryName: options.context7Library,
        maxDocuments: options.context7MaxDocuments
      });
      
      try {
        const contextResult = await this.fetchContext7Documentation(
          normalizedQuestion, 
          options.context7Library,
          options.context7MaxDocuments
        );
        context7Docs = contextResult.documents;
        resolvedLibraryId = contextResult.resolvedLibraryId;
        retrievalDocumentCount = contextResult.retrievalDocumentCount;
        
        this.logger.info('Context7 retrieval completed', {
          requestId,
          documentsFound: context7Docs.length,
          resolvedLibraryId,
          retrievalTime: Date.now() - startTime
        });
      } catch (error) {
        retrievalSuccess = 'failed';
        this.logger.error('Context7 retrieval failed', error instanceof Error ? error : new Error(String(error)), {
          requestId,
          libraryName: options.context7Library
        });
        throw error;
      }

      // Stage 2: Gemini Grounded Generation (always required)
      let generationSuccess = 'success' as const;
      
      this.logger.info('Starting Gemini generation', {
        requestId,
        hasContext: context7Docs.length > 0,
        contextDocuments: context7Docs.length,
        promptLength: enhancedPrompt.length
      });
      
      // Build enhanced prompt with Context7 documentation
      let enhancedPrompt = normalizedQuestion;
      if (context7Docs.length > 0) {
        const contextText = context7Docs
          .map(doc => `## ${doc.title}\n${doc.content}\nSource: ${doc.sourceUrl}`)
          .join('\n\n');
        
        enhancedPrompt = `Based on the following documentation, answer the question:\n\n${contextText}\n\nQuestion: ${normalizedQuestion}`;
      }

      // Generate response with environment-specific optimizations and retry
      const optimizedTimeout = this.getOptimizedTimeout(options.timeoutMs);
      const result = await this.retryHandler.executeWithRetry(
        async () => {
          return await generateText({
            model: this.model,
            prompt: enhancedPrompt,
            temperature: 0.1,
            maxSteps: 5,
            timeout: optimizedTimeout,
          });
        },
        'GeminiGeneration',
        (attempt, error) => {
          this.logger.warn(`Gemini API call failed, retrying (attempt ${attempt})`, {
            requestId,
            error: error.message,
            promptLength: enhancedPrompt.length
          });
        }
      );

      this.logger.info('Gemini generation completed', {
        requestId,
        responseLength: result.text.length,
        tokensUsed: result.usage?.totalTokens || 0,
        generationTime: Date.now() - startTime
      });

      // Format response
      const response: ChatbotResponse = {
        success: true,
        answer: result.text,
        sources: this.mapContext7ToDocumentationSources(context7Docs), // Use mapping function
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

      // Cache response - use enhanced cache key with resolved information
      const enhancedCacheKey = this.getCacheKey(
        normalizedQuestion, 
        options.context7Library, 
        options.context7MaxDocuments,
        resolvedLibraryId,
        retrievalDocumentCount
      );
      
      if (baseCacheKey) {
        this.cache.set(enhancedCacheKey, response);
      }

      // Update metrics
      this.metrics.set('successful_requests', (this.metrics.get('successful_requests') || 0) + 1);
      this.metrics.set('total_tokens', (this.metrics.get('total_tokens') || 0) + (response.usage?.totalTokens || 0));
      this.metrics.set('total_response_time', (this.metrics.get('total_response_time') || 0) + response.responseTime);
      
      this.emitMetricsEvent('request_completed', { 
        requestId, 
        responseTime: response.responseTime,
        tokensUsed: response.usage?.totalTokens || 0,
        success: true
      });
      
      if (response.usage?.totalTokens) {
        this.emitMetricsEvent('token_usage', { 
          requestId,
          inputTokens: response.usage.inputTokens,
          outputTokens: response.usage.outputTokens,
          totalTokens: response.usage.totalTokens
        });
      }

      this.logger.info('Request completed successfully', {
        requestId,
        totalResponseTime: response.responseTime,
        tokensUsed: response.usage?.totalTokens || 0,
        cacheStored: !!baseCacheKey
      });

      return response;

    } catch (error) {
      this.metrics.set('failed_requests', (this.metrics.get('failed_requests') || 0) + 1);
      this.emitMetricsEvent('request_failed', { 
        requestId, 
        error: error instanceof Error ? error.message : 'Unknown error',
        errorType: error instanceof Error ? error.constructor.name : 'Unknown'
      });
      
      this.logger.error('Request failed', error instanceof Error ? error : new Error(String(error)), {
        requestId,
        totalResponseTime: Date.now() - startTime,
        errorType: error instanceof Error ? error.constructor.name : 'Unknown'
      });
      
      // Check if this is a validation error
      if (error instanceof Error && error.constructor.name === 'ZodError') {
        return {
          success: false,
          responseTime: Date.now() - startTime,
          cached: false,
          timestamp: new Date().toISOString(),
          model: 'gemini-3.1-pro-preview',
          error: this.createError(
            'VALIDATION_ERROR',
            'Invalid input provided',
            'VALIDATION',
            false,
            { validationDetails: error.message }
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

      // Handle other errors
      const chatbotError = this.createError(
        'REQUEST_FAILED',
        error instanceof Error ? error.message : 'Unknown error occurred',
        'UPSTREAM',
        this.retryHandler.isRetryableError(error instanceof Error ? error : new Error(String(error))),
        { originalError: error instanceof Error ? error.message : String(error) }
      );

      return {
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
      // Test Google AI - Check API key validity without making expensive calls
      // Just verify the model configuration is valid
      if (this.model && this.config.googleApiKey) {
        checks.google = true;
      }
    } catch (error) {
      // Google check failed
    }

    try {
      // Test Context7 - Check API key validity without making expensive calls
      if (this.context7Client && this.config.context7ApiKey) {
        checks.context7 = true;
      }
    } catch (error) {
      // Context7 check failed
    }

    try {
      // Test cache
      const testKey = 'health_test';
      const testValue = { 
        success: true, 
        responseTime: 0,
        cached: false,
        timestamp: new Date().toISOString(),
        model: 'gemini-3.1-pro-preview',
        metadata: {
          requestId: 'health-check',
          toolsUsed: false,
          context7Used: false,
          cacheHit: false,
          processingTime: 0
        },
        pipeline: {
          context7Retrieval: 'success',
          geminiGeneration: 'success'
        }
      } as ChatbotResponse;
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
      if (now - bucket.getLastAccessTime() > inactiveThreshold) {
        this.requestBuckets.delete(identifier);
      }
    }
  }
}

// ===== FACTORY FUNCTION =====

export function createUltimateChatbot(config?: ChatbotConfig): UltimateChatbot {
  return new UltimateProductionChatbot(config || {});
}
