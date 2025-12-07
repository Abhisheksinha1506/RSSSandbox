import { WebSocketServer, WebSocket } from 'ws';
import type { Server } from 'http';

export interface WebSocketEvent {
  type: 'websub_subscribe' | 'websub_verify' | 'websub_notify' | 'websub_error';
  timestamp: Date;
  message: string;
  data?: unknown;
}

interface ClientInfo {
  ws: WebSocket;
  lastActivity: number;
  timeoutId: NodeJS.Timeout;
  pingInterval: NodeJS.Timeout;
}

const CONNECTION_TIMEOUT = 5 * 60 * 1000; // 5 minutes of inactivity
const CLEANUP_INTERVAL = 60 * 1000; // Cleanup every minute

export class WebSocketService {
  private wss: WebSocketServer | null = null;
  private clients: Map<WebSocket, ClientInfo> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  initialize(server: Server) {
    this.wss = new WebSocketServer({ server });

    this.wss.on('connection', (ws: WebSocket) => {
      this.addClient(ws);
    });

    // Start periodic cleanup
    this.startCleanup();
  }

  private addClient(ws: WebSocket): void {
    const timeoutId = setTimeout(() => {
      this.removeClient(ws, 'Connection timeout: no activity for 5 minutes');
    }, CONNECTION_TIMEOUT);

    // Send ping every 30 seconds to check connection health
    const pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.ping();
      } else {
        // Connection is closed, clear interval and remove client
        clearInterval(pingInterval);
        this.removeClient(ws, 'Connection closed during ping check');
      }
    }, 30 * 1000);

    const clientInfo: ClientInfo = {
      ws,
      lastActivity: Date.now(),
      timeoutId,
      pingInterval
    };

    this.clients.set(ws, clientInfo);
    console.log('WebSocket client connected. Total clients:', this.clients.size);

    // Update activity on any message
    ws.on('message', () => {
      this.updateActivity(ws);
    });

    ws.on('pong', () => {
      this.updateActivity(ws);
    });

    // Single close handler to prevent double cleanup
    ws.on('close', () => {
      this.removeClient(ws, 'Client disconnected');
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      this.removeClient(ws, 'WebSocket error occurred');
    });
  }

  private updateActivity(ws: WebSocket): void {
    const clientInfo = this.clients.get(ws);
    if (clientInfo) {
      // Clear existing timeout
      clearTimeout(clientInfo.timeoutId);
      
      // Update last activity time
      clientInfo.lastActivity = Date.now();
      
      // Set new timeout
      clientInfo.timeoutId = setTimeout(() => {
        this.removeClient(ws, 'Connection timeout: no activity for 5 minutes');
      }, CONNECTION_TIMEOUT);
    }
  }

  private removeClient(ws: WebSocket, reason: string): void {
    const clientInfo = this.clients.get(ws);
    if (clientInfo) {
      // Clear all timers and intervals
      clearTimeout(clientInfo.timeoutId);
      clearInterval(clientInfo.pingInterval);
      this.clients.delete(ws);
      console.log(`WebSocket client removed: ${reason}. Total clients: ${this.clients.size}`);
      
      // Close connection if still open
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close();
      }
    }
  }

  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanupStaleConnections();
    }, CLEANUP_INTERVAL);
  }

  private cleanupStaleConnections(): void {
    const now = Date.now();
    const staleClients: WebSocket[] = [];

    for (const [ws, clientInfo] of this.clients.entries()) {
      // Check if connection is still alive
      if (ws.readyState !== WebSocket.OPEN && ws.readyState !== WebSocket.CONNECTING) {
        staleClients.push(ws);
      } else if (now - clientInfo.lastActivity > CONNECTION_TIMEOUT) {
        staleClients.push(ws);
      }
    }

    staleClients.forEach(ws => {
      this.removeClient(ws, 'Stale connection detected during cleanup');
    });

    if (staleClients.length > 0) {
      console.log(`Cleaned up ${staleClients.length} stale WebSocket connection(s)`);
    }
  }

  broadcast(event: WebSocketEvent) {
    const message = JSON.stringify(event);
    const deadClients: WebSocket[] = [];

    for (const [ws, clientInfo] of this.clients.entries()) {
      if (ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(message);
          // Update activity on successful send
          this.updateActivity(ws);
        } catch (error) {
          console.error('Error sending WebSocket message:', error);
          deadClients.push(ws);
        }
      } else {
        deadClients.push(ws);
      }
    }

    // Remove dead clients
    deadClients.forEach(ws => {
      this.removeClient(ws, 'Connection dead during broadcast');
    });
  }

  close() {
    // Clear cleanup interval
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    // Close all clients and clear all timers
    for (const [ws, clientInfo] of this.clients.entries()) {
      clearTimeout(clientInfo.timeoutId);
      clearInterval(clientInfo.pingInterval);
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close();
      }
    }

    this.clients.clear();

    if (this.wss) {
      this.wss.close();
    }
  }

  /**
   * Get number of active clients (useful for monitoring)
   */
  getClientCount(): number {
    return this.clients.size;
  }
}

export const websocketService = new WebSocketService();
