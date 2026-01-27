/**
 * 插件执行结果
 */
export interface PluginResult {
  success: boolean;
  data?: any;
  error?: string;
}

/**
 * 插件接口
 */
export interface Plugin {
  name: string;
  description: string;
  parameters?: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
  execute(params: any): Promise<PluginResult>;
}

/**
 * 插件管理器
 * 负责注册和执行插件
 */
export class PluginManager {
  private plugins: Map<string, Plugin> = new Map();

  /**
   * 注册插件
   */
  register(plugin: Plugin): void {
    if (this.plugins.has(plugin.name)) {
      console.warn(`[PluginManager] 插件 ${plugin.name} 已存在，将被覆盖`);
    }
    this.plugins.set(plugin.name, plugin);
    console.log(`[PluginManager] 注册插件: ${plugin.name}`);
  }

  /**
   * 批量注册插件
   */
  registerMany(plugins: Plugin[]): void {
    plugins.forEach(plugin => this.register(plugin));
  }

  /**
   * 注销插件
   */
  unregister(name: string): boolean {
    return this.plugins.delete(name);
  }

  /**
   * 执行插件
   */
  async execute(name: string, params: any = {}): Promise<PluginResult> {
    const plugin = this.plugins.get(name);

    if (!plugin) {
      return {
        success: false,
        error: `插件 ${name} 不存在`,
      };
    }

    try {
      console.log(`[PluginManager] 执行插件: ${name}`, params);
      const result = await plugin.execute(params);
      return result;
    } catch (error) {
      console.error(`[PluginManager] 插件执行失败: ${name}`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误',
      };
    }
  }

  /**
   * 获取插件列表
   */
  list(): Plugin[] {
    return Array.from(this.plugins.values());
  }

  /**
   * 获取插件
   */
  get(name: string): Plugin | undefined {
    return this.plugins.get(name);
  }

  /**
   * 检查插件是否存在
   */
  has(name: string): boolean {
    return this.plugins.has(name);
  }

  /**
   * 获取插件数量
   */
  count(): number {
    return this.plugins.size;
  }

  /**
   * 获取 LLM 工具定义格式
   */
  getToolDefinitions(): any[] {
    return Array.from(this.plugins.values()).map(plugin => ({
      type: 'function',
      function: {
        name: plugin.name,
        description: plugin.description,
        parameters: plugin.parameters || {
          type: 'object',
          properties: {},
        },
      },
    }));
  }

  /**
   * 从工具调用执行插件
   */
  async executeFromToolCall(toolCall: {
    id: string;
    function: { name: string; arguments: string };
  }): Promise<{ id: string; result: PluginResult }> {
    let params: any = {};

    try {
      params = JSON.parse(toolCall.function.arguments);
    } catch (error) {
      console.error('[PluginManager] 解析工具参数失败:', error);
    }

    const result = await this.execute(toolCall.function.name, params);

    return {
      id: toolCall.id,
      result,
    };
  }

  /**
   * 清空所有插件
   */
  clear(): void {
    this.plugins.clear();
  }
}

/**
 * 创建插件管理器
 */
export function createPluginManager(): PluginManager {
  return new PluginManager();
}
