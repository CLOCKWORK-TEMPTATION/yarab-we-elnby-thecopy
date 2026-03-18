/**
 * Real-time Communication Controller
 *
 * Handles SSE connections and real-time event endpoints
 */

import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { sseService } from '@/services/sse.service';
import { websocketService } from '@/services/websocket.service';
import { logger } from '@/utils/logger';
import { RealtimeEventType } from '@/types/realtime.types';

export class RealtimeController {
  /**
   * Initialize SSE connection
   * GET /api/realtime/events
   */
  async connectSSE(req: Request, res: Response): Promise<void> {
    const clientId = uuidv4();
    const userId = (req.user as any)?.userId;
    const lastEventId = req.headers['last-event-id'] as string | undefined;

    // Initialize SSE connection
    sseService.initializeConnection(clientId, res, userId, lastEventId);

    // Sanitize log inputs to prevent CRLF injection
    const safeClientId = clientId.replace(/[\r\n]/g, '');
    const safeUserId = userId ? userId.replace(/[\r\n]/g, '') : 'anonymous';

    logger.info("[SSE] New connection established");
  }

  /**
   * Get real-time service statistics
   * GET /api/realtime/stats
   */
  async getStats(req: Request, res: Response): Promise<void> {
    try {
      const wsStats = websocketService.getStats();
      const sseStats = sseService.getStats();

      res.json({
        success: true,
        stats: {
          websocket: wsStats,
          sse: sseStats,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      logger.error('[Realtime] Failed to get stats');
      res.status(500).json({
        success: false,
        error: 'فشل في الحصول على إحصائيات الاتصالات الحية',
      });
    }
  }

  /**
   * Health check for real-time services
   * GET /api/realtime/health
   */
  async healthCheck(req: Request, res: Response): Promise<void> {
    const wsIO = websocketService.getIO();
    const sseStats = sseService.getStats();

    const health = {
      websocket: {
        status: wsIO ? 'operational' : 'not_initialized',
        initialized: !!wsIO,
      },
      sse: {
        status: 'operational',
        clients: sseStats.totalClients,
      },
      timestamp: new Date().toISOString(),
    };

    res.json({
      success: true,
      health,
    });
  }

  /**
   * Test endpoint to send a test event
   * POST /api/realtime/test
   * (Admin only - should be protected)
   */
  async sendTestEvent(req: Request, res: Response): Promise<void> {
    try {
      const { eventType, payload, target } = req.body;

      const testEvent = {
        event: eventType || RealtimeEventType.SYSTEM_INFO,
        payload: {
          ...payload,
          timestamp: new Date().toISOString(),
          eventType: eventType || RealtimeEventType.SYSTEM_INFO,
          message: payload?.message || 'Test event',
        },
      };

      // Send via WebSocket
      if (target === 'websocket' || !target) {
        websocketService.broadcast(testEvent);
      }

      // Send via SSE
      if (target === 'sse' || !target) {
        sseService.broadcast(testEvent);
      }

      res.json({
        success: true,
        message: 'Test event sent successfully',
        event: testEvent,
      });
    } catch (error) {
      // Sanitize error info
      const safeError = error instanceof Error
        ? error.message.replace(/[\r\n]/g, ' ')
        : String(error).replace(/[\r\n]/g, ' ');

      logger.error('[Realtime] Failed to send test event');
      res.status(500).json({
        success: false,
        error: 'فشل في إرسال الحدث التجريبي',
      });
    }
  }

  /**
   * Stream analysis logs via SSE
   * GET /api/realtime/analysis/:analysisId/stream
   */
  async streamAnalysisLogs(req: Request, res: Response): Promise<void> {
    const analysisId = typeof req.params.analysisId === 'string' ? req.params.analysisId : '';
    const clientId = uuidv4();
    const userId = (req.user as { userId?: string })?.userId;

    // Initialize SSE connection
    sseService.initializeConnection(clientId, res, userId);

    // Subscribe to analysis room
    const analysisRoom = `analysis:${analysisId}`;
    sseService.subscribeToRoom(clientId, analysisRoom);

    // Sanitize log inputs
    const safeClientId = clientId.replace(/[\r\n]/g, '');
    const safeAnalysisId = analysisId.replace(/[\r\n]/g, '');

    logger.info("[SSE] Client streaming analysis logs");

    // Send initial event
    sseService.sendToClient(clientId, {
      event: RealtimeEventType.ANALYSIS_STARTED,
      payload: {
        timestamp: new Date().toISOString(),
        eventType: RealtimeEventType.ANALYSIS_STARTED,
        projectId: analysisId,
        analysisId,
        message: 'Analysis log streaming started',
      },
    });
  }

  /**
   * Stream job progress via SSE
   * GET /api/realtime/jobs/:jobId/stream
   */
  async streamJobProgress(req: Request, res: Response): Promise<void> {
    const jobId = typeof req.params.jobId === 'string' ? req.params.jobId : '';
    const clientId = uuidv4();
    const userId = (req.user as { userId?: string })?.userId;

    // Initialize SSE connection
    sseService.initializeConnection(clientId, res, userId);

    // Subscribe to job room
    const jobRoom = `job:${jobId}`;
    sseService.subscribeToRoom(clientId, jobRoom);

    // Sanitize log inputs
    const safeClientId = clientId.replace(/[\r\n]/g, '');
    const safeJobId = jobId.replace(/[\r\n]/g, '');

    logger.info("[SSE] Client streaming job progress");

    // Send initial event
    sseService.sendToClient(clientId, {
      event: RealtimeEventType.JOB_STARTED,
      payload: {
        timestamp: new Date().toISOString(),
        eventType: RealtimeEventType.JOB_STARTED,
        jobId,
        queueName: 'unknown',
        jobName: jobId,
        message: 'Job progress streaming started',
      },
    });
  }
}

export const realtimeController = new RealtimeController();
