/**
 * OpenAI 适配器
 * 支持 OpenAI API 和兼容接口（如 ChatGLM、阿里通义等）
 */

import OpenAI from "openai";
import type { ChatResponse, Message, ModelConfig, StreamChunk } from "../model-base";
import { ModelBase } from "../model-base";

// ============= OpenAI 适配器 =============

/** OpenAI 模型适配器 */
export class OpenAIAdapter extends ModelBase {
  private client: OpenAI;

  constructor(config: ModelConfig) {
    super(config);
    this.validateConfig();

    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseUrl,
    });
  }

  /** 提供商名称 */
  get providerName(): string {
    return "OpenAI";
  }

  /** 模型名称 */
  get modelName(): string {
    return this.config.model;
  }

  /** 非流式聊天 */
  async chat(messages: Message[]): Promise<ChatResponse> {
    const response = await this.client.chat.completions.create({
      model: this.config.model,
      messages: this.formatMessages(messages),
      temperature: this.config.temperature ?? 0.7,
      max_tokens: this.config.maxTokens ?? 2000,
      top_p: this.config.topP ?? 1,
      stream: false,
    });

    const choice = response.choices[0];
    return {
      content: choice.message.content || "",
      finishReason: choice.finish_reason as "stop" | "length",
      usage: response.usage
        ? {
            promptTokens: response.usage.prompt_tokens,
            completionTokens: response.usage.completion_tokens,
            totalTokens: response.usage.total_tokens,
          }
        : undefined,
    };
  }

  /** 流式聊天 */
  async *chatStream(messages: Message[]): AsyncGenerator<StreamChunk> {
    const stream = await this.client.chat.completions.create({
      model: this.config.model,
      messages: this.formatMessages(messages),
      temperature: this.config.temperature ?? 0.7,
      max_tokens: this.config.maxTokens ?? 2000,
      top_p: this.config.topP ?? 1,
      stream: true,
    });

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta;
      const finishReason = chunk.choices[0]?.finish_reason;

      if (delta?.content) {
        yield {
          content: delta.content,
          done: false,
        };
      }

      if (finishReason) {
        yield {
          content: "",
          done: true,
          finishReason: finishReason as "stop" | "length",
        };
      }
    }
  }

  /** 格式化消息 */
  protected formatMessages(messages: Message[]) {
    return messages.map((msg) => {
      // 处理函数调用角色，转换为 assistant 角色
      if (msg.role === "function") {
        return {
          role: "assistant" as const,
          content: msg.content,
          ...(msg.name && { name: msg.name }),
          ...(msg.functionCall && { function_call: msg.functionCall }),
        };
      }

      return {
        role: msg.role as "system" | "user" | "assistant",
        content: msg.content,
        ...(msg.name && { name: msg.name }),
        ...(msg.functionCall && { function_call: msg.functionCall }),
      };
    });
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

// ============= 特定提供商的适配器 =============

/** ChatGLM 适配器 */
export class ChatGLMAdapter extends OpenAIAdapter {
  get providerName(): string {
    return "ChatGLM";
  }
}

/** 阿里通义适配器 */
export class AliQwenAdapter extends OpenAIAdapter {
  get providerName(): string {
    return "Ali Qwen";
  }
}

/** 豆包适配器 */
export class DoubaoAdapter extends OpenAIAdapter {
  get providerName(): string {
    return "Doubao";
  }
}

/** 自定义 OpenAI 兼容适配器 */
export class CustomOpenAIAdapter extends OpenAIAdapter {
  constructor(
    config: ModelConfig,
    private customName: string = "Custom",
  ) {
    super(config);
  }

  get providerName(): string {
    return this.customName;
  }
}

// ============= 导出 =============

export default OpenAIAdapter;
