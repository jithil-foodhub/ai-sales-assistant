import { WebSocket } from 'ws';

export interface WebSocketMessage {
  conversationId: string;
  suggestions: Suggestion[];
  metadata: {
    reason: string;
    used_context_ids: string[];
    latency?: number;
    timestamp: string;
  };
}

export interface Suggestion {
  text: string;
  offer_id: string;
  type: 'upsell' | 'cross-sell' | 'retention' | 'new-offer';
  confidence: number;
  deliver_as: 'say' | 'show' | 'email';
}

export class WebSocketManager {
  private connections: Map<string, WebSocket> = new Map();

  addConnection(connectionId: string, ws: WebSocket): void {
    this.connections.set(connectionId, ws);
  }

  removeConnection(connectionId: string): void {
    this.connections.delete(connectionId);
  }

  getConnectionCount(): number {
    return this.connections.size;
  }

  broadcastToConversation(conversationId: string, message: WebSocketMessage): void {
    const messageStr = JSON.stringify(message);
    let sentCount = 0;

    this.connections.forEach((ws, connectionId) => {
      if (ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(messageStr);
          sentCount++;
        } catch (error) {
          console.error(`Failed to send message to connection ${connectionId}:`, error);
          this.connections.delete(connectionId);
        }
      } else {
        // Clean up closed connections
        this.connections.delete(connectionId);
      }
    });

    console.log(`Broadcasted message to ${sentCount} connections for conversation ${conversationId}`);
  }

  sendToConnection(connectionId: string, message: WebSocketMessage): boolean {
    const ws = this.connections.get(connectionId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify(message));
        return true;
      } catch (error) {
        console.error(`Failed to send message to connection ${connectionId}:`, error);
        this.connections.delete(connectionId);
        return false;
      }
    }
    return false;
  }

  broadcastToAll(message: any): void {
    const messageStr = JSON.stringify(message);
    let sentCount = 0;

    this.connections.forEach((ws, connectionId) => {
      if (ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(messageStr);
          sentCount++;
        } catch (error) {
          console.error(`Failed to send message to connection ${connectionId}:`, error);
          this.connections.delete(connectionId);
        }
      } else {
        // Clean up closed connections
        this.connections.delete(connectionId);
      }
    });

    console.log(`Broadcasted message to ${sentCount} connections`);
  }
}
