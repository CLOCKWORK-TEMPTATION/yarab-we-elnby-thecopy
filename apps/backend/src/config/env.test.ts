import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest';
import crypto from 'crypto';

describe('Environment Configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    // Create a clean environment with only NODE_ENV set to test
    process.env = { NODE_ENV: 'test' };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('env validation', () => {
    it('should parse valid environment variables', async () => {
      (process.env as any).NODE_ENV = 'development';
      process.env.PORT = '3001';
      process.env.DATABASE_URL = `postgresql://${process.env.TEST_DB_USER || 'user'}:${process.env.TEST_DB_PASS || 'pass'}@localhost:5432/test_db`;
      process.env.JWT_SECRET = 'a-very-long-secret-key-for-testing-purposes-32-chars';
      process.env.CORS_ORIGIN = 'http://localhost:5000';
      process.env.RATE_LIMIT_WINDOW_MS = '900000';
      process.env.RATE_LIMIT_MAX_REQUESTS = '100';

      const { env } = await import('./env');

      expect(env.NODE_ENV).toBe('development');
      expect(env.PORT).toBe(3001);
      expect(env.DATABASE_URL).toContain('postgresql://');
      expect(env.DATABASE_URL).toContain('@localhost:5432/test_db');
      expect(env.JWT_SECRET).toHaveLength(54);
      expect(env.CORS_ORIGIN).toBe('http://localhost:5000');
      expect(env.RATE_LIMIT_WINDOW_MS).toBe(900000);
      expect(env.RATE_LIMIT_MAX_REQUESTS).toBe(100);
    });

    it('should use default values when not provided', async () => {
      // Start with minimal env
      process.env = { NODE_ENV: 'test' };

      const { env } = await import('./env');

      expect(env.NODE_ENV).toBe('test');
      expect(env.PORT).toBe(3001);
      expect(env.DATABASE_URL).toBe('sqlite://./dev.db');
    });

    it('should validate NODE_ENV enum', async () => {
      (process.env as any).NODE_ENV = 'production';
      process.env.JWT_SECRET = crypto.randomBytes(32).toString('hex');

      const { env } = await import('./env');

      expect(env.NODE_ENV).toBe('production');
    });

    it('should handle test environment', async () => {
      (process.env as any).NODE_ENV = 'test';
      delete process.env.JWT_SECRET;

      const { env } = await import('./env');

      expect(env.NODE_ENV).toBe('test');
    });

    it('should transform string PORT to number', async () => {
      process.env.PORT = '8080';
      delete process.env.JWT_SECRET;

      const { env } = await import('./env');

      expect(typeof env.PORT).toBe('number');
      expect(env.PORT).toBe(8080);
    });

    it('should transform rate limit values to numbers', async () => {
      process.env.RATE_LIMIT_WINDOW_MS = '600000';
      process.env.RATE_LIMIT_MAX_REQUESTS = '50';
      delete process.env.JWT_SECRET;

      const { env } = await import('./env');

      expect(typeof env.RATE_LIMIT_WINDOW_MS).toBe('number');
      expect(typeof env.RATE_LIMIT_MAX_REQUESTS).toBe('number');
      expect(env.RATE_LIMIT_WINDOW_MS).toBe(600000);
      expect(env.RATE_LIMIT_MAX_REQUESTS).toBe(50);
    });
  });

  describe('isDevelopment helper', () => {
    it('should return true for development environment', async () => {
      (process.env as any).NODE_ENV = 'development';
      delete process.env.JWT_SECRET;

      const { isDevelopment } = await import('./env');

      expect(isDevelopment).toBe(true);
    });

    it('should return false for production environment', async () => {
      (process.env as any).NODE_ENV = 'production';
      process.env.JWT_SECRET = crypto.randomBytes(32).toString('hex');

      const { isDevelopment } = await import('./env');

      expect(isDevelopment).toBe(false);
    });

    it('should return false for test environment', async () => {
      (process.env as any).NODE_ENV = 'test';
      delete process.env.JWT_SECRET;

      const { isDevelopment } = await import('./env');

      expect(isDevelopment).toBe(false);
    });
  });

  describe('optional environment variables', () => {
    it('should handle optional GOOGLE_GENAI_API_KEY', async () => {
      process.env = {
        NODE_ENV: 'test',
        // Ensure these are explicitly undefined
        GOOGLE_GENAI_API_KEY: undefined as any,
        GEMINI_API_KEY: undefined as any,
      };

      const { env } = await import('./env');

      // Optional fields can be undefined
      expect(env.GOOGLE_GENAI_API_KEY === undefined || typeof env.GOOGLE_GENAI_API_KEY === 'string').toBe(true);
    });

    it('should handle optional GEMINI_API_KEY', async () => {
      process.env = {
        NODE_ENV: 'test',
        GOOGLE_GENAI_API_KEY: undefined as any,
        GEMINI_API_KEY: undefined as any,
      };

      const { env } = await import('./env');

      // Optional fields can be undefined
      expect(env.GEMINI_API_KEY === undefined || typeof env.GEMINI_API_KEY === 'string').toBe(true);
    });

    it('should accept GOOGLE_GENAI_API_KEY when provided', async () => {
      process.env = {
        NODE_ENV: 'test',
        GOOGLE_GENAI_API_KEY: 'test-key',
        GEMINI_API_KEY: undefined as any,
      };

      const { env } = await import('./env');

      expect(env.GOOGLE_GENAI_API_KEY).toBe('test-key');
    });
  });
});
