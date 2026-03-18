/**
 * WebSocket Client Service
 * 
 * Handles real-time communication with backend for analysis progress updates
 */

import { io, Socket } from 'socket.io-client';

// Event types matching backend
export enum RealtimeEventType {
  // Agent events
  AGENT_STARTED = 'agent:started',
  AGENT_PROGRESS = 'agent:progress',
  AGENT_COMPLETED = 'agent:completed',
  AGENT_FAILED = 'agent:failed',
  
  // Job events
  JOB_STARTED = 'job:started',
  JOB_PROGRESS = 'job:progress',
  JOB_COMPLETED = 'job:completed',
  JOB_FAILED = 'job:failed',
  
  // Step events
  STEP_PROGRESS = 'step:progress',
  
  // Connection events
  CONNECTED = 'connect',
  DISCONNECTED = 'disconnect',
  UNAUTHORIZED = 'unauthorized',
  ERROR = 'error',
}

export interface AgentProgressPayload {
  agentId: string;
  agentName: string;
  progress: number;
  message: string;
  timestamp: string;
}

export interface JobProgressPayload {
  jobId: string;
  progress: number;
  currentStep?: string;
  message?: string;
}

export interface StepProgressPayload {
  step: string;
  status: 'started' | 'in_progress' | 'completed' | 'failed';
  message: string;
}

type EventCallback = (data: any) => void;

class WebSocketClient {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<EventCallback>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  /**
   * Connect to WebSocket server
   */
  connect(token?: string): void {
    if (this.socket?.connected) {
      console.warn('[WebSocket] Already connected');
      return;
    }

    // Use environment variable or default to backend URL
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
    
    this.socket = io(backendUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
      auth: token ? { token } : undefined,
    });

    this.setupEventHandlers();
  }

  /**
   * Setup event handlers
   */
  private setupEventHandlers(): void {
    if (!this.socket) return;

    this.socket.on(RealtimeEventType.CONNECTED, () => {
      console.log('[WebSocket] Connected');
      this.reconnectAttempts = 0;
      this.notifyListeners(RealtimeEventType.CONNECTED, {});
    });

    this.socket.on(RealtimeEventType.DISCONNECTED, (reason: string) => {
      console.log('[WebSocket] Disconnected');
      this.notifyListeners(RealtimeEventType.DISCONNECTED, { reason });
    });

    this.socket.on(RealtimeEventType.ERROR, (error: any) => {
      console.error('[WebSocket] Error');
      this.notifyListeners(RealtimeEventType.ERROR, error);
    });

    this.socket.on(RealtimeEventType.UNAUTHORIZED, (data: any) => {
      console.warn('[WebSocket] Unauthorized');
      this.notifyListeners(RealtimeEventType.UNAUTHORIZED, data);
    });

    // Authenticate if we have a token
    const token = this.getAuthToken();
    if (token) {
      this.authenticate(token);
    }
  }

  /**
   * Authenticate with the server
   */
  authenticate(token: string): void {
    if (!this.socket) return;
    
    this.socket.emit('authenticate', { token });
  }

  /**
   * Subscribe to agent progress updates
   */
  onAgentProgress(callback: (data: AgentProgressPayload) => void): () => void {
    return this.on(RealtimeEventType.AGENT_PROGRESS, callback);
  }

  /**
   * Subscribe to job progress updates
   */
  onJobProgress(callback: (data: JobProgressPayload) => void): () => void {
    return this.on(RealtimeEventType.JOB_PROGRESS, callback);
  }

  /**
   * Subscribe to step progress updates
   */
  onStepProgress(callback: (data: StepProgressPayload) => void): () => void {
    return this.on(RealtimeEventType.STEP_PROGRESS, callback);
  }

  /**
   * Subscribe to job completion
   */
  onJobCompleted(callback: (data: any) => void): () => void {
    return this.on(RealtimeEventType.JOB_COMPLETED, callback);
  }

  /**
   * Subscribe to job failure
   */
  onJobFailed(callback: (data: any) => void): () => void {
    return this.on(RealtimeEventType.JOB_FAILED, callback);
  }

  /**
   * Generic event subscription
   */
  on(eventType: string, callback: EventCallback): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    
    this.listeners.get(eventType)!.add(callback);

    // Setup socket listener if not already set
    if (this.socket && this.socket.listeners(eventType).length === 0) {
      this.socket.on(eventType, (data: any) => {
        this.notifyListeners(eventType, data);
      });
    }

    // Return unsubscribe function
    return () => this.off(eventType, callback);
  }

  /**
   * Unsubscribe from event
   */
  off(eventType: string, callback: EventCallback): void {
    const listeners = this.listeners.get(eventType);
    if (listeners) {
      listeners.delete(callback);
      if (listeners.size === 0) {
        this.listeners.delete(eventType);
        if (this.socket) {
          this.socket.off(eventType);
        }
      }
    }
  }

  /**
   * Notify all listeners for an event
   */
  private notifyListeners(eventType: string, data: any): void {
    const listeners = this.listeners.get(eventType);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`[WebSocket] Error in listener for ${eventType}`);
        }
      });
    }
  }

  /**
   * Join a room (e.g., for job-specific updates)
   */
  joinRoom(room: string): void {
    if (!this.socket) return;
    this.socket.emit('join', room);
  }

  /**
   * Leave a room
   */
  leaveRoom(room: string): void {
    if (!this.socket) return;
    this.socket.emit('leave', room);
  }

  /**
   * Disconnect from server
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.listeners.clear();
    }
  }

  /**
   * Get connection status
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * Get auth token from storage
   */
  private getAuthToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('auth_token');
  }
}

// Export singleton instance
export const websocketClient = new WebSocketClient();

// Auto-connect on client-side
if (typeof window !== 'undefined') {
  // Connect after a short delay to allow app initialization
  setTimeout(() => {
    websocketClient.connect();
  }, 1000);
}

export default websocketClient;
