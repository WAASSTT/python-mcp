/**
 * Silero VAD Provider
 * 使用 Silero VAD 模型进行语音活动检测
 *
 * 依赖:
 * - onnxruntime-node: ONNX Runtime for Node.js
 * - opus-decoder: Opus 解码器
 */

import type { VADContext, VADProviderConfig, VADResult } from "@/types/vad";
import type { Logger } from "@/utils/logger";
import { VADProvider } from "./base";

// 动态导入类型
type InferenceSession = import("onnxruntime-node").InferenceSession;

/**
 * Silero VAD 配置
 */
export interface SileroVADConfig extends VADProviderConfig {
  type: "silero";
  model_dir: string;
  threshold?: number;
  threshold_low?: number;
  min_silence_duration_ms?: number;
}

/**
 * Silero VAD 模型状态
 */
interface SileroState {
  h: Float32Array;
  c: Float32Array;
  sr: bigint;
}

/**
 * Silero VAD Provider
 *
 * 使用 Silero VAD ONNX 模型进行语音活动检测
 * 支持 Opus 解码和 PCM 输入
 */
export class SileroVADProvider extends VADProvider {
  private modelPath: string;
  private model: InferenceSession | null = null;
  private decoder: any = null;
  private isInitialized = false;
  private modelState: SileroState | null = null;
  private ort: typeof import("onnxruntime-node") | null = null;

  constructor(config: SileroVADConfig, logger: Logger) {
    super(config, logger);
    this.modelPath = config.model_dir || "models/snakers4_silero-vad";
  }

  /**
   * 初始化模型
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      this.logger.info("Initializing Silero VAD...");

      // 1. 加载 ONNX Runtime
      try {
        this.ort = await import("onnxruntime-node");
        this.logger.info("ONNX Runtime loaded successfully");
      } catch (error) {
        this.logger.warn({ err: error }, "ONNX Runtime not available, using energy-based fallback");
        this.isInitialized = true;
        return;
      }

      // 2. 加载 Silero VAD 模型
      const modelFile = `${this.modelPath}/silero_vad.onnx`;
      try {
        this.model = await this.ort.InferenceSession.create(modelFile);
        this.logger.info(`Silero VAD model loaded from: ${modelFile}`);

        // 初始化模型状态 (h, c 为 hidden states, 64 维)
        this.modelState = {
          h: new Float32Array(2 * 64).fill(0), // [2, 1, 64]
          c: new Float32Array(2 * 64).fill(0), // [2, 1, 64]
          sr: BigInt(16000),
        };
      } catch (error) {
        this.logger.warn({ err: error, modelFile }, "Failed to load model, using fallback");
      }

      // 3. 初始化 Opus 解码器
      try {
        const { OpusDecoder } = await import("opus-decoder");
        this.decoder = new OpusDecoder({
          sampleRate: 16000,
          channels: 1,
          streamCount: 1,
          coupledStreamCount: 0,
          channelMappingTable: [0],
        });
        await this.decoder.ready;
        this.logger.info("Opus decoder initialized");
      } catch (error) {
        this.logger.warn({ err: error }, "Opus decoder not available, assuming PCM input");
      }

      this.isInitialized = true;
      this.logger.info("Silero VAD initialized successfully");
    } catch (error) {
      this.logger.error({ err: error }, "Failed to initialize Silero VAD");
      this.isInitialized = true; // 允许使用回退方案
    }
  }

  async isVAD(audioData: Uint8Array, context: VADContext): Promise<VADResult> {
    // 手动模式: 直接返回有语音
    if (context.listenMode === "manual") {
      return { hasVoice: true };
    }

    try {
      // 确保模型已初始化
      if (!this.isInitialized) {
        await this.initialize();
      }

      // 1. 解码 Opus 数据为 PCM
      const pcmData = await this.decodeOpus(audioData);
      if (!pcmData || pcmData.length === 0) {
        return { hasVoice: false };
      }

      // 2. 将 PCM 数据加入缓冲区
      context.audioBuffer.push(pcmData);

      // 3. 处理缓冲区中的完整帧 (每次处理 512 采样点)
      let hasVoice = false;
      const frameSize = 512 * 2; // 512 samples * 2 bytes per sample

      // 合并缓冲区
      const totalLength = context.audioBuffer.reduce((sum, arr) => sum + arr.length, 0);
      const combinedBuffer = new Uint8Array(totalLength);
      let offset = 0;
      for (const arr of context.audioBuffer) {
        combinedBuffer.set(arr, offset);
        offset += arr.length;
      }

      // 处理完整帧
      let processedBytes = 0;
      while (combinedBuffer.length - processedBytes >= frameSize) {
        const chunk = combinedBuffer.slice(processedBytes, processedBytes + frameSize);
        processedBytes += frameSize;

        // 获取语音概率
        const probability = await this.getSpeechProbability(chunk);

        // 双阈值判断
        const isVoice = this.applyDualThreshold(probability, context.lastIsVoice);
        context.lastIsVoice = isVoice;

        // 更新滑动窗口
        hasVoice = this.updateVoiceWindow(context, isVoice);
      }

      // 保留未处理的数据
      if (processedBytes > 0) {
        const remaining = combinedBuffer.slice(processedBytes);
        context.audioBuffer = remaining.length > 0 ? [remaining] : [];
      }

      // 检查语音是否停止
      const voiceStopped = this.checkVoiceStopped(context, hasVoice);
      context.voiceStopped = voiceStopped;

      return {
        hasVoice,
        voiceStopped,
        firstActivityTime: context.firstActivityTime,
        lastActivityTime: context.lastActivityTime,
      };
    } catch (error) {
      this.logger.error({ err: error }, "Silero VAD error");
      return { hasVoice: false };
    }
  }

  /**
   * 解码 Opus 数据
   */
  private async decodeOpus(opusData: Uint8Array): Promise<Uint8Array> {
    if (!this.decoder) {
      // 如果没有解码器，假设输入已经是 PCM
      return opusData;
    }

    try {
      // 使用 Opus 解码器解码
      const decoded = this.decoder.decodeFrame(opusData);
      if (decoded && decoded.channelData && decoded.channelData[0]) {
        // 将 Float32Array 转换为 Int16 PCM
        const float32Data = decoded.channelData[0];
        const int16Data = new Int16Array(float32Data.length);
        for (let i = 0; i < float32Data.length; i++) {
          // 将 float [-1, 1] 转换为 int16 [-32768, 32767]
          const sample = Math.max(-1, Math.min(1, float32Data[i]));
          int16Data[i] = sample < 0 ? sample * 32768 : sample * 32767;
        }
        return new Uint8Array(int16Data.buffer);
      }
      return new Uint8Array(0);
    } catch (error) {
      this.logger.error({ err: error }, "Opus decode error");
      return new Uint8Array(0);
    }
  }

  /**
   * 获取语音概率
   */
  private async getSpeechProbability(audioChunk: Uint8Array): Promise<number> {
    if (!this.model || !this.ort || !this.modelState) {
      // 没有模型时使用简单的能量检测作为后备
      return this.calculateEnergyProbability(audioChunk);
    }

    try {
      // 1. 转换 PCM 数据为 float32 张量
      const audioInt16 = new Int16Array(
        audioChunk.buffer,
        audioChunk.byteOffset,
        audioChunk.length / 2,
      );
      const audioFloat32 = new Float32Array(audioInt16.length);
      for (let i = 0; i < audioInt16.length; i++) {
        audioFloat32[i] = audioInt16[i] / 32768.0;
      }

      // 2. 创建输入张量
      const inputTensor = new this.ort.Tensor("float32", audioFloat32, [1, audioFloat32.length]);
      const hTensor = new this.ort.Tensor("float32", this.modelState.h, [2, 1, 64]);
      const cTensor = new this.ort.Tensor("float32", this.modelState.c, [2, 1, 64]);
      const srTensor = new this.ort.Tensor("int64", BigInt64Array.from([this.modelState.sr]), [1]);

      // 3. 运行推理
      const feeds = {
        input: inputTensor,
        h: hTensor,
        c: cTensor,
        sr: srTensor,
      };
      const results = await this.model.run(feeds);

      // 4. 更新状态
      if (results.hn?.data) {
        this.modelState.h = new Float32Array(results.hn.data as Float32Array);
      }
      if (results.cn?.data) {
        this.modelState.c = new Float32Array(results.cn.data as Float32Array);
      }

      // 5. 获取输出概率
      if (results.output?.data) {
        const probability = (results.output.data as Float32Array)[0];
        return probability;
      }

      return 0;
    } catch (error) {
      this.logger.error({ err: error }, "Model inference error");
      return this.calculateEnergyProbability(audioChunk);
    }
  }

  /**
   * 基于能量的概率估算 (后备方案)
   */
  private calculateEnergyProbability(audioChunk: Uint8Array): number {
    if (audioChunk.length < 2) return 0;

    let sum = 0;
    for (let i = 0; i < audioChunk.length - 1; i += 2) {
      const sample = (audioChunk[i + 1] << 8) | audioChunk[i];
      const signedSample = sample > 32767 ? sample - 65536 : sample;
      sum += signedSample * signedSample;
    }

    const rms = Math.sqrt(sum / (audioChunk.length / 2));
    // 将 RMS 映射到 0-1 的概率
    // 假设 1000 是典型语音的 RMS
    return Math.min(rms / 3000, 1);
  }

  reset(): void {
    // 重置模型状态
    if (this.modelState) {
      this.modelState.h.fill(0);
      this.modelState.c.fill(0);
    }
    this.logger.debug("Silero VAD state reset");
  }

  destroy(): void {
    if (this.model) {
      // 释放 ONNX 模型资源
      this.model = null;
    }
    if (this.decoder) {
      // 释放解码器资源
      if (typeof this.decoder.free === "function") {
        this.decoder.free();
      }
      this.decoder = null;
    }
    this.modelState = null;
    this.ort = null;
    this.isInitialized = false;
    this.logger.info("Silero VAD destroyed");
  }
}
