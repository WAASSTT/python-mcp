import type { ChatOptions, Message } from "@/types/providers";
import type { Logger } from "@/utils/logger";
import OpenAI from "openai/index.mjs";
import { LLMProvider } from "./base";

export class OpenAILLMProvider extends LLMProvider {
  private client: OpenAI;
  private modelName: string;
  private defaultMaxTokens?: number;
  private defaultTemperature?: number;
  private defaultTopP?: number;
  private defaultFrequencyPenalty?: number;

  constructor(config: any, logger: Logger) {
    super(config, logger);

    this.modelName = config.model_name || config.model || "gpt-3.5-turbo";
    const apiKey = config.api_key || config.apiKey;
    const baseURL = config.base_url || config.baseUrl || config.url;
    const timeout = config.timeout ? parseInt(config.timeout) : 300000;

    this.client = new OpenAI({
      apiKey,
      baseURL,
      timeout,
    });

    // 设置默认参数
    this.defaultMaxTokens = config.max_tokens ? parseInt(config.max_tokens) : undefined;
    this.defaultTemperature = config.temperature ? parseFloat(config.temperature) : undefined;
    this.defaultTopP = config.top_p ? parseFloat(config.top_p) : undefined;
    this.defaultFrequencyPenalty = config.frequency_penalty
      ? parseFloat(config.frequency_penalty)
      : undefined;
  }

  private normalizeMessages(messages: Message[]): Message[] {
    return messages.map((msg) => ({
      ...msg,
      content: msg.content || "",
    }));
  }

  async chat(messages: Message[], options?: ChatOptions): Promise<string> {
    try {
      const normalizedMessages = this.normalizeMessages(messages);

      const requestParams: any = {
        model: this.modelName,
        messages: normalizedMessages,
        stream: false,
      };

      // 添加可选参数
      if (options?.max_tokens !== undefined || this.defaultMaxTokens !== undefined) {
        requestParams.max_tokens = options?.max_tokens ?? this.defaultMaxTokens;
      }
      if (options?.temperature !== undefined || this.defaultTemperature !== undefined) {
        requestParams.temperature = options?.temperature ?? this.defaultTemperature;
      }
      if (options?.top_p !== undefined || this.defaultTopP !== undefined) {
        requestParams.top_p = options?.top_p ?? this.defaultTopP;
      }
      if (options?.frequency_penalty !== undefined || this.defaultFrequencyPenalty !== undefined) {
        requestParams.frequency_penalty =
          options?.frequency_penalty ?? this.defaultFrequencyPenalty;
      }

      const response = await this.client.chat.completions.create(requestParams);

      return response.choices[0]?.message?.content || "";
    } catch (error) {
      this.logger.error(`OpenAI LLM chat failed: ${error}`);
      throw error;
    }
  }

  async *chatStream(messages: Message[], options?: ChatOptions): AsyncIterableIterator<string> {
    try {
      const normalizedMessages = this.normalizeMessages(messages);

      const requestParams: any = {
        model: this.modelName,
        messages: normalizedMessages,
        stream: true,
      };

      // 添加可选参数
      if (options?.max_tokens !== undefined || this.defaultMaxTokens !== undefined) {
        requestParams.max_tokens = options?.max_tokens ?? this.defaultMaxTokens;
      }
      if (options?.temperature !== undefined || this.defaultTemperature !== undefined) {
        requestParams.temperature = options?.temperature ?? this.defaultTemperature;
      }
      if (options?.top_p !== undefined || this.defaultTopP !== undefined) {
        requestParams.top_p = options?.top_p ?? this.defaultTopP;
      }
      if (options?.frequency_penalty !== undefined || this.defaultFrequencyPenalty !== undefined) {
        requestParams.frequency_penalty =
          options?.frequency_penalty ?? this.defaultFrequencyPenalty;
      }

      const stream = (await this.client.chat.completions.create(
        requestParams,
      )) as unknown as AsyncIterable<any>;

      let isActive = true;
      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta;
        let content = delta?.content || "";

        if (content) {
          // 处理思考标签
          if (content.includes("<think>")) {
            isActive = false;
            content = content.split("<think>")[0];
          }
          if (content.includes("</think>")) {
            isActive = true;
            content = content.split("</think>").pop() || "";
          }

          if (isActive && content) {
            yield content;
          }
        }
      }
    } catch (error) {
      this.logger.error(`OpenAI LLM stream chat failed: ${error}`);
      throw error;
    }
  }

  async *chatStreamWithFunctions(
    messages: Message[],
    functions: any[],
    options?: ChatOptions,
  ): AsyncIterableIterator<{ content?: string; toolCalls?: any[] }> {
    try {
      const normalizedMessages = this.normalizeMessages(messages);

      const requestParams: any = {
        model: this.modelName,
        messages: normalizedMessages,
        stream: true,
        tools: functions,
      };

      // 添加可选参数
      if (options?.max_tokens !== undefined || this.defaultMaxTokens !== undefined) {
        requestParams.max_tokens = options?.max_tokens ?? this.defaultMaxTokens;
      }
      if (options?.temperature !== undefined || this.defaultTemperature !== undefined) {
        requestParams.temperature = options?.temperature ?? this.defaultTemperature;
      }
      if (options?.top_p !== undefined || this.defaultTopP !== undefined) {
        requestParams.top_p = options?.top_p ?? this.defaultTopP;
      }
      if (options?.frequency_penalty !== undefined || this.defaultFrequencyPenalty !== undefined) {
        requestParams.frequency_penalty =
          options?.frequency_penalty ?? this.defaultFrequencyPenalty;
      }

      const stream = (await this.client.chat.completions.create(
        requestParams,
      )) as unknown as AsyncIterable<any>;

      for await (const chunk of stream) {
        if (chunk.choices?.[0]) {
          const delta = chunk.choices[0].delta;
          const content = delta.content || undefined;
          const toolCalls = delta.tool_calls || undefined;

          yield { content, toolCalls };
        }

        // 记录 token 使用情况
        if (chunk.usage) {
          this.logger.info(
            `Token usage - Input: ${chunk.usage.prompt_tokens}, ` +
              `Output: ${chunk.usage.completion_tokens}, ` +
              `Total: ${chunk.usage.total_tokens}`,
          );
        }
      }
    } catch (error) {
      this.logger.error(`OpenAI LLM function call streaming failed: ${error}`);
      throw error;
    }
  }
}
