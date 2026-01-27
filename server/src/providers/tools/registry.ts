import type { Logger } from "@/utils/logger";
import type {
  ActionResponse,
  FunctionDefinition,
  FunctionItem,
  ToolContext,
  ToolDefinition,
} from "./base";
import { Action, ToolType } from "./base";

/**
 * 全局函数注册表
 * 存储所有通过装饰器注册的函数
 */
const globalFunctionRegistry: Map<string, FunctionItem> = new Map();

/**
 * 函数注册装饰器
 * 用于注册函数到全局注册表
 */
export function registerFunction<T = any>(
  name: string,
  description: string,
  parameters: {
    type: "object";
    properties: Record<string, any>;
    required?: string[];
  },
  type: ToolType = ToolType.SERVER_PLUGIN,
) {
  return function (
    handler: (context: ToolContext, params: T) => Promise<ActionResponse>,
  ): (context: ToolContext, params: T) => Promise<ActionResponse> {
    const functionItem: FunctionItem<T> = {
      name,
      description: {
        type: "function",
        function: {
          name,
          description,
          parameters,
        },
      },
      handler,
      type,
    };

    globalFunctionRegistry.set(name, functionItem);
    console.log(`[FunctionRegistry] 函数 '${name}' 已注册`);

    return handler;
  };
}

/**
 * 简化的函数注册辅助方法
 */
export function defineFunction<T = any>(config: {
  name: string;
  description: string;
  parameters: {
    type: "object";
    properties: Record<string, any>;
    required?: string[];
  };
  type?: ToolType;
  handler: (context: ToolContext, params: T) => Promise<ActionResponse>;
}): FunctionItem<T> {
  const item: FunctionItem<T> = {
    name: config.name,
    description: {
      type: "function",
      function: {
        name: config.name,
        description: config.description,
        parameters: config.parameters,
      },
    },
    handler: config.handler,
    type: config.type || ToolType.SERVER_PLUGIN,
  };

  globalFunctionRegistry.set(config.name, item);
  return item;
}

/**
 * 获取全局注册的所有函数
 */
export function getGlobalFunctions(): Map<string, FunctionItem> {
  return globalFunctionRegistry;
}

/**
 * 函数注册表类
 * 管理会话级别的函数注册
 */
export class FunctionRegistry {
  private functions: Map<string, FunctionItem>;
  private logger?: Logger;

  constructor(logger?: Logger) {
    this.functions = new Map();
    this.logger = logger;
  }

  /**
   * 从全局注册表加载所有函数
   */
  loadFromGlobal(): void {
    for (const [name, item] of globalFunctionRegistry.entries()) {
      this.functions.set(name, item);
    }
    this.logger?.debug(`从全局注册表加载了 ${this.functions.size} 个函数`);
  }

  /**
   * 注册函数
   */
  register<T = any>(item: FunctionItem<T>): void {
    this.functions.set(item.name, item);
    this.logger?.debug(`注册函数: ${item.name}`);
  }

  /**
   * 批量注册函数
   */
  registerMany(items: FunctionItem[]): void {
    for (const item of items) {
      this.register(item);
    }
  }

  /**
   * 注销函数
   */
  unregister(name: string): boolean {
    const result = this.functions.delete(name);
    if (result) {
      this.logger?.debug(`注销函数: ${name}`);
    }
    return result;
  }

  /**
   * 获取函数
   */
  get(name: string): FunctionItem | undefined {
    return this.functions.get(name);
  }

  /**
   * 检查函数是否存在
   */
  has(name: string): boolean {
    return this.functions.has(name);
  }

  /**
   * 获取所有函数
   */
  getAll(): Map<string, FunctionItem> {
    return this.functions;
  }

  /**
   * 获取所有函数描述（OpenAI 格式）
   */
  getAllDescriptions(): FunctionDefinition[] {
    return Array.from(this.functions.values()).map((item) => item.description);
  }

  /**
   * 转换为工具定义
   */
  toToolDefinitions(): Record<string, ToolDefinition> {
    const tools: Record<string, ToolDefinition> = {};

    for (const [name, item] of this.functions.entries()) {
      tools[name] = {
        name,
        toolType: item.type,
        description: item.description,
      };
    }

    return tools;
  }

  /**
   * 执行函数
   */
  async execute(
    context: ToolContext,
    name: string,
    params: Record<string, any>,
  ): Promise<ActionResponse> {
    const item = this.functions.get(name);

    if (!item) {
      return {
        action: Action.NOTFOUND,
        response: `函数 ${name} 未找到`,
      };
    }

    try {
      return await item.handler(context, params);
    } catch (error) {
      this.logger?.error(`函数 ${name} 执行失败: ${error}`);
      return {
        action: Action.ERROR,
        response: `函数执行失败: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * 获取函数数量
   */
  get size(): number {
    return this.functions.size;
  }

  /**
   * 按类型筛选函数
   */
  getByType(type: ToolType): FunctionItem[] {
    return Array.from(this.functions.values()).filter((item) => item.type === type);
  }

  /**
   * 清空所有函数
   */
  clear(): void {
    this.functions.clear();
  }
}

// DeviceTypeRegistry 已移除 - 纯软件版本不需要设备管理

/**
 * 创建默认的函数注册表实例
 */
export function createFunctionRegistry(logger?: Logger): FunctionRegistry {
  const registry = new FunctionRegistry(logger);
  registry.loadFromGlobal();
  return registry;
}
