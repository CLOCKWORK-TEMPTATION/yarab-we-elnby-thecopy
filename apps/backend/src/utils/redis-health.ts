/**
 * Redis Health Check Utility
 */

import { createClient } from 'redis';
import type { RedisClientType } from 'redis';
import { logger } from './logger';

let redisClient: RedisClientType | null = null;

/**
 * Check if Redis is available
 */
export async function checkRedisHealth(): Promise<boolean> {
  try {
    if (!redisClient) {
      const url = process.env.REDIS_PASSWORD
        ? `redis://:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || '6379'}`
        : `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || '6379'}`;
      
      redisClient = createClient({
        url,
        socket: {
          connectTimeout: 5000,
          reconnectStrategy: () => false,
        },
      });
      
      await redisClient.connect();
    }

    await redisClient.ping();
    logger.info('[Redis] Health check passed');
    return true;
  } catch (error) {
    logger.warn('[Redis] Health check failed:', error);
    if (redisClient) {
      await redisClient.disconnect().catch(() => {});
      redisClient = null;
    }
    return false;
  }
}

/**
 * Get Redis status for monitoring
 */
export async function getRedisStatus() {
  const isHealthy = await checkRedisHealth();
  
  return {
    status: isHealthy ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
  };
}

/**
 * Close Redis connection
 */
export async function closeRedisConnection() {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
}