/**
 * Ultimate Production Chatbot - Public Contract Definition
 * 
 * This file defines the authoritative public contract for the Ultimate Production Chatbot
 * with mandatory dual dependency on Gemini and Context7 APIs.
 */

// ===== CORE INTERFACES =====

/**
 * Configuration for creating a new chatbot instance
 * Note: API keys are optional here because they default to environment variables
 * but become required after validation in ResolvedChatbotConfig
 */
export interface ChatbotConfig {
  googleApiKey?: string      // optional because defaults to environment
  context7ApiKey?: string    // optional because defaults to environment
  cacheMaxSize?: number
  cacheTTL?: number
  rateLimitPerMinute?: number
  logLevel?: 'error' | 'warn' | 'info' | 'debug'
  // Explicitly NO disable flags: no enableContext7, enableTools, allowUngroundedFallback
}

/**
 * Internal resolved configuration after validation
 * All fields become required after environment validation
 */
export interface ResolvedChatbotConfig {
  googleApiKey: string       // required after validation
  context7ApiKey: string     // required after validation
  cacheMaxSize: number
  cacheTTL: number
  rateLimitPerMinute: number
  logLevel: 'error' | 'warn' | 'info' | 'debug'
}

/**
 * Options for individual questions
 * No disable flags - only controls for usage behavior
 */
export interface QuestionOptions {
  useCache?: boolean
  timeoutMs?: number
  userId?: string
  sessionId?: string
  context7Library?: string
  context7MaxDocuments?: number
}

/**
 * Raw document retrieved from Context7 API
 */
export interface Context7Document {
  id: string                 // for deduplication and traceability
  title: string
  content: string
  sourceUrl: string          // more precise than 'source'
  relevance?: number
  lastUpdated?: string
}

/**
 * Canonical source after processing
 * Context7 is the primary reference source, Gemini is the generator
 */
export interface DocumentationSource {
  id: string
  title: string
  url: string
  snippet: string
  relevance: number
  confidence: number
  lastUpdated?: string
  provider: 'context7' | 'custom'  // Context7 is primary reference source
}

/**
 * Token usage information
 */
export interface TokenUsage {
  inputTokens: number
  outputTokens: number
  totalTokens: number
  reasoningTokens?: number
  cachedInputTokens?: number
  cost?: number
}

/**
 * Structured error information
 */
export interface ChatbotError {
  code: string
  message: string
  type: 'CONFIGURATION' | 'RATE_LIMIT' | 'VALIDATION' | 'UPSTREAM' | 'TIMEOUT' | 
        'CONTEXT7_UNAVAILABLE' | 'GEMINI_UNAVAILABLE' | 'GROUNDING_FAILED' | 
        'RETRIEVAL_FAILED' | 'GENERATION_FAILED'
  retryable: boolean
  details?: Record<string, unknown>  // strict: no 'any'
}

/**
 * Response metadata
 */
export interface ResponseMetadata {
  requestId: string
  userId?: string
  sessionId?: string
  toolsUsed: boolean
  context7Used: boolean
  cacheHit: boolean
  processingTime: number
}

/**
 * Main chatbot response with dual pipeline proof
 */
export interface ChatbotResponse {
  success: boolean
  answer?: string
  sources?: DocumentationSource[]     // canonical normalized references for response contract
  context7Sources?: Context7Document[]  // raw retrieval payload from Context7
  usage?: TokenUsage
  responseTime: number
  cached: boolean
  timestamp: string
  model: string
  error?: ChatbotError
  metadata: ResponseMetadata
  pipeline: {
    context7Retrieval: 'success' | 'failed'
    geminiGeneration: 'success' | 'failed'
  }
}

/**
 * Health status with minimal operational signals
 * Separates health from detailed metrics
 */
export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy'
  liveness: boolean           // is the system running?
  readiness: boolean          // is the system ready for requests?
  dependencies: {
    google: 'healthy' | 'unhealthy'
    context7: 'healthy' | 'unhealthy'  // no 'disabled' state
    cache: 'healthy' | 'unhealthy'
  }
  minimal_operational_signals: {
    uptime: number              // minimal signal for liveness
    active_requests: number    // minimal signal for load
  }
  timestamp: string
}

/**
 * Chatbot metrics (separate from health)
 */
export interface ChatbotMetrics {
  total_requests: number
  successful_requests: number
  failed_requests: number
  cache_hits: number
  cache_misses: number
  rate_limit_hits: number
  context7_calls: number
  context7_errors: number
  total_tokens: number
  total_response_time: number
}

/**
 * Cache statistics
 */
export interface CacheStats {
  size: number
  maxSize: number
  hitRate: number
  missRate: number
  memoryUsage: string
  evictions: number
}

// ===== MAIN INTERFACE =====

/**
 * Ultimate Chatbot interface with mandatory dual dependency
 * No disable flags - Gemini and Context7 are always required
 */
export interface UltimateChatbot {
  askQuestion(question: string, options?: QuestionOptions): Promise<ChatbotResponse>
  healthCheck(): Promise<HealthStatus>
  getMetrics(): ChatbotMetrics
  getCacheStatistics(): CacheStats
  clearCache(): void
  cleanup(): void  // cleans cache, rate limiters, active timers, telemetry sinks, event listeners
}

// ===== FACTORY FUNCTION =====

/**
 * Factory function for creating chatbot instances
 * Single factory function - no direct class constructor
 */
export declare function createUltimateChatbot(config?: ChatbotConfig): UltimateChatbot;

// ===== INPUT NORMALIZATION CONTRACT =====

/**
 * Input normalization rules for consistency across the system
 */
export interface InputNormalization {
  trim: boolean              // remove whitespace from start/end
  whitespaceCollapse: boolean  // collapse multiple spaces to single space
  unicodeNormalization: boolean // Unicode NFC/NFD normalization
  casingPolicy: 'preserve' | 'lower' | 'upper'  // casing policy
}

// ===== METRICS OBSERVER INTERFACE =====

export interface MetricsEvent {
  type: 'request_started' | 'request_completed' | 'request_failed' | 'cache_hit' | 'cache_miss' | 'rate_limit_hit' | 'token_usage';
  data: Record<string, unknown>;
  timestamp: number;
}

export interface MetricsObserver {
  onMetricsEvent(event: MetricsEvent): void;
}

export default UltimateChatbot;
