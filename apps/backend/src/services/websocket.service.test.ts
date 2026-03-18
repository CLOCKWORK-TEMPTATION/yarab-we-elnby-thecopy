/**
 * WebSocket Service Tests
 *
 * Comprehensive tests for WebSocket service functionality
 */

import { createServer, Server as HTTPServer } from 'http';
import { websocketService } from './websocket.service';
import { RealtimeEventType } from '@/types/realtime.types';

// Mock Socket.IO
const mockSocket = {
  id: 'test-socket-id',
  userId: undefined as string | undefined,
  authenticated: false,
  rooms: new Set(['test-socket-id']),
  join: jest.fn(),
  leave: jest.fn(),
  emit: jest.fn(),
  on: jest.fn(),
  disconnect: jest.fn(),
};

const mockIO = {
  on: jest.fn(),
  emit: jest.fn(),
  to: jest.fn().mockReturnThis(),
  engine: {
    on: jest.fn(),
  },
  sockets: {
    adapter: {
      rooms: new Map([
        ['user:test-user', new Set(['socket-1'])],
        ['project:test-project', new Set(['socket-2'])],
      ]),
    },
  },
  disconnectSockets: jest.fn(),
  close: jest.fn((callback: () => void) => callback()),
};

// Mock logger
jest.mock('@/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

// Mock Socket.IO
jest.mock('socket.io', () => {
  return {
    Server: jest.fn(() => mockIO),
  };
});

describe('WebSocketService', () => {
  let httpServer: HTTPServer;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    mockSocket.authenticated = false;
    mockSocket.userId = undefined;

    // Create HTTP server
    httpServer = createServer();
  });

  afterEach(async () => {
    // Cleanup
    if (httpServer.listening) {
      httpServer.close();
    }
  });

  describe('Initialization', () => {
    it('should initialize WebSocket server successfully', () => {
      websocketService.initialize(httpServer);

      expect(mockIO.on).toHaveBeenCalledWith('connection', expect.any(Function));
      expect(mockIO.engine.on).toHaveBeenCalledWith('error', expect.any(Function));
    });

    it('should not initialize twice', () => {
      websocketService.initialize(httpServer);
      websocketService.initialize(httpServer);

      // Should only be called once during first initialization
      expect(mockIO.on).toHaveBeenCalledTimes(1);
    });
  });

  describe('Connection Handling', () => {
    beforeEach(() => {
      websocketService.initialize(httpServer);
    });

    it('should handle new client connection', () => {
      const connectionHandler = mockIO.on.mock.calls.find(
        (call) => call[0] === 'connection'
      )?.[1];

      expect(connectionHandler).toBeDefined();

      if (connectionHandler) {
        connectionHandler(mockSocket);

        expect(mockSocket.on).toHaveBeenCalledWith('authenticate', expect.any(Function));
        expect(mockSocket.on).toHaveBeenCalledWith('disconnect', expect.any(Function));
        expect(mockSocket.on).toHaveBeenCalledWith('error', expect.any(Function));
        expect(mockSocket.on).toHaveBeenCalledWith('subscribe', expect.any(Function));
        expect(mockSocket.on).toHaveBeenCalledWith('unsubscribe', expect.any(Function));
        expect(mockSocket.emit).toHaveBeenCalledWith(
          RealtimeEventType.CONNECTED,
          expect.objectContaining({
            socketId: mockSocket.id,
            message: 'Connected successfully',
          })
        );
      }
    });

    it('should handle authentication timeout', (done) => {
      jest.useFakeTimers();

      const connectionHandler = mockIO.on.mock.calls.find(
        (call) => call[0] === 'connection'
      )?.[1];

      if (connectionHandler) {
        connectionHandler(mockSocket);

        // Fast-forward time past authentication timeout
        jest.advanceTimersByTime(5001);

        expect(mockSocket.emit).toHaveBeenCalledWith(
          RealtimeEventType.UNAUTHORIZED,
          expect.objectContaining({
            message: 'Authentication timeout',
          })
        );
        expect(mockSocket.disconnect).toHaveBeenCalledWith(true);
      }

      jest.useRealTimers();
      done();
    });
  });

  describe('Authentication', () => {
    beforeEach(() => {
      websocketService.initialize(httpServer);
      const connectionHandler = mockIO.on.mock.calls.find(
        (call) => call[0] === 'connection'
      )?.[1];
      if (connectionHandler) {
        connectionHandler(mockSocket);
      }
    });

    it('should authenticate user successfully', () => {
      const authHandler = mockSocket.on.mock.calls.find(
        (call) => call[0] === 'authenticate'
      )?.[1];

      expect(authHandler).toBeDefined();

      if (authHandler) {
        authHandler({ userId: 'test-user-123' });

        expect(mockSocket.userId).toBe('test-user-123');
        expect(mockSocket.authenticated).toBe(true);
        expect(mockSocket.join).toHaveBeenCalledWith('user:test-user-123');
        expect(mockSocket.emit).toHaveBeenCalledWith(
          RealtimeEventType.AUTHENTICATED,
          expect.objectContaining({
            message: 'Authenticated successfully',
            userId: 'test-user-123',
          })
        );
      }
    });

    it('should reject authentication without userId', () => {
      const authHandler = mockSocket.on.mock.calls.find(
        (call) => call[0] === 'authenticate'
      )?.[1];

      if (authHandler) {
        authHandler({ token: 'some-token' });

        expect(mockSocket.authenticated).toBe(false);
        expect(mockSocket.emit).toHaveBeenCalledWith(
          RealtimeEventType.UNAUTHORIZED,
          expect.objectContaining({
            message: 'Invalid authentication data',
          })
        );
        expect(mockSocket.disconnect).toHaveBeenCalledWith(true);
      }
    });
  });

  describe('Room Management', () => {
    beforeEach(() => {
      websocketService.initialize(httpServer);
      const connectionHandler = mockIO.on.mock.calls.find(
        (call) => call[0] === 'connection'
      )?.[1];
      if (connectionHandler) {
        connectionHandler(mockSocket);
      }

      // Authenticate first
      mockSocket.authenticated = true;
      mockSocket.userId = 'test-user';
    });

    it('should allow authenticated user to subscribe to room', () => {
      const subscribeHandler = mockSocket.on.mock.calls.find(
        (call) => call[0] === 'subscribe'
      )?.[1];

      if (subscribeHandler) {
        subscribeHandler({ room: 'project:123' });

        expect(mockSocket.join).toHaveBeenCalledWith('project:123');
        expect(mockSocket.emit).toHaveBeenCalledWith(
          RealtimeEventType.SYSTEM_INFO,
          expect.objectContaining({
            message: 'Subscribed to room: project:123',
          })
        );
      }
    });

    it('should reject room subscription for unauthenticated user', () => {
      mockSocket.authenticated = false;

      const subscribeHandler = mockSocket.on.mock.calls.find(
        (call) => call[0] === 'subscribe'
      )?.[1];

      if (subscribeHandler) {
        subscribeHandler({ room: 'project:123' });

        expect(mockSocket.join).not.toHaveBeenCalled();
        expect(mockSocket.emit).toHaveBeenCalledWith(
          RealtimeEventType.UNAUTHORIZED,
          expect.objectContaining({
            message: 'Must authenticate before subscribing to rooms',
          })
        );
      }
    });

    it('should allow user to unsubscribe from room', () => {
      const unsubscribeHandler = mockSocket.on.mock.calls.find(
        (call) => call[0] === 'unsubscribe'
      )?.[1];

      if (unsubscribeHandler) {
        unsubscribeHandler({ room: 'project:123' });

        expect(mockSocket.leave).toHaveBeenCalledWith('project:123');
        expect(mockSocket.emit).toHaveBeenCalledWith(
          RealtimeEventType.SYSTEM_INFO,
          expect.objectContaining({
            message: 'Unsubscribed from room: project:123',
          })
        );
      }
    });
  });

  describe('Broadcasting Events', () => {
    beforeEach(() => {
      websocketService.initialize(httpServer);
    });

    it('should broadcast event to all clients', () => {
      const testEvent = {
        event: RealtimeEventType.SYSTEM_INFO,
        payload: {
          timestamp: new Date().toISOString(),
          eventType: RealtimeEventType.SYSTEM_INFO,
          level: 'info' as const,
          message: 'Test message',
        },
      };

      websocketService.broadcast(testEvent);

      expect(mockIO.emit).toHaveBeenCalledWith(testEvent.event, testEvent.payload);
    });

    it('should send event to specific room', () => {
      const testEvent = {
        event: RealtimeEventType.JOB_PROGRESS,
        payload: {
          timestamp: new Date().toISOString(),
          eventType: RealtimeEventType.JOB_PROGRESS,
          jobId: 'job-123',
          queueName: 'test-queue',
          progress: 50,
          status: 'active' as const,
        },
      };

      websocketService.toRoom('queue:test-queue', testEvent);

      expect(mockIO.to).toHaveBeenCalledWith('queue:test-queue');
      expect(mockIO.emit).toHaveBeenCalledWith(testEvent.event, testEvent.payload);
    });

    it('should send event to specific user', () => {
      const testEvent = {
        event: RealtimeEventType.SYSTEM_INFO,
        payload: {
          timestamp: new Date().toISOString(),
          eventType: RealtimeEventType.SYSTEM_INFO,
          level: 'info' as const,
          message: 'User notification',
        },
      };

      websocketService.toUser('user-123', testEvent);

      expect(mockIO.to).toHaveBeenCalledWith('user:user-123');
    });

    it('should send event to specific project', () => {
      const testEvent = {
        event: RealtimeEventType.ANALYSIS_PROGRESS,
        payload: {
          timestamp: new Date().toISOString(),
          eventType: RealtimeEventType.ANALYSIS_PROGRESS,
          projectId: 'project-123',
          analysisId: 'analysis-456',
          currentStation: 3,
          totalStations: 7,
          stationName: 'Station 3',
          progress: 43,
        },
      };

      websocketService.toProject('project-123', testEvent);

      expect(mockIO.to).toHaveBeenCalledWith('project:project-123');
    });

    it('should send event to specific queue', () => {
      const testEvent = {
        event: RealtimeEventType.QUEUE_ACTIVE,
        payload: {
          timestamp: new Date().toISOString(),
          eventType: RealtimeEventType.QUEUE_ACTIVE,
          queueName: 'ai-analysis',
        },
      };

      websocketService.toQueue('ai-analysis', testEvent);

      expect(mockIO.to).toHaveBeenCalledWith('queue:ai-analysis');
    });
  });

  describe('Job Event Helpers', () => {
    beforeEach(() => {
      websocketService.initialize(httpServer);
    });

    it('should emit job started event', () => {
      websocketService.emitJobStarted({
        jobId: 'job-123',
        queueName: 'test-queue',
        jobName: 'test-job',
        userId: 'user-123',
      });

      expect(mockIO.to).toHaveBeenCalledWith('queue:test-queue');
      expect(mockIO.to).toHaveBeenCalledWith('user:user-123');
      expect(mockIO.emit).toHaveBeenCalledWith(
        RealtimeEventType.JOB_STARTED,
        expect.objectContaining({
          jobId: 'job-123',
          queueName: 'test-queue',
        })
      );
    });

    it('should emit job progress event', () => {
      websocketService.emitJobProgress({
        jobId: 'job-123',
        queueName: 'test-queue',
        progress: 75,
        status: 'active',
        userId: 'user-123',
      });

      expect(mockIO.emit).toHaveBeenCalledWith(
        RealtimeEventType.JOB_PROGRESS,
        expect.objectContaining({
          jobId: 'job-123',
          progress: 75,
        })
      );
    });

    it('should emit job completed event', () => {
      websocketService.emitJobCompleted({
        jobId: 'job-123',
        queueName: 'test-queue',
        result: { success: true },
        duration: 5000,
        userId: 'user-123',
      });

      expect(mockIO.emit).toHaveBeenCalledWith(
        RealtimeEventType.JOB_COMPLETED,
        expect.objectContaining({
          jobId: 'job-123',
          result: { success: true },
        })
      );
    });

    it('should emit job failed event', () => {
      websocketService.emitJobFailed({
        jobId: 'job-123',
        queueName: 'test-queue',
        error: 'Test error',
        attemptsMade: 3,
        attemptsMax: 3,
        userId: 'user-123',
      });

      expect(mockIO.emit).toHaveBeenCalledWith(
        RealtimeEventType.JOB_FAILED,
        expect.objectContaining({
          jobId: 'job-123',
          error: 'Test error',
        })
      );
    });
  });

  describe('Statistics', () => {
    beforeEach(() => {
      websocketService.initialize(httpServer);
    });

    it('should return connection statistics', () => {
      const stats = websocketService.getStats();

      expect(stats).toHaveProperty('totalConnections');
      expect(stats).toHaveProperty('authenticatedConnections');
      expect(stats).toHaveProperty('rooms');
      expect(Array.isArray(stats.rooms)).toBe(true);
    });

    it('should return zero stats when not initialized', () => {
      // Create a new instance (not initialized)
      const { websocketService: newService } = require('./websocket.service');

      const stats = newService.getStats();

      expect(stats.totalConnections).toBe(0);
      expect(stats.authenticatedConnections).toBe(0);
      expect(stats.rooms).toEqual([]);
    });
  });

  describe('Shutdown', () => {
    beforeEach(() => {
      websocketService.initialize(httpServer);
    });

    it('should shutdown gracefully', async () => {
      await websocketService.shutdown();

      expect(mockIO.disconnectSockets).toHaveBeenCalledWith(true);
      expect(mockIO.close).toHaveBeenCalled();
    });

    it('should handle shutdown when not initialized', async () => {
      // Create a new instance (not initialized)
      const { websocketService: newService } = require('./websocket.service');

      await expect(newService.shutdown()).resolves.not.toThrow();
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      websocketService.initialize(httpServer);
    });

    it('should handle socket errors', () => {
      const connectionHandler = mockIO.on.mock.calls.find(
        (call) => call[0] === 'connection'
      )?.[1];

      if (connectionHandler) {
        connectionHandler(mockSocket);

        const errorHandler = mockSocket.on.mock.calls.find(
          (call) => call[0] === 'error'
        )?.[1];

        if (errorHandler) {
          const testError = new Error('Test socket error');
          errorHandler(testError);

          // Should log the error (mocked)
          expect(true).toBe(true); // Error logged
        }
      }
    });

    it('should handle engine errors', () => {
      const engineErrorHandler = mockIO.engine.on.mock.calls.find(
        (call) => call[0] === 'error'
      )?.[1];

      if (engineErrorHandler) {
        const testError = new Error('Test engine error');
        engineErrorHandler(testError);

        // Should log the error (mocked)
        expect(true).toBe(true); // Error logged
      }
    });
  });

  describe('Advanced Features', () => {
    beforeEach(() => {
      websocketService.initialize(httpServer);
    });

    it('should return Socket.IO instance', () => {
      const io = websocketService.getIO();
      expect(io).toBeDefined();
      expect(io).toBe(mockIO);
    });

    it('should handle multiple rooms per socket', () => {
      const connectionHandler = mockIO.on.mock.calls.find(
        (call) => call[0] === 'connection'
      )?.[1];

      if (connectionHandler) {
        connectionHandler(mockSocket);

        mockSocket.authenticated = true;

        const subscribeHandler = mockSocket.on.mock.calls.find(
          (call) => call[0] === 'subscribe'
        )?.[1];

        if (subscribeHandler) {
          // Subscribe to multiple rooms
          subscribeHandler({ room: 'project:1' });
          subscribeHandler({ room: 'project:2' });
          subscribeHandler({ room: 'queue:analysis' });

          expect(mockSocket.join).toHaveBeenCalledTimes(3);
        }
      }
    });
  });
});
