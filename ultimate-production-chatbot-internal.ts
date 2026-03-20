// ===== INTERNAL TYPES =====
// These interfaces are implementation details and should not be part of the public contract

export interface LogLevel {
  level: 'error' | 'warn' | 'info' | 'debug'
}

export interface LogEntry {
  timestamp: string
  level: LogLevel['level']
  message: string
  requestId?: string
  userId?: string
  sessionId?: string
  component: string
  duration?: number
  error?: {
    code: string
    message: string
    stack?: string
  }
  metadata?: Record<string, unknown>
}

export interface StructuredLogger {
  error(message: string, error?: Error, metadata?: Record<string, unknown>): void
  warn(message: string, metadata?: Record<string, unknown>): void
  info(message: string, metadata?: Record<string, unknown>): void
  debug(message: string, metadata?: Record<string, unknown>): void
  setLevel(level: LogLevel['level']): void
  withContext(context: Partial<LogEntry>): StructuredLogger
}

export interface RuntimeEnvironment {
  node: boolean
  browser: boolean
  version: string
  platform: string
  arch: string
}

export interface CircuitBreakerState {
  failures: number
  lastFailureTime: number
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN'
}

export interface GeminiUsage {
  inputTokens?: number
  outputTokens?: number
  totalTokens?: number
  reasoningTokens?: number
  cachedInputTokens?: number
}
