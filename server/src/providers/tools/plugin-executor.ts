import type { PluginManager as BasePluginManager, Plugin } from "@/plugins/plugin-manager";
import type { Logger } from "@/utils/logger";
import type {
  ActionResponse,
  FunctionItem,
  ToolContext,
  ToolDefinition,
  ToolExecutor,
} from "./base";
import { Action, ToolType } from "./base";
import { FunctionRegistry, createFunctionRegistry } from "./registry";

/**
 * 服务端插件执行器
 * 整合 FunctionRegistry 和 PluginManager
 */
export class ServerPluginExecutor implements ToolExecutor {
  readonly type = ToolType.SERVER_PLUGIN;
  private logger: Logger;
  private registry: FunctionRegistry;
  private pluginManager?: BasePluginManager;

  constructor(logger: Logger, pluginManager?: BasePluginManager) {
    this.logger = logger;
    this.registry = createFunctionRegistry(logger);
    this.pluginManager = pluginManager;
  }

  /**
   * 设置插件管理器
   */
  setPluginManager(pluginManager: BasePluginManager): void {
    this.pluginManager = pluginManager;
    this.logger.debug("Plugin manager attached to executor");
  }

  /**
   * 注册函数
   */
  registerFunction(item: FunctionItem): void {
    this.registry.register(item);
  }

  /**
   * 注册插件（转换为函数项）
   */
  registerPlugin(plugin: Plugin): void {
    const functionItem: FunctionItem = {
      name: plugin.name,
      description: {
        type: "function",
        function: {
          name: plugin.name,
          description: plugin.description,
          parameters: plugin.parameters || { type: "object", properties: {} },
        },
      },
      handler: async (_context, params) => {
        const result = await plugin.execute(params);
        if (result.success) {
          return {
            action: result.data?.shouldExit ? Action.BREAK : Action.CONTINUE,
            response: JSON.stringify(result.data),
            data: result.data,
            shouldExit: result.data?.shouldExit,
            updatePrompt: result.data?.systemPrompt,
          };
        }
        return {
          action: Action.ERROR,
          response: result.error || "Plugin execution failed",
        };
      },
      type: ToolType.SERVER_PLUGIN,
    };

    this.registry.register(functionItem);
    this.logger.debug(`Registered plugin as function: ${plugin.name}`);
  }

  /**
   * 从插件管理器加载所有插件
   */
  loadPluginsFromManager(): void {
    if (!this.pluginManager) {
      this.logger.warn("No plugin manager attached");
      return;
    }

    const plugins = this.pluginManager.list();
    for (const plugin of plugins) {
      this.registerPlugin(plugin);
    }
    this.logger.info(`Loaded ${plugins.length} plugins from manager`);
  }

  /**
   * 获取所有工具定义
   */
  async getTools(): Promise<Record<string, ToolDefinition>> {
    // 合并 registry 中的函数
    const tools = this.registry.toToolDefinitions();

    // 如果有 pluginManager 但函数未加载，则加载
    if (this.pluginManager) {
      const plugins = this.pluginManager.list();
      for (const plugin of plugins) {
        if (!tools[plugin.name]) {
          tools[plugin.name] = {
            name: plugin.name,
            toolType: ToolType.SERVER_PLUGIN,
            description: {
              type: "function",
              function: {
                name: plugin.name,
                description: plugin.description,
                parameters: plugin.parameters || { type: "object", properties: {} },
              },
            },
          };
        }
      }
    }

    return tools;
  }

  /**
   * 执行工具调用
   */
  async execute(
    context: ToolContext,
    toolName: string,
    params: Record<string, any>,
  ): Promise<ActionResponse> {
    // 优先从 registry 执行
    if (this.registry.has(toolName)) {
      return this.registry.execute(context, toolName, params);
    }

    // 其次从 pluginManager 执行
    if (this.pluginManager?.has(toolName)) {
      try {
        const result = await this.pluginManager.execute(toolName, params);

        if (result.success) {
          return {
            action: result.data?.shouldExit ? Action.BREAK : Action.CONTINUE,
            response: JSON.stringify(result.data),
            data: result.data,
            shouldExit: result.data?.shouldExit,
            updatePrompt: result.data?.systemPrompt,
          };
        }

        return {
          action: Action.ERROR,
          response: result.error || "Plugin execution failed",
        };
      } catch (error) {
        this.logger.error(`Plugin ${toolName} execution error: ${error}`);
        return {
          action: Action.ERROR,
          response: `Plugin execution failed: ${error instanceof Error ? error.message : String(error)}`,
        };
      }
    }

    return {
      action: Action.NOTFOUND,
      response: `Tool ${toolName} not found`,
    };
  }

  /**
   * 获取注册的函数数量
   */
  get functionCount(): number {
    return this.registry.size;
  }

  /**
   * 获取注册的插件数量
   */
  get pluginCount(): number {
    return this.pluginManager?.count() || 0;
  }
}

// IoTDeviceExecutor 已移除 - 纯软件版本不需要 IoT 设备控制

/**
 * 系统控制执行器
 */
export class SystemControlExecutor implements ToolExecutor {
  readonly type = ToolType.SYSTEM_CTL;
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  async getTools(): Promise<Record<string, ToolDefinition>> {
    return {
      exit_conversation: {
        name: "exit_conversation",
        toolType: ToolType.SYSTEM_CTL,
        description: {
          type: "function",
          function: {
            name: "exit_conversation",
            description: "结束当前对话，关闭连接",
            parameters: { type: "object", properties: {} },
          },
        },
      },
      change_language: {
        name: "change_language",
        toolType: ToolType.SYSTEM_CTL,
        description: {
          type: "function",
          function: {
            name: "change_language",
            description: "切换对话语言",
            parameters: {
              type: "object",
              properties: {
                language: {
                  type: "string",
                  description: "目标语言代码，如 zh, en, ja",
                },
              },
              required: ["language"],
            },
          },
        },
      },
    };
  }

  async execute(
    context: ToolContext,
    toolName: string,
    params: Record<string, any>,
  ): Promise<ActionResponse> {
    switch (toolName) {
      case "exit_conversation":
        return {
          action: Action.BREAK,
          response: "好的，再见！有需要随时叫我~",
          shouldExit: true,
        };

      case "change_language":
        const language = params.language || "zh";
        return {
          action: Action.CONTINUE,
          response: `已切换到 ${language} 语言`,
          data: { language },
        };

      default:
        return {
          action: Action.NOTFOUND,
          response: `System control ${toolName} not found`,
        };
    }
  }
}

/**
 * 创建并配置默认的执行器（纯软件版本）
 */
export function createDefaultExecutors(
  logger: Logger,
  pluginManager?: BasePluginManager,
): {
  serverPlugin: ServerPluginExecutor;
  systemControl: SystemControlExecutor;
} {
  const serverPlugin = new ServerPluginExecutor(logger, pluginManager);
  const systemControl = new SystemControlExecutor(logger);

  return {
    serverPlugin,
    systemControl,
  };
}
