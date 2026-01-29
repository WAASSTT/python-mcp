/**
 * Gemini 适配器
 * 支持 Google Gemini 系列模型
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import type { ChatResponse, Message, ModelConfig, StreamChunk } from "../model-base";
import { ModelBase } from "../model-base";

// ============= Gemini 适配器 =============

/** Gemini 模型适配器 */
export class GeminiAdapter extends ModelBase {
  private client: GoogleGenerativeAI;

  constructor(config: ModelConfig) {
    super(config);
    this.validateConfig();

    this.client = new GoogleGenerativeAI(config.apiKey);
  }

  /** 提供商名称 */
  get providerName(): string {
    return "Google Gemini";
  }

  /** 模型名称 */
  get modelName(): string {
    return this.config.model;
  }

  /** 非流式聊天 */
  async chat(messages: Message[]): Promise<ChatResponse> {
    const model = this.client.getGenerativeModel({
      model: this.config.model,
    });

    const { systemPrompt, history, lastMessage } = this.formatMessages(messages);

    const chat = model.startChat({
      history,
      ...(systemPrompt && {
        systemInstruction: systemPrompt,
      }),
    });

    const result = await chat.sendMessage(lastMessage);
    const response = result.response;

    return {
      content: response.text(),
      finishReason: "stop",
      usage: response.usageMetadata
        ? {
            promptTokens: response.usageMetadata.promptTokenCount,
            completionTokens: response.usageMetadata.candidatesTokenCount,
            totalTokens: response.usageMetadata.totalTokenCount,
          }
        : undefined,
    };
  }

  /** 流式聊天 */
  async *chatStream(messages: Message[]): AsyncGenerator<StreamChunk> {
    const model = this.client.getGenerativeModel({
      model: this.config.model,
    });

    const { systemPrompt, history, lastMessage } = this.formatMessages(messages);

    const chat = model.startChat({
      history,
      ...(systemPrompt && {
        systemInstruction: systemPrompt,
      }),
    });

    const result = await chat.sendMessageStream(lastMessage);

    for await (const chunk of result.stream) {
      const text = chunk.text();
      if (text) {
        yield {
          content: text,
          done: false,
        };
      }
    }

    yield {
      content: "",
      done: true,
      finishReason: "stop",
    };
  }

  /** 格式化消息 - Gemini 需要特殊的格式 */
  protected formatMessages(messages: Message[]) {
    let systemPrompt = "";
    const history: Array<{ role: "user" | "model"; parts: Array<{ text: string }> }> = [];
    let lastMessage = "";

    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];

      if (msg.role === "system") {
        systemPrompt = msg.content;
      } else if (i === messages.length - 1 && msg.role === "user") {
        // 最后一条用户消息单独处理
        lastMessage = msg.content;
      } else {
        history.push({
          role: msg.role === "assistant" ? "model" : "user",
          parts: [{ text: msg.content }],
        });
      }
    }

    return { systemPrompt, history, lastMessage };
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

export default GeminiAdapter;
