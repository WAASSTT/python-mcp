/**
 * Anthropic 适配器
 * 支持 Claude 系列模型
 */

import Anthropic from "@anthropic-ai/sdk";
import type { ChatResponse, Message, ModelConfig, StreamChunk } from "../model-base";
import { ModelBase } from "../model-base";

// ============= Anthropic 适配器 =============

/** Anthropic 模型适配器 */
export class AnthropicAdapter extends ModelBase {
  private client: Anthropic;

  constructor(config: ModelConfig) {
    super(config);
    this.validateConfig();

    this.client = new Anthropic({
      apiKey: config.apiKey,
      ...(config.baseUrl && { baseURL: config.baseUrl }),
    });
  }

  /** 提供商名称 */
  get providerName(): string {
    return "Anthropic";
  }

  /** 模型名称 */
  get modelName(): string {
    return this.config.model;
  }

  /** 非流式聊天 */
  async chat(messages: Message[]): Promise<ChatResponse> {
    const { systemPrompt, userMessages } = this.formatMessages(messages);

    const response = await this.client.messages.create({
      model: this.config.model,
      max_tokens: this.config.maxTokens ?? 2000,
      temperature: this.config.temperature ?? 0.7,
      ...(systemPrompt && { system: systemPrompt }),
      messages: userMessages,
    });

    const content = response.content[0];
    return {
      content: content.type === "text" ? content.text : "",
      finishReason: response.stop_reason as "stop" | "length",
      usage: {
        promptTokens: response.usage.input_tokens,
        completionTokens: response.usage.output_tokens,
        totalTokens: response.usage.input_tokens + response.usage.output_tokens,
      },
    };
  }

  /** 流式聊天 */
  async *chatStream(messages: Message[]): AsyncGenerator<StreamChunk> {
    const { systemPrompt, userMessages } = this.formatMessages(messages);

    const stream = await this.client.messages.create({
      model: this.config.model,
      max_tokens: this.config.maxTokens ?? 2000,
      temperature: this.config.temperature ?? 0.7,
      ...(systemPrompt && { system: systemPrompt }),
      messages: userMessages,
      stream: true,
    });

    for await (const event of stream) {
      if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
        yield {
          content: event.delta.text,
          done: false,
        };
      }

      if (event.type === "message_stop") {
        yield {
          content: "",
          done: true,
          finishReason: "stop",
        };
      }
    }
  }

  /** 格式化消息 - Anthropic 需要特殊处理 system 消息 */
  protected formatMessages(messages: Message[]) {
    let systemPrompt = "";
    const userMessages: Array<{ role: "user" | "assistant"; content: string }> = [];

    for (const msg of messages) {
      if (msg.role === "system") {
        systemPrompt = msg.content;
      } else if (msg.role === "user" || msg.role === "assistant") {
        userMessages.push({
          role: msg.role,
          content: msg.content,
        });
      }
    }

    return { systemPrompt, userMessages };
  }

  /** 验证配置 */
  protected validateConfig(): void {
    if (!this.config.apiKey) {
      throw new Error(`API key is required for ${this.providerName}`);
    }
    if (!this.config.model) {
      throw new Error(`Model name is required for ${this.providerName}`);
    }
  }
}

// ============= 导出 =============

export default AnthropicAdapter;
