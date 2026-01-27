import type { Intent } from "@/types/providers";
import type { Logger } from "@/utils/logger";
import { IntentProvider } from "../base";

/**
 * Function Call Intent Provider
 * 始终返回继续聊天的意图
 */
export class FunctionCallProvider extends IntentProvider {
  constructor(config: any, logger: Logger) {
    super(config, logger);
    this.logger.info("FunctionCall Intent provider initialized");
  }

  async recognize(_text: string): Promise<Intent> {
    this.logger.debug("Using FunctionCallProvider, always returning continue chat");
    return this.createIntent("continue_chat", 1.0, {
      function_call: { name: "continue_chat" },
    });
  }
}
