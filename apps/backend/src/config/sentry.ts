/**
 * Sentry Configuration for Backend
 *
 * Error tracking and APM (Application Performance Monitoring)
 *
 * Features:
 * - Error tracking with context
 * - Performance monitoring (P50, P95, P99 latencies)
 * - Custom transactions for Gemini, DB, Redis
 * - Profiling for CPU/memory analysis
 * - Alert thresholds configuration
 */

import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import { logger } from '@/utils/logger';

// APM Configuration
const APM_CONFIG = {
  // Sample rates (adjust based on traffic volume)
  tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.1'), // 10% default
  profilesSampleRate: parseFloat(process.env.SENTRY_PROFILES_SAMPLE_RATE || '0.1'), // 10% default

  // Performance thresholds (milliseconds)
  thresholds: {
    apiResponse: 2000,      // Alert if API response > 2s
    geminiCall: 30000,      // Alert if Gemini call > 30s
    dbQuery: 1000,          // Alert if DB query > 1s
    redisOperation: 100,    // Alert if Redis operation > 100ms
  },

  // Error rate threshold (percentage)
  errorRateThreshold: 5, // Alert if error rate > 5%
};

/**
 * Initialize Sentry monitoring with APM
 */
export function initializeSentry() {
  const dsn = process.env.SENTRY_DSN;

  if (!dsn) {
    logger.warn('[Sentry] DSN not configured, monitoring disabled');
    return;
  }

  // Allow Sentry in development for testing APM
  const isProduction = process.env.NODE_ENV === 'production';

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV || 'development',

    // Release tracking for version monitoring
    release: process.env.SENTRY_RELEASE || `the-copy-backend@${process.env.npm_package_version || '1.0.0'}`,

    // Server name for multi-instance deployments
    serverName: process.env.HOSTNAME || process.env.SENTRY_SERVER_NAME || 'backend-server',

    // Performance Monitoring - APM Configuration
    tracesSampleRate: isProduction ? APM_CONFIG.tracesSampleRate : 1.0,
    profilesSampleRate: isProduction ? APM_CONFIG.profilesSampleRate : 1.0,

    // Enable sending of default PII (careful with GDPR)
    sendDefaultPii: false,

    // Integrations
    integrations: [
      // Performance profiling for CPU/memory analysis
      ...(process.env.NODE_ENV === 'production' ? [nodeProfilingIntegration()] : []),
    ] as any,

    // Tags for filtering and searching
    initialScope: {
      tags: {
        'app.name': 'the-copy',
        'app.component': 'backend',
        'node.version': process.version,
      },
    },

    // Before sending transactions (for performance filtering)
    beforeSendTransaction(event) {
      // Add custom tags based on transaction duration
      if (event.timestamp && event.start_timestamp) {
        const duration = (event.timestamp - event.start_timestamp) * 1000;

        // Tag slow transactions
        if (duration > APM_CONFIG.thresholds.apiResponse) {
          event.tags = {
            ...event.tags,
            'performance.slow': 'true',
            'performance.duration_ms': String(Math.round(duration)),
          };
        }
      }
      return event;
    },

    // Before sending events (errors)
    beforeSend(event, hint) {
      // Filter out non-critical errors
      const error = hint.originalException;

      if (error instanceof Error) {
        // Don't send expected/noisy errors
        if (error.message.includes('ECONNREFUSED') ||
            error.message.includes('timeout') ||
            error.message.includes('ENOTFOUND')) {
          return null;
        }
      }

      return event;
    },

    // Before sending breadcrumbs
    beforeBreadcrumb(breadcrumb) {
      // Add more context to HTTP breadcrumbs
      if (breadcrumb.category === 'http') {
        breadcrumb.data = {
          ...breadcrumb.data,
          timestamp: new Date().toISOString(),
        };
      }
      return breadcrumb;
    },
  });

  logger.info('[Sentry] APM initialized', {
    environment: process.env.NODE_ENV,
    tracesSampleRate: isProduction ? APM_CONFIG.tracesSampleRate : 1.0,
    profilesSampleRate: isProduction ? APM_CONFIG.profilesSampleRate : 1.0,
  });
}

// Export APM configuration for use in other modules
export { APM_CONFIG };

/**
 * Capture exception with context
 */
export function captureException(error: Error, context?: Record<string, any>) {
  if (process.env.NODE_ENV === 'production') {
    if (context) {
      Sentry.withScope((scope) => {
        scope.setContext('custom', context);
        Sentry.captureException(error);
      });
    } else {
      Sentry.captureException(error);
    }
  } else {
    console.error('[Sentry] Exception:', error, context);
  }
}

/**
 * Capture message with context
 */
export function captureMessage(message: string, level: Sentry.SeverityLevel = 'info', context?: Record<string, any>) {
  if (process.env.NODE_ENV === 'production') {
    if (context) {
      Sentry.withScope((scope) => {
        scope.setContext('custom', context);
        Sentry.captureMessage(message, level);
      });
    } else {
      Sentry.captureMessage(message, level);
    }
  } else {
    console.log(`[Sentry] ${level.toUpperCase()}: ${message}`, context);
  }
}

/**
 * Track performance metric
 */
export function trackMetric(name: string, value: number, unit: string = 'ms') {
  Sentry.metrics.gauge(name, value, {
    unit,
  });

  // Log in development
  if (process.env.NODE_ENV !== 'production') {
    logger.debug(`[Metric] ${name}: ${value}${unit}`);
  }
}

// ============================================
// Custom Transaction Helpers for APM
// ============================================

/**
 * Operation types for custom transactions
 */
export enum OperationType {
  GEMINI_API = 'gemini.api',
  DB_QUERY = 'db.query',
  REDIS_OPERATION = 'redis.operation',
  QUEUE_JOB = 'queue.job',
  FILE_UPLOAD = 'file.upload',
  EXTERNAL_API = 'external.api',
}

/**
 * Start a custom transaction for performance monitoring
 * Returns a finish function to call when the operation completes
 *
 * @example
 * const finish = startTransaction(OperationType.GEMINI_API, 'analyzeScript');
 * try {
 *   const result = await geminiService.analyze(script);
 *   finish({ status: 'ok', result_size: result.length });
 *   return result;
 * } catch (error) {
 *   finish({ status: 'error', error: error.message });
 *   throw error;
 * }
 */
export function startTransaction(
  operation: OperationType,
  name: string,
  data?: Record<string, any>
): (endData?: Record<string, any>) => void {
  const startTime = performance.now();

  // Start Sentry span
  const spanOptions: any = {
    name: `${operation}:${name}`,
    op: operation,
  };

  if (data) {
    spanOptions.attributes = data;
  }

  const span = Sentry.startInactiveSpan(spanOptions);

  return (endData?: Record<string, any>) => {
    const duration = performance.now() - startTime;

    // End the span
    if (span) {
      if (endData) {
        Object.entries(endData).forEach(([key, value]) => {
          span.setAttribute(key, String(value));
        });
      }
      span.setAttribute('duration_ms', duration);
      span.end();
    }

    // Track as metric
    trackMetric(`${operation}.duration`, duration, 'ms');

    // Check against thresholds and log warnings
    const threshold = getThresholdForOperation(operation);
    if (threshold && duration > threshold) {
      logger.warn('Slow operation detected', {
        operation,
        name,
        duration: Math.round(duration),
        threshold,
        ...endData,
      });

      // Send to Sentry as a performance issue
      captureMessage(`Slow ${operation}: ${name}`, 'warning', {
        duration,
        threshold,
        ...data,
        ...endData,
      });
    }
  };
}

/**
 * Get threshold for operation type
 */
function getThresholdForOperation(operation: OperationType): number | null {
  switch (operation) {
    case OperationType.GEMINI_API:
      return APM_CONFIG.thresholds.geminiCall;
    case OperationType.DB_QUERY:
      return APM_CONFIG.thresholds.dbQuery;
    case OperationType.REDIS_OPERATION:
      return APM_CONFIG.thresholds.redisOperation;
    default:
      return APM_CONFIG.thresholds.apiResponse;
  }
}

/**
 * Wrap an async function with automatic transaction tracking
 *
 * @example
 * const trackedAnalyze = withTransaction(
 *   OperationType.GEMINI_API,
 *   'analyzeScript',
 *   async (script: string) => geminiService.analyze(script)
 * );
 */
export function withTransaction<T extends (...args: any[]) => Promise<any>>(
  operation: OperationType,
  name: string,
  fn: T
): T {
  return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    const finish = startTransaction(operation, name, {
      args_count: args.length,
    });

    try {
      const result = await fn(...args);
      finish({ status: 'ok' });
      return result;
    } catch (error) {
      finish({
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }) as T;
}

/**
 * Track a database query with automatic timing
 */
export async function trackDbQuery<T>(
  queryName: string,
  queryFn: () => Promise<T>
): Promise<T> {
  const finish = startTransaction(OperationType.DB_QUERY, queryName);

  try {
    const result = await queryFn();
    finish({ status: 'ok' });
    return result;
  } catch (error) {
    finish({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

/**
 * Track a Redis operation with automatic timing
 */
export async function trackRedisOp<T>(
  opName: string,
  opFn: () => Promise<T>
): Promise<T> {
  const finish = startTransaction(OperationType.REDIS_OPERATION, opName);

  try {
    const result = await opFn();
    finish({ status: 'ok' });
    return result;
  } catch (error) {
    finish({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

/**
 * Track a Gemini API call with automatic timing
 */
export async function trackGeminiCall<T>(
  callName: string,
  callFn: () => Promise<T>
): Promise<T> {
  const finish = startTransaction(OperationType.GEMINI_API, callName);

  try {
    const result = await callFn();
    finish({ status: 'ok' });
    return result;
  } catch (error) {
    finish({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

// ============================================
// Performance Dashboard Metrics
// ============================================

/**
 * Performance metrics storage for dashboard
 */
interface PerformanceMetrics {
  requests: {
    total: number;
    errors: number;
    latencies: number[];
  };
  operations: Record<string, {
    count: number;
    errors: number;
    totalDuration: number;
    latencies: number[];
  }>;
  lastReset: Date;
}

const metrics: PerformanceMetrics = {
  requests: { total: 0, errors: 0, latencies: [] },
  operations: {},
  lastReset: new Date(),
};

const MAX_LATENCY_SAMPLES = 1000; // Keep last 1000 samples for percentile calculation

/**
 * Record a request for dashboard metrics
 */
export function recordRequest(duration: number, isError: boolean = false) {
  metrics.requests.total++;
  if (isError) metrics.requests.errors++;

  metrics.requests.latencies.push(duration);
  if (metrics.requests.latencies.length > MAX_LATENCY_SAMPLES) {
    metrics.requests.latencies.shift();
  }

  // Track in Sentry using gauge (increment not available in this version)
  Sentry.metrics.gauge('requests.total', metrics.requests.total);
  if (isError) {
    Sentry.metrics.gauge('requests.errors', metrics.requests.errors);
  }
  Sentry.metrics.distribution('requests.latency', duration, { unit: 'millisecond' });
}

/**
 * Record an operation for dashboard metrics
 */
export function recordOperation(operation: string, duration: number, isError: boolean = false) {
  if (!metrics.operations[operation]) {
    metrics.operations[operation] = {
      count: 0,
      errors: 0,
      totalDuration: 0,
      latencies: [],
    };
  }

  const op = metrics.operations[operation];
  op.count++;
  if (isError) op.errors++;
  op.totalDuration += duration;

  op.latencies.push(duration);
  if (op.latencies.length > MAX_LATENCY_SAMPLES) {
    op.latencies.shift();
  }
}

/**
 * Calculate percentile from array of numbers
 */
function percentile(arr: number[], p: number): number {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const index = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)] || 0;
}

/**
 * Get performance dashboard data
 */
export function getPerformanceDashboard() {
  const requestLatencies = metrics.requests.latencies;

  const dashboard = {
    summary: {
      totalRequests: metrics.requests.total,
      totalErrors: metrics.requests.errors,
      errorRate: metrics.requests.total > 0
        ? ((metrics.requests.errors / metrics.requests.total) * 100).toFixed(2) + '%'
        : '0%',
      uptime: Date.now() - metrics.lastReset.getTime(),
    },
    latencies: {
      p50: Math.round(percentile(requestLatencies, 50)),
      p95: Math.round(percentile(requestLatencies, 95)),
      p99: Math.round(percentile(requestLatencies, 99)),
      avg: requestLatencies.length > 0
        ? Math.round(requestLatencies.reduce((a, b) => a + b, 0) / requestLatencies.length)
        : 0,
    },
    throughput: {
      requestsPerSecond: metrics.requests.total > 0
        ? (metrics.requests.total / ((Date.now() - metrics.lastReset.getTime()) / 1000)).toFixed(2)
        : '0',
    },
    operations: Object.entries(metrics.operations).map(([name, data]) => ({
      name,
      count: data.count,
      errors: data.errors,
      errorRate: data.count > 0 ? ((data.errors / data.count) * 100).toFixed(2) + '%' : '0%',
      avgDuration: data.count > 0 ? Math.round(data.totalDuration / data.count) : 0,
      p95: Math.round(percentile(data.latencies, 95)),
    })),
    thresholds: APM_CONFIG.thresholds,
    alerts: {
      p95AboveThreshold: percentile(requestLatencies, 95) > APM_CONFIG.thresholds.apiResponse,
      errorRateAboveThreshold: metrics.requests.total > 0 &&
        (metrics.requests.errors / metrics.requests.total) * 100 > APM_CONFIG.errorRateThreshold,
    },
    lastReset: metrics.lastReset.toISOString(),
  };

  return dashboard;
}

/**
 * Reset performance metrics (call periodically, e.g., every hour)
 */
export function resetPerformanceMetrics() {
  metrics.requests = { total: 0, errors: 0, latencies: [] };
  metrics.operations = {};
  metrics.lastReset = new Date();
  logger.info('Performance metrics reset');
}

export { Sentry };

