/**
 * VAD (Voice Activity Detection) 相关类型定义
 */

/**
 * VAD Provider 配置
 */
export interface VADProviderConfig {
  type: string;
  threshold?: number;
  threshold_low?: number;
  min_silence_duration_ms?: number;
  model_dir?: string;
  [key: string]: any;
}

/**
 * VAD 检测结果
 */
export interface VADResult {
  /** 是否检测到语音活动 */
  hasVoice: boolean;
  /** 语音概率 (0-1) */
  probability?: number;
  /** 是否语音停止 */
  voiceStopped?: boolean;
  /** 首次检测到语音的时间戳 */
  firstActivityTime?: number;
  /** 最后一次活动时间戳 */
  lastActivityTime?: number;
}

/**
 * VAD Provider 基础接口
 */
export interface BaseVADProvider {
  /**
   * 检测音频数据中是否有语音活动
   * @param audioData 音频数据 (Opus 编码或 PCM)
   * @param context 连接上下文
   */
  isVAD(audioData: Uint8Array, context: VADContext): Promise<VADResult>;

  /**
   * 重置 VAD 状态
   */
  reset(): void;

  /**
   * 销毁 VAD 实例
   */
  destroy(): void;
}

/**
 * VAD 上下文 - 保存每个连接的 VAD 状态
 */
export interface VADContext {
  /** 音频缓冲区 */
  audioBuffer: Uint8Array[];
  /** 是否有语音 */
  hasVoice: boolean;
  /** 语音窗口 (用于滑动窗口检测) */
  voiceWindow: boolean[];
  /** 首次活动时间 */
  firstActivityTime: number;
  /** 最后活动时间 */
  lastActivityTime: number;
  /** 语音是否停止 */
  voiceStopped: boolean;
  /** 上一次是否有语音 */
  lastIsVoice: boolean;
  /** 监听模式: auto | manual */
  listenMode: "auto" | "manual";
}

/**
 * 创建默认 VAD 上下文
 */
export function createVADContext(): VADContext {
  return {
    audioBuffer: [],
    hasVoice: false,
    voiceWindow: [],
    firstActivityTime: 0,
    lastActivityTime: 0,
    voiceStopped: false,
    lastIsVoice: false,
    listenMode: "auto",
  };
}
