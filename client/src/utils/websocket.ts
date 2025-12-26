/**
 * WebSocket 连接管理器
 */

import {
  type ConfigMessage,
  ConnectionStatus,
  type DeviceInfo,
  MessageType,
  type WSMessage,
  type WebSocketConfig,
} from "@/types";

export type MessageHandler = (message: WSMessage) => void;
export type ConnectionHandler = (status: ConnectionStatus) => void;

export class WebSocketManager {
  private ws: WebSocket | null = null;
  private config: WebSocketConfig;
  private status: ConnectionStatus = ConnectionStatus.DISCONNECTED;
  private reconnectAttempts = 0;
  private reconnectTimer: number | null = null;
  private heartbeatTimer: number | null = null;
  private shouldReconnect = true; // 是否应该自动重连
  private messageHandlers: Set<MessageHandler> = new Set();
  private connectionHandlers: Set<ConnectionHandler> = new Set();

  constructor(config: WebSocketConfig) {
    this.config = {
      reconnectInterval: 3000,
      maxReconnectAttempts: 5,
      heartbeatInterval: 30000,
      ...config,
    };
  }

  /**
   * 连接到 WebSocket 服务器
   */
  public connect(deviceInfo?: DeviceInfo): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws?.readyState === WebSocket.OPEN || this.ws?.readyState === WebSocket.CONNECTING) {
        resolve();
        return;
      }

      this.shouldReconnect = true; // 连接前启用自动重连
      this.updateStatus(ConnectionStatus.CONNECTING);

      try {
        // 构建带查询参数的URL
        let wsUrl = this.config.url;
        // 确保URL有查询参数分隔符
        const separator = wsUrl.includes("?") ? "&" : "?";
        // 使用连字符格式的参数名，与服务器端保持一致
        wsUrl += `${separator}client-id=${this.config.clientId}&device-id=${this.config.deviceId}`;

        this.ws = new WebSocket(wsUrl);

        // 二进制数据处理为 ArrayBuffer
        this.ws.binaryType = "arraybuffer";

        this.ws.onopen = () => {
          console.log("[WebSocket] 连接成功");
          this.updateStatus(ConnectionStatus.CONNECTED);
          this.reconnectAttempts = 0;
          this.shouldReconnect = true; // 连接成功后允许重连
          this.startHeartbeat();

          // 发送配置消息
          if (deviceInfo) {
            this.sendConfig(deviceInfo);
          }

          resolve();
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event);
        };

        this.ws.onerror = (error) => {
          console.error("[WebSocket] 错误:", error);
          this.updateStatus(ConnectionStatus.ERROR);
          reject(error);
        };

        this.ws.onclose = (event) => {
          console.log("[WebSocket] 连接关闭:", event.code, event.reason);
          this.stopHeartbeat();
          this.updateStatus(ConnectionStatus.DISCONNECTED);

          // 仅在非主动断开且未超过最大重连次数时自动重连
          if (
            this.shouldReconnect &&
            this.reconnectAttempts < (this.config.maxReconnectAttempts || 5)
          ) {
            this.scheduleReconnect(deviceInfo);
          } else if (!this.shouldReconnect) {
            console.log("[WebSocket] 用户主动断开，不进行重连");
          } else {
            console.log("[WebSocket] 已达到最大重连次数，停止重连");
          }
        };
      } catch (error) {
        console.error("[WebSocket] 连接失败:", error);
        this.updateStatus(ConnectionStatus.ERROR);
        reject(error);
      }
    });
  }

  /**
   * 断开连接
   */
  public disconnect(): void {
    this.shouldReconnect = false; // 主动断开时禁用自动重连
    this.reconnectAttempts = 0; // 重置重连计数
    this.clearReconnectTimer();
    this.stopHeartbeat();

    if (this.ws) {
      this.ws.close(1000, "客户端主动断开");
      this.ws = null;
    }

    this.updateStatus(ConnectionStatus.DISCONNECTED);
  }

  /**
   * 发送 JSON 消息
   */
  public sendMessage(message: WSMessage): void {
    if (this.ws?.readyState !== WebSocket.OPEN) {
      console.warn("[WebSocket] 未连接，无法发送消息");
      return;
    }

    try {
      this.ws.send(JSON.stringify(message));
    } catch (error) {
      console.error("[WebSocket] 发送消息失败:", error);
    }
  }

  /**
   * 发送二进制数据（音频）
   */
  public sendBinary(data: ArrayBuffer): void {
    if (this.ws?.readyState !== WebSocket.OPEN) {
      console.warn("[WebSocket] 未连接，无法发送二进制数据");
      return;
    }

    try {
      // 检查数据大小，避免发送过大的数据包
      if (data.byteLength > 1024 * 1024) {
        // 1MB
        console.warn("[WebSocket] 音频数据过大:", data.byteLength);
      }
      this.ws.send(data);
    } catch (error) {
      console.error("[WebSocket] 发送二进制数据失败:", error);
    }
  }

  /**
   * 发送配置消息
   */
  public sendConfig(deviceInfo: DeviceInfo): void {
    const message: ConfigMessage = {
      type: MessageType.CONFIG,
      deviceInfo,
    };
    this.sendMessage(message);
  }

  /**
   * 发送文本消息
   */
  public sendText(text: string, sessionId?: string): void {
    this.sendMessage({
      type: MessageType.TEXT,
      data: { text },
      session_id: sessionId,
    });
  }

  /**
   * 发送控制命令
   */
  public sendControl(command: string, params?: Record<string, any>): void {
    this.sendMessage({
      type: MessageType.CONTROL,
      data: { command, params },
    });
  }

  /**
   * 注册消息处理器
   */
  public onMessage(handler: MessageHandler): () => void {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }

  /**
   * 注册连接状态处理器
   */
  public onConnectionChange(handler: ConnectionHandler): () => void {
    this.connectionHandlers.add(handler);
    return () => this.connectionHandlers.delete(handler);
  }

  /**
   * 获取当前连接状态
   */
  public getStatus(): ConnectionStatus {
    return this.status;
  }

  /**
   * 是否已连接
   */
  public isConnected(): boolean {
    return this.status === ConnectionStatus.CONNECTED;
  }

  // ========== 私有方法 ==========

  private handleMessage(event: MessageEvent): void {
    try {
      // 处理二进制数据 (TTS 音频)
      if (event.data instanceof ArrayBuffer) {
        const message: WSMessage = {
          type: MessageType.TTS,
          data: event.data,
        };
        this.notifyMessageHandlers(message);
        return;
      }

      // 处理 JSON 消息
      if (typeof event.data === "string") {
        const message: WSMessage = JSON.parse(event.data);
        this.notifyMessageHandlers(message);
      }
    } catch (error) {
      console.error("[WebSocket] 消息处理失败:", error);
    }
  }

  private notifyMessageHandlers(message: WSMessage): void {
    this.messageHandlers.forEach((handler) => {
      try {
        handler(message);
      } catch (error) {
        console.error("[WebSocket] 消息处理器执行失败:", error);
      }
    });
  }

  private updateStatus(status: ConnectionStatus): void {
    this.status = status;
    this.connectionHandlers.forEach((handler) => {
      try {
        handler(status);
      } catch (error) {
        console.error("[WebSocket] 连接状态处理器执行失败:", error);
      }
    });
  }

  private scheduleReconnect(deviceInfo?: DeviceInfo): void {
    this.clearReconnectTimer();
    this.reconnectAttempts++;
    this.updateStatus(ConnectionStatus.RECONNECTING);

    console.log(
      `[WebSocket] ${this.config.reconnectInterval}ms 后尝试重连 (${this.reconnectAttempts}/${this.config.maxReconnectAttempts})`,
    );

    this.reconnectTimer = window.setTimeout(() => {
      this.connect(deviceInfo);
    }, this.config.reconnectInterval);
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();

    this.heartbeatTimer = window.setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        // 发送心跳消息
        this.sendMessage({
          type: MessageType.CONTROL,
          data: { command: "ping" },
        });
      }
    }, this.config.heartbeatInterval);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer !== null) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }
}

export default WebSocketManager;
