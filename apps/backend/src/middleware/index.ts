import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
import { env } from "@/config/env";
import { logger } from "@/utils/logger";
import {
  logSecurityEvent,
  SecurityEventType,
} from "./security-logger.middleware";
import { sanitizeRequestLogs } from "./log-sanitization.middleware";
import { sloMetricsMiddleware } from "./slo-metrics.middleware";

/**
 * Rate Limiting Strategy Notes:
 *
 * Current implementation uses in-memory store which works for single-server deployments.
 * For distributed deployments (multiple servers), install 'rate-limit-redis' package
 * and configure a Redis store:
 *
 * npm install rate-limit-redis
 *
 * Then update the rate limiters to use:
 * store: new RedisStore({ sendCommand: (...args) => redisClient.sendCommand(args) })
 */

export const setupMiddleware = (app: express.Application): void => {
  // CORS Configuration with strict origin validation
  const allowedOrigins = env.CORS_ORIGIN.split(",").map((origin) =>
    origin.trim()
  );

  // Development whitelist for local testing (strict mode - no wildcard acceptance)
  const devWhitelist = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:5174",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
  ];

  // Combine production and dev whitelists in development mode
  const effectiveWhitelist =
    env.NODE_ENV === "development"
      ? [...allowedOrigins, ...devWhitelist]
      : allowedOrigins;

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests without Origin header (health checks, server-to-server, etc.)
        // This is safe because browsers always send Origin header for cross-origin requests
        if (!origin) {
          return callback(null, true);
        }

        // Check if origin is in the effective whitelist
        if (effectiveWhitelist.includes(origin)) {
          return callback(null, true);
        }

        // Log CORS violation
        logSecurityEvent(SecurityEventType.CORS_VIOLATION, {} as any, {
          blockedOrigin: origin,
          allowedOrigins: effectiveWhitelist,
        });

        return callback(new Error("CORS policy violation"));
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "X-XSRF-TOKEN"],
      exposedHeaders: ["X-RateLimit-Limit", "X-RateLimit-Remaining"],
      maxAge: 86400, // 24 hours
    })
  );

  // CSP directives - stricter in production
  const isProduction = env.NODE_ENV === "production";
  const scriptSrc = isProduction
    ? ["'self'"] // No unsafe-inline in production
    : ["'self'", "'unsafe-inline'"]; // Allow in development for hot reload
  const styleSrc = isProduction
    ? ["'self'"] // No unsafe-inline in production
    : ["'self'", "'unsafe-inline'"]; // Allow in development

  // Enhanced Security middleware with strict CSP
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc,
          styleSrc,
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'", "https://o*.ingest.sentry.io", process.env.OTEL_EXPORTER_OTLP_ENDPOINT ? new URL(process.env.OTEL_EXPORTER_OTLP_ENDPOINT).origin : ""].filter(Boolean),
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"],
          upgradeInsecureRequests: isProduction ? [] : null,
        },
      },
      crossOriginEmbedderPolicy: true,
      crossOriginOpenerPolicy: true,
      crossOriginResourcePolicy: { policy: "same-site" },
      dnsPrefetchControl: { allow: false },
      frameguard: { action: "deny" },
      hidePoweredBy: true,
      hsts: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true,
      },
      ieNoOpen: true,
      noSniff: true,
      referrerPolicy: { policy: "strict-origin-when-cross-origin" },
      xssFilter: true,
    })
  );

  // Compression
  app.use(compression() as any);

  // Body parsing
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  // CSRF protection via SameSite cookies (modern approach)
  // Using strict SameSite cookies provides CSRF protection without additional tokens
  // This is configured in the cookie settings throughout the application

  // PII Sanitization - Apply BEFORE logging to ensure no PII is logged
  app.use(sanitizeRequestLogs as any);

  // SLO Metrics - Track service level objectives
  app.use(sloMetricsMiddleware);

  // Rate limiting - General API rate limit
  const generalLimiter = rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS, // 15 minutes by default
    max: env.RATE_LIMIT_MAX_REQUESTS, // 100 requests per window by default
    message: {
      success: false,
      error: "تم تجاوز الحد المسموح من الطلبات، يرجى المحاولة لاحقاً",
    },
    standardHeaders: true,
    legacyHeaders: false,
  });

  // Strict rate limiting for authentication endpoints (prevent brute force)
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 requests per window
    skipSuccessfulRequests: false, // Count all requests
    message: {
      success: false,
      error: "تم تجاوز عدد محاولات تسجيل الدخول، يرجى المحاولة بعد 15 دقيقة",
    },
    standardHeaders: true,
    legacyHeaders: false,
  });

  // Moderate rate limiting for AI-intensive endpoints
  const aiLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 20, // 20 AI requests per hour
    message: {
      success: false,
      error:
        "تم تجاوز الحد المسموح من طلبات التحليل بالذكاء الاصطناعي، يرجى المحاولة لاحقاً",
    },
    standardHeaders: true,
    legacyHeaders: false,
  });

  // Apply general rate limiting to all API routes
  app.use("/api/", generalLimiter as any);

  // Apply stricter rate limiting to auth endpoints
  app.use("/api/auth/login", authLimiter as any);
  app.use("/api/auth/signup", authLimiter as any);

  // Apply AI-specific rate limiting to analysis endpoints
  app.use("/api/analysis/", aiLimiter as any);
  app.use("/api/projects/:id/analyze", aiLimiter as any);

  // Request logging
  app.use((req, res, next) => {
    logger.info("Request received", {
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.get("User-Agent"),
    });
    next();
  });
};

// Export validation utilities
export {
  validateBody,
  validateQuery,
  validateParams,
  commonSchemas,
  detectAttacks,
} from "./validation.middleware";

// Export SLO metrics utilities
export {
  sloMetricsMiddleware,
  trackAPIRequest,
  trackAuthAttempt,
  trackGeminiCall,
  trackDatabaseQuery,
  getSLOStatus,
  SLO_TARGETS,
  ERROR_BUDGETS,
} from "./slo-metrics.middleware";

// Error handling middleware - must be registered separately in server.ts after all routes
export const errorHandler = (
  error: Error,
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
): void => {
  // Sanitize error details before logging - remove sensitive data
  const sanitizedError = {
    message: error.message,
    name: error.name,
    // Only include stack trace in development
    ...(env.NODE_ENV === "development" && { stack: error.stack }),
  };

  // Log sanitized error (no sensitive request body data)
  logger.error("Unhandled error:", {
    error: sanitizedError,
    path: req.path,
    method: req.method,
    // Don't log request body as it may contain sensitive data
  });

  // Never expose internal error details to client in production
  res.status(500).json({
    success: false,
    error: "حدث خطأ داخلي في الخادم",
    // Only include error details in development
    ...(env.NODE_ENV === "development" && {
      details: error.message,
    }),
  });
};
