export interface WebSocketMessage {
  conversationId?: string;
  suggestions?: any[];
  metadata?: {
    reason: string;
    used_context_ids: string[];
    latency?: number;
    timestamp: string;
  };
  type?: string;
  callSid?: string;
  callData?: any;
  transcript?: string;
  fullTranscript?: string;
  speaker?: string;
  confidence?: number;
  moodAnalysis?: any;
  enhancedAnalysis?: any;
}

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  public onConnect?: () => void;
  public onDisconnect?: () => void;
  public onMessage?: (message: WebSocketMessage) => void;
  public onError?: (error: Event) => void;

  constructor() {
    this.connect();
  }

  connect(): void {
    try {
      const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3000/ws';
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
        this.onConnect?.();
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.onDisconnect?.();
        this.attemptReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.onError?.(error);
      };

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          this.onMessage?.(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      this.attemptReconnect();
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      
      setTimeout(() => {
        this.connect();
      }, this.reconnectDelay * this.reconnectAttempts);
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  send(message: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected');
    }
  }

  getReadyState(): number {
    return this.ws?.readyState ?? WebSocket.CLOSED;
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}
