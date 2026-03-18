import { Request, Response } from 'express';
import { db } from '../db/index.js';
import { createClient } from 'redis';
import { getRedisConfig } from '../config/redis.config.js';
import { logger } from '@/utils/logger';

interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  version: string;
  uptime: number;
  checks: {
    database: HealthCheck;
    redis: HealthCheck;
    memory: HealthCheck;
  };
}

interface HealthCheck {
  status: 'healthy' | 'unhealthy';
  responseTime?: number;
  error?: string;
}

interface ReadinessStatus {
  status: 'ready' | 'not_ready';
  timestamp: string;
  checks: {
    database: HealthCheck;
    redis: HealthCheck;
    external_services: HealthCheck;
  };
}

interface LivenessStatus {
  status: 'alive' | 'dead';
  timestamp: string;
  uptime: number;
}

export class HealthController {
  private startTime = Date.now();

  /**
   * Basic health check endpoint
   * Returns overall health status of the application
   */
  async getHealth(req: Request, res: Response): Promise<void> {
    try {
      const healthStatus = await this.performHealthChecks();
      const isHealthy = Object.values(healthStatus.checks).every(check => check.status === 'healthy');
      
      res.status(isHealthy ? 200 : 503).json(healthStatus);
    } catch (error) {
      logger.error('Health check failed', { error });
      res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
        uptime: Date.now() - this.startTime,
        error: 'Health check failed',
      });
    }
  }

  /**
   * Readiness probe endpoint
   * Checks if the application is ready to serve traffic
   */
  async getReadiness(req: Request, res: Response): Promise<void> {
    try {
      const readinessStatus = await this.performReadinessChecks();
      const isReady = Object.values(readinessStatus.checks).every(check => check.status === 'healthy');
      
      res.status(isReady ? 200 : 503).json(readinessStatus);
    } catch (error) {
      logger.error('Readiness check failed', { error });
      res.status(503).json({
        status: 'not_ready',
        timestamp: new Date().toISOString(),
        error: 'Readiness check failed',
      });
    }
  }

  /**
   * Liveness probe endpoint
   * Checks if the application is alive and responding
   */
  async getLiveness(req: Request, res: Response): Promise<void> {
    try {
      const livenessStatus: LivenessStatus = {
        status: 'alive',
        timestamp: new Date().toISOString(),
        uptime: Date.now() - this.startTime,
      };
      
      res.status(200).json(livenessStatus);
    } catch (error) {
      logger.error('Liveness check failed', { error });
      res.status(503).json({
        status: 'dead',
        timestamp: new Date().toISOString(),
        error: 'Liveness check failed',
      });
    }
  }

  /**
   * Startup probe endpoint
   * Checks if the application has started successfully
   */
  async getStartup(req: Request, res: Response): Promise<void> {
    try {
      // Check if application has been running for at least 30 seconds
      const uptime = Date.now() - this.startTime;
      const isStarted = uptime > 30000; // 30 seconds
      
      const startupStatus = {
        status: isStarted ? 'started' : 'starting',
        timestamp: new Date().toISOString(),
        uptime,
        startTime: new Date(this.startTime).toISOString(),
      };
      
      res.status(isStarted ? 200 : 503).json(startupStatus);
    } catch (error) {
      logger.error('Startup check failed', { error });
      res.status(503).json({
        status: 'failed',
        timestamp: new Date().toISOString(),
        error: 'Startup check failed',
      });
    }
  }

  /**
   * Detailed health check with all system components
   */
  async getDetailedHealth(req: Request, res: Response): Promise<void> {
    try {
      const detailedHealth = await this.performDetailedHealthChecks();
      const isHealthy = Object.values(detailedHealth.checks).every(
        (check: any) => check.status === 'healthy'
      );
      
      res.status(isHealthy ? 200 : 503).json(detailedHealth);
    } catch (error) {
      logger.error('Detailed health check failed', { error });
      res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Detailed health check failed',
      });
    }
  }

  private async performHealthChecks(): Promise<HealthStatus> {
    const checks = {
      database: await this.checkDatabase(),
      redis: await this.checkRedis(),
      memory: await this.checkMemory(),
    };

    return {
      status: Object.values(checks).every(check => check.status === 'healthy') ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      uptime: Date.now() - this.startTime,
      checks,
    };
  }

  private async performReadinessChecks(): Promise<ReadinessStatus> {
    const checks = {
      database: await this.checkDatabase(),
      redis: await this.checkRedis(),
      external_services: await this.checkExternalServices(),
    };

    return {
      status: Object.values(checks).every(check => check.status === 'healthy') ? 'ready' : 'not_ready',
      timestamp: new Date().toISOString(),
      checks,
    };
  }

  private async performDetailedHealthChecks(): Promise<any> {
    const checks = {
      database: await this.checkDatabase(),
      redis: await this.checkRedis(),
      memory: await this.checkMemory(),
      disk: await this.checkDisk(),
      external_services: await this.checkExternalServices(),
      environment: await this.checkEnvironment(),
    };

    return {
      status: Object.values(checks).every(check => check.status === 'healthy') ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      uptime: Date.now() - this.startTime,
      environment: process.env.NODE_ENV || 'development',
      checks,
    };
  }

  private async checkDatabase(): Promise<HealthCheck> {
    const startTime = Date.now();
    try {
      await db.execute('SELECT 1');
      return {
        status: 'healthy',
        responseTime: Date.now() - startTime,
      };
    } catch (error) {
      logger.error('Database health check failed', { error });
      return {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Database connection failed',
      };
    }
  }

  private async checkRedis(): Promise<HealthCheck> {
    const startTime = Date.now();
    let client: any = null;
    try {
      const config = getRedisConfig();
      client = createClient(config);
      await client.connect();
      await client.ping();
      await client.disconnect();
      return {
        status: 'healthy',
        responseTime: Date.now() - startTime,
      };
    } catch (error) {
      logger.error('Redis health check failed', { error });
      if (client) {
        try {
          await client.disconnect();
        } catch (disconnectError) {
          logger.error('Error disconnecting Redis client', { disconnectError });
        }
      }
      return {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Redis connection failed',
      };
    }
  }

  private async checkMemory(): Promise<HealthCheck> {
    try {
      const usage = process.memoryUsage();
      const heapUsed = usage.heapUsed / 1024 / 1024; // MB
      const heapTotal = usage.heapTotal / 1024 / 1024; // MB
      const memoryLimit = 512; // 512MB limit

      if (heapUsed > memoryLimit) {
        return {
          status: 'unhealthy',
          error: `Memory usage (${heapUsed.toFixed(2)}MB) exceeds limit (${memoryLimit}MB)`,
        };
      }

      return {
        status: 'healthy',
        responseTime: Math.round(heapUsed),
      };
    } catch (error) {
      logger.error('Memory health check failed', { error });
      return {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Memory check failed',
      };
    }
  }

  private async checkDisk(): Promise<HealthCheck> {
    try {
      // Simple disk space check (mock implementation)
      // In a real implementation, you would use a library like 'check-disk-space'
      const diskUsage = 75; // Mock disk usage percentage
      const diskLimit = 90; // 90% limit

      if (diskUsage > diskLimit) {
        return {
          status: 'unhealthy',
          error: `Disk usage (${diskUsage}%) exceeds limit (${diskLimit}%)`,
        };
      }

      return {
        status: 'healthy',
        responseTime: diskUsage,
      };
    } catch (error) {
      logger.error('Disk health check failed', { error });
      return {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Disk check failed',
      };
    }
  }

  private async checkExternalServices(): Promise<HealthCheck> {
    try {
      // Check external services like AI providers, third-party APIs
      // This is a mock implementation
      const externalServices = [
        { name: 'Gemini AI', url: 'https://generativelanguage.googleapis.com' },
        { name: 'Sentry', url: 'https://sentry.io' },
      ];

      // In a real implementation, you would ping these services
      const allHealthy = true; // Mock result

      if (!allHealthy) {
        return {
          status: 'unhealthy',
          error: 'One or more external services are unavailable',
        };
      }

      return {
        status: 'healthy',
        responseTime: 100, // Mock response time
      };
    } catch (error) {
      logger.error('External services health check failed', { error });
      return {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'External services check failed',
      };
    }
  }

  private async checkEnvironment(): Promise<HealthCheck> {
    try {
      const requiredEnvVars = [
        'NODE_ENV',
        'DATABASE_URL',
        'REDIS_URL',
        'JWT_SECRET',
        'GEMINI_API_KEY',
      ];

      const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

      if (missingVars.length > 0) {
        return {
          status: 'unhealthy',
          error: `Missing required environment variables: ${missingVars.join(', ')}`,
        };
      }

      return {
        status: 'healthy',
        responseTime: 0,
      };
    } catch (error) {
      logger.error('Environment health check failed', { error });
      return {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Environment check failed',
      };
    }
  }
}