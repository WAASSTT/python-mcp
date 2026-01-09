/**
 * WebSocket 服务 - 原生实现
 * 支持二进制数据传输和消息路由
 */

export interface MessageHandler {
  (data: MessageData): void;
}

export interface AudioHandler {
  (data: Uint8Array): void;
}

export interface ConnectionHandler {
  (connected: boolean): void;
}

export interface MessageData {
  type: string;
  [key: string]: unknown;
}

class WebSocketService {
  private ws: WebSocket | null = null;
  private messageHandlers: Map<string, MessageHandler[]> = new Map();
  private audioHandlers: AudioHandler[] = [];
  private connectionHandlers: ConnectionHandler[] = [];
  private reconnectTimer?: number;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  get connected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * 连接 WebSocket
   */
  connect(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log("[WebSocket] 连接:", url);

      this.ws = new WebSocket(url);
      this.ws.binaryType = "arraybuffer";

      this.ws.onopen = () => {
        console.log("[WebSocket] ✅ 已连接");
        this.reconnectAttempts = 0;
        this.notifyConnection(true);
        resolve();
      };

      this.ws.onerror = (error) => {
        console.error("[WebSocket] ❌ 错误:", error);
        reject(error);
      };

      this.ws.onmessage = (event) => {
        if (event.data instanceof ArrayBuffer) {
          // 二进制数据 (音频)
          const data = new Uint8Array(event.data);
          this.audioHandlers.forEach((handler) => handler(data));
        } else {
          // 文本数据 (JSON)
          try {
            const data = JSON.parse(event.data);
            this.routeMessage(data);
          } catch (error) {
            console.error("[WebSocket] JSON 解析失败:", error);
          }
        }
      };

      this.ws.onclose = () => {
        console.log("[WebSocket] 已断开");
        this.notifyConnection(false);
        this.tryReconnect(url);
      };
    });
  }

  /**
   * 路由消息到对应的处理器
   */
  private routeMessage(data: MessageData): void {
    const type = data.type;

    // 调用特定类型的处理器
    const handlers = this.messageHandlers.get(type);
    if (handlers) {
      handlers.forEach((handler) => handler(data));
    }

    // 调用通配符处理器
    const wildcardHandlers = this.messageHandlers.get("*");
    if (wildcardHandlers) {
      wildcardHandlers.forEach((handler) => handler(data));
    }
  }

  /**
   * 通知连接状态变化
   */
  private notifyConnection(connected: boolean): void {
    this.connectionHandlers.forEach((handler) => handler(connected));
  }

  /**
   * 尝试重连
   */
  private tryReconnect(url: string): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error("[WebSocket] 重连失败，已达最大次数");
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);

    console.log(`[WebSocket] ${delay}ms 后重连...`);
    this.reconnectTimer = window.setTimeout(() => {
      this.connect(url).catch(() => {});
    }, delay);
  }

  /**
   * 注册消息处理器 (支持类型路由)
   */
  on(type: string, handler: MessageHandler): void {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, []);
    }
    this.messageHandlers.get(type)!.push(handler);
  }

  /**
   * 注册消息处理器 (通用)
   */
  onMessage(handler: MessageHandler): void {
    this.on("*", handler);
  }

  /**
   * 注册音频处理器
   */
  onAudio(handler: AudioHandler): void {
    this.audioHandlers.push(handler);
  }

  /**
   * 注册连接状态处理器
   */
  onConnect(handler: ConnectionHandler): void {
    this.connectionHandlers.push(handler);
  }

  /**
   * 发送文本消息
   */
  send(data: object): void {
    if (!this.connected) {
      throw new Error("WebSocket 未连接");
    }
    this.ws!.send(JSON.stringify(data));
  }

  /**
   * 发送二进制数据
   */
  sendBinary(data: Uint8Array): void {
    if (!this.connected) {
      throw new Error("WebSocket 未连接");
    }
    this.ws!.send(data.buffer);
  }

  /**
   * 断开连接
   */
  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    this.ws?.close();
    this.ws = null;
  }

  /**
   * 清理所有处理器
   */
  cleanup(): void {
    this.messageHandlers.clear();
    this.audioHandlers = [];
    this.connectionHandlers = [];
  }
}

// 单例导出
export const wsService = new WebSocketService();
