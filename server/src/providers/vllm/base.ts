import type { BaseVLLMProvider, VisionOptions } from "@/types/providers";
import type { Logger } from "@/utils/logger";

export abstract class VLLMProvider implements BaseVLLMProvider {
  protected config: any;
  protected logger: Logger;

  constructor(config: any, logger: Logger) {
    this.config = config;
    this.logger = logger;
  }

  abstract analyze(
    image: string | Buffer,
    prompt: string,
    options?: VisionOptions,
  ): Promise<string>;

  analyzeStream?(
    image: string | Buffer,
    prompt: string,
    options?: VisionOptions,
  ): AsyncIterableIterator<string>;

  protected mergeOptions(options?: VisionOptions): any {
    return {
      max_tokens: this.config.max_tokens || 1000,
      detail: this.config.detail || "auto",
      ...options,
    };
  }

  protected imageToBase64(image: string | Buffer): string {
    if (typeof image === "string") {
      return image;
    }
    return image.toString("base64");
  }
}
