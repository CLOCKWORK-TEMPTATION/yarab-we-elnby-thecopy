/**
 * WebSocket Service
 *
 * Central service for managing Socket.IO connections and broadcasting events
 */

import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import type { ServerOptions } from 'socket.io';
import { getWebSocketConfig, WEBSOCKET_CONFIG } from '@/config/websocket.config';
import { logger } from '@/utils/logger';
import {
  RealtimeEvent,
  RealtimeEventType,
  RealtimePayload,
  WebSocketRoom,
  createRoomName,
  JobProgressPayload,
  JobStartedPayload,
  JobCompletedPayload,
  JobFailedPayload,
} from '@/types/realtime.types';

/**
 * Extended Socket interface with custom properties
 */
interface AuthenticatedSocket extends Socket {
  userId?: string;
  authenticated?: boolean;
}

/**
 * WebSocket Service Manager
 */
class WebSocketService {
  private io: SocketIOServer | null = null;
  private connections: Map<string, AuthenticatedSocket> = new Map();

  /**
   * Initialize WebSocket server
   */
  initialize(httpServer: HTTPServer): void {
    if (this.io) {
      logger.warn('[WebSocket] Service already initialized');
      return;
    }

    const config = getWebSocketConfig() as ServerOptions;
    this.io = new SocketIOServer(httpServer, config);

    this.setupEventHandlers();
    logger.info('[WebSocket] Service initialized successfully');
  }

  /**
   * Setup event handlers for Socket.IO
   */
  private setupEventHandlers(): void {
    if (!this.io) return;

    this.io.on(WEBSOCKET_CONFIG.EVENTS.CONNECTION, (socket: AuthenticatedSocket) => {
      logger.info(`[WebSocket] Client connected: ${socket.id}`);
      this.handleConnection(socket);
    });

    // Handle errors at server level
    this.io.engine.on(WEBSOCKET_CONFIG.EVENTS.ERROR, (error: Error) => {
      logger.error('[WebSocket] Engine error:', error);
    });
  }

  /**
   * Handle new client connection
   */
  private handleConnection(socket: AuthenticatedSocket): void {
    // Store connection
    this.connections.set(socket.id, socket);

    // Setup authentication timeout
    const authTimeout = setTimeout(() => {
      if (!socket.authenticated) {
        logger.warn(`[WebSocket] Authentication timeout for socket: ${socket.id}`);
        socket.emit(RealtimeEventType.UNAUTHORIZED, {
          message: 'Authentication timeout',
        });
        socket.disconnect(true);
      }
    }, WEBSOCKET_CONFIG.TIMEOUTS.AUTHENTICATION);

    // Handle authentication
    socket.on('authenticate', (data: { token?: string; userId?: string }) => {
      clearTimeout(authTimeout);
      this.handleAuthentication(socket, data);
    });

    // Handle disconnection
    socket.on(WEBSOCKET_CONFIG.EVENTS.DISCONNECT, (reason: string) => {
      this.handleDisconnection(socket, reason);
    });

    // Handle errors
    socket.on(WEBSOCKET_CONFIG.EVENTS.ERROR, (error: Error) => {
      logger.error(`[WebSocket] Socket error for ${socket.id}:`, error);
    });

    // Handle room subscriptions
    socket.on('subscribe', (data: { room: string }) => {
      this.handleRoomSubscription(socket, data.room);
    });

    socket.on('unsubscribe', (data: { room: string }) => {
      this.handleRoomUnsubscription(socket, data.room);
    });

    // Send connection confirmation
    socket.emit(RealtimeEventType.CONNECTED, {
      socketId: socket.id,
      message: 'Connected successfully',
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Handle client authentication
   *
   * ⚠️ SECURITY WARNING: DEV STUB - NO AUTHENTICATION
   * Current implementation accepts userId without verification
   *
   * 🚨 CRITICAL TODO PRODUCTION: Implement JWT verification
   *
   * Production implementation MUST:
   * 1. Verify JWT token signature using secret key
   * 2. Check token expiration
   * 3. Validate token claims (issuer, audience, etc.)
   * 4. Rate limit authentication attempts
   * 5. Log authentication failures for security monitoring
   *
   * Example production implementation:
   * ```
   * import jwt from 'jsonwebtoken';
   * const decoded = jwt.verify(data.token, process.env.JWT_SECRET);
   * socket.userId = decoded.userId;
   * ```
   */
  private handleAuthentication(
    socket: AuthenticatedSocket,
    data: { token?: string; userId?: string }
  ): void {
    // 🚨 DEV MODE ONLY: Accepting userId without verification
    // This is UNSAFE for production and must be replaced
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[DEV STUB] WebSocket authentication: bypassing JWT verification');
    }

    // TODO PRODUCTION: Replace with actual JWT verification
    if (data.userId) {
      socket.userId = data.userId;
      socket.authenticated = true;

      // Join user-specific room
      const userRoom = createRoomName(WebSocketRoom.USER, data.userId);
      socket.join(userRoom);

      logger.info(`[WebSocket] Socket ${socket.id} authenticated for user ${data.userId}`);

      socket.emit(RealtimeEventType.AUTHENTICATED, {
        message: 'Authenticated successfully',
        userId: data.userId,
        timestamp: new Date().toISOString(),
      });
    } else {
      logger.warn(`[WebSocket] Authentication failed for socket: ${socket.id}`);
      socket.emit(RealtimeEventType.UNAUTHORIZED, {
        message: 'Invalid authentication data',
      });
      socket.disconnect(true);
    }
  }

  /**
   * Handle client disconnection
   */
  private handleDisconnection(socket: AuthenticatedSocket, reason: string): void {
    logger.info(`[WebSocket] Client disconnected: ${socket.id}, reason: ${reason}`);
    this.connections.delete(socket.id);

    if (socket.userId) {
      socket.emit(RealtimeEventType.DISCONNECTED, {
        message: 'Disconnected',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Handle room subscription
   */
  private handleRoomSubscription(socket: AuthenticatedSocket, room: string): void {
    if (!socket.authenticated) {
      socket.emit(RealtimeEventType.UNAUTHORIZED, {
        message: 'Must authenticate before subscribing to rooms',
      });
      return;
    }

    const currentRooms = Array.from(socket.rooms).length;
    if (currentRooms >= WEBSOCKET_CONFIG.LIMITS.MAX_ROOMS_PER_SOCKET) {
      socket.emit(RealtimeEventType.SYSTEM_ERROR, {
        message: 'Maximum room limit reached',
      });
      return;
    }

    socket.join(room);
    logger.info(`[WebSocket] Socket ${socket.id} joined room: ${room}`);
    socket.emit(RealtimeEventType.SYSTEM_INFO, {
      message: `Subscribed to room: ${room}`,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Handle room unsubscription
   */
  private handleRoomUnsubscription(socket: AuthenticatedSocket, room: string): void {
    socket.leave(room);
    logger.info(`[WebSocket] Socket ${socket.id} left room: ${room}`);
    socket.emit(RealtimeEventType.SYSTEM_INFO, {
      message: `Unsubscribed from room: ${room}`,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Broadcast event to all connected clients
   */
  broadcast<T extends RealtimePayload>(event: RealtimeEvent<T>): void {
    if (!this.io) {
      logger.warn('[WebSocket] Service not initialized');
      return;
    }

    this.io.emit(event.event, event.payload);
    logger.debug(`[WebSocket] Broadcasted event: ${event.event}`);
  }

  /**
   * Send event to specific room
   */
  toRoom<T extends RealtimePayload>(room: string, event: RealtimeEvent<T>): void {
    if (!this.io) {
      logger.warn('[WebSocket] Service not initialized');
      return;
    }

    this.io.to(room).emit(event.event, event.payload);
    logger.debug(`[WebSocket] Sent event to room ${room}: ${event.event}`);
  }

  /**
   * Send event to specific user
   */
  toUser<T extends RealtimePayload>(userId: string, event: RealtimeEvent<T>): void {
    const userRoom = createRoomName(WebSocketRoom.USER, userId);
    this.toRoom(userRoom, event);
  }

  /**
   * Send event to specific project subscribers
   */
  toProject<T extends RealtimePayload>(projectId: string, event: RealtimeEvent<T>): void {
    const projectRoom = createRoomName(WebSocketRoom.PROJECT, projectId);
    this.toRoom(projectRoom, event);
  }

  /**
   * Send event to queue monitoring room
   */
  toQueue<T extends RealtimePayload>(queueName: string, event: RealtimeEvent<T>): void {
    const queueRoom = createRoomName(WebSocketRoom.QUEUE, queueName);
    this.toRoom(queueRoom, event);
  }

  /**
   * Emit job progress update
   */
  emitJobProgress(payload: Omit<JobProgressPayload, 'timestamp' | 'eventType'>): void {
    const event: RealtimeEvent<JobProgressPayload> = {
      event: RealtimeEventType.JOB_PROGRESS,
      payload: {
        ...payload,
        timestamp: new Date().toISOString(),
        eventType: RealtimeEventType.JOB_PROGRESS,
      },
    };

    // Broadcast to queue room and user if available
    this.toQueue(payload.queueName, event);
    if (payload.userId) {
      this.toUser(payload.userId, event);
    }
  }

  /**
   * Emit job started event
   */
  emitJobStarted(payload: Omit<JobStartedPayload, 'timestamp' | 'eventType'>): void {
    const event: RealtimeEvent<JobStartedPayload> = {
      event: RealtimeEventType.JOB_STARTED,
      payload: {
        ...payload,
        timestamp: new Date().toISOString(),
        eventType: RealtimeEventType.JOB_STARTED,
      },
    };

    this.toQueue(payload.queueName, event);
    if (payload.userId) {
      this.toUser(payload.userId, event);
    }
  }

  /**
   * Emit job completed event
   */
  emitJobCompleted(payload: Omit<JobCompletedPayload, 'timestamp' | 'eventType'>): void {
    const event: RealtimeEvent<JobCompletedPayload> = {
      event: RealtimeEventType.JOB_COMPLETED,
      payload: {
        ...payload,
        timestamp: new Date().toISOString(),
        eventType: RealtimeEventType.JOB_COMPLETED,
      },
    };

    this.toQueue(payload.queueName, event);
    if (payload.userId) {
      this.toUser(payload.userId, event);
    }
  }

  /**
   * Emit job failed event
   */
  emitJobFailed(payload: Omit<JobFailedPayload, 'timestamp' | 'eventType'>): void {
    const event: RealtimeEvent<JobFailedPayload> = {
      event: RealtimeEventType.JOB_FAILED,
      payload: {
        ...payload,
        timestamp: new Date().toISOString(),
        eventType: RealtimeEventType.JOB_FAILED,
      },
    };

    this.toQueue(payload.queueName, event);
    if (payload.userId) {
      this.toUser(payload.userId, event);
    }
  }

  /**
   * Get connection statistics
   */
  getStats(): {
    totalConnections: number;
    authenticatedConnections: number;
    rooms: string[];
  } {
    if (!this.io) {
      return {
        totalConnections: 0,
        authenticatedConnections: 0,
        rooms: [],
      };
    }

    const authenticatedCount = Array.from(this.connections.values()).filter(
      (socket) => socket.authenticated
    ).length;

    // Get all rooms
    const rooms = Array.from(this.io.sockets.adapter.rooms.keys()).filter(
      (room) => !this.connections.has(room) // Filter out socket IDs
    );

    return {
      totalConnections: this.connections.size,
      authenticatedConnections: authenticatedCount,
      rooms,
    };
  }

  /**
   * Shutdown WebSocket service
   */
  async shutdown(): Promise<void> {
    if (!this.io) return;

    logger.info('[WebSocket] Shutting down service...');

    // Disconnect all clients
    this.io.disconnectSockets(true);

    // Close server
    await new Promise<void>((resolve) => {
      this.io?.close(() => {
        logger.info('[WebSocket] Service shut down successfully');
        resolve();
      });
    });

    this.connections.clear();
    this.io = null;
  }

  /**
   * Get Socket.IO instance (for advanced usage)
   */
  getIO(): SocketIOServer | null {
    return this.io;
  }
}

// Export singleton instance
export const websocketService = new WebSocketService();
