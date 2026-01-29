/**
 * WebSocket 服务
 * 处理实时通信
 */

import type { ServerWebSocket } from "bun";
import type { Logger } from "./utils/logger";

// ============= 类型定义 =============

export interface WebSocketMessage {
  type: string;
  data: unknown;
  timestamp: number;
}

export interface ConnectionInfo {
  id: string;
  deviceId?: string;
  connectedAt: number;
  lastActivity: number;
}

// ============= WebSocket 管理器 =============

export class WebSocketManager {
  private connections = new Map<string, ServerWebSocket<ConnectionInfo>>();
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  /** 添加连接 */
  addConnection(id: string, ws: ServerWebSocket<ConnectionInfo>): void {
    this.connections.set(id, ws);
    this.logger.info(`WebSocket connected: ${id}`);
  }

  /** 移除连接 */
  removeConnection(id: string): void {
    this.connections.delete(id);
    this.logger.info(`WebSocket disconnected: ${id}`);
  }

  /** 获取连接 */
  getConnection(id: string): ServerWebSocket<ConnectionInfo> | undefined {
    return this.connections.get(id);
  }

  /** 广播消息 */
  broadcast(message: WebSocketMessage): void {
    const payload = JSON.stringify(message);
    for (const ws of this.connections.values()) {
      ws.send(payload);
    }
  }

  /** 发送到特定连接 */
  sendTo(id: string, message: WebSocketMessage): boolean {
    const ws = this.connections.get(id);
    if (ws) {
      ws.send(JSON.stringify(message));
      return true;
    }
    return false;
  }

  /** 获取连接数 */
  get connectionCount(): number {
    return this.connections.size;
  }

  /** 清理超时连接 */
  cleanupStaleConnections(timeoutMs: number = 300000): void {
    const now = Date.now();
    for (const [id, ws] of this.connections.entries()) {
      if (ws.data && now - ws.data.lastActivity > timeoutMs) {
        this.logger.warn(`Closing stale connection: ${id}`);
        ws.close();
        this.connections.delete(id);
      }
    }
  }
}

// ============= WebSocket 处理器 =============

export const createWebSocketHandlers = (logger: Logger) => {
  const manager = new WebSocketManager(logger);

  // 定期清理超时连接
  setInterval(() => manager.cleanupStaleConnections(), 60000);

  return {
    open(ws: any) {
      const rawWs = ws.raw as ServerWebSocket<ConnectionInfo>;
      const id = rawWs.data.id;
      manager.addConnection(id, rawWs);

      // 发送欢迎消息
      rawWs.send(
        JSON.stringify({
          type: "connected",
          data: { id, timestamp: Date.now() },
        }),
      );
    },

    message(ws: any, message: string | Buffer) {
      const rawWs = ws.raw as ServerWebSocket<ConnectionInfo>;
      const id = rawWs.data.id;

      // 更新最后活动时间
      if (rawWs.data) {
        rawWs.data.lastActivity = Date.now();
      }

      try {
        const payload = typeof message === "string" ? JSON.parse(message) : message;

        logger.debug(`WebSocket message from ${id}:`, payload);

        // 处理不同类型的消息
        switch (payload.type) {
          case "ping":
            rawWs.send(JSON.stringify({ type: "pong", timestamp: Date.now() }));
            break;

          case "audio":
            // 处理音频数据
            break;

          case "text":
            // 处理文本消息
            break;

          default:
            rawWs.send(
              JSON.stringify({
                type: "error",
                data: { message: `Unknown message type: ${payload.type}` },
              }),
            );
        }
      } catch (error) {
        logger.error(`WebSocket message error from ${id}:`);
        logger.error(error);
        rawWs.send(
          JSON.stringify({
            type: "error",
            data: {
              message: error instanceof Error ? error.message : "Parse error",
            },
          }),
        );
      }
    },

    close(ws: any, code: number, reason: string) {
      const rawWs = ws.raw as ServerWebSocket<ConnectionInfo>;
      const id = rawWs.data.id;
      manager.removeConnection(id);
      logger.info(`WebSocket closed: ${id} (code: ${code}, reason: ${reason})`);
    },

    error(ws: any, error: Error, _context?: any) {
      const rawWs = ws.raw as ServerWebSocket<ConnectionInfo>;
      const id = rawWs.data?.id || "unknown";
      logger.error(`WebSocket error for ${id}:`);
      logger.error(error);
    },

    // 暴露管理器用于外部访问
    manager,
  };
};

// ============= 导出 =============

export default createWebSocketHandlers;
