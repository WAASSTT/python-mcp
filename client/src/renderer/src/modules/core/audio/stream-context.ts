/**
 * 音频流播放上下文
 * 用于管理音频流的解码、缓冲和播放
 */

import { BlockingQueue } from "../../utils/blocking-queue";
import { logger } from "../../utils/logger";

export interface OpusDecoder {
  decode(opusData: Uint8Array): Int16Array;
  destroy(): void;
}

export class StreamingContext {
  private opusDecoder: OpusDecoder;
  private audioContext: AudioContext;

  // 音频参数
  private sampleRate: number;
  private channels: number;
  private minAudioDuration: number;

  // 队列和状态
  private queue: Int16Array[] = [];
  private activeQueue = new BlockingQueue<Int16Array>();
  private pendingAudioBufferQueue: Uint8Array[] = [];
  private audioBufferQueue = new BlockingQueue<Uint8Array>();
  private playing = false;
  private endOfStream = false;
  private source: AudioBufferSourceNode | null = null;
  private totalSamples = 0;
  private scheduledEndTime = 0;

  constructor(
    opusDecoder: OpusDecoder,
    audioContext: AudioContext,
    sampleRate: number,
    channels: number,
    minAudioDuration: number
  ) {
    this.opusDecoder = opusDecoder;
    this.audioContext = audioContext;
    this.sampleRate = sampleRate;
    this.channels = channels;
    this.minAudioDuration = minAudioDuration;
  }

  /**
   * 缓存音频数组
   */
  public pushAudioBuffer(items: Uint8Array[]): void {
    items.forEach((item) => this.audioBufferQueue.enqueue(item));
  }

  /**
   * 获取需要处理缓存队列
   */
  public async getPendingAudioBufferQueue(): Promise<void> {
    const data = await this.audioBufferQueue.dequeue();
    this.pendingAudioBufferQueue = data;
  }

  /**
   * 获取正在播放已解码的PCM队列
   */
  public async getQueue(minSamples: number): Promise<void> {
    const num = Math.max(1, minSamples - this.queue.length);
    const tempArray = await this.activeQueue.dequeue(num);
    this.queue.push(...tempArray);
  }

  /**
   * 将Int16音频数据转换为Float32音频数据
   */
  private convertInt16ToFloat32(int16Data: Int16Array): Float32Array {
    const float32Data = new Float32Array(int16Data.length);
    for (let i = 0; i < int16Data.length; i++) {
      float32Data[i] = int16Data[i] / 32768.0;
    }
    return float32Data;
  }

  /**
   * 获取待解码包数
   */
  public getPendingDecodeCount(): number {
    return this.audioBufferQueue.length + this.pendingAudioBufferQueue.length;
  }

  /**
   * 获取待播放样本数（转换为包数，每包960样本）
   */
  public getPendingPlayCount(): number {
    const queuedSamples = this.activeQueue.length + this.queue.length;

    let scheduledSamples = 0;
    if (this.playing && this.scheduledEndTime) {
      const currentTime = this.audioContext.currentTime;
      const remainingTime = Math.max(0, this.scheduledEndTime - currentTime);
      scheduledSamples = Math.floor(remainingTime * this.sampleRate);
    }

    const totalSamples = queuedSamples + scheduledSamples;
    return Math.ceil(totalSamples / 960);
  }

  /**
   * 清空所有音频缓冲
   */
  public clearAllBuffers(): void {
    logger.info("清空所有音频缓冲");

    this.audioBufferQueue.clear();
    this.pendingAudioBufferQueue = [];
    this.activeQueue.clear();
    this.queue = [];

    if (this.source) {
      try {
        this.source.stop();
        this.source.disconnect();
      } catch (e) {
        // 忽略已经停止的错误
      }
      this.source = null;
    }

    this.playing = false;
    this.endOfStream = false;
    this.totalSamples = 0;
    this.scheduledEndTime = 0;
  }

  /**
   * 标记流结束
   */
  public markEndOfStream(): void {
    this.endOfStream = true;
    logger.debug("标记音频流结束");
  }

  /**
   * 检查是否所有音频都已播放完成
   */
  public isComplete(): boolean {
    return (
      this.endOfStream &&
      this.audioBufferQueue.length === 0 &&
      this.pendingAudioBufferQueue.length === 0 &&
      this.activeQueue.length === 0 &&
      this.queue.length === 0 &&
      !this.playing
    );
  }

  /**
   * 解码音频数据
   */
  public async decodeLoop(): Promise<void> {
    while (!this.isComplete()) {
      await this.getPendingAudioBufferQueue();

      while (this.pendingAudioBufferQueue.length > 0) {
        const opusData = this.pendingAudioBufferQueue.shift();
        if (!opusData) continue;

        try {
          const pcmData = this.opusDecoder.decode(opusData);
          this.activeQueue.enqueue(pcmData);
        } catch (error) {
          logger.error(`解码失败: ${error}`);
        }
      }

      if (this.endOfStream && this.audioBufferQueue.length === 0) {
        break;
      }
    }
  }

  /**
   * 播放音频数据
   */
  public async playLoop(): Promise<void> {
    this.playing = true;

    try {
      while (!this.isComplete()) {
        const minSamples = Math.floor(this.minAudioDuration * this.sampleRate);
        await this.getQueue(minSamples);

        if (this.queue.length === 0) {
          if (this.endOfStream) break;
          continue;
        }

        const totalLength = this.queue.reduce(
          (sum, arr) => sum + arr.length,
          0
        );
        const combinedPcm = new Int16Array(totalLength);
        let offset = 0;
        for (const pcm of this.queue) {
          combinedPcm.set(pcm, offset);
          offset += pcm.length;
        }
        this.queue = [];

        const float32Data = this.convertInt16ToFloat32(combinedPcm);
        const audioBuffer = this.audioContext.createBuffer(
          this.channels,
          float32Data.length,
          this.sampleRate
        );
        audioBuffer.getChannelData(0).set(float32Data);

        const source = this.audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(this.audioContext.destination);

        const startTime = Math.max(
          this.audioContext.currentTime,
          this.scheduledEndTime
        );
        source.start(startTime);

        this.scheduledEndTime = startTime + audioBuffer.duration;
        this.totalSamples += combinedPcm.length;
        this.source = source;
      }
    } finally {
      this.playing = false;
      logger.debug("播放循环结束");
    }
  }

  /**
   * 开始播放
   */
  public async start(): Promise<void> {
    if (this.playing) {
      logger.warning("播放器已在运行中");
      return;
    }

    this.clearAllBuffers();
    this.endOfStream = false;

    // 并行启动解码和播放循环
    await Promise.all([this.decodeLoop(), this.playLoop()]);
  }

  /**
   * 停止播放
   */
  public stop(): void {
    this.markEndOfStream();
    this.clearAllBuffers();
  }
}

/**
 * 创建流播放上下文
 */
export function createStreamingContext(
  opusDecoder: OpusDecoder,
  audioContext: AudioContext,
  sampleRate: number,
  channels: number,
  minAudioDuration: number
): StreamingContext {
  return new StreamingContext(
    opusDecoder,
    audioContext,
    sampleRate,
    channels,
    minAudioDuration
  );
}
