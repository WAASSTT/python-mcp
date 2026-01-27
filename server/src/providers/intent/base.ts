import type { BaseIntentProvider, Intent } from "@/types/providers";
import type { Logger } from "@/utils/logger";

export abstract class IntentProvider implements BaseIntentProvider {
  protected config: any;
  protected logger: Logger;

  constructor(config: any, logger: Logger) {
    this.config = config;
    this.logger = logger;
  }

  abstract recognize(text: string): Promise<Intent>;

  batchRecognize?(texts: string[]): Promise<Intent[]>;

  protected createIntent(
    intent: string,
    confidence: number,
    entities?: Record<string, any>,
  ): Intent {
    return {
      intent,
      confidence,
      entities,
    };
  }
}
