import type { SynthesizeOptions } from "@/types/providers";
import type { Logger } from "@/utils/logger";
import { randomUUID } from "crypto";
import WebSocket from "ws";
import { gunzipSync, gzipSync } from "zlib";
import { TTSProvider } from "./base";

// 协议常量
const PROTOCOL_VERSION = 0x01;
const _DEFAULT_HEADER_SIZE = 0x01;

// Message Types
const FULL_CLIENT_REQUEST = 0x01;
const AUDIO_ONLY_RESPONSE = 0x0b;
const _FULL_SERVER_RESPONSE = 0x09;
const _ERROR_INFORMATION = 0x0f;

// Message Type Specific Flags
const _MSG_FLAG_NO_SEQ = 0x00;
const MSG_FLAG_WITH_EVENT = 0x04;

// Serialization & Compression
const JSON_SERIAL = 0x01;
const GZIP_COMPRESSION = 0x01;

// Events
const EVENT_START_CONNECTION = 1;
const EVENT_FINISH_CONNECTION = 2;
const _EVENT_CONNECTION_STARTED = 50;
const _EVENT_CONNECTION_FINISHED = 52;
const EVENT_START_SESSION = 100;
const EVENT_FINISH_SESSION = 102;
const _EVENT_SESSION_STARTED = 150;
const _EVENT_SESSION_FINISHED = 152;
const EVENT_TASK_REQUEST = 200;
const _EVENT_TTS_RESPONSE = 352;

/**
 * Huoshan (火山引擎) Double Stream TTS Provider
 * 火山引擎双向流式语音合成服务
 *
 * 基于 WebSocket 协议，支持流式输入文本、流式输出音频
 * 参考实现: server/core/providers/tts/huoshan_double_stream.py (787行)
 */
export class HuoshanStreamTTSProvider extends TTSProvider {
  private appId: string;
  private accessToken: string;
  private resourceId: string;
  private wsUrl: string;
  private speaker: string;
  private speechRate: number;
  private loudnessRate: number;
  private pitch: number;
  private emotion: string;
  private emotionScale: number;
  private enableWsReuse: boolean;

  // WebSocket 连接
  private ws: any | null = null;
  private sessionId: string | null = null;
  private monitorTask: Promise<void> | null = null;

  constructor(config: any, logger: Logger) {
    super(config, logger);

    this.appId = String(config.appid || "");
    this.accessToken = config.access_token || "";
    this.resourceId = config.resource_id || "volc.service_type.10029";
    this.wsUrl = config.ws_url || "wss://openspeech.bytedance.com/api/v3/tts/bidirection";
    this.speaker = config.speaker || "zh_female_xinlingjitang_moon_bigtts";
    this.speechRate = Number(config.speech_rate || 0);
    this.loudnessRate = Number(config.loudness_rate || 0);
    this.pitch = Number(config.pitch || 0);
    this.emotion = config.emotion || "neutral";
    this.emotionScale = Number(config.emotion_scale || 4);
    this.enableWsReuse = config.enable_ws_reuse !== false;

    this.logger.info("Huoshan Stream TTS provider initialized");
  }

  async synthesize(text: string, options?: SynthesizeOptions): Promise<Buffer> {
    const chunks: Buffer[] = [];
    for await (const chunk of this.synthesizeStream(text, options)) {
      chunks.push(chunk);
    }
    return Buffer.concat(chunks);
  }

  async *synthesizeStream(
    text: string,
    _options?: SynthesizeOptions,
  ): AsyncIterableIterator<Buffer> {
    this.logger.debug(`Huoshan Stream TTS processing: ${text.substring(0, 50)}...`);

    try {
      // 建立连接
      await this.ensureConnection();

      // 开始会话
      this.sessionId = randomUUID();
      await this.startSession(this.sessionId);

      // 创建音频接收队列
      const audioQueue: Buffer[] = [];
      let sessionFinished = false;

      // 启动音频接收任务
      const receiveTask = this.receiveAudio(audioQueue, () => sessionFinished);

      // 发送文本
      await this.sendText(text, this.sessionId);

      // 结束会话
      await this.finishSession(this.sessionId);

      // 流式返回音频
      while (!sessionFinished || audioQueue.length > 0) {
        if (audioQueue.length > 0) {
          const audio = audioQueue.shift();
          if (audio) yield audio;
        } else {
          // 等待更多数据
          await new Promise((resolve) => setTimeout(resolve, 10));
        }
      }

      // 等待接收任务完成
      await receiveTask;

      // 如果不复用连接，关闭它
      if (!this.enableWsReuse) {
        await this.closeConnection();
      }
    } catch (error) {
      this.logger.error(`Huoshan Stream TTS error: ${error}`);
      throw error;
    }
  }

  /**
   * 确保 WebSocket 连接建立
   */
  private async ensureConnection(): Promise<void> {
    if (this.ws) {
      if (this.enableWsReuse) {
        this.logger.info("Reusing existing WebSocket connection");
        return;
      } else {
        await this.closeConnection();
      }
    }

    return new Promise((resolve, reject) => {
      try {
        const headers = {
          "X-Api-App-Key": this.appId,
          "X-Api-Access-Key": this.accessToken,
          "X-Api-Resource-Id": this.resourceId,
          "X-Api-Connect-Id": randomUUID(),
        };

        // 使用 Bun 原生 WebSocket
        this.ws = new WebSocket(this.wsUrl, { headers });

        this.ws.on("open", async () => {
          this.logger.info("WebSocket connected");

          // 发送建连事件
          await this.sendConnectionStart();

          // 启动监听任务
          if (!this.monitorTask) {
            this.monitorTask = this.monitorTTSResponse();
          }

          resolve();
        });

        this.ws.on("error", (error: Error) => {
          this.logger.error(`WebSocket error: ${error.message}`);
          reject(error);
        });

        this.ws.on("close", () => {
          this.logger.info("WebSocket closed");
          this.ws = null;
        });
      } catch (error) {
        this.logger.error(`Failed to create WebSocket: ${error}`);
        reject(error);
      }
    });
  }

  /**
   * 发送建连事件
   */
  private async sendConnectionStart(): Promise<void> {
    const header = this.generateHeader(
      FULL_CLIENT_REQUEST,
      MSG_FLAG_WITH_EVENT,
      JSON_SERIAL,
      GZIP_COMPRESSION,
    );
    const optional = this.generateOptional(EVENT_START_CONNECTION);
    const payload = Buffer.from("{}");

    await this.sendEvent(header, optional, payload);
  }

  /**
   * 开始会话
   */
  private async startSession(sessionId: string): Promise<void> {
    const requestBody = {
      app: {
        appid: this.appId,
        token: this.accessToken,
        cluster: "",
      },
      user: {
        uid: "tts_service",
      },
      audio: {
        voice: this.speaker,
        encoding: "opus",
        rate: this.speechRate,
        loudness_rate: this.loudnessRate,
        pitch: this.pitch,
        emotion: this.emotion,
        emotion_scale: this.emotionScale,
      },
      request: {
        reqid: randomUUID(),
        operation: "query",
      },
      resource_id: this.resourceId,
    };

    const header = this.generateHeader(
      FULL_CLIENT_REQUEST,
      MSG_FLAG_WITH_EVENT,
      JSON_SERIAL,
      GZIP_COMPRESSION,
    );
    const optional = this.generateOptional(EVENT_START_SESSION, sessionId);
    const payload = Buffer.from(JSON.stringify(requestBody));

    await this.sendEvent(header, optional, payload);
    this.logger.debug(`Session started: ${sessionId}`);
  }

  /**
   * 发送文本
   */
  private async sendText(text: string, sessionId: string): Promise<void> {
    const requestBody = {
      text,
      operation: "submit",
    };

    const header = this.generateHeader(
      FULL_CLIENT_REQUEST,
      MSG_FLAG_WITH_EVENT,
      JSON_SERIAL,
      GZIP_COMPRESSION,
    );
    const optional = this.generateOptional(EVENT_TASK_REQUEST, sessionId);
    const payload = Buffer.from(JSON.stringify(requestBody));

    await this.sendEvent(header, optional, payload);
    this.logger.debug(`Text sent: ${text.substring(0, 50)}...`);
  }

  /**
   * 结束会话
   */
  private async finishSession(sessionId: string): Promise<void> {
    const header = this.generateHeader(
      FULL_CLIENT_REQUEST,
      MSG_FLAG_WITH_EVENT,
      JSON_SERIAL,
      GZIP_COMPRESSION,
    );
    const optional = this.generateOptional(EVENT_FINISH_SESSION, sessionId);
    const payload = Buffer.from("{}");

    await this.sendEvent(header, optional, payload);
    this.logger.debug(`Session finished: ${sessionId}`);
  }

  /**
   * 监听 TTS 响应
   */
  private async monitorTTSResponse(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.ws) {
        resolve();
        return;
      }

      this.ws.on("close", () => {
        resolve();
      });
    });
  }

  /**
   * 接收音频数据
   */
  private async receiveAudio(audioQueue: Buffer[], _isFinished: () => boolean): Promise<void> {
    return new Promise((resolve) => {
      const onMessage = (data: Buffer) => {
        try {
          const response = this.parseResponse(new Uint8Array(data));

          // 检查消息类型
          const messageType = (data[1] >> 4) & 0x0f;

          if (messageType === AUDIO_ONLY_RESPONSE) {
            // 音频数据
            const headerSize = (data[0] & 0x0f) * 4;
            const audioData = data.slice(headerSize);
            audioQueue.push(audioData);
            this.logger.debug(`Received audio chunk: ${audioData.length} bytes`);
          } else if (response.payload_msg) {
            // JSON 响应
            this.logger.debug(
              `Received message: ${JSON.stringify(response.payload_msg).substring(0, 200)}...`,
            );
          }
        } catch (error) {
          this.logger.error(`Failed to process TTS response: ${error}`);
        }
      };

      const onClose = () => {
        this.ws?.off("message", onMessage);
        this.ws?.off("close", onClose);
        resolve();
      };

      this.ws?.on("message", onMessage);
      this.ws?.on("close", onClose);
    });
  }

  /**
   * 发送事件
   */
  private async sendEvent(header: Buffer, optional: Buffer, payload: Buffer): Promise<void> {
    if (!this.ws) {
      throw new Error("WebSocket not connected");
    }

    const compressedPayload = gzipSync(payload);
    const payloadSize = Buffer.alloc(4);
    payloadSize.writeUInt32BE(compressedPayload.length, 0);

    const fullRequest = Buffer.concat([header, optional, payloadSize, compressedPayload]);

    this.ws.send(fullRequest);
  }

  /**
   * 生成协议 header
   */
  private generateHeader(
    messageType: number,
    messageTypeSpecificFlags: number,
    serialMethod: number,
    compressionType: number,
    extensionHeader: Buffer = Buffer.alloc(0),
  ): Buffer {
    const headerSize = Math.floor(extensionHeader.length / 4) + 1;
    const header = Buffer.alloc(4 + extensionHeader.length);

    header[0] = (PROTOCOL_VERSION << 4) | headerSize;
    header[1] = (messageType << 4) | messageTypeSpecificFlags;
    header[2] = (serialMethod << 4) | compressionType;
    header[3] = 0x00;

    if (extensionHeader.length > 0) {
      extensionHeader.copy(header, 4);
    }

    return header;
  }

  /**
   * 生成 optional 字段
   */
  private generateOptional(event: number, sessionId?: string): Buffer {
    const parts: Buffer[] = [];

    // Event (4 bytes)
    const eventBuf = Buffer.alloc(4);
    eventBuf.writeInt32BE(event, 0);
    parts.push(eventBuf);

    // Session ID (if provided)
    if (sessionId) {
      const sessionIdBytes = Buffer.from(sessionId, "utf-8");
      const sizeBuf = Buffer.alloc(4);
      sizeBuf.writeInt32BE(sessionIdBytes.length, 0);
      parts.push(sizeBuf);
      parts.push(sessionIdBytes);
    }

    return Buffer.concat(parts);
  }

  /**
   * 解析响应
   */
  private parseResponse(data: Uint8Array): any {
    try {
      if (data.length < 4) {
        return {};
      }

      const header = data.slice(0, 4);
      const headerSize = (header[0] & 0x0f) * 4;
      const messageType = (header[1] >> 4) & 0x0f;
      const serialMethod = (header[2] >> 4) & 0x0f;
      const compressionType = header[2] & 0x0f;

      // 音频响应直接返回
      if (messageType === AUDIO_ONLY_RESPONSE) {
        return { audio: true };
      }

      // JSON 响应
      let offset = headerSize;

      // 读取 payload size
      if (data.length < offset + 4) {
        return {};
      }
      const payloadSize = new DataView(data.buffer, offset, 4).getUint32(0, false);
      offset += 4;

      if (data.length < offset + payloadSize) {
        return {};
      }
      let payloadBytes = data.slice(offset, offset + payloadSize);

      // 解压缩
      if (compressionType === GZIP_COMPRESSION) {
        payloadBytes = new Uint8Array(gunzipSync(Buffer.from(payloadBytes)));
      }

      // 解析 JSON
      if (serialMethod === JSON_SERIAL) {
        const jsonStr = new TextDecoder().decode(payloadBytes);
        const result = JSON.parse(jsonStr);
        return { payload_msg: result };
      }

      return {};
    } catch (error) {
      this.logger.error(`Failed to parse response: ${error}`);
      return {};
    }
  }

  /**
   * 关闭连接
   */
  private async closeConnection(): Promise<void> {
    if (this.ws) {
      try {
        // 发送关闭连接事件
        const header = this.generateHeader(
          FULL_CLIENT_REQUEST,
          MSG_FLAG_WITH_EVENT,
          JSON_SERIAL,
          GZIP_COMPRESSION,
        );
        const optional = this.generateOptional(EVENT_FINISH_CONNECTION);
        const payload = Buffer.from("{}");
        await this.sendEvent(header, optional, payload);

        // 等待一小段时间让服务器响应
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        this.logger.error(`Error during connection close: ${error}`);
      }

      this.ws.close();
      this.ws = null;
      this.logger.info("Connection closed");
    }
  }
}
