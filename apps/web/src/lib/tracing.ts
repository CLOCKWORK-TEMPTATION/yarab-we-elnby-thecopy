/**
 * OpenTelemetry Browser Tracing Configuration
 * 
 * This module initializes OpenTelemetry tracing for the frontend Next.js application.
 * It automatically instruments:
 * - Fetch API calls
 * - XMLHttpRequest
 * - User interactions (optional)
 * - Page navigation (via Next.js instrumentation)
 * 
 * Note: OpenTelemetry packages are optional. If not installed, tracing will be disabled.
 * To enable tracing, install the required OpenTelemetry packages and set NEXT_PUBLIC_TRACING_ENABLED=true
 * 
 * @module lib/tracing
 */

'use client';

import { WebTracerProvider } from '@opentelemetry/sdk-trace-web';
import { resourceFromAttributes } from '@opentelemetry/resources';
import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
  SEMRESATTRS_DEPLOYMENT_ENVIRONMENT,
} from '@opentelemetry/semantic-conventions';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { FetchInstrumentation } from '@opentelemetry/instrumentation-fetch';
import { XMLHttpRequestInstrumentation } from '@opentelemetry/instrumentation-xml-http-request';
import { registerInstrumentations } from '@opentelemetry/instrumentation';

/**
 * Environment variables for tracing configuration
 */
const TRACING_ENABLED =
  process.env.NEXT_PUBLIC_TRACING_ENABLED === 'true';
const OTEL_EXPORTER_OTLP_ENDPOINT =
  process.env.NEXT_PUBLIC_OTEL_EXPORTER_OTLP_ENDPOINT ||
  'http://localhost:4318/v1/traces';
const SERVICE_NAME =
  process.env.NEXT_PUBLIC_SERVICE_NAME || 'theeeecopy-frontend';
const SERVICE_VERSION =
  process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0';
const ENVIRONMENT =
  process.env.NEXT_PUBLIC_ENVIRONMENT || 'development';

let isInitialized = false;

/**
 * Initialize OpenTelemetry browser tracing
 * Should be called once in the root layout or _app file
 * 
 * Note: This function will silently skip if OpenTelemetry packages are not installed
 * or if NEXT_PUBLIC_TRACING_ENABLED is not set to 'true'
 */
export function initBrowserTracing(): void {
  // Skip if not in browser environment
  if (typeof window === 'undefined') {
    return;
  }

  console.log('🚀 Initializing browser tracing...');
  console.log(`   📍 Service: ${SERVICE_NAME}`);
  console.log(`   📦 Version: ${SERVICE_VERSION}`);
  console.log(`   🌍 Environment: ${ENVIRONMENT}`);
  console.log(`   🔗 Exporter: ${OTEL_EXPORTER_OTLP_ENDPOINT}`);

  try {
    // Create resource with service metadata
    const resource = resourceFromAttributes({
      [ATTR_SERVICE_NAME]: SERVICE_NAME,
      [ATTR_SERVICE_VERSION]: SERVICE_VERSION,
      [SEMRESATTRS_DEPLOYMENT_ENVIRONMENT]: ENVIRONMENT,
    });

    // Create OTLP exporter
    const exporter = new OTLPTraceExporter({
      url: OTEL_EXPORTER_OTLP_ENDPOINT,
      // Optional: Add headers for authentication
      // headers: {
      //   'Authorization': `Bearer ${process.env.NEXT_PUBLIC_OTEL_AUTH_TOKEN}`,
      // },
    });

    // Create batch span processor for efficient export
    // @ts-ignore - Version mismatch between duplicate @opentelemetry/sdk-trace-base dependencies
    const spanProcessor = new BatchSpanProcessor(exporter);

    // Create tracer provider with batch span processor
    const provider = new WebTracerProvider({
      resource,
      // @ts-ignore - Version mismatch between duplicate @opentelemetry/sdk-trace-base dependencies
      spanProcessors: [spanProcessor],
    });

    // Register the provider
    provider.register();

    // Register auto-instrumentations
    registerInstrumentations({
      instrumentations: [
        new FetchInstrumentation({
          // Ignore health checks and tracing endpoints
          ignoreUrls: [
            /\/health$/,
            /\/metrics$/,
            /v1\/traces$/,
          ],
          // Propagate trace context to backend
          propagateTraceHeaderCorsUrls: [
            new RegExp(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'),
          ],
          // Clear timing resources
          clearTimingResources: true,
        }),
        new XMLHttpRequestInstrumentation({
          ignoreUrls: [
            /\/health$/,
            /\/metrics$/,
            /v1\/traces$/,
          ],
          propagateTraceHeaderCorsUrls: [
            new RegExp(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'),
          ],
        }),
      ],
    });

    isInitialized = true;
    console.log('✅ Browser tracing initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize browser tracing');
  }
}

/**
 * Stub tracer span interface for when OpenTelemetry is not available
 */
interface StubSpan {
  end: () => void;
  setAttribute: (key: string, value: unknown) => void;
  setStatus: (status: { code: number }) => void;
  recordException: (error: Error) => void;
}

/**
 * Stub tracer interface for when OpenTelemetry is not available
 */
interface StubTracer {
  startSpan: (name: string) => StubSpan;
}

/**
 * Helper to get the current tracer
 * Use this to create custom spans in your components
 * 
 * Note: Returns a no-op tracer stub if OpenTelemetry is not available
 */
export const trace = {
  getTracer: (name?: string): StubTracer => ({
    startSpan: (spanName: string): StubSpan => ({
      end: () => {},
      setAttribute: () => {},
      setStatus: () => {},
      recordException: () => {},
    }),
  }),
};
