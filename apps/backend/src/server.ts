import 'module-alias/register';

// Initialize OpenTelemetry tracing (MUST be before any other imports)
import { initTracing } from '@/config/tracing';
initTracing();

import express, { Application } from 'express';
import { createServer } from 'http';
import type { Server } from 'http';
import cookieParser from 'cookie-parser';
import { env } from '@/config/env';
import { initializeSentry } from '@/config/sentry';
import { setupMiddleware, errorHandler } from '@/middleware';
import { sentryErrorHandler, trackError, trackPerformance } from '@/middleware/sentry.middleware';
import { logAuthAttempts, logRateLimitViolations } from '@/middleware/security-logger.middleware';
import { wafMiddleware, getWAFStats, getWAFEvents, blockIP, unblockIP, getBlockedIPs, updateWAFConfig, getWAFConfig } from '@/middleware/waf.middleware';
import { metricsMiddleware, metricsEndpoint } from '@/middleware/metrics.middleware';
import { csrfProtection, setCsrfToken } from '@/middleware/csrf.middleware';
import { AnalysisController } from '@/controllers/analysis.controller';
import { HealthController } from '@/controllers/health.controller';
import { authController } from '@/controllers/auth.controller';
import { projectsController } from '@/controllers/projects.controller';
import { scenesController } from '@/controllers/scenes.controller';
import { charactersController } from '@/controllers/characters.controller';
import { shotsController } from '@/controllers/shots.controller';
import { aiController } from '@/controllers/ai.controller';
import { authMiddleware } from '@/middleware/auth.middleware';
import { logger } from '@/utils/logger';
import { closeDatabase } from '@/db';

import { initializeWorkers, shutdownQueues } from '@/queues';
import { setupBullBoard, getAuthenticatedBullBoardRouter } from '@/middleware/bull-board.middleware';
import { queueController } from '@/controllers/queue.controller';
import { metricsController } from '@/controllers/metrics.controller';
import { critiqueController } from '@/controllers/critique.controller';
import { websocketService } from '@/services/websocket.service';
import { sseService } from '@/services/sse.service';

// Initialize Sentry monitoring (must be first)
initializeSentry();

const app: Application = express();
// Create HTTP server for WebSocket integration
const httpServer: Server = createServer(app);
const analysisController = new AnalysisController();
const healthController = new HealthController();

// Sentry error tracking and performance monitoring
app.use(trackError);
app.use(trackPerformance);

// Prometheus metrics tracking
app.use(metricsMiddleware);

// SLO Metrics tracking (Availability, Latency, Error Budget)
import { sloMetricsMiddleware } from '@/middleware/slo-metrics.middleware';
app.use(sloMetricsMiddleware);

// WAF (Web Application Firewall) - must be early in the chain
app.use(wafMiddleware);

// Security logging middleware
app.use(logAuthAttempts);
app.use(logRateLimitViolations);

// Initialize cookie parser (required for CSRF token cookie handling)
// SECURITY: cookieParser is required before csrfProtection middleware below
app.use(cookieParser());

// CSRF Protection - Implements Double Submit Cookie pattern
// SECURITY: This middleware provides CSRF protection by:
// 1. Setting CSRF tokens in cookies for GET requests (via setCsrfToken)
// 2. Validating CSRF tokens in headers for state-changing requests (via csrfProtection)
// 3. Additional Origin/Referer header validation for browser-based requests
app.use(csrfProtection);

// Additional CSRF Protection - validates Origin/Referer for state-changing requests
// This provides defense-in-depth alongside the token-based csrfProtection middleware
// SECURITY: This middleware runs AFTER csrfProtection to add an additional layer
app.use((req, res, next) => {
  // Only check state-changing methods
  if (!['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    return next();
  }

  // Skip for health endpoints and metrics
  const safePaths = ['/health', '/api/health', '/metrics'];
  if (safePaths.some(path => req.path.startsWith(path))) {
    return next();
  }

  const origin = req.get('Origin');
  const referer = req.get('Referer');
  const contentType = req.get('Content-Type') || '';
  const userAgent = req.get('User-Agent') || '';

  const allowedOrigins = [
    env.CORS_ORIGIN,
    'http://localhost:5000',
    'http://localhost:3000',
    `http://localhost:${env.PORT}`,
  ].filter(Boolean);

  // SECURITY: Require Origin or Referer for state-changing requests
  if (!origin && !referer) {
    const isBrowserRequest =
      contentType.includes('application/x-www-form-urlencoded') ||
      contentType.includes('multipart/form-data') ||
      (contentType.includes('application/json') && userAgent.toLowerCase().includes('mozilla'));

    if (isBrowserRequest) {
      const sanitizedPath = req.path.replace(/[^\w\-\/]/g, '');
      const sanitizedMethod = req.method.replace(/[^A-Z]/g, '');
      logger.warn('CSRF: Missing Origin/Referer', {
        path: sanitizedPath,
        method: sanitizedMethod,
      });
      return res.status(403).json({
        success: false,
        error: 'طلب غير مصرح به',
        code: 'CSRF_MISSING_ORIGIN'
      });
    }
    return next();
  }

  // Validate Origin
  if (origin) {
    if (!allowedOrigins.some(allowed => origin === allowed || origin.startsWith(allowed as string))) {
      const sanitizedOrigin = origin.replace(/[^\w\-\:\.]/g, '');
      logger.warn('CSRF: Origin mismatch', { origin: sanitizedOrigin });
      return res.status(403).json({
        success: false,
        error: 'طلب غير مصرح به',
        code: 'CSRF_ORIGIN_MISMATCH'
      });
    }
  }

  // Validate Referer
  if (!origin && referer) {
    try {
      const refererUrl = new URL(referer);
      const refererOrigin = `${refererUrl.protocol}//${refererUrl.host}`;
      if (!allowedOrigins.some(allowed => refererOrigin === allowed || refererOrigin.startsWith(allowed as string))) {
        const sanitizedReferer = refererOrigin.replace(/[^\w\-\:\.]/g, '');
        logger.warn('CSRF: Referer mismatch', { referer: sanitizedReferer });
        return res.status(403).json({
          success: false,
          error: 'طلب غير مصرح به',
          code: 'CSRF_REFERER_MISMATCH'
        });
      }
    } catch (err) {
      logger.warn('CSRF: Invalid Referer URL');
      return res.status(403).json({
        success: false,
        error: 'طلب غير مصرح به',
        code: 'CSRF_INVALID_REFERER'
      });
    }
  }

  // Origin/Referer validation passed
  next();
});

// Setup middleware
setupMiddleware(app);


// Initialize WebSocket service
try {
  websocketService.initialize(httpServer);
  logger.info('WebSocket service initialized');
} catch (error) {
  logger.error('Failed to initialize WebSocket service:', error);
}



// Initialize background job workers (BullMQ)
(async () => {
  try {
    await initializeWorkers();
    logger.info('Background job workers initialized');
  } catch (error) {
    logger.error('Failed to initialize job workers:', error);
    // Continue without workers - app can still function
  }
})();

// Setup Bull Board dashboard for queue monitoring (with authentication)
// Access at: http://localhost:3000/admin/queues
try {
  setupBullBoard();
  const authenticatedBullBoardRouter = getAuthenticatedBullBoardRouter();
  app.use('/admin/queues', authenticatedBullBoardRouter);
  logger.info('Bull Board dashboard available at /admin/queues (authenticated)');
} catch (error) {
  logger.error('Failed to setup Bull Board:', error);
}

// Health check endpoints for Blue-Green deployment
app.get('/api/health', healthController.getHealth.bind(healthController));
app.get('/health', healthController.getHealth.bind(healthController));
app.get('/health/live', healthController.getLiveness.bind(healthController));
app.get('/health/ready', healthController.getReadiness.bind(healthController));
app.get('/health/startup', healthController.getStartup.bind(healthController));
app.get('/health/detailed', healthController.getDetailedHealth.bind(healthController));

// Prometheus metrics endpoint
app.get('/metrics', metricsEndpoint);

// Gemini cost monitoring endpoint (protected - admin only)
app.get('/api/gemini/cost-summary', authMiddleware, async (_req, res) => {
  try {
    const { geminiCostTracker } = await import('@/services/gemini-cost-tracker.service');
    const summary = await geminiCostTracker.getCostSummary();
    res.json({
      success: true,
      data: summary,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to get cost summary:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve cost summary',
    });
  }
});

// Auth endpoints (public) - CSRF token is set after successful authentication
app.post('/api/auth/signup', authController.signup.bind(authController), setCsrfToken);
app.post('/api/auth/login', authController.login.bind(authController), setCsrfToken);
app.post('/api/auth/logout', csrfProtection, authController.logout.bind(authController));
app.post('/api/auth/refresh', csrfProtection, authController.refresh.bind(authController), setCsrfToken);
app.get('/api/auth/me', authMiddleware, authController.getCurrentUser.bind(authController));

// Zero-Knowledge Auth endpoints (public)
import { zkSignup, zkLoginInit, zkLoginVerify, manageRecoveryArtifact } from '@/controllers/zkAuth.controller';
app.post('/api/auth/zk-signup', zkSignup, setCsrfToken);
app.post('/api/auth/zk-login-init', zkLoginInit);
app.post('/api/auth/zk-login-verify', zkLoginVerify, setCsrfToken);
app.post('/api/auth/recovery', authMiddleware, csrfProtection, manageRecoveryArtifact);

// Seven Stations Pipeline endpoints (protected)
app.post('/api/analysis/seven-stations', authMiddleware, csrfProtection, analysisController.runSevenStationsPipeline.bind(analysisController));
app.get('/api/analysis/stations-info', authMiddleware, analysisController.getStationDetails.bind(analysisController));

// Enhanced Self-Critique endpoints (protected)
app.get('/api/critique/config', authMiddleware, critiqueController.getAllCritiqueConfigs.bind(critiqueController));
app.get('/api/critique/config/:taskType', authMiddleware, critiqueController.getCritiqueConfig.bind(critiqueController));
app.get('/api/critique/dimensions/:taskType', authMiddleware, critiqueController.getDimensionDetails.bind(critiqueController));
app.post('/api/critique/summary', authMiddleware, csrfProtection, critiqueController.getCritiqueSummary.bind(critiqueController));

// Directors Studio - Projects endpoints (protected)
app.get('/api/projects', authMiddleware, projectsController.getProjects.bind(projectsController));
app.get('/api/projects/:id', authMiddleware, projectsController.getProject.bind(projectsController));
app.post('/api/projects', authMiddleware, csrfProtection, projectsController.createProject.bind(projectsController));
app.put('/api/projects/:id', authMiddleware, csrfProtection, projectsController.updateProject.bind(projectsController));
app.delete('/api/projects/:id', authMiddleware, csrfProtection, projectsController.deleteProject.bind(projectsController));
app.post('/api/projects/:id/analyze', authMiddleware, csrfProtection, projectsController.analyzeScript.bind(projectsController));

// Zero-Knowledge Encrypted Documents endpoints (protected)
import { createEncryptedDocument, getEncryptedDocument, updateEncryptedDocument, deleteEncryptedDocument, listEncryptedDocuments } from '@/controllers/encryptedDocs.controller';
app.post('/api/docs', authMiddleware, csrfProtection, createEncryptedDocument);
app.get('/api/docs/:id', authMiddleware, getEncryptedDocument);
app.put('/api/docs/:id', authMiddleware, csrfProtection, updateEncryptedDocument);
app.delete('/api/docs/:id', authMiddleware, csrfProtection, deleteEncryptedDocument);
app.get('/api/docs', authMiddleware, listEncryptedDocuments);

// Directors Studio - Scenes endpoints (protected)
app.get('/api/projects/:projectId/scenes', authMiddleware, scenesController.getScenes.bind(scenesController));
app.get('/api/scenes/:id', authMiddleware, scenesController.getScene.bind(scenesController));
app.post('/api/scenes', authMiddleware, csrfProtection, scenesController.createScene.bind(scenesController));
app.put('/api/scenes/:id', authMiddleware, csrfProtection, scenesController.updateScene.bind(scenesController));
app.delete('/api/scenes/:id', authMiddleware, csrfProtection, scenesController.deleteScene.bind(scenesController));

// Directors Studio - Characters endpoints (protected)
app.get('/api/projects/:projectId/characters', authMiddleware, charactersController.getCharacters.bind(charactersController));
app.get('/api/characters/:id', authMiddleware, charactersController.getCharacter.bind(charactersController));
app.post('/api/characters', authMiddleware, csrfProtection, charactersController.createCharacter.bind(charactersController));
app.put('/api/characters/:id', authMiddleware, csrfProtection, charactersController.updateCharacter.bind(charactersController));
app.delete('/api/characters/:id', authMiddleware, csrfProtection, charactersController.deleteCharacter.bind(charactersController));

// Directors Studio - Shots endpoints (protected)
app.get('/api/scenes/:sceneId/shots', authMiddleware, shotsController.getShots.bind(shotsController));
app.get('/api/shots/:id', authMiddleware, shotsController.getShot.bind(shotsController));
app.post('/api/shots', authMiddleware, csrfProtection, shotsController.createShot.bind(shotsController));
app.put('/api/shots/:id', authMiddleware, csrfProtection, shotsController.updateShot.bind(shotsController));
app.delete('/api/shots/:id', authMiddleware, csrfProtection, shotsController.deleteShot.bind(shotsController));
app.post('/api/shots/suggestion', authMiddleware, csrfProtection, shotsController.generateShotSuggestion.bind(shotsController));

// AI endpoints (protected)
app.post('/api/ai/chat', authMiddleware, csrfProtection, aiController.chat.bind(aiController));
app.post('/api/ai/shot-suggestion', authMiddleware, csrfProtection, aiController.getShotSuggestion.bind(aiController));

// Queue Management endpoints (protected)
app.get('/api/queue/jobs/:jobId', authMiddleware, queueController.getJobStatus.bind(queueController));
app.get('/api/queue/stats', authMiddleware, queueController.getQueueStats.bind(queueController));
app.get('/api/queue/:queueName/stats', authMiddleware, queueController.getSpecificQueueStats.bind(queueController));
app.post('/api/queue/jobs/:jobId/retry', authMiddleware, csrfProtection, queueController.retryJob.bind(queueController));
app.post('/api/queue/:queueName/clean', authMiddleware, csrfProtection, queueController.cleanQueue.bind(queueController));

// Metrics Dashboard endpoints (protected)
app.get('/api/metrics/snapshot', authMiddleware, metricsController.getSnapshot.bind(metricsController));
app.get('/api/metrics/latest', authMiddleware, metricsController.getLatest.bind(metricsController));
app.get('/api/metrics/range', authMiddleware, metricsController.getRange.bind(metricsController));
app.get('/api/metrics/database', authMiddleware, metricsController.getDatabaseMetrics.bind(metricsController));
app.get('/api/metrics/redis', authMiddleware, metricsController.getRedisMetrics.bind(metricsController));
app.get('/api/metrics/queue', authMiddleware, metricsController.getQueueMetrics.bind(metricsController));
app.get('/api/metrics/api', authMiddleware, metricsController.getApiMetrics.bind(metricsController));
app.get('/api/metrics/resources', authMiddleware, metricsController.getResourceMetrics.bind(metricsController));
app.get('/api/metrics/gemini', authMiddleware, metricsController.getGeminiMetrics.bind(metricsController));
app.get('/api/metrics/report', authMiddleware, metricsController.generateReport.bind(metricsController));
app.get('/api/metrics/health', authMiddleware, metricsController.getHealth.bind(metricsController));
app.get('/api/metrics/dashboard', authMiddleware, metricsController.getDashboardSummary.bind(metricsController));

// Cache-specific Metrics endpoints (protected)
app.get('/api/metrics/cache/snapshot', authMiddleware, metricsController.getCacheSnapshot.bind(metricsController));
app.get('/api/metrics/cache/realtime', authMiddleware, metricsController.getCacheRealtime.bind(metricsController));
app.get('/api/metrics/cache/health', authMiddleware, metricsController.getCacheHealth.bind(metricsController));
app.get('/api/metrics/cache/report', authMiddleware, metricsController.getCacheReport.bind(metricsController));

// APM (Application Performance Monitoring) endpoints (protected)
app.get('/api/metrics/apm/dashboard', authMiddleware, metricsController.getApmDashboard.bind(metricsController));
app.get('/api/metrics/apm/config', authMiddleware, metricsController.getApmConfig.bind(metricsController));
app.post('/api/metrics/apm/reset', authMiddleware, csrfProtection, metricsController.resetApmMetrics.bind(metricsController));
app.get('/api/metrics/apm/alerts', authMiddleware, metricsController.getApmAlerts.bind(metricsController));

// WAF Management endpoints (protected - admin only)
app.get('/api/waf/stats', authMiddleware, (_req, res) => {
  try {
    const stats = getWAFStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    logger.error('Failed to get WAF stats:', error);
    res.status(500).json({ success: false, error: 'Failed to retrieve WAF stats' });
  }
});

app.get('/api/waf/events', authMiddleware, (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const events = getWAFEvents(limit);
    res.json({ success: true, data: events });
  } catch (error) {
    logger.error('Failed to get WAF events:', error);
    res.status(500).json({ success: false, error: 'Failed to retrieve WAF events' });
  }
});

app.get('/api/waf/config', authMiddleware, (_req, res) => {
  try {
    const config = getWAFConfig();
    res.json({ success: true, data: config });
  } catch (error) {
    logger.error('Failed to get WAF config:', error);
    res.status(500).json({ success: false, error: 'Failed to retrieve WAF config' });
  }
});

app.put('/api/waf/config', authMiddleware, csrfProtection, (req, res) => {
  try {
    updateWAFConfig(req.body);
    res.json({ success: true, message: 'WAF configuration updated' });
  } catch (error) {
    logger.error('Failed to update WAF config:', error);
    res.status(500).json({ success: false, error: 'Failed to update WAF config' });
  }
});

app.get('/api/waf/blocked-ips', authMiddleware, (_req, res) => {
  try {
    const ips = getBlockedIPs();
    res.json({ success: true, data: ips });
  } catch (error) {
    logger.error('Failed to get blocked IPs:', error);
    res.status(500).json({ success: false, error: 'Failed to retrieve blocked IPs' });
  }
});

app.post('/api/waf/block-ip', authMiddleware, csrfProtection, (req, res) => {
  try {
    const { ip, reason } = req.body;
    if (!ip) {
      return res.status(400).json({ success: false, error: 'IP address required' });
    }
    blockIP(ip, reason);
    return res.json({ success: true, message: `IP ${ip} blocked successfully` });
  } catch (error) {
    logger.error('Failed to block IP:', error);
    return res.status(500).json({ success: false, error: 'Failed to block IP' });
  }
});

app.post('/api/waf/unblock-ip', authMiddleware, csrfProtection, (req, res) => {
  try {
    const { ip } = req.body;
    if (!ip) {
      return res.status(400).json({ success: false, error: 'IP address required' });
    }
    unblockIP(ip);
    return res.json({ success: true, message: `IP ${ip} unblocked successfully` });
  } catch (error) {
    logger.error('Failed to unblock IP:', error);
    return res.status(500).json({ success: false, error: 'Failed to unblock IP' });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'المسار غير موجود',
  });
});

// Sentry error handler (must be before other error handlers)
app.use(sentryErrorHandler);

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server with automatic port fallback if the selected port is in use
let runningServer: Server | null = null;
const startPort = Number(process.env.PORT) || env.PORT;

function startListening(port: number): void {
  // Use httpServer instead of app.listen to support WebSocket
  httpServer.listen(port, () => {
    runningServer = httpServer;
    logger.info(`Server running on port ${port}`, {
      environment: env.NODE_ENV,
      port,
      websocket: 'enabled',
      sse: 'enabled',
    });
  });

  httpServer.on('error', (error: NodeJS.ErrnoException) => {
    if (error.code === 'EADDRINUSE') {
      const nextPort = port + 1;
      logger.warn(`Port ${port} is in use. Trying ${nextPort}...`);
      startListening(nextPort);
      return;
    }
    logger.error('Server error:', error);
    throw error;
  });
}

startListening(startPort);

// Graceful shutdown
process.on('SIGTERM', async (): Promise<void> => {
  logger.info('SIGTERM received, shutting down gracefully');

  // Shutdown real-time services
  try {
    sseService.shutdown();
    await websocketService.shutdown();
    logger.info('Real-time services shut down');
  } catch (error) {
    logger.error('Error shutting down real-time services:', error);
  }

  // Close queues
  try {
    await shutdownQueues();
  } catch (error) {
    logger.error('Error shutting down queues:', error);
  }

  // Close database connections
  await closeDatabase();

  if (runningServer) {
    runningServer.close(() => {
      logger.info('Server closed');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
});

process.on('SIGINT', async (): Promise<void> => {
  logger.info('SIGINT received, shutting down gracefully');

  // Shutdown real-time services
  try {
    sseService.shutdown();
    await websocketService.shutdown();
    logger.info('Real-time services shut down');
  } catch (error) {
    logger.error('Error shutting down real-time services:', error);
  }

  // Close queues
  try {
    await shutdownQueues();
  } catch (error) {
    logger.error('Error shutting down queues:', error);
  }

  // Close database connections
  await closeDatabase();

  if (runningServer) {
    runningServer.close(() => {
      logger.info('Server closed');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
});

export { app, httpServer };
export default app;
