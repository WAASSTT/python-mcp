import type { BaseLLMProvider, ChatOptions, Message } from "@/types/providers";
import type { Logger } from "@/utils/logger";

/**
 * LLM Provider 基类
 */
export abstract class LLMProvider implements BaseLLMProvider {
  protected config: any;
  protected logger: Logger;

  constructor(config: any, logger: Logger) {
    this.config = config;
    this.logger = logger;
  }

  /**
   * 对话
   */
  abstract chat(
    messages: Message[],
    options?: ChatOptions,
  ): Promise<string | AsyncIterableIterator<string>>;

  /**
   * 流式对话
   */
  abstract chatStream(messages: Message[], options?: ChatOptions): AsyncIterableIterator<string>;

  /**
   * 格式化消息
   */
  protected formatMessages(messages: Message[]): any[] {
    return messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
      ...(msg.name && { name: msg.name }),
    }));
  }

  /**
   * 合并选项
   */
  protected mergeOptions(options?: ChatOptions): any {
    return {
      temperature: this.config.temperature || 0.7,
      max_tokens: this.config.max_tokens || 2000,
      ...options,
    };
  }
}
