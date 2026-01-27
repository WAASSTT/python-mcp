/**
 * 现代化音频播放器
 * 使用Web Audio API的最佳实践
 */

import { logger } from "../../utils/logger";
import { initOpusDecoder, type OpusDecoder } from "./opus-codec";

export class ModernAudioPlayer {
  private audioContext: AudioContext | null = null;
  private opusDecoder: OpusDecoder | null = null;
  private sourceNodes: AudioBufferSourceNode[] = [];
  private nextStartTime = 0;
  private isInitialized = false;

  private readonly SAMPLE_RATE = 16000;
  private readonly CHANNELS = 1;
  private readonly FRAME_SIZE = 960;

  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      logger.debug("播放器已初始化");
      return;
    }

    logger.info("初始化音频播放器...");

    this.audioContext = new (window.AudioContext ||
      (window as any).webkitAudioContext)({
      sampleRate: this.SAMPLE_RATE,
      latencyHint: "interactive",
    });

    logger.info(`AudioContext创建成功，状态: ${this.audioContext.state}`);

    this.opusDecoder = initOpusDecoder(
      this.CHANNELS,
      this.SAMPLE_RATE,
      this.FRAME_SIZE
    );
    this.opusDecoder.init();

    logger.success("Opus解码器初始化成功");

    this.isInitialized = true;
    this.nextStartTime = 0;
  }

  public async playAudio(opusData: Uint8Array): Promise<void> {
    if (!this.isInitialized || !this.audioContext || !this.opusDecoder) {
      logger.error("播放器未初始化");
      return;
    }

    if (this.audioContext.state === "suspended") {
      logger.info("恢复AudioContext...");
      await this.audioContext.resume();
    }

    try {
      const pcmData = this.opusDecoder.decode(opusData);

      if (!pcmData || pcmData.length === 0) {
        logger.warning("解码后的PCM数据为空");
        return;
      }

      logger.debug(
        `解码音频: ${opusData.length} 字节 -> ${pcmData.length} 采样`
      );

      const float32Data = new Float32Array(pcmData.length);
      for (let i = 0; i < pcmData.length; i++) {
        float32Data[i] = pcmData[i] / 32768.0;
      }

      const audioBuffer = this.audioContext.createBuffer(
        this.CHANNELS,
        float32Data.length,
        this.SAMPLE_RATE
      );
      audioBuffer.getChannelData(0).set(float32Data);

      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.audioContext.destination);

      const currentTime = this.audioContext.currentTime;
      const startTime = Math.max(currentTime, this.nextStartTime);

      source.start(startTime);
      this.nextStartTime = startTime + audioBuffer.duration;
      this.sourceNodes.push(source);
      source.onended = () => {
        const index = this.sourceNodes.indexOf(source);
        if (index > -1) {
          this.sourceNodes.splice(index, 1);
        }
      };

      logger.debug(`音频已调度播放，时长: ${audioBuffer.duration.toFixed(3)}s`);
    } catch (error) {
      logger.error(`播放音频失败: ${error}`);
    }
  }

  public stop(): void {
    logger.info("停止所有音频播放");

    this.sourceNodes.forEach((source) => {
      try {
        source.stop();
        source.disconnect();
      } catch (e) {
        // 忽略已停止的节点
      }
    });

    this.sourceNodes = [];
    this.nextStartTime = 0;
  }

  public clear(): void {
    this.stop();
    logger.info("音频缓冲已清空");
  }

  public getState(): string {
    return this.audioContext?.state || "未初始化";
  }

  public getAudioContext(): AudioContext {
    if (!this.audioContext) {
      throw new Error("AudioContext未初始化，请先调用initialize()");
    }
    return this.audioContext;
  }

  public destroy(): void {
    logger.info("销毁音频播放器");

    this.stop();

    if (this.opusDecoder) {
      this.opusDecoder.destroy();
      this.opusDecoder = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.isInitialized = false;
  }
}

let modernPlayerInstance: ModernAudioPlayer | null = null;

export function getModernAudioPlayer(): ModernAudioPlayer {
  if (!modernPlayerInstance) {
    modernPlayerInstance = new ModernAudioPlayer();
  }
  return modernPlayerInstance;
}
