import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3001').transform(Number),
  GOOGLE_GENAI_API_KEY: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  DATABASE_URL: z.string().optional().default('sqlite://./dev.db'),
  // JWT_SECRET: Required in production with minimum 32 characters
  // In development, a default is provided but should be changed
  JWT_SECRET: z.string().default('dev-secret-CHANGE-THIS-IN-PRODUCTION-minimum-32-chars'),
  CORS_ORIGIN: z.string().default('http://localhost:5000,http://localhost:9002'),
  RATE_LIMIT_WINDOW_MS: z.string().default('900000').transform(Number), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: z.string().default('100').transform(Number),
  // Redis Configuration (for caching and job queues)
  FRONTEND_URL: z.string().optional(),
  REDIS_ENABLED: z.string().optional(),
  REDIS_URL: z.string().optional(),
  REDIS_HOST: z.string().optional().default('localhost'),
  REDIS_PORT: z.string().optional().default('6379').transform(Number),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_SENTINEL_ENABLED: z.string().optional(),
  REDIS_SENTINELS: z.string().optional(),
  REDIS_MASTER_NAME: z.string().optional(),
  REDIS_SENTINEL_PASSWORD: z.string().optional(),
  // Sentry Configuration (for error tracking and performance monitoring)
  SENTRY_DSN: z.string().optional(),
  SENTRY_ORG: z.string().optional(),
  SENTRY_PROJECT: z.string().optional(),
  SENTRY_AUTH_TOKEN: z.string().optional(),
  SENTRY_RELEASE: z.string().optional(),
  SENTRY_SERVER_NAME: z.string().optional(),
  SENTRY_TRACES_SAMPLE_RATE: z.string().optional(),
  SENTRY_PROFILES_SAMPLE_RATE: z.string().optional(),
  SENTRY_SUPPRESS_TURBOPACK_WARNING: z.string().optional(),
  SENTRY_SUPPRESS_GLOBAL_ERROR_HANDLER_FILE_WARNING: z.string().optional(),
  TRACING_ENABLED: z.string().optional(),
  SERVICE_NAME: z.string().optional(),
  FILE_IMPORT_HOST: z.string().optional(),
  FILE_IMPORT_PORT: z.string().optional(),
  LOG_LEVEL: z.string().optional(),
});

const parsedEnv = envSchema.parse(process.env);

// Security validation: In production, JWT_SECRET must be strong
if (parsedEnv.NODE_ENV === 'production') {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is required in production');
  }
  if (parsedEnv.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters in production');
  }
  if (parsedEnv.JWT_SECRET.includes('dev-secret') || parsedEnv.JWT_SECRET.includes('CHANGE-THIS')) {
    throw new Error('JWT_SECRET cannot use default value in production. Please set a secure secret.');
  }
}

export const env = parsedEnv;

export const isProduction = env.NODE_ENV === 'production';
export const isDevelopment = env.NODE_ENV === 'development';
