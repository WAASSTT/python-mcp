/**
 * 模型基类
 * 定义所有模型适配器的统一接口
 */

// ============= 类型定义 =============

/** 消息角色 */
export type MessageRole = "system" | "user" | "assistant" | "function";

/** 消息接口 */
export interface Message {
  role: MessageRole;
  content: string;
  name?: string;
  functionCall?: {
    name: string;
    arguments: string;
  };
}

/** 模型配置 */
export interface ModelConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  stream?: boolean;
}

/** 聊天响应 */
export interface ChatResponse {
  content: string;
  finishReason?: "stop" | "length" | "function_call";
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

/** 流式聊天响应 */
export interface StreamChunk {
  content: string;
  done: boolean;
  finishReason?: "stop" | "length" | "function_call";
}

// ============= 模型基类 =============

/** 模型适配器抽象基类 */
export abstract class ModelBase {
  constructor(protected config: ModelConfig) {}

  /** 聊天接口 - 非流式 */
  abstract chat(messages: Message[]): Promise<ChatResponse>;

  /** 聊天接口 - 流式 */
  abstract chatStream(messages: Message[]): AsyncGenerator<StreamChunk>;

  /** 获取模型名称 */
  get modelName(): string {
    return this.config.model;
  }

  /** 获取提供商名称 */
  abstract get providerName(): string;

  /** 验证配置 */
  protected validateConfig(): void {
    if (!this.config.apiKey) {
      throw new Error(`API key is required for ${this.providerName}`);
    }
    if (!this.config.model) {
      throw new Error(`Model name is required for ${this.providerName}`);
    }
  }

  /** 格式化消息（供子类覆盖） */
  protected formatMessages(messages: Message[]): unknown {
    return messages;
  }
}

// ============= 工具函数 =============

/** 创建系统消息 */
export const createSystemMessage = (content: string): Message => ({
  role: "system",
  content,
});

/** 创建用户消息 */
export const createUserMessage = (content: string, name?: string): Message => ({
  role: "user",
  content,
  name,
});

/** 创建助手消息 */
export const createAssistantMessage = (content: string): Message => ({
  role: "assistant",
  content,
});

/** 创建函数调用消息 */
export const createFunctionMessage = (name: string, args: Record<string, unknown>): Message => ({
  role: "assistant",
  content: "",
  functionCall: {
    name,
    arguments: JSON.stringify(args),
  },
});

/** 计算消息 token 数量（粗略估计） */
export const estimateTokens = (messages: Message[]): number => {
  return messages.reduce((total, msg) => {
    // 粗略估计：中文 ~1.5 字符/token，英文 ~4 字符/token
    const length = msg.content.length;
    const chineseChars = (msg.content.match(/[\u4e00-\u9fa5]/g) || []).length;
    const englishChars = length - chineseChars;
    return total + Math.ceil(chineseChars / 1.5 + englishChars / 4);
  }, 0);
};
