/**
 * OpenTelemetry Distributed Tracing Configuration
 *
 * This module initializes and configures OpenTelemetry for distributed tracing
 * across the entire backend application. It automatically instruments:
 * - HTTP/HTTPS requests and responses
 * - Express.js middleware and routes
 * - PostgreSQL database queries (via Drizzle ORM)
 * - Redis operations
 * - MongoDB operations
 * - BullMQ job processing
 *
 * @module config/tracing
 */

import { NodeSDK } from '@opentelemetry/sdk-node';
import { defaultResource, resourceFromAttributes } from '@opentelemetry/resources';
import { SEMRESATTRS_SERVICE_NAME, SEMRESATTRS_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api';

/**
 * Environment variables for tracing configuration
 */
const TRACING_ENABLED = process.env.TRACING_ENABLED === 'true';
const OTEL_EXPORTER_OTLP_ENDPOINT =
  process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318/v1/traces';
const SERVICE_NAME = process.env.SERVICE_NAME || 'thecopy-backend';
const SERVICE_VERSION = process.env.npm_package_version || '1.0.0';
const ENVIRONMENT = process.env.NODE_ENV || 'development';
const OTEL_LOG_LEVEL = process.env.OTEL_LOG_LEVEL || 'info';

/**
 * Enable OpenTelemetry diagnostic logging for debugging
 */
if (OTEL_LOG_LEVEL === 'debug') {
  diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG);
} else if (OTEL_LOG_LEVEL === 'verbose') {
  diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.VERBOSE);
}

/**
 * Initialize the OpenTelemetry SDK
 *
 * @returns {NodeSDK | null} Configured SDK instance or null if tracing is disabled
 */
export function initTracing(): NodeSDK | null {
  if (!TRACING_ENABLED) {
    console.log('📊 OpenTelemetry tracing is disabled');
    return null;
  }

  console.log('🚀 Initializing OpenTelemetry distributed tracing...');
  console.log(`   📍 Service: ${SERVICE_NAME}`);
  console.log(`   📦 Version: ${SERVICE_VERSION}`);
  console.log(`   🌍 Environment: ${ENVIRONMENT}`);
  console.log(`   🔗 Exporter: ${OTEL_EXPORTER_OTLP_ENDPOINT}`);

  // Create OTLP exporter for sending traces to Jaeger or other backends
  const traceExporter = new OTLPTraceExporter({
    url: OTEL_EXPORTER_OTLP_ENDPOINT,
  });

  // Define service resource attributes
  const resource = defaultResource().merge(
    resourceFromAttributes({
      [SEMRESATTRS_SERVICE_NAME]: SERVICE_NAME,
      [SEMRESATTRS_SERVICE_VERSION]: SERVICE_VERSION,
      'deployment.environment': ENVIRONMENT,
    })
  );

  // Initialize the SDK with auto-instrumentation
  const sdk = new NodeSDK({
    resource,
    traceExporter,
    instrumentations: [
      getNodeAutoInstrumentations({
        // Fine-tune which instrumentations to enable
        '@opentelemetry/instrumentation-http': {
          enabled: true,
          ignoreIncomingRequestHook: (request) => {
            const url = request.url || '';
            return url.includes('/health') || url.includes('/metrics');
          },
        },
        '@opentelemetry/instrumentation-express': {
          enabled: true,
        },
        '@opentelemetry/instrumentation-pg': {
          enabled: true,
        },
        '@opentelemetry/instrumentation-redis': {
          enabled: true,
        },
        '@opentelemetry/instrumentation-mongodb': {
          enabled: true,
        },
        '@opentelemetry/instrumentation-net': {
          enabled: false,
        },
        '@opentelemetry/instrumentation-fs': {
          enabled: false,
        },
      }),
    ],
  });

  // Start the SDK
  sdk.start();
  console.log('✅ OpenTelemetry SDK started successfully');

  // Graceful shutdown
  process.on('SIGTERM', () => {
    sdk
      .shutdown()
      .then(() => console.log('🛑 OpenTelemetry SDK shut down successfully'))
      .catch((error) => console.error('❌ Error shutting down OpenTelemetry SDK', error))
      .finally(() => process.exit(0));
  });

  return sdk;
}

/**
 * Helper function to create custom spans
 */
export { trace, SpanStatusCode, context } from '@opentelemetry/api';
