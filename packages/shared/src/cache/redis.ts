/**
 * Redis caching utilities
 *
 * Uses the `redis` package (v5) for actual caching when enabled.
 * Gracefully falls back to pass-through when Redis is unavailable.
 *
 * Enable by setting:
 *   REDIS_ENABLED=true
 *   REDIS_URL=redis://localhost:6379
 */

import { createClient, type RedisClientType } from "redis";

// ── Configuration ──────────────────────────────────────────────────

const REDIS_ENABLED =
  process.env.REDIS_ENABLED === "true" && !!process.env.REDIS_URL;

const DEFAULT_TTL = 3600; // 1 hour in seconds

// ── Singleton client ───────────────────────────────────────────────

let client: RedisClientType | null = null;
let connectionFailed = false;

async function ensureClient(): Promise<RedisClientType | null> {
  if (!REDIS_ENABLED) return null;
  if (connectionFailed) return null;
  if (client?.isOpen) return client;

  try {
    client = createClient({ url: process.env.REDIS_URL }) as RedisClientType;

    client.on("error", (err) => {
      console.warn("[redis] Client error:", err.message);
    });

    await client.connect();
    return client;
  } catch (err) {
    console.warn(
      "[redis] Failed to connect — caching disabled for this process:",
      (err as Error).message
    );
    connectionFailed = true;
    client = null;
    return null;
  }
}

// ── Public API ─────────────────────────────────────────────────────

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
}

/**
 * Returns the underlying Redis client (lazy-initialized).
 * Returns null when Redis is disabled or unavailable.
 */
export async function getRedisClient(): Promise<RedisClientType | null> {
  return ensureClient();
}

/**
 * Generate a cache key for Gemini API calls.
 */
export function generateGeminiCacheKey(
  prompt: string,
  model: string,
  options?: Record<string, any>
): string {
  const hash = Buffer.from(JSON.stringify({ prompt, model, options })).toString(
    "base64"
  );
  return `gemini:${model}:${hash}`;
}

/**
 * Get a cached value by key. Returns null on miss or when Redis is unavailable.
 */
export async function getCached<T>(key: string): Promise<T | null> {
  try {
    const redis = await ensureClient();
    if (!redis) return null;

    const raw = await redis.get(key);
    if (raw === null) return null;

    return JSON.parse(raw) as T;
  } catch (err) {
    console.warn("[redis] getCached error:", (err as Error).message);
    return null;
  }
}

/**
 * Set a cached value. Serializes to JSON. Optional TTL (defaults to 1 hour).
 */
export async function setCached<T>(
  key: string,
  value: T,
  options?: CacheOptions
): Promise<void> {
  try {
    const redis = await ensureClient();
    if (!redis) return;

    const ttl = options?.ttl ?? DEFAULT_TTL;
    await redis.set(key, JSON.stringify(value), { EX: ttl });
  } catch (err) {
    console.warn("[redis] setCached error:", (err as Error).message);
  }
}

/**
 * Invalidate cache keys matching a glob pattern.
 * Uses SCAN (not KEYS) to avoid blocking Redis on large datasets.
 */
export async function invalidateCache(pattern: string): Promise<void> {
  try {
    const redis = await ensureClient();
    if (!redis) return;

    let cursor = 0;
    do {
      const result = await redis.scan(cursor, { MATCH: pattern, COUNT: 100 });
      cursor = result.cursor;
      const keys = result.keys;
      if (keys.length > 0) {
        await redis.del(keys);
      }
    } while (cursor !== 0);
  } catch (err) {
    console.warn("[redis] invalidateCache error:", (err as Error).message);
  }
}

/**
 * Cache-through helper for Gemini (or any async) calls.
 * On cache hit, returns the cached value. On miss, calls `callFn`,
 * caches the result, and returns it.
 * Falls through to a direct call when Redis is unavailable.
 */
export async function cachedGeminiCall<T>(
  key: string,
  callFn: () => Promise<T>,
  options?: CacheOptions
): Promise<T> {
  try {
    const redis = await ensureClient();
    if (redis) {
      const raw = await redis.get(key);
      if (raw !== null) {
        return JSON.parse(raw) as T;
      }
    }
  } catch (err) {
    console.warn("[redis] cachedGeminiCall read error:", (err as Error).message);
    // Fall through to direct call
  }

  const result = await callFn();

  // Fire-and-forget cache write — don't slow down the response
  try {
    const redis = await ensureClient();
    if (redis) {
      const ttl = options?.ttl ?? DEFAULT_TTL;
      await redis.set(key, JSON.stringify(result), { EX: ttl });
    }
  } catch (err) {
    console.warn(
      "[redis] cachedGeminiCall write error:",
      (err as Error).message
    );
  }

  return result;
}
