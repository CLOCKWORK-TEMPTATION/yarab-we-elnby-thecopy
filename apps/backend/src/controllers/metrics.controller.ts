/**
 * Metrics Controller
 *
 * Provides comprehensive metrics API endpoints
 * Includes APM (Application Performance Monitoring) dashboard
 */

import { Request, Response } from 'express';
import { metricsAggregator } from '@/services/metrics-aggregator.service';
import { resourceMonitor } from '@/services/resource-monitor.service';
import { queueManager } from '@/queues/queue.config';
import { cacheMetricsService } from '@/services/cache-metrics.service';
import { logger } from '@/utils/logger';
import {
  getPerformanceDashboard,
  resetPerformanceMetrics,
  APM_CONFIG,
} from '@/config/sentry';

export class MetricsController {
  /**
   * Get comprehensive metrics snapshot
   * GET /api/metrics/snapshot
   */
  async getSnapshot(req: Request, res: Response): Promise<void> {
    try {
      const snapshot = await metricsAggregator.takeSnapshot();

      res.json({
        success: true,
        data: snapshot,
      });
    } catch (error) {
      logger.error('Failed to get metrics snapshot:', error);
      res.status(500).json({
        success: false,
        error: 'فشل في الحصول على لقطة المقاييس',
      });
    }
  }

  /**
   * Get latest metrics snapshot
   * GET /api/metrics/latest
   */
  async getLatest(req: Request, res: Response): Promise<void> {
    try {
      const snapshot = metricsAggregator.getLatestSnapshot();

      if (!snapshot) {
        // Take a new snapshot if none exists
        const newSnapshot = await metricsAggregator.takeSnapshot();
        res.json({
          success: true,
          data: newSnapshot,
        });
        return;
      }

      res.json({
        success: true,
        data: snapshot,
      });
    } catch (error) {
      logger.error('Failed to get latest metrics:', error);
      res.status(500).json({
        success: false,
        error: 'فشل في الحصول على آخر المقاييس',
      });
    }
  }

  /**
   * Get metrics for a time range
   * GET /api/metrics/range?start=2024-01-01&end=2024-01-02
   */
  async getRange(req: Request, res: Response): Promise<void> {
    try {
      const { start, end } = req.query;

      if (!start || !end) {
        res.status(400).json({
          success: false,
          error: 'يجب توفير start و end',
        });
        return;
      }

      const startTime = new Date(start as string);
      const endTime = new Date(end as string);

      if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
        res.status(400).json({
          success: false,
          error: 'تنسيق التاريخ غير صالح',
        });
        return;
      }

      const snapshots = metricsAggregator.getSnapshotsInRange(startTime, endTime);

      res.json({
        success: true,
        data: snapshots,
        count: snapshots.length,
      });
    } catch (error) {
      logger.error('Failed to get metrics range:', error);
      res.status(500).json({
        success: false,
        error: 'فشل في الحصول على نطاق المقاييس',
      });
    }
  }

  /**
   * Get database metrics
   * GET /api/metrics/database
   */
  async getDatabaseMetrics(req: Request, res: Response): Promise<void> {
    try {
      const snapshot = metricsAggregator.getLatestSnapshot();

      if (!snapshot) {
        const newSnapshot = await metricsAggregator.takeSnapshot();
        res.json({
          success: true,
          data: newSnapshot.database,
        });
        return;
      }

      res.json({
        success: true,
        data: snapshot.database,
      });
    } catch (error) {
      logger.error('Failed to get database metrics:', error);
      res.status(500).json({
        success: false,
        error: 'فشل في الحصول على مقاييس قاعدة البيانات',
      });
    }
  }

  /**
   * Get Redis metrics
   * GET /api/metrics/redis
   */
  async getRedisMetrics(req: Request, res: Response): Promise<void> {
    try {
      const snapshot = metricsAggregator.getLatestSnapshot();

      if (!snapshot) {
        const newSnapshot = await metricsAggregator.takeSnapshot();
        res.json({
          success: true,
          data: newSnapshot.redis,
        });
        return;
      }

      res.json({
        success: true,
        data: snapshot.redis,
      });
    } catch (error) {
      logger.error('Failed to get Redis metrics:', error);
      res.status(500).json({
        success: false,
        error: 'فشل في الحصول على مقاييس Redis',
      });
    }
  }

  /**
   * Get queue metrics
   * GET /api/metrics/queue
   */
  async getQueueMetrics(req: Request, res: Response): Promise<void> {
    try {
      const snapshot = metricsAggregator.getLatestSnapshot();

      if (!snapshot) {
        const newSnapshot = await metricsAggregator.takeSnapshot();
        res.json({
          success: true,
          data: newSnapshot.queue,
        });
        return;
      }

      res.json({
        success: true,
        data: snapshot.queue,
      });
    } catch (error) {
      logger.error('Failed to get queue metrics:', error);
      res.status(500).json({
        success: false,
        error: 'فشل في الحصول على مقاييس الطوابير',
      });
    }
  }

  /**
   * Get API metrics
   * GET /api/metrics/api
   */
  async getApiMetrics(req: Request, res: Response): Promise<void> {
    try {
      const snapshot = metricsAggregator.getLatestSnapshot();

      if (!snapshot) {
        const newSnapshot = await metricsAggregator.takeSnapshot();
        res.json({
          success: true,
          data: newSnapshot.api,
        });
        return;
      }

      res.json({
        success: true,
        data: snapshot.api,
      });
    } catch (error) {
      logger.error('Failed to get API metrics:', error);
      res.status(500).json({
        success: false,
        error: 'فشل في الحصول على مقاييس API',
      });
    }
  }

  /**
   * Get resource metrics
   * GET /api/metrics/resources
   */
  async getResourceMetrics(req: Request, res: Response): Promise<void> {
    try {
      const resources = await resourceMonitor.getResourceStatus();

      res.json({
        success: true,
        data: resources,
      });
    } catch (error) {
      logger.error('Failed to get resource metrics:', error);
      res.status(500).json({
        success: false,
        error: 'فشل في الحصول على مقاييس الموارد',
      });
    }
  }

  /**
   * Get Gemini API metrics
   * GET /api/metrics/gemini
   */
  async getGeminiMetrics(req: Request, res: Response): Promise<void> {
    try {
      const snapshot = metricsAggregator.getLatestSnapshot();

      if (!snapshot) {
        const newSnapshot = await metricsAggregator.takeSnapshot();
        res.json({
          success: true,
          data: newSnapshot.gemini,
        });
        return;
      }

      res.json({
        success: true,
        data: snapshot.gemini,
      });
    } catch (error) {
      logger.error('Failed to get Gemini metrics:', error);
      res.status(500).json({
        success: false,
        error: 'فشل في الحصول على مقاييس Gemini',
      });
    }
  }

  /**
   * Generate performance report
   * GET /api/metrics/report?start=2024-01-01&end=2024-01-02
   */
  async generateReport(req: Request, res: Response): Promise<void> {
    try {
      const { start, end } = req.query;

      let startTime: Date;
      let endTime: Date;

      if (start && end) {
        startTime = new Date(start as string);
        endTime = new Date(end as string);

        if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
          res.status(400).json({
            success: false,
            error: 'تنسيق التاريخ غير صالح',
          });
          return;
        }
      } else {
        // Default to last hour
        endTime = new Date();
        startTime = new Date(endTime.getTime() - 60 * 60 * 1000);
      }

      const report = await metricsAggregator.generatePerformanceReport(startTime, endTime);

      res.json({
        success: true,
        data: report,
      });
    } catch (error) {
      logger.error('Failed to generate performance report:', error);
      res.status(500).json({
        success: false,
        error: 'فشل في إنشاء تقرير الأداء',
      });
    }
  }

  /**
   * Get system health status
   * GET /api/metrics/health
   */
  async getHealth(req: Request, res: Response): Promise<void> {
    try {
      const resources = await resourceMonitor.getResourceStatus();
      const snapshot = metricsAggregator.getLatestSnapshot();

      let status: 'healthy' | 'degraded' | 'critical' = 'healthy';

      // Check resource status
      if (
        resources.cpu.status === 'critical' ||
        resources.memory.status === 'critical'
      ) {
        status = 'critical';
      } else if (
        resources.cpu.status === 'warning' ||
        resources.memory.status === 'warning'
      ) {
        status = 'degraded';
      }

      // Check error rates if snapshot exists
      if (snapshot) {
        if (snapshot.api.errorRate > 0.1) {
          status = 'critical';
        } else if (snapshot.api.errorRate > 0.05) {
          status = status === 'critical' ? 'critical' : 'degraded';
        }
      }

      const isUnderPressure = resourceMonitor.isUnderPressure();

      res.json({
        success: true,
        data: {
          status,
          isUnderPressure,
          timestamp: new Date().toISOString(),
          resources,
          metrics: snapshot ? {
            errorRate: snapshot.api.errorRate,
            avgResponseTime: snapshot.api.avgResponseTime,
            cacheHitRatio: snapshot.redis.hitRatio,
            activeJobs: snapshot.queue.activeJobs,
          } : null,
        },
      });
    } catch (error) {
      logger.error('Failed to get health status:', error);
      res.status(500).json({
        success: false,
        error: 'فشل في الحصول على حالة النظام',
      });
    }
  }

  /**
   * Get dashboard summary
   * GET /api/metrics/dashboard
   */
  async getDashboardSummary(req: Request, res: Response): Promise<void> {
    try {
      const snapshot = await metricsAggregator.takeSnapshot();
      const resources = await resourceMonitor.getResourceStatus();

      const summary = {
        timestamp: snapshot.timestamp,
        overview: {
          totalRequests: snapshot.api.totalRequests,
          avgResponseTime: snapshot.api.avgResponseTime,
          errorRate: snapshot.api.errorRate,
          activeJobs: snapshot.queue.activeJobs,
          cacheHitRatio: snapshot.redis.hitRatio,
        },
        database: {
          totalQueries: snapshot.database.totalQueries,
          avgDuration: snapshot.database.avgQueryDuration,
          slowQueries: snapshot.database.slowQueries,
        },
        redis: {
          hitRatio: snapshot.redis.hitRatio,
          hits: snapshot.redis.hits,
          misses: snapshot.redis.misses,
          memoryUsage: snapshot.redis.memoryUsage,
        },
        queue: {
          total: snapshot.queue.totalJobs,
          active: snapshot.queue.activeJobs,
          completed: snapshot.queue.completedJobs,
          failed: snapshot.queue.failedJobs,
        },
        resources: {
          cpu: resources.cpu,
          memory: resources.memory,
          concurrentRequests: resources.concurrentRequests,
        },
        gemini: {
          totalRequests: snapshot.gemini.totalRequests,
          avgDuration: snapshot.gemini.avgDuration,
          cacheHitRatio: snapshot.gemini.cacheHitRatio,
          errorRate: snapshot.gemini.errorRate,
        },
      };

      res.json({
        success: true,
        data: summary,
      });
    } catch (error) {
      logger.error('Failed to get dashboard summary:', error);
      res.status(500).json({
        success: false,
        error: 'فشل في الحصول على ملخص لوحة التحكم',
      });
    }
  }

  /**
   * Get cache-specific metrics snapshot
   * GET /api/metrics/cache/snapshot
   */
  async getCacheSnapshot(req: Request, res: Response): Promise<void> {
    try {
      const snapshot = await cacheMetricsService.takeSnapshot();

      res.json({
        success: true,
        data: snapshot,
      });
    } catch (error) {
      logger.error('Failed to get cache snapshot:', error);
      res.status(500).json({
        success: false,
        error: 'فشل في الحصول على لقطة مقاييس الكاش',
      });
    }
  }

  /**
   * Get real-time cache statistics
   * GET /api/metrics/cache/realtime
   */
  async getCacheRealtime(req: Request, res: Response): Promise<void> {
    try {
      const stats = cacheMetricsService.getRealTimeStats();

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      logger.error('Failed to get real-time cache stats:', error);
      res.status(500).json({
        success: false,
        error: 'فشل في الحصول على إحصائيات الكاش الفورية',
      });
    }
  }

  /**
   * Get cache health status
   * GET /api/metrics/cache/health
   */
  async getCacheHealth(req: Request, res: Response): Promise<void> {
    try {
      const health = await cacheMetricsService.getHealthStatus();

      res.json({
        success: true,
        data: health,
      });
    } catch (error) {
      logger.error('Failed to get cache health:', error);
      res.status(500).json({
        success: false,
        error: 'فشل في الحصول على حالة الكاش الصحية',
      });
    }
  }

  /**
   * Generate cache performance report
   * GET /api/metrics/cache/report?start=2024-01-01&end=2024-01-02
   */
  async getCacheReport(req: Request, res: Response): Promise<void> {
    try {
      const { start, end } = req.query;

      let startTime: Date;
      let endTime: Date;

      if (start && end) {
        startTime = new Date(start as string);
        endTime = new Date(end as string);

        if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
          res.status(400).json({
            success: false,
            error: 'تنسيق التاريخ غير صالح',
          });
          return;
        }
      } else {
        // Default to last hour
        endTime = new Date();
        startTime = new Date(endTime.getTime() - 60 * 60 * 1000);
      }

      const report = await cacheMetricsService.generatePerformanceReport(
        startTime,
        endTime
      );

      res.json({
        success: true,
        data: report,
      });
    } catch (error) {
      logger.error('Failed to generate cache report:', error);
      res.status(500).json({
        success: false,
        error: 'فشل في إنشاء تقرير أداء الكاش',
      });
    }
  }

  // ============================================
  // APM (Application Performance Monitoring) Endpoints
  // ============================================

  /**
   * Get APM Performance Dashboard
   * GET /api/metrics/apm/dashboard
   *
   * Returns:
   * - P50, P95, P99 latencies
   * - Throughput (requests/second)
   * - Error rates by endpoint
   * - Operation-specific metrics (Gemini, DB, Redis)
   * - Alert status
   */
  async getApmDashboard(req: Request, res: Response): Promise<void> {
    try {
      const dashboard = getPerformanceDashboard();

      res.json({
        success: true,
        data: dashboard,
      });
    } catch (error) {
      logger.error('Failed to get APM dashboard:', error);
      res.status(500).json({
        success: false,
        error: 'فشل في الحصول على لوحة مراقبة الأداء',
      });
    }
  }

  /**
   * Get APM Configuration
   * GET /api/metrics/apm/config
   */
  async getApmConfig(req: Request, res: Response): Promise<void> {
    try {
      res.json({
        success: true,
        data: {
          thresholds: APM_CONFIG.thresholds,
          errorRateThreshold: APM_CONFIG.errorRateThreshold,
          sampleRates: {
            traces: APM_CONFIG.tracesSampleRate,
            profiles: APM_CONFIG.profilesSampleRate,
          },
        },
      });
    } catch (error) {
      logger.error('Failed to get APM config:', error);
      res.status(500).json({
        success: false,
        error: 'فشل في الحصول على إعدادات APM',
      });
    }
  }

  /**
   * Reset APM Performance Metrics
   * POST /api/metrics/apm/reset
   *
   * Resets all performance metrics counters.
   * Should be called periodically (e.g., every hour) or manually for testing.
   */
  async resetApmMetrics(req: Request, res: Response): Promise<void> {
    try {
      resetPerformanceMetrics();

      res.json({
        success: true,
        message: 'تم إعادة تعيين مقاييس الأداء',
      });
    } catch (error) {
      logger.error('Failed to reset APM metrics:', error);
      res.status(500).json({
        success: false,
        error: 'فشل في إعادة تعيين مقاييس الأداء',
      });
    }
  }

  /**
   * Get APM Alerts Status
   * GET /api/metrics/apm/alerts
   *
   * Returns current alert status based on thresholds
   */
  async getApmAlerts(req: Request, res: Response): Promise<void> {
    try {
      const dashboard = getPerformanceDashboard();

      const alerts = {
        current: dashboard.alerts,
        thresholds: {
          p95Latency: APM_CONFIG.thresholds.apiResponse,
          errorRate: APM_CONFIG.errorRateThreshold,
          geminiLatency: APM_CONFIG.thresholds.geminiCall,
          dbLatency: APM_CONFIG.thresholds.dbQuery,
          redisLatency: APM_CONFIG.thresholds.redisOperation,
        },
        metrics: {
          p95Latency: dashboard.latencies.p95,
          errorRate: dashboard.summary.errorRate,
        },
        status: dashboard.alerts.p95AboveThreshold || dashboard.alerts.errorRateAboveThreshold
          ? 'warning'
          : 'ok',
      };

      res.json({
        success: true,
        data: alerts,
      });
    } catch (error) {
      logger.error('Failed to get APM alerts:', error);
      res.status(500).json({
        success: false,
        error: 'فشل في الحصول على تنبيهات الأداء',
      });
    }
  }
}

export const metricsController = new MetricsController();
