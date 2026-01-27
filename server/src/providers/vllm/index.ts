// VLLM (Vision Language Model) Providers
export * from "./base";
export * from "./openai";

import type { Logger } from "@/utils/logger";
import { VLLMProvider } from "./base";
import { OpenAIVLLMProvider } from "./openai";

/**
 * VLLM Provider Factory
 */
export function createVLLMProvider(type: string, config: any, logger: Logger): VLLMProvider {
  switch (type.toLowerCase()) {
    case "xunfei":
    case "xunfeispark":
    case "xunfeisparkllm":
    case "openai":
    case "gpt-4-vision":
    case "gpt-4o":
      return new OpenAIVLLMProvider(config, logger);
    default:
      throw new Error(`Unknown VLLM provider type: ${type}`);
  }
}
