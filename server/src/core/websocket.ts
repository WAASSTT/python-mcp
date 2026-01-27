import type { WebSocketMessage } from "@/types/api";
import type { AppConfig } from "@/types/config";
import type { Logger } from "@/utils/logger";
import { Elysia } from "elysia";
import { nanoid } from "nanoid";
import { ConnectionHandler } from "./connection";

/**
 * WebSocket 会话
 */
interface WebSocketSession {
  id: string;
  ws: any;
  handler: ConnectionHandler;
  startTime: number;
  lastActivity: number;
}

/**
 * WebSocket 服务
 */
export function createWebSocketServer(config: AppConfig, logger: Logger) {
  const sessions = new Map<string, WebSocketSession>();

  return new Elysia().ws("/ws/v1", {
    open(ws) {
      // 解析请求参数
      const headers = ws.data?.headers || {};
      const deviceId = headers["device-id"] || getQueryParam(ws, "device-id");
      const clientId = headers["client-id"] || getQueryParam(ws, "client-id");

      // 验证 device-id
      if (!deviceId) {
        ws.send(
          JSON.stringify({
            type: "error",
            message: "端口正常，如需测试连接，请使用 test_page.html",
          }),
        );
        ws.close();
        return;
      }

      // 获取客户端 IP
      const clientIp =
        headers["x-real-ip"] || headers["x-forwarded-for"]?.split(",")[0].trim() || "unknown";

      // 创建会话 ID
      const sessionId = nanoid();

      // 创建连接处理器
      const handler = new ConnectionHandler(config, logger, ws, {
        deviceId,
        clientId,
        clientIp,
      });

      // 保存会话
      sessions.set(sessionId, {
        id: sessionId,
        ws,
        handler,
        startTime: Date.now(),
        lastActivity: Date.now(),
      });

      logger.info(`WebSocket connected: ${sessionId}, device: ${deviceId}`);

      // 处理连接
      handler.handleConnection();
    },

    message(ws, message: any) {
      try {
        const data = typeof message === "string" ? JSON.parse(message) : message;
        const session = findSessionByWs(sessions, ws);

        if (!session) {
          logger.error("Session not found for WebSocket");
          return;
        }

        session.lastActivity = Date.now();

        // 处理不同类型的消息
        handleMessage(data, session, config, logger);
      } catch (error: any) {
        logger.error("WebSocket message error:", error);
        ws.send(
          JSON.stringify({
            type: "error",
            error: error.message,
          }),
        );
      }
    },

    close(ws) {
      const session = findSessionByWs(sessions, ws);
      if (session) {
        sessions.delete(session.id);
        logger.info(`WebSocket disconnected: ${session.id}`);
      }
    },
  });

  // 定期清理不活跃的连接
  if (config.close_connection_no_voice_time > 0) {
    setInterval(() => {
      const now = Date.now();
      const timeout = config.close_connection_no_voice_time * 1000;

      for (const [sessionId, session] of sessions.entries()) {
        if (now - session.lastActivity > timeout) {
          logger.info(`Closing inactive session: ${sessionId}`);
          session.ws.close();
          sessions.delete(sessionId);
        }
      }
    }, 30000); // 每30秒检查一次
  }
}

/**
 * 从查询参数获取值
 */
function getQueryParam(ws: any, name: string): string | undefined {
  try {
    const url = ws.data?.url || ws.url;
    if (!url) return undefined;

    const urlObj = new URL(url, "http://localhost");
    return urlObj.searchParams.get(name) || undefined;
  } catch {
    return undefined;
  }
}

/**
 * 根据 WebSocket 查找会话
 */
function findSessionByWs(
  sessions: Map<string, WebSocketSession>,
  ws: any,
): WebSocketSession | undefined {
  for (const session of sessions.values()) {
    if (session.ws === ws) {
      return session;
    }
  }
  return undefined;
}

/**
 * 处理 WebSocket 消息
 */
async function handleMessage(
  message: WebSocketMessage,
  session: WebSocketSession,
  config: AppConfig,
  logger: Logger,
) {
  const { type, data } = message;
  const handler = session.handler;

  switch (type) {
    case "hello":
      logger.info(`Hello from session: ${session.id}`);
      break;

    case "audio":
      // 处理音频数据
      if (data?.audio) {
        const audioData =
          typeof data.audio === "string"
            ? Buffer.from(data.audio, "base64")
            : new Uint8Array(data.audio);
        await handler.handleAudioMessage(audioData);
      }
      break;

    case "text":
      // 处理文本消息
      if (data?.text) {
        await handler.handleTextMessage(data.text);
      }
      break;

    case "listen":
      // 设置监听模式
      if (data?.mode) {
        handler.connectionState.clientListenMode = data.mode;
        logger.debug(`Listen mode changed to: ${data.mode}`);
      }
      break;

    case "abort":
      // 处理打断
      await handler.handleAbort();
      break;

    case "intent":
      // 处理意图消息
      logger.debug(`Received intent from session: ${session.id}`, data);
      await handleIntentMessage(session, data, config, logger);
      break;

    case "close":
      logger.info(`Close requested by session: ${session.id}`);
      handler.close();
      break;

    default:
      logger.warn(`Unknown message type: ${type}`);
  }
}

/**
 * 处理意图消息
 */
async function handleIntentMessage(
  session: WebSocketSession,
  data: any,
  config: AppConfig,
  logger: Logger,
) {
  const { intent, action, params } = data || {};

  if (!intent) {
    logger.warn(`Invalid intent message: missing intent field`);
    return;
  }

  logger.info(`Processing intent: ${intent}, action: ${action}`);

  // 发送意图确认
  session.handler.send({
    type: "intent_ack",
    session_id: session.id,
    timestamp: Date.now(),
    data: {
      intent,
      status: "received",
    },
  });

  // 根据意图类型执行不同操作
  switch (intent) {
    case "play_music":
      // 处理播放音乐意图
      logger.info(`Play music request: ${params?.query || "random"}`);
      // 这里可以集成音乐服务
      session.handler.send({
        type: "intent_result",
        session_id: session.id,
        timestamp: Date.now(),
        data: {
          intent: "play_music",
          status: "processing",
          message: `正在播放: ${params?.query || "随机音乐"}`,
        },
      });
      break;

    case "weather":
      // 处理天气查询意图
      const location = params?.location || "当前位置";
      logger.info(`Weather query for: ${location}`);
      // 这里可以集成天气服务
      session.handler.send({
        type: "intent_result",
        session_id: session.id,
        timestamp: Date.now(),
        data: {
          intent: "weather",
          status: "processing",
          message: `正在查询${location}的天气...`,
        },
      });
      break;

    case "exit":
    case "goodbye":
      // 处理退出意图
      await session.handler.handleExit();
      break;

    default:
      logger.debug(`Unknown intent: ${intent}`);
  }
}

// handleIoTMessage 已移除 - 纯软件版本不需要 IoT 设备控制
