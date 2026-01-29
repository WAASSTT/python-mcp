/**
 * 模型类型定义
 */

// ============= 导出模型相关类型 =============

export type {
  ChatResponse,
  Message,
  MessageRole,
  ModelConfig,
  StreamChunk,
} from "../models/model-base";

export type { ModelProvider } from "../models/model-factory";

// ============= 模型元数据 =============

export interface ModelMetadata {
  provider: string;
  model: string;
  version?: string;
  capabilities: {
    streaming: boolean;
    functionCalling: boolean;
    vision: boolean;
  };
  limits: {
    maxTokens: number;
    maxContextLength: number;
  };
  pricing?: {
    input: number; // per 1M tokens
    output: number; // per 1M tokens
  };
}

// ============= 模型统计 =============

export interface ModelStats {
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
  totalTokens: number;
  avgResponseTime: number;
  lastUsed: number;
}

// ============= 导出 =============

export type { ModelMetadata, ModelStats };
