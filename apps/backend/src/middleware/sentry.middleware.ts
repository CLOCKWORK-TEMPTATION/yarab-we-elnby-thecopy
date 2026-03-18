/**
 * Sentry Middleware for Express
 * 
 * Captures errors and performance data
 */

import { Request, Response, NextFunction } from 'express';
import * as Sentry from '@sentry/node';
import { expressIntegration, expressErrorHandler } from '@sentry/node';

// Note: In Sentry v10, middleware setup is typically done via expressIntegration
// These exports are kept for backwards compatibility but may need to be updated
// to use the new integration pattern

/**
 * Sentry request handler - must be first middleware
 * @deprecated Use expressIntegration instead in Sentry v10+
 */
export const sentryRequestHandler = (req: Request, res: Response, next: NextFunction) => {
  // Basic request handling - in v10 this should be handled by expressIntegration
  next();
};

/**
 * Sentry tracing handler for performance monitoring
 * @deprecated Use expressIntegration instead in Sentry v10+
 */
export const sentryTracingHandler = (req: Request, res: Response, next: NextFunction) => {
  // Basic tracing - in v10 this should be handled by expressIntegration
  next();
};

/**
 * Sentry error handler - must be before other error handlers
 */
export const sentryErrorHandler = expressErrorHandler;

/**
 * Custom error tracking middleware with user context
 */
export function trackError(req: Request, res: Response, next: NextFunction) {
  // Set user context if authenticated
  if ((req as any).user) {
    Sentry.setUser({
      id: (req as any).user.id,
      email: (req as any).user.email,
      ip_address: req.ip || req.socket.remoteAddress || null,
    });
  }

  const originalSend = res.send;

  res.send = function (data: any) {
    if (res.statusCode >= 400) {
      Sentry.addBreadcrumb({
        message: `HTTP ${res.statusCode} on ${req.method} ${req.path}`,
        level: res.statusCode >= 500 ? 'error' : 'warning',
        data: {
          method: req.method,
          url: req.url,
          statusCode: res.statusCode,
          userId: (req as any).user?.id,
        },
      });
    }

    return originalSend.call(this, data);
  };

  next();
}

/**
 * Performance tracking middleware
 */
export function trackPerformance(req: Request, res: Response, next: NextFunction) {
  const startTime = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - startTime;

    // Track slow requests (> 1s)
    if (duration > 1000) {
      Sentry.addBreadcrumb({
        message: `Slow request: ${req.method} ${req.path}`,
        level: 'warning',
        data: {
          duration,
          method: req.method,
          url: req.url,
          statusCode: res.statusCode,
        },
      });
    }

    // Track metrics
    Sentry.metrics.distribution('http.request.duration', duration, {
      unit: 'millisecond',
    });
  });

  next();
}

