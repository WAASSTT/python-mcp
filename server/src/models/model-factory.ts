/**
 * 模型工厂
 * 负责创建和管理模型实例
 */

import { AnthropicAdapter } from "./adapters/anthropic";
import { GeminiAdapter } from "./adapters/gemini";
import { OpenAIAdapter } from "./adapters/openai";
import type { ModelBase, ModelConfig } from "./model-base";

// ============= 类型定义 =============

/** 支持的模型提供商 */
export type ModelProvider = "openai" | "anthropic" | "gemini" | "custom";

/** 模型适配器构造函数 */
type ModelAdapterConstructor = new (config: ModelConfig) => ModelBase;

// ============= 模型工厂类 =============

/** 模型工厂 */
export class ModelFactory {
  private static adapters = new Map<ModelProvider, ModelAdapterConstructor>();
  private static instances = new Map<string, ModelBase>();

  /** 注册模型适配器 */
  static register(provider: ModelProvider, adapter: ModelAdapterConstructor): void {
    this.adapters.set(provider, adapter);
  }

  /** 创建模型实例 */
  static create(provider: ModelProvider, config: ModelConfig): ModelBase {
    const cacheKey = `${provider}:${config.model}`;

    // 检查缓存
    if (this.instances.has(cacheKey)) {
      return this.instances.get(cacheKey)!;
    }

    // 获取适配器
    const AdapterClass = this.adapters.get(provider);
    if (!AdapterClass) {
      throw new Error(`Unknown model provider: ${provider}`);
    }

    // 创建实例
    const instance = new AdapterClass(config);
    this.instances.set(cacheKey, instance);

    return instance;
  }

  /** 获取已注册的提供商列表 */
  static getProviders(): ModelProvider[] {
    return Array.from(this.adapters.keys());
  }

  /** 清除缓存 */
  static clearCache(): void {
    this.instances.clear();
  }

  /** 移除特定实例 */
  static remove(provider: ModelProvider, model: string): void {
    const cacheKey = `${provider}:${model}`;
    this.instances.delete(cacheKey);
  }
}

// ============= 初始化默认适配器 =============

/** 初始化模型工厂 */
export const initializeModelFactory = () => {
  // 注册内置适配器
  ModelFactory.register("openai", OpenAIAdapter);
  ModelFactory.register("anthropic", AnthropicAdapter);
  ModelFactory.register("gemini", GeminiAdapter);
};

// ============= 便捷函数 =============

/** 创建 OpenAI 兼容模型 */
export const createOpenAIModel = (config: ModelConfig) => ModelFactory.create("openai", config);

/** 创建 Anthropic 模型 */
export const createAnthropicModel = (config: ModelConfig) =>
  ModelFactory.create("anthropic", config);

/** 创建 Gemini 模型 */
export const createGeminiModel = (config: ModelConfig) => ModelFactory.create("gemini", config);

// ============= 导出 =============

export default ModelFactory;
