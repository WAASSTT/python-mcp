import type { BaseVADProvider, VADContext, VADProviderConfig, VADResult } from "@/types/vad";
import type { Logger } from "@/utils/logger";

// Re-export types for use in subclasses
export type { VADProviderConfig as VADConfig, VADResult };

/**
 * VAD Provider 基类
 */
export abstract class VADProvider implements BaseVADProvider {
  protected config: VADProviderConfig;
  protected logger: Logger;

  // VAD 参数
  protected threshold: number;
  protected thresholdLow: number;
  protected silenceThresholdMs: number;
  protected frameWindowThreshold: number;

  constructor(config: VADProviderConfig, logger: Logger) {
    this.config = config;
    this.logger = logger;

    // 初始化参数 (双阈值检测)
    this.threshold = config.threshold ?? 0.5;
    this.thresholdLow = config.threshold_low ?? 0.2;
    this.silenceThresholdMs = config.min_silence_duration_ms ?? 1000;
    this.frameWindowThreshold = 3; // 至少要多少帧才算有语音
  }

  /**
   * 检测是否有语音活动
   */
  abstract isVAD(audioData: Uint8Array, context: VADContext): Promise<VADResult>;

  /**
   * 重置 VAD 状态
   */
  reset(): void {
    // 子类可以覆盖
  }

  /**
   * 销毁实例
   */
  destroy(): void {
    // 子类可以覆盖
  }

  /**
   * 双阈值判断
   * @param probability 语音概率
   * @param lastIsVoice 上一次是否有语音
   */
  protected applyDualThreshold(probability: number, lastIsVoice: boolean): boolean {
    if (probability >= this.threshold) {
      return true;
    } else if (probability <= this.thresholdLow) {
      return false;
    } else {
      // 在两个阈值之间，保持上一次的状态
      return lastIsVoice;
    }
  }

  /**
   * 更新滑动窗口并判断是否有语音
   * @param context VAD 上下文
   * @param isVoice 当前帧是否有语音
   */
  protected updateVoiceWindow(context: VADContext, isVoice: boolean): boolean {
    // 更新滑动窗口 (保持最近5帧)
    context.voiceWindow.push(isVoice);
    if (context.voiceWindow.length > 5) {
      context.voiceWindow.shift();
    }

    // 统计有语音的帧数
    const voiceCount = context.voiceWindow.filter((v) => v).length;
    return voiceCount >= this.frameWindowThreshold;
  }

  /**
   * 检查语音是否停止
   * @param context VAD 上下文
   * @param hasVoice 当前是否有语音
   */
  protected checkVoiceStopped(context: VADContext, hasVoice: boolean): boolean {
    const now = Date.now();

    // 如果之前有声音，但本次没有声音
    if (context.hasVoice && !hasVoice) {
      const stopDuration = now - context.lastActivityTime;
      if (stopDuration >= this.silenceThresholdMs) {
        return true;
      }
    }

    // 更新状态
    if (hasVoice) {
      context.hasVoice = true;
      context.lastActivityTime = now;
      if (context.firstActivityTime === 0) {
        context.firstActivityTime = now;
      }
    }

    return false;
  }
}

/**
 * 简单 VAD Provider - 基于能量检测
 * 用于不需要复杂模型的场景
 */
export class SimpleVADProvider extends VADProvider {
  private energyThreshold: number;

  constructor(config: VADProviderConfig, logger: Logger) {
    super(config, logger);
    this.energyThreshold = config.energy_threshold ?? 0.01;
  }

  async isVAD(audioData: Uint8Array, context: VADContext): Promise<VADResult> {
    // 手动模式: 直接返回有语音
    if (context.listenMode === "manual") {
      return { hasVoice: true };
    }

    try {
      // 简单的能量检测
      const energy = this.calculateEnergy(audioData);
      const probability = Math.min(energy / this.energyThreshold, 1);

      // 双阈值判断
      const isVoice = this.applyDualThreshold(probability, context.lastIsVoice);
      context.lastIsVoice = isVoice;

      // 更新滑动窗口
      const hasVoice = this.updateVoiceWindow(context, isVoice);

      // 检查语音是否停止
      const voiceStopped = this.checkVoiceStopped(context, hasVoice);
      context.voiceStopped = voiceStopped;

      return {
        hasVoice,
        probability,
        voiceStopped,
        firstActivityTime: context.firstActivityTime,
        lastActivityTime: context.lastActivityTime,
      };
    } catch (error) {
      this.logger.error({ err: error }, "VAD detection error");
      return { hasVoice: false };
    }
  }

  /**
   * 计算音频能量
   */
  private calculateEnergy(audioData: Uint8Array): number {
    if (audioData.length === 0) return 0;

    // 假设是 16-bit PCM
    let sum = 0;
    for (let i = 0; i < audioData.length - 1; i += 2) {
      // 转换为 16-bit 有符号整数
      const sample = (audioData[i + 1] << 8) | audioData[i];
      const signedSample = sample > 32767 ? sample - 65536 : sample;
      sum += signedSample * signedSample;
    }

    const rms = Math.sqrt(sum / (audioData.length / 2));
    return rms / 32768; // 归一化到 0-1
  }

  reset(): void {
    // 无状态，无需重置
  }

  destroy(): void {
    // 无资源需要释放
  }
}
