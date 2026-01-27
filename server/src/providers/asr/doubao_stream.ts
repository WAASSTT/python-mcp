import type { TranscribeOptions } from "@/types/providers";
import type { Logger } from "@/utils/logger";
import { randomUUID } from "crypto";
import WebSocket from "ws";
import { gunzipSync, gzipSync } from "zlib";
import { ASRProvider } from "./base";

/**
 * Doubao (字节跳动) Stream ASR Provider
 * 豆包流式语音识别服务
 *
 * 基于 WebSocket 协议的双向流式语音识别
 * 支持三种模式：bigmodel（标准）/ bigmodel_async（推荐）/ bigmodel_nostream
 *
 * 参考实现: server/core/providers/asr/doubao_stream.py (517行)
 */
export class DoubaoStreamASRProvider extends ASRProvider {
  private appId: string;
  private accessToken: string;
  private cluster: string;
  private resourceId: string;
  private streamMode: string;
  private wsUrl: string;
  private uid: string;
  private workflow: string;
  private endWindowSize: number;

  // WebSocket 连接
  private ws: any | null = null;
  private isProcessing = false;

  // 音频配置
  private format = "pcm";
  private codec = "pcm";
  private rate = 16000;
  private language = "zh-CN";
  private bits = 16;
  private channel = 1;

  constructor(config: any, logger: Logger) {
    super(config, logger);

    this.appId = String(config.appid || "");
    this.accessToken = config.access_token || "";
    this.cluster = config.cluster || "";
    this.resourceId = config.resource_id || "volc.seedasr.sauc.duration";
    this.streamMode = config.stream_mode || "bigmodel_async";
    this.uid = config.uid || "streaming_asr_service";
    this.workflow =
      config.workflow || "audio_in,resample,partition,vad,fe,decode,itn,nlu_punctuate";
    this.endWindowSize = Number(config.end_window_size) || 200;

    // 根据模式选择接口地址
    const modeUrls: Record<string, string> = {
      bigmodel: "wss://openspeech.bytedance.com/api/v3/sauc/bigmodel",
      bigmodel_async: "wss://openspeech.bytedance.com/api/v3/sauc/bigmodel_async",
      bigmodel_nostream: "wss://openspeech.bytedance.com/api/v3/sauc/bigmodel_nostream",
    };
    this.wsUrl = modeUrls[this.streamMode] || modeUrls.bigmodel_async;

    this.logger.info(`Doubao Stream ASR provider initialized [${this.streamMode}]`);
  }

  async transcribe(audio: Buffer, options?: TranscribeOptions): Promise<string> {
    const chunks: string[] = [];
    const audioIterator = (async function* () {
      yield audio;
    })();

    for await (const text of this.transcribeStream(audioIterator, options)) {
      chunks.push(text);
    }
    return chunks.join("");
  }

  async *transcribeStream(
    audioStream: AsyncIterableIterator<Buffer>,
    _options?: TranscribeOptions,
  ): AsyncIterableIterator<string> {
    this.logger.debug(`Doubao Stream ASR processing [${this.streamMode}]...`);

    try {
      // 建立 WebSocket 连接
      await this.connect();

      // 发送初始化请求
      await this.sendInitRequest();

      // 等待初始化响应
      const initResponse = await this.waitForInitResponse();
      if (!initResponse.success) {
        throw new Error(`ASR initialization failed: ${initResponse.error}`);
      }

      // 处理音频流
      const resultQueue: string[] = [];

      // 启动结果接收
      const receiveTask = this.receiveResults(resultQueue);

      // 发送音频数据
      for await (const audioChunk of audioStream) {
        await this.sendAudioData(audioChunk);

        // 返回已接收的结果
        while (resultQueue.length > 0) {
          const text = resultQueue.shift();
          if (text) yield text;
        }
      }

      // 发送结束标记
      await this.sendFinish();

      // 等待剩余结果
      await receiveTask;
      while (resultQueue.length > 0) {
        const text = resultQueue.shift();
        if (text) yield text;
      }
    } catch (error) {
      this.logger.error(`Doubao Stream ASR error: ${error}`);
      throw error;
    } finally {
      await this.disconnect();
    }
  }

  /**
   * 建立 WebSocket 连接
   */
  private async connect(): Promise<void> {
    if (this.ws) {
      this.logger.warn("WebSocket already connected");
      return;
    }

    return new Promise((resolve, reject) => {
      try {
        const headers = this.getAuthHeaders();

        // 使用 Bun 原生 WebSocket
        this.ws = new WebSocket(this.wsUrl, { headers });

        this.ws.on("open", () => {
          this.logger.info(`WebSocket connected: ${this.wsUrl}`);
          this.isProcessing = true;
          resolve();
        });

        this.ws.on("error", (error: Error) => {
          this.logger.error(`WebSocket error: ${error.message}`);
          reject(new Error("WebSocket connection failed"));
        });

        this.ws.on("close", () => {
          this.logger.info("WebSocket closed");
          this.isProcessing = false;
          this.ws = null;
        });
      } catch (error) {
        this.logger.error(`Failed to create WebSocket: ${error}`);
        reject(error);
      }
    });
  }

  /**
   * 获取认证 headers
   */
  private getAuthHeaders(): Record<string, string> {
    return {
      "X-Api-App-Key": this.appId,
      "X-Api-Access-Key": this.accessToken,
      "X-Api-Resource-Id": this.resourceId,
      "X-Api-Connect-Id": randomUUID(),
    };
  }

  /**
   * 发送初始化请求
   */
  private async sendInitRequest(): Promise<void> {
    const reqId = randomUUID();
    const requestParams = {
      app: {
        appid: this.appId,
        cluster: this.cluster,
        token: this.accessToken,
      },
      user: { uid: this.uid },
      request: {
        reqid: reqId,
        workflow: this.workflow,
        show_utterances: true,
        result_type: "single",
        sequence: 1,
        end_window_size: this.endWindowSize,
      },
      audio: {
        format: this.format,
        codec: this.codec,
        rate: this.rate,
        language: this.language,
        bits: this.bits,
        channel: this.channel,
        sample_rate: this.rate,
      },
    };

    const payloadBytes = Buffer.from(JSON.stringify(requestParams), "utf-8");
    const compressedPayload = gzipSync(payloadBytes);

    const header = this.generateHeader(0x01, 0x01, 0x00, 0x01, 0x01, 0x00);
    const fullRequest = Buffer.concat([
      header,
      Buffer.from([
        (compressedPayload.length >> 24) & 0xff,
        (compressedPayload.length >> 16) & 0xff,
        (compressedPayload.length >> 8) & 0xff,
        compressedPayload.length & 0xff,
      ]),
      compressedPayload,
    ]);

    this.logger.debug(
      `Sending init request: ${JSON.stringify(requestParams).substring(0, 200)}...`,
    );
    this.ws?.send(fullRequest);
  }

  /**
   * 等待初始化响应
   */
  private waitForInitResponse(): Promise<{ success: boolean; error?: string }> {
    return new Promise((resolve) => {
      const onMessage = (data: Buffer) => {
        try {
          const response = this.parseResponse(new Uint8Array(data));
          this.logger.debug(`Init response: ${JSON.stringify(response).substring(0, 200)}...`);

          if (response.code && response.code !== 1000) {
            resolve({
              success: false,
              error: response.payload_msg?.error || "Unknown error",
            });
          } else {
            resolve({ success: true });
          }

          this.ws?.off("message", onMessage);
        } catch (error) {
          this.logger.error(`Failed to parse init response: ${error}`);
          resolve({ success: false, error: String(error) });
        }
      };

      this.ws?.on("message", onMessage);
    });
  }

  /**
   * 发送音频数据
   */
  private async sendAudioData(audioData: Buffer): Promise<void> {
    if (!this.ws || !this.isProcessing) {
      throw new Error("WebSocket not connected");
    }

    // 压缩音频数据
    const compressedAudio = gzipSync(audioData);

    // 生成音频 header
    const header = this.generateHeader(0x01, 0x02, 0x00, 0x01, 0x01, 0x00);

    const audioRequest = Buffer.concat([
      header,
      Buffer.from([
        (compressedAudio.length >> 24) & 0xff,
        (compressedAudio.length >> 16) & 0xff,
        (compressedAudio.length >> 8) & 0xff,
        compressedAudio.length & 0xff,
      ]),
      compressedAudio,
    ]);

    this.ws.send(audioRequest);
  }

  /**
   * 发送结束标记
   */
  private async sendFinish(): Promise<void> {
    if (!this.ws) return;

    const emptyPayload = gzipSync(Buffer.alloc(0));
    const header = this.generateHeader(0x01, 0x02, 0x02, 0x01, 0x01, 0x00);

    const finishRequest = Buffer.concat([
      header,
      Buffer.from([
        (emptyPayload.length >> 24) & 0xff,
        (emptyPayload.length >> 16) & 0xff,
        (emptyPayload.length >> 8) & 0xff,
        emptyPayload.length & 0xff,
      ]),
      emptyPayload,
    ]);

    this.logger.debug("Sending finish marker");
    this.ws.send(finishRequest);
  }

  /**
   * 接收识别结果
   */
  private async receiveResults(resultQueue: string[]): Promise<void> {
    return new Promise((resolve) => {
      const onMessage = (data: Buffer) => {
        try {
          const response = this.parseResponse(new Uint8Array(data));

          if (response.payload_msg) {
            const payload = response.payload_msg;

            // 检查错误
            if (payload.code === 1013) {
              // 无有效语音，静默处理
              return;
            }

            if (payload.error) {
              this.logger.error(`ASR error: ${payload.error}`);
              return;
            }

            // 提取识别结果
            if (payload.result) {
              const utterances = payload.result.utterances || [];
              for (const utterance of utterances) {
                if (utterance.definite && utterance.text) {
                  this.logger.info(`Recognized: ${utterance.text}`);
                  resultQueue.push(utterance.text);
                }
              }
            }
          }
        } catch (error) {
          this.logger.error(`Failed to process ASR result: ${error}`);
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
   * 生成协议 header
   */
  private generateHeader(
    version: number,
    messageType: number,
    messageTypeSpecificFlags: number,
    serialMethod: number,
    compressionType: number,
    reservedData: number,
    extensionHeader: Buffer = Buffer.alloc(0),
  ): Buffer {
    const headerSize = Math.floor(extensionHeader.length / 4) + 1;
    const header = Buffer.alloc(4 + extensionHeader.length);

    header[0] = (version << 4) | headerSize;
    header[1] = (messageType << 4) | messageTypeSpecificFlags;
    header[2] = (serialMethod << 4) | compressionType;
    header[3] = reservedData;

    if (extensionHeader.length > 0) {
      extensionHeader.copy(header, 4);
    }

    return header;
  }

  /**
   * 解析响应
   */
  private parseResponse(data: Uint8Array): any {
    try {
      if (data.length < 4) {
        throw new Error(`Response too short: ${data.length}`);
      }

      // 解析 header
      const header = data.slice(0, 4);
      const protocolVersion = (header[0] >> 4) & 0x0f;
      const headerSize = (header[0] & 0x0f) * 4;
      const messageType = (header[1] >> 4) & 0x0f;
      const messageTypeSpecificFlags = header[1] & 0x0f;
      const serialMethod = (header[2] >> 4) & 0x0f;
      const compressionType = header[2] & 0x0f;

      this.logger.debug(
        `Header: version=${protocolVersion}, headerSize=${headerSize}, ` +
          `messageType=0x${messageType.toString(16)}, flags=0x${messageTypeSpecificFlags.toString(16)}, ` +
          `serial=${serialMethod}, compression=${compressionType}`,
      );

      // 错误响应 (message_type = 0x0F)
      if (messageType === 0x0f) {
        const code = new DataView(data.buffer, headerSize, 4).getUint32(0, false);
        const msgLength = new DataView(data.buffer, headerSize + 4, 4).getUint32(0, false);
        const errorMsg = JSON.parse(
          new TextDecoder().decode(data.slice(headerSize + 8, headerSize + 8 + msgLength)),
        );
        return { code, msg_length: msgLength, payload_msg: errorMsg };
      }

      let offset = headerSize;

      // 检查是否有 sequence number
      if (messageTypeSpecificFlags & 0x01) {
        if (data.length < offset + 4) {
          throw new Error("Data too short for sequence");
        }
        const sequence = new DataView(data.buffer, offset, 4).getUint32(0, false);
        offset += 4;
        this.logger.debug(`Sequence: ${sequence}`);
      }

      // 读取 payload size
      if (data.length < offset + 4) {
        throw new Error("Data too short for payload size");
      }
      const payloadSize = new DataView(data.buffer, offset, 4).getUint32(0, false);
      offset += 4;

      this.logger.debug(`Payload size: ${payloadSize}, remaining: ${data.length - offset}`);

      // 读取 payload
      if (data.length < offset + payloadSize) {
        throw new Error(`Payload incomplete: expected ${payloadSize}, got ${data.length - offset}`);
      }
      let payloadBytes = data.slice(offset, offset + payloadSize);

      // 解压缩
      if (compressionType === 0x01) {
        payloadBytes = new Uint8Array(gunzipSync(Buffer.from(payloadBytes)));
        this.logger.debug(`Decompressed payload length: ${payloadBytes.length}`);
      }

      // 解析 JSON
      if (serialMethod === 0x01) {
        const jsonStr = new TextDecoder().decode(payloadBytes);
        const result = JSON.parse(jsonStr);
        return { payload_msg: result };
      }

      throw new Error(`Unsupported serial method: ${serialMethod}`);
    } catch (error) {
      this.logger.error(`Failed to parse response: ${error}`);
      this.logger.error(`Raw data (hex): ${Buffer.from(data.slice(0, 100)).toString("hex")}`);
      throw error;
    }
  }

  /**
   * 断开连接
   */
  private async disconnect(): Promise<void> {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.isProcessing = false;
      this.logger.info("WebSocket disconnected");
    }
  }
}
