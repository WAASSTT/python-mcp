/**
 * 音频录制管理器
 * 使用高性能 @evan/wasm Opus 编码器（基于基准测试性能最优）
 */

import { type AudioConfig, RecordingStatus } from "@/types";
import { FastOpusEncoder } from "./fast-opus-encoder";

export type AudioDataHandler = (audioData: ArrayBuffer) => void;
export type StatusHandler = (status: RecordingStatus) => void;

export class AudioRecorder {
  private mediaStream: MediaStream | null = null;
  private opusEncoder: FastOpusEncoder | null = null;
  private config: AudioConfig;
  private status: RecordingStatus = RecordingStatus.IDLE;
  private audioDataHandlers: Set<AudioDataHandler> = new Set();
  private statusHandlers: Set<StatusHandler> = new Set();

  constructor(config?: Partial<AudioConfig>) {
    this.config = {
      sampleRate: 16000, // 服务端配置的采样率
      channels: 1, // 单声道
      bitDepth: 16, // 16位深度
      bufferSize: 4096,
      ...config,
    };
  }

  /**
   * 初始化录音
   */
  public async init(): Promise<void> {
    try {
      // 获取麦克风权限
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: this.config.channels,
          sampleRate: this.config.sampleRate,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      // 创建高性能 Opus 编码器
      this.opusEncoder = new FastOpusEncoder({
        sampleRate: this.config.sampleRate,
        channels: this.config.channels,
        frameSize: 960, // 60ms @ 16kHz
        application: "voip", // VOIP
        bitrate: 24000,
        complexity: 10,
      });

      await this.opusEncoder.init(this.mediaStream);

      // 设置数据回调
      this.opusEncoder.onData((data) => {
        if (this.status === RecordingStatus.RECORDING) {
          this.notifyAudioDataHandlers(data);
        }
      });

      console.log("[AudioRecorder] 高性能 Opus 编码器初始化成功");
    } catch (error) {
      console.error("[AudioRecorder] 初始化失败:", error);
      throw error;
    }
  }

  /**
   * 开始录音
   */
  public async start(): Promise<void> {
    if (this.status === RecordingStatus.RECORDING) {
      console.warn("[AudioRecorder] 已在录音中");
      return;
    }

    if (!this.opusEncoder) {
      await this.init();
    }

    this.opusEncoder?.start();
    this.updateStatus(RecordingStatus.RECORDING);
    console.log("[AudioRecorder] 开始录音");
  }

  /**
   * 停止录音
   */
  public stop(): void {
    if (this.status !== RecordingStatus.RECORDING && this.status !== RecordingStatus.PAUSED) {
      return;
    }

    this.opusEncoder?.stop();
    this.updateStatus(RecordingStatus.IDLE);
    console.log("[AudioRecorder] 停止录音");
  }

  /**
   * 暂停录音
   */
  public pause(): void {
    if (this.status !== RecordingStatus.RECORDING) {
      return;
    }

    this.opusEncoder?.pause();
    this.updateStatus(RecordingStatus.PAUSED);
    console.log("[AudioRecorder] 暂停录音");
  }

  /**
   * 恢复录音
   */
  public async resume(): Promise<void> {
    if (this.status !== RecordingStatus.PAUSED) {
      return;
    }

    this.opusEncoder?.resume();
    this.updateStatus(RecordingStatus.RECORDING);
    console.log("[AudioRecorder] 恢复录音");
  }

  /**
   * 销毁录音器
   */
  public destroy(): void {
    this.stop();

    if (this.opusEncoder) {
      this.opusEncoder.destroy();
      this.opusEncoder = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }

    this.audioDataHandlers.clear();
    this.statusHandlers.clear();
    console.log("[AudioRecorder] 已销毁");
  }

  /**
   * 添加音频数据处理器
   */
  public onAudioData(handler: AudioDataHandler): void {
    this.audioDataHandlers.add(handler);
  }

  /**
   * 移除音频数据处理器
   */
  public offAudioData(handler: AudioDataHandler): void {
    this.audioDataHandlers.delete(handler);
  }

  /**
   * 添加状态变化处理器
   */
  public onStatusChange(handler: StatusHandler): void {
    this.statusHandlers.add(handler);
  }

  /**
   * 移除状态变化处理器
   */
  public offStatusChange(handler: StatusHandler): void {
    this.statusHandlers.delete(handler);
  }

  /**
   * 获取当前录音状态
   */
  public getStatus(): RecordingStatus {
    return this.status;
  }

  private notifyAudioDataHandlers(audioData: ArrayBuffer): void {
    this.audioDataHandlers.forEach((handler) => {
      try {
        handler(audioData);
      } catch (error) {
        console.error("[AudioRecorder] 音频数据处理器执行失败:", error);
      }
    });
  }

  private updateStatus(status: RecordingStatus): void {
    this.status = status;
    this.statusHandlers.forEach((handler) => {
      try {
        handler(status);
      } catch (error) {
        console.error("[AudioRecorder] 状态处理器执行失败:", error);
      }
    });
  }
}

export default AudioRecorder;
