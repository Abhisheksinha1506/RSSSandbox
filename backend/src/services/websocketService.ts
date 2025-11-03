import { WebSocketServer, WebSocket } from 'ws';
import type { Server } from 'http';

export interface WebSocketEvent {
  type: 'websub_subscribe' | 'websub_verify' | 'websub_notify' | 'websub_error';
  timestamp: Date;
  message: string;
  data?: unknown;
}

export class WebSocketService {
  private wss: WebSocketServer | null = null;
  private clients: Set<WebSocket> = new Set();

  initialize(server: Server) {
    this.wss = new WebSocketServer({ server });

    this.wss.on('connection', (ws: WebSocket) => {
      this.clients.add(ws);
      console.log('WebSocket client connected. Total clients:', this.clients.size);

      ws.on('close', () => {
        this.clients.delete(ws);
        console.log('WebSocket client disconnected. Total clients:', this.clients.size);
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
      });
    });
  }

  broadcast(event: WebSocketEvent) {
    const message = JSON.stringify(event);
    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  close() {
    this.clients.forEach((client) => {
      client.close();
    });
    if (this.wss) {
      this.wss.close();
    }
  }
}

export const websocketService = new WebSocketService();
