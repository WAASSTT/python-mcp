import type { BaseTTSProvider, SynthesizeOptions } from "@/types/providers";
import type { Logger } from "@/utils/logger";

export abstract class TTSProvider implements BaseTTSProvider {
  protected config: any;
  protected logger: Logger;

  constructor(config: any, logger: Logger) {
    this.config = config;
    this.logger = logger;
  }

  abstract synthesize(text: string, options?: SynthesizeOptions): Promise<Buffer>;
  abstract synthesizeStream(
    text: string,
    options?: SynthesizeOptions,
  ): AsyncIterableIterator<Buffer>;

  protected mergeOptions(options?: SynthesizeOptions): any {
    return {
      voice: this.config.voice || "alloy",
      speed: this.config.speed || 1.0,
      format: this.config.format || "mp3",
      ...options,
    };
  }
}
