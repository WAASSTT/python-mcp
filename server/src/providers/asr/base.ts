import type { BaseASRProvider, TranscribeOptions } from "@/types/providers";
import type { Logger } from "@/utils/logger";

/**
 * ASR Provider 基类
 */
export abstract class ASRProvider implements BaseASRProvider {
  protected config: any;
  protected logger: Logger;

  constructor(config: any, logger: Logger) {
    this.config = config;
    this.logger = logger;
  }

  /**
   * 转录音频
   */
  abstract transcribe(audio: Buffer | Blob, options?: TranscribeOptions): Promise<string>;

  /**
   * 流式转录（可选）
   */
  transcribeStream?(audioStream: AsyncIterableIterator<Buffer>): AsyncIterableIterator<string>;

  /**
   * 合并选项
   */
  protected mergeOptions(options?: TranscribeOptions): any {
    return {
      language: this.config.language || "zh",
      ...options,
    };
  }
}
