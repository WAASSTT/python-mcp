// LLM Providers index
export { LLMProvider } from "./base";
export { OpenAILLMProvider } from "./openai";

import type { Logger } from "@/utils/logger";
import { LLMProvider } from "./base";
import { OpenAILLMProvider } from "./openai";

/**
 * LLM Provider Factory
 */
export function createLLMProvider(type: string, config: any, logger: Logger): LLMProvider {
  switch (type.toLowerCase()) {
    case "ali":
    case "alillm":
    case "openai":
    case "openai-compatible":
      return new OpenAILLMProvider(config, logger);
    default:
      throw new Error(`Unknown LLM provider type: ${type}`);
  }
}
