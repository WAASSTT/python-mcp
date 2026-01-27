import type { Intent } from "@/types/providers";
import type { Logger } from "@/utils/logger";
import { IntentProvider } from "../base";

/**
 * No Intent Provider
 * 不使用意图识别，始终返回继续聊天
 */
export class NoIntentProvider extends IntentProvider {
  constructor(config: any, logger: Logger) {
    super(config, logger);
    this.logger.info("NoIntent provider initialized");
  }

  async recognize(_text: string): Promise<Intent> {
    this.logger.debug("Using NoIntentProvider, always returning continue chat");
    return this.createIntent("continue_chat", 1.0, {
      function_call: { name: "continue_chat" },
    });
  }
}
