/**
 * 高性能 Opus 编码器
 * 使用 @evan/wasm (浏览器环境)
 * 参考: https://twlite.github.io/node-opus-benchmark/
 */

import { Encoder, initOpus } from "./opus-browser";

export interface FastOpusEncoderConfig {
  sampleRate?: number;
  channels?: number;
  frameSize?: number; // 每帧采样数
  application?: "voip" | "audio" | "restricted_lowdelay"; // VOIP, AUDIO, LOW_DELAY
  bitrate?: number;
  complexity?: number; // 0-10
}

export class FastOpusEncoder {
  private audioContext: AudioContext | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private workletNode: AudioWorkletNode | null = null;
  private encoder: any = null;
  private config: Required<FastOpusEncoderConfig>;
  private onDataCallback: ((data: ArrayBuffer) => void) | null = null;
  private isRecording: boolean = false;

  constructor(config?: FastOpusEncoderConfig) {
    this.config = {
      sampleRate: config?.sampleRate ?? 16000,
      channels: config?.channels ?? 1,
      frameSize: config?.frameSize ?? 960, // 60ms @ 16kHz
      application: config?.application ?? "voip",
      bitrate: config?.bitrate ?? 24000,
      complexity: config?.complexity ?? 10,
    };
  }

  /**
   * 初始化编码器
   */
  public async init(stream: MediaStream): Promise<void> {
    try {
      // 初始化 WASM 模块
      await initOpus();

      // 创建 Opus 编码器
      this.encoder = new Encoder({
        sample_rate: this.config.sampleRate,
        channels: this.config.channels,
        application: this.config.application,
      });

      // 设置编码器参数
      this.encoder.bitrate = this.config.bitrate;
      this.encoder.complexity = this.config.complexity;

      console.log("[FastOpusEncoder] Opus 编码器初始化成功");

      // 创建 AudioContext
      this.audioContext = new AudioContext({
        sampleRate: this.config.sampleRate,
      });

      // 创建音频源
      this.sourceNode = this.audioContext.createMediaStreamSource(stream);

      // 注册 AudioWorklet
      await this.audioContext.audioWorklet.addModule("/audio-processor.worklet.js");

      // 创建 AudioWorklet 节点
      this.workletNode = new AudioWorkletNode(this.audioContext, "audio-processor", {
        numberOfInputs: 1,
        numberOfOutputs: 1,
        channelCount: this.config.channels,
      });

      // 监听 PCM 数据
      this.workletNode.port.onmessage = (event) => {
        const data = event.data;

        if (data && typeof data === "object" && "error" in data) {
          console.error("[FastOpusEncoder] AudioWorklet 错误:", data.error);
          return;
        }

        if (data instanceof Float32Array && this.isRecording) {
          this.processPCMData(data);
        }
      };

      // 连接音频节点
      this.sourceNode.connect(this.workletNode);
      this.workletNode.connect(this.audioContext.destination);

      console.log("[FastOpusEncoder] 初始化完成");
    } catch (error) {
      console.error("[FastOpusEncoder] 初始化失败:", error);
      throw error;
    }
  }

  /**
   * 处理 PCM 数据并编码
   */
  private processPCMData(pcmFloat32: Float32Array): void {
    try {
      // 转换 Float32 (-1.0 ~ 1.0) 为 Int16 (-32768 ~ 32767)
      const pcmInt16 = new Int16Array(pcmFloat32.length);
      for (let i = 0; i < pcmFloat32.length; i++) {
        const sample = pcmFloat32[i];
        if (sample === undefined) continue;
        const s = Math.max(-1, Math.min(1, sample));
        pcmInt16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
      }

      // 按帧大小编码
      for (let i = 0; i < pcmInt16.length; i += this.config.frameSize) {
        const end = Math.min(i + this.config.frameSize, pcmInt16.length);
        if (end - i < this.config.frameSize) break; // 不够一帧

        const frame = pcmInt16.subarray(i, end);

        // 使用 @evan/wasm 编码
        const opusData = this.encoder.encode(frame);

        if (opusData && this.onDataCallback) {
          this.onDataCallback(opusData.buffer);
        }
      }
    } catch (error) {
      console.error("[FastOpusEncoder] 编码错误:", error);
    }
  }

  /**
   * 开始录制
   */
  public start(): void {
    this.isRecording = true;
    console.log("[FastOpusEncoder] 开始编码");
  }

  /**
   * 停止录制
   */
  public stop(): void {
    this.isRecording = false;
    console.log("[FastOpusEncoder] 停止编码");
  }

  /**
   * 暂停录制
   */
  public pause(): void {
    this.isRecording = false;
  }

  /**
   * 恢复录制
   */
  public resume(): void {
    this.isRecording = true;
  }

  /**
   * 设置数据回调
   */
  public onData(callback: (data: ArrayBuffer) => void): void {
    this.onDataCallback = callback;
  }

  /**
   * 销毁编码器
   */
  public destroy(): void {
    console.log("[FastOpusEncoder] 开始销毁...");

    this.isRecording = false;

    // 清理编码器引用（@evan/wasm 的 Encoder 会自动管理内存）
    if (this.encoder) {
      this.encoder = null;
    }

    // 断开音频节点
    if (this.workletNode) {
      this.workletNode.port.onmessage = null;
      this.workletNode.disconnect();
      this.workletNode = null;
    }

    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }

    // 关闭 AudioContext
    if (this.audioContext) {
      this.audioContext.close().catch(console.error);
      this.audioContext = null;
    }

    this.onDataCallback = null;

    console.log("[FastOpusEncoder] 已销毁");
  }
}

export default FastOpusEncoder;
