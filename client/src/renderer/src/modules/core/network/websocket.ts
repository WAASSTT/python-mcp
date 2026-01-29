/**
 * WebSocket 消息处理
 */

import type { DeviceConfig } from "../../config/manager";
import { logger } from "../../utils/logger";
import { getModernAudioPlayer } from "../audio/modern-player";
import { webSocketConnect } from "./ws-connector";

export type ConnectionStateCallback = (isConnected: boolean) => void;
export type SessionStateCallback = (isSpeaking: boolean) => void;
export type SessionEmotionCallback = (emoji: string) => void;
export type MessageCallback = (message: any) => void;

export interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

export class WebSocketHandler {
  private websocket: WebSocket | null = null;
  private currentSessionId: string | null = null;

  // 回调函数
  public onConnectionStateChange: ConnectionStateCallback | null = null;
  public onSessionStateChange: SessionStateCallback | null = null;
  public onSessionEmotionChange: SessionEmotionCallback | null = null;
  public onTextMessage: MessageCallback | null = null;
  public onSTTMessage: MessageCallback | null = null;
  public onLLMMessage: MessageCallback | null = null;
  public onMCPMessage: MessageCallback | null = null;

  /**
   * 连接到服务器
   */
  public async connect(serverUrl: string, config: DeviceConfig): Promise<boolean> {
    try {
      logger.info("正在连接服务器...");

      // 断开现有连接
      this.disconnect();

      // 直接连接到本地服务端 WebSocket
      const ws = await webSocketConnect(serverUrl, config);
      if (!ws) {
        logger.error("创建WebSocket连接失败");
        return false;
      }

      this.websocket = ws;

      // 设置二进制数据类型为 arraybuffer（默认是 blob）
      this.websocket.binaryType = "arraybuffer";

      // 设置事件监听器
      this.websocket.onopen = () => this.handleOpen();
      this.websocket.onclose = (event) => this.handleClose(event);
      this.websocket.onerror = (error) => this.handleError(error);
      this.websocket.onmessage = (event) => this.handleMessage(event);

      return true;
    } catch (error: any) {
      logger.error(`连接失败: ${error.message}`);
      return false;
    }
  }

  /**
   * 断开连接
   */
  public disconnect(): void {
    if (this.websocket) {
      logger.info("断开连接...");
      this.websocket.close();
      this.websocket = null;
    }

    if (this.onConnectionStateChange) {
      this.onConnectionStateChange(false);
    }
  }

  /**
   * 发送消息
   */
  public send(message: any): boolean {
    if (!this.websocket || this.websocket.readyState !== WebSocket.OPEN) {
      logger.error("WebSocket未连接");
      return false;
    }

    try {
      const data =
        typeof message === "string" ? message : JSON.stringify(message);
      this.websocket.send(data);
      return true;
    } catch (error: any) {
      logger.error(`发送消息失败: ${error.message}`);
      return false;
    }
  }

  /**
   * 发送文本消息
   */
  public sendText(text: string): boolean {
    return this.send({
      type: "text",
      text,
    });
  }

  /**
   * 发送中止消息
   */
  public sendAbort(): boolean {
    logger.info("发送中止消息");
    return this.send({
      type: "abort",
      session_id: this.currentSessionId,
    });
  }

  /**
   * 发送音频数据
   */
  public sendAudio(audioData: Uint8Array): boolean {
    if (!this.websocket || this.websocket.readyState !== WebSocket.OPEN) {
      return false;
    }

    try {
      this.websocket.send(audioData);
      return true;
    } catch (error: any) {
      logger.error(`发送音频失败: ${error.message}`);
      return false;
    }
  }

  /**
   * 发送 Hello 握手消息
   */
  public async sendHelloMessage(config: DeviceConfig): Promise<boolean> {
    if (!this.websocket || this.websocket.readyState !== WebSocket.OPEN) {
      return false;
    }

    try {
      const helloMessage = {
        type: "hello",
        device_id: config.deviceId,
        device_name: config.deviceName,
        device_mac: config.deviceId,
        token: config.token || "",
        features: {
          mcp: true,
        },
      };

      logger.info("发送hello握手消息");
      this.websocket.send(JSON.stringify(helloMessage));

      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          logger.error("等待hello响应超时");
          resolve(false);
        }, 5000);

        const onMessageHandler = (event: MessageEvent) => {
          try {
            const response = JSON.parse(event.data);
            if (response.type === "hello" && response.session_id) {
              logger.success(`服务器握手成功，会话ID: ${response.session_id}`);
              clearTimeout(timeout);
              this.websocket?.removeEventListener("message", onMessageHandler);
              resolve(true);
            }
          } catch (e) {
            // 忽略非JSON消息
          }
        };

        this.websocket?.addEventListener("message", onMessageHandler);
      });
    } catch (error: any) {
      logger.error(`发送hello消息错误: ${error.message}`);
      return false;
    }
  }

  /**
   * 处理连接打开
   */
  private handleOpen(): void {
    logger.success("WebSocket连接已建立");

    if (this.onConnectionStateChange) {
      this.onConnectionStateChange(true);
    }
  }

  /**
   * 处理连接关闭
   */
  private handleClose(event: CloseEvent): void {
    logger.info(`WebSocket连接已关闭: ${event.code} ${event.reason}`);

    if (this.onConnectionStateChange) {
      this.onConnectionStateChange(false);
    }

    if (this.onSessionStateChange) {
      this.onSessionStateChange(false);
    }
  }

  /**
   * 处理连接错误
   */
  private handleError(_error: Event): void {
    logger.error("WebSocket错误");
  }

  /**
   * 处理消息
   */
  private async handleMessage(event: MessageEvent): Promise<void> {
    // 处理二进制音频数据 (ArrayBuffer)
    if (event.data instanceof ArrayBuffer) {
      logger.info(`收到ArrayBuffer音频数据: ${event.data.byteLength} 字节`);
      this.handleBinaryMessage(event.data);
      return;
    }

    // 处理二进制音频数据 (Blob)
    if (event.data instanceof Blob) {
      logger.info(`收到Blob音频数据: ${event.data.size} 字节`);
      const arrayBuffer = await event.data.arrayBuffer();
      this.handleBinaryMessage(arrayBuffer);
      return;
    }

    // 处理文本消息
    try {
      const message: WebSocketMessage = JSON.parse(event.data);
      this.handleTextMessage(message);
    } catch (error) {
      logger.error(
        `消息解析失败: ${error}, 数据类型: ${typeof event.data}, 数据: ${
          event.data
        }`
      );
    }
  }

  /**
   * 处理二进制消息（音频数据）
   */
  private handleBinaryMessage(data: ArrayBuffer): void {
    const audioData = new Uint8Array(data);
    logger.info(`收到音频数据: ${audioData.length} 字节`);

    const audioPlayer = getModernAudioPlayer();
    audioPlayer.playAudio(audioData);
  }

  /**
   * 处理文本消息
   */
  private handleTextMessage(message: WebSocketMessage): void {
    logger.debug(`收到消息: ${message.type}`);

    if (this.onTextMessage) {
      this.onTextMessage(message);
    }

    switch (message.type) {
      case "hello":
        this.handleHelloMessage(message);
        break;

      case "tts":
        this.handleTTSMessage(message);
        break;

      case "stt":
        this.handleSTTMessage(message);
        break;

      case "llm":
        this.handleLLMMessage(message);
        break;

      case "mcp":
        this.handleMCPMessageInternal(message);
        break;

      case "audio":
        logger.info(`收到音频控制消息: ${JSON.stringify(message)}`);
        break;

      default:
        logger.info(`未知消息类型: ${message.type}`);
        break;
    }
  }

  /**
   * 处理 Hello 消息
   */
  private handleHelloMessage(message: WebSocketMessage): void {
    logger.success(`服务器回应：${JSON.stringify(message, null, 2)}`);
  }

  /**
   * 处理 TTS 消息
   */
  private handleTTSMessage(message: WebSocketMessage): void {
    if (message.state === "start") {
      logger.info("服务器开始发送语音");
      this.currentSessionId = message.session_id;

      // 清空旧的音频缓冲，准备接收新的音频流
      const audioPlayer = getModernAudioPlayer();
      audioPlayer.clear();

      if (this.onSessionStateChange) {
        this.onSessionStateChange(true);
      }
    } else if (message.state === "sentence_start") {
      logger.info(`服务器发送语音段: ${message.text}`);
    } else if (message.state === "sentence_end") {
      logger.info(`语音段结束: ${message.text}`);
    } else if (message.state === "stop") {
      logger.info("服务器语音传输结束");

      if (this.onSessionStateChange) {
        this.onSessionStateChange(false);
      }
    }
  }

  /**
   * 处理 STT 消息
   */
  private handleSTTMessage(message: WebSocketMessage): void {
    logger.info(`识别结果: ${message.text}`);

    if (this.onSTTMessage) {
      this.onSTTMessage(message);
    }
  }

  /**
   * 处理 LLM 消息
   */
  private handleLLMMessage(message: WebSocketMessage): void {
    logger.info(`大模型回复: ${message.text}`);

    // 提取表情
    const emojiRegex =
      /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u;
    if (message.text && emojiRegex.test(message.text)) {
      const emojiMatch = message.text.match(emojiRegex);
      if (emojiMatch && this.onSessionEmotionChange) {
        this.onSessionEmotionChange(emojiMatch[0]);
      }
    }

    if (this.onLLMMessage) {
      this.onLLMMessage(message);
    }
  }

  /**
   * 处理 MCP 消息
   */
  private handleMCPMessageInternal(message: WebSocketMessage): void {
    logger.info(`服务器下发: ${JSON.stringify(message)}`);

    if (this.onMCPMessage) {
      this.onMCPMessage(message);
    }
  }

  /**
   * 获取连接状态
   */
  public isConnected(): boolean {
    return (
      this.websocket !== null && this.websocket.readyState === WebSocket.OPEN
    );
  }

  /**
   * 获取当前会话ID
   */
  public getCurrentSessionId(): string | null {
    return this.currentSessionId;
  }
}

// 单例
let webSocketHandlerInstance: WebSocketHandler | null = null;

/**
 * 获取 WebSocket 处理器实例
 */
export function getWebSocketHandler(): WebSocketHandler {
  if (!webSocketHandlerInstance) {
    webSocketHandlerInstance = new WebSocketHandler();
  }
  return webSocketHandlerInstance;
}
