/**
 * WebSocket 服务
 * 负责与服务器的 WebSocket 连接、消息发送和接收
 */

export interface MessageData {
  type: string;
  [key: string]: any;
}

export type MessageHandler = (data: MessageData) => void;

export class WebSocketService {
  private ws: WebSocket | null = null;
  private url: string = '';
  private deviceId: string = '';
  private token: string = '';
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 3000;
  private heartbeatInterval: number | null = null;
  private heartbeatTimeout: number = 30000; // 30秒心跳间隔
  private messageHandlers: Map<string, Set<MessageHandler>> = new Map();
  private onConnectionChange?: (connected: boolean) => void;

  /**
   * 连接到 WebSocket 服务器
   */
  connect(url: string, deviceId: string, token: string = ''): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // 保存连接参数
        this.url = url;
        this.deviceId = deviceId;
        this.token = token;

        // 构建带参数的 WebSocket URL
        const wsUrl = `${url}?device-id=${deviceId}`;
        console.log('[WebSocket] 正在连接到:', wsUrl);

        this.ws = new WebSocket(wsUrl);

        // 连接成功
        this.ws.onopen = () => {
          console.log('[WebSocket] 连接成功');
          this.reconnectAttempts = 0;
          this.startHeartbeat();
          this.onConnectionChange?.(true);
          resolve();
        };

        // 接收消息
        this.ws.onmessage = event => {
          this.handleMessage(event.data);
        };

        // 连接关闭
        this.ws.onclose = event => {
          console.log('[WebSocket] 连接关闭:', event.code, event.reason);
          this.stopHeartbeat();
          this.onConnectionChange?.(false);

          // 尝试重连
          if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(
              `[WebSocket] ${this.reconnectDelay / 1000}秒后尝试第${
                this.reconnectAttempts
              }次重连...`
            );
            setTimeout(() => {
              this.connect(this.url, this.deviceId, this.token);
            }, this.reconnectDelay);
          }
        };

        // 连接错误
        this.ws.onerror = error => {
          console.error('[WebSocket] 连接错误:', error);
          reject(error);
        };
      } catch (error) {
        console.error('[WebSocket] 连接失败:', error);
        reject(error);
      }
    });
  }

  /**
   * 断开连接
   */
  disconnect(): void {
    this.reconnectAttempts = this.maxReconnectAttempts; // 阻止自动重连
    this.stopHeartbeat();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.onConnectionChange?.(false);
  }

  /**
   * 发送消息
   */
  send(data: MessageData): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('[WebSocket] 连接未建立，无法发送消息');
      return;
    }

    try {
      const message = JSON.stringify(data);
      this.ws.send(message);
      console.log('[WebSocket] 发送消息:', data);
    } catch (error) {
      console.error('[WebSocket] 发送消息失败:', error);
    }
  }

  /**
   * 发送二进制数据（音频）
   */
  sendBinary(data: ArrayBuffer | Blob): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('[WebSocket] 连接未建立，无法发送二进制数据');
      return;
    }

    try {
      this.ws.send(data);
      const size = data instanceof ArrayBuffer ? data.byteLength : data.size;
      console.log('[WebSocket] 发送二进制数据:', size, 'bytes');
    } catch (error) {
      console.error('[WebSocket] 发送二进制数据失败:', error);
    }
  }

  /**
   * 处理接收到的消息
   */
  private handleMessage(data: string | ArrayBuffer): void {
    try {
      // 处理文本消息
      if (typeof data === 'string') {
        const message: MessageData = JSON.parse(data);
        console.log('[WebSocket] 收到消息:', message);

        // 触发对应类型的处理器
        const handlers = this.messageHandlers.get(message.type);
        if (handlers) {
          handlers.forEach(handler => handler(message));
        }

        // 触发通配符处理器
        const allHandlers = this.messageHandlers.get('*');
        if (allHandlers) {
          allHandlers.forEach(handler => handler(message));
        }
      }
      // 处理二进制消息（音频数据）
      else if (data instanceof ArrayBuffer) {
        console.log('[WebSocket] 收到二进制数据:', data.byteLength, 'bytes');
        const handlers = this.messageHandlers.get('audio');
        if (handlers) {
          handlers.forEach(handler => handler({ type: 'audio', data }));
        }
      }
    } catch (error) {
      console.error('[WebSocket] 处理消息失败:', error);
    }
  }

  /**
   * 注册消息处理器
   */
  on(type: string, handler: MessageHandler): void {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, new Set());
    }
    this.messageHandlers.get(type)!.add(handler);
  }

  /**
   * 注销消息处理器
   */
  off(type: string, handler: MessageHandler): void {
    const handlers = this.messageHandlers.get(type);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  /**
   * 设置连接状态变化回调
   */
  onConnect(callback: (connected: boolean) => void): void {
    this.onConnectionChange = callback;
  }

  /**
   * 启动心跳
   */
  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.send({ type: 'ping' });
      }
    }, this.heartbeatTimeout);
  }

  /**
   * 停止心跳
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * 获取连接状态
   */
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}

// 导出单例
export const wsService = new WebSocketService();
