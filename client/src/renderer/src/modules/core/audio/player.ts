/**
 * 音频播放器
 */

import { logger } from "../../utils/logger";
import { initOpusDecoder, type OpusDecoder } from "./opus-codec";
import {
  createStreamingContext,
  type StreamingContext,
} from "./stream-context";

export class AudioPlayer {
  // 音频参数
  private readonly SAMPLE_RATE = 16000;
  private readonly CHANNELS = 1;
  private readonly FRAME_SIZE = 960;
  private readonly MIN_AUDIO_DURATION = 0.12;

  // 状态
  private audioContext: AudioContext | null = null;
  private opusDecoder: OpusDecoder | null = null;
  private streamingContext: StreamingContext | null = null;
  private isPlaying = false;

  /**
   * 获取或创建 AudioContext
   */
  public getAudioContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)({
        sampleRate: this.SAMPLE_RATE,
        latencyHint: "interactive",
      });
      logger.debug(`创建音频上下文，采样率: ${this.SAMPLE_RATE}Hz`);
    }
    return this.audioContext;
  }

  /**
   * 初始化 Opus 解码器
   */
  private initOpusDecoderInstance(): OpusDecoder {
    if (this.opusDecoder) return this.opusDecoder;

    this.opusDecoder = initOpusDecoder(
      this.CHANNELS,
      this.SAMPLE_RATE,
      this.FRAME_SIZE
    );
    return this.opusDecoder;
  }

  /**
   * 启动播放器
   */
  public async start(): Promise<void> {
    logger.info("启动音频播放器...");

    // 初始化 AudioContext
    const audioContext = this.getAudioContext();

    // 初始化解码器
    const decoder = this.initOpusDecoderInstance();
    decoder.init();

    // 创建流上下文
    this.streamingContext = createStreamingContext(
      decoder,
      audioContext,
      this.SAMPLE_RATE,
      this.CHANNELS,
      this.MIN_AUDIO_DURATION
    );

    logger.success("音频播放器启动成功");
  }

  /**
   * 接收音频数据
   */
  public receiveAudio(audioBuffers: Uint8Array[]): void {
    if (!this.streamingContext) {
      logger.error("流上下文未初始化");
      return;
    }

    this.streamingContext.pushAudioBuffer(audioBuffers);

    // 如果尚未播放，开始播放
    if (!this.isPlaying) {
      this.isPlaying = true;
      this.streamingContext.start().finally(() => {
        this.isPlaying = false;
      });
    }
  }

  /**
   * 标记流结束
   */
  public endStream(): void {
    if (this.streamingContext) {
      this.streamingContext.markEndOfStream();
    }
  }

  /**
   * 停止播放
   */
  public stop(): void {
    if (this.streamingContext) {
      this.streamingContext.stop();
      this.isPlaying = false;
    }
  }

  /**
   * 清空缓冲
   */
  public clearBuffers(): void {
    if (this.streamingContext) {
      this.streamingContext.clearAllBuffers();
      this.isPlaying = false;
    }
  }

  /**
   * 获取播放状态
   */
  public getPlaybackStats() {
    if (!this.streamingContext) {
      return {
        pendingDecodeCount: 0,
        pendingPlayCount: 0,
        isPlaying: false,
      };
    }

    return {
      pendingDecodeCount: this.streamingContext.getPendingDecodeCount(),
      pendingPlayCount: this.streamingContext.getPendingPlayCount(),
      isPlaying: this.isPlaying,
    };
  }

  /**
   * 销毁播放器
   */
  public destroy(): void {
    this.stop();

    if (this.opusDecoder) {
      this.opusDecoder.destroy();
      this.opusDecoder = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    logger.info("音频播放器已销毁");
  }
}

// 单例
let audioPlayerInstance: AudioPlayer | null = null;

/**
 * 获取音频播放器实例
 */
export function getAudioPlayer(): AudioPlayer {
  if (!audioPlayerInstance) {
    audioPlayerInstance = new AudioPlayer();
  }
  return audioPlayerInstance;
}
