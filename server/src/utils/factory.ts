import type { AppConfig, ProviderType } from "@/types/config";
import type {
  BaseASRProvider,
  BaseIntentProvider,
  BaseLLMProvider,
  BaseMemoryProvider,
  BaseTTSProvider,
  BaseVLLMProvider,
} from "@/types/providers";
import type { Logger } from "./logger";

/**
 * Provider 工厂
 * 动态加载和创建各种 AI 服务提供者
 */
export class ProviderFactory {
  private providers: Map<string, any> = new Map();
  private config: AppConfig;
  private logger: Logger;

  constructor(config: AppConfig, logger: Logger) {
    this.config = config;
    this.logger = logger;
  }

  /**
   * 获取 LLM Provider
   */
  async getLLMProvider(name?: string): Promise<BaseLLMProvider> {
    const providerName = name || this.config.llm.default;
    const cacheKey = `llm:${providerName}`;

    if (this.providers.has(cacheKey)) {
      return this.providers.get(cacheKey);
    }

    const providerConfig = this.config.llm.providers[providerName];
    if (!providerConfig) {
      throw new Error(`LLM provider '${providerName}' not found in config`);
    }

    const provider = await this.createProvider("llm", providerConfig.type, providerConfig);
    this.providers.set(cacheKey, provider);

    this.logger.info(`LLM Provider '${providerName}' (${providerConfig.type}) initialized`);
    return provider;
  }

  /**
   * 获取 ASR Provider
   */
  async getASRProvider(name?: string): Promise<BaseASRProvider> {
    const providerName = name || this.config.asr.default;
    const cacheKey = `asr:${providerName}`;

    if (this.providers.has(cacheKey)) {
      return this.providers.get(cacheKey);
    }

    const providerConfig = this.config.asr.providers[providerName];
    if (!providerConfig) {
      throw new Error(`ASR provider '${providerName}' not found in config`);
    }

    const provider = await this.createProvider("asr", providerConfig.type, providerConfig);
    this.providers.set(cacheKey, provider);

    this.logger.info(`ASR Provider '${providerName}' (${providerConfig.type}) initialized`);
    return provider;
  }

  /**
   * 获取 TTS Provider
   */
  async getTTSProvider(name?: string): Promise<BaseTTSProvider> {
    const providerName = name || this.config.tts.default;
    const cacheKey = `tts:${providerName}`;

    if (this.providers.has(cacheKey)) {
      return this.providers.get(cacheKey);
    }

    const providerConfig = this.config.tts.providers[providerName];
    if (!providerConfig) {
      throw new Error(`TTS provider '${providerName}' not found in config`);
    }

    const provider = await this.createProvider("tts", providerConfig.type, providerConfig);
    this.providers.set(cacheKey, provider);

    this.logger.info(`TTS Provider '${providerName}' (${providerConfig.type}) initialized`);
    return provider;
  }

  /**
   * 获取 vLLM Provider
   */
  async getVLLMProvider(name?: string): Promise<BaseVLLMProvider> {
    const providerName = name || this.config.vllm.default;
    const cacheKey = `vllm:${providerName}`;

    if (this.providers.has(cacheKey)) {
      return this.providers.get(cacheKey);
    }

    const providerConfig = this.config.vllm.providers[providerName];
    if (!providerConfig) {
      throw new Error(`vLLM provider '${providerName}' not found in config`);
    }

    const provider = await this.createProvider("vllm", providerConfig.type, providerConfig);
    this.providers.set(cacheKey, provider);

    this.logger.info(`vLLM Provider '${providerName}' (${providerConfig.type}) initialized`);
    return provider;
  }

  /**
   * 获取 Intent Provider
   */
  async getIntentProvider(name?: string): Promise<BaseIntentProvider> {
    const providerName = name || this.config.intent.default;
    const cacheKey = `intent:${providerName}`;

    if (this.providers.has(cacheKey)) {
      return this.providers.get(cacheKey);
    }

    const providerConfig = this.config.intent.providers[providerName];
    if (!providerConfig) {
      throw new Error(`Intent provider '${providerName}' not found in config`);
    }

    const provider = await this.createProvider("intent", providerConfig.type, providerConfig);
    this.providers.set(cacheKey, provider);

    this.logger.info(`Intent Provider '${providerName}' (${providerConfig.type}) initialized`);
    return provider;
  }

  /**
   * 获取 Memory Provider
   */
  async getMemoryProvider(name?: string): Promise<BaseMemoryProvider> {
    const providerName = name || this.config.memory.default;
    const cacheKey = `memory:${providerName}`;

    if (this.providers.has(cacheKey)) {
      return this.providers.get(cacheKey);
    }

    const providerConfig = this.config.memory.providers[providerName];
    if (!providerConfig) {
      throw new Error(`Memory provider '${providerName}' not found in config`);
    }

    const provider = await this.createProvider("memory", providerConfig.type, providerConfig);
    this.providers.set(cacheKey, provider);

    this.logger.info(`Memory Provider '${providerName}' (${providerConfig.type}) initialized`);
    return provider;
  }

  /**
   * 创建 Provider 实例
   */
  private async createProvider(category: ProviderType, type: string, config: any): Promise<any> {
    try {
      // 动态导入对应的 Provider 类
      // 对于有子目录的 provider，直接指定文件名
      const modulePath = this.getModulePath(category, type);
      const module = await import(modulePath);

      // 查找 Provider 类
      const ProviderClass = this.getProviderClass(module, type);

      if (!ProviderClass) {
        throw new Error(`Provider class not found in ${modulePath}`);
      }

      // 创建实例
      return new ProviderClass(config, this.logger);
    } catch (error) {
      this.logger.error(
        { error, type, category },
        `Failed to create ${category} provider '${type}'`,
      );
      throw error;
    }
  }

  /**
   * 获取 Provider 模块路径
   */
  private getModulePath(category: ProviderType, type: string): string {
    // 对于有子目录的 provider，明确指定文件名
    const pathMap: Record<string, string> = {
      "intent/function_call": "@/providers/intent/function_call/function_call",
      "intent/intent_llm": "@/providers/intent/intent_llm/intent_llm",
      "intent/nointent": "@/providers/intent/nointent/nointent",
      "memory/mem0ai": "@/providers/memory/mem0ai/mem0ai",
      "memory/mem_local_short": "@/providers/memory/mem_local_short/mem_local_short",
      "memory/nomem": "@/providers/memory/nomem/nomem",
    };

    const key = `${category}/${type}`;
    return pathMap[key] || `@/providers/${category}/${type}`;
  }

  /**
   * 从模块中获取 Provider 类
   */
  private getProviderClass(module: any, type: string): any {
    // 1. 尝试默认导出
    if (module.default) {
      return module.default;
    }

    // 2. 尝试特定的 Provider 类名映射
    const classNameMap: Record<string, string> = {
      function_call: "FunctionCallProvider",
      intent_llm: "IntentLLMProvider",
      nointent: "NoIntentProvider",
      mem0ai: "Mem0AIProvider",
      mem_local_short: "LocalProvider",
      nomem: "NoMemProvider",
      doubao_stream: "DoubaoStreamASRProvider",
      huoshan_stream: "HuoshanStreamTTSProvider",
      openai: "OpenAILLMProvider",
      silero: "SileroVADProvider",
    };

    const className = classNameMap[type];
    if (className && module[className]) {
      return module[className];
    }

    // 3. 尝试首字母大写的类名
    const capitalizedName = `${this.capitalize(type)}Provider`;
    if (module[capitalizedName]) {
      return module[capitalizedName];
    }

    return null;
  }

  /**
   * 首字母大写
   */
  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * 清除所有缓存的 Providers
   */
  clearCache(): void {
    this.providers.clear();
    this.logger.info("All provider caches cleared");
  }
}
