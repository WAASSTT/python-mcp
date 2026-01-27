// ============================================
// Tools Module - 统一工具管理系统
// ============================================

// 基础类型和接口
export * from "./base";

// 函数注册系统
export {
  createFunctionRegistry,
  defineFunction,
  FunctionRegistry,
  getGlobalFunctions,
  registerFunction,
} from "./registry";

// 工具管理器
export { ToolManager } from "./manager";

// 执行器
export {
  createDefaultExecutors,
  ServerPluginExecutor,
  SystemControlExecutor,
} from "./plugin-executor";

// 内置函数
export {
  builtinFunctions,
  changeRoleFunction,
  continueConversationFunction,
  exitConversationFunction,
  getTimeFunction,
  playMusicFunction,
  resultForContextFunction,
} from "./builtin-functions";

// ============================================
// 工具模块工厂函数
// ============================================

import type { PluginManager } from "@/plugins/plugin-manager";
import type { Logger } from "@/utils/logger";
import { ToolManager } from "./manager";
import { ServerPluginExecutor, SystemControlExecutor } from "./plugin-executor";

/**
 * 工具模块配置
 */
export interface ToolModuleConfig {
  /** 是否启用服务端插件 */
  enableServerPlugins?: boolean;
  /** 是否启用系统控制 */
  enableSystemControl?: boolean;
  /** 插件管理器实例 */
  pluginManager?: PluginManager;
}

/**
 * 工具模块实例
 */
export interface ToolModule {
  manager: ToolManager;
  executors: {
    serverPlugin?: ServerPluginExecutor;
    systemControl?: SystemControlExecutor;
  };
}

/**
 * 创建并配置完整的工具模块
 *
 * @example
 * ```typescript
 * const toolModule = createToolModule(logger, {
 *   enableServerPlugins: true,
 *   pluginManager: myPluginManager,
 * });
 *
 * // 使用工具管理器
 * const tools = await toolModule.manager.getAllTools();
 * const result = await toolModule.manager.executeTool(context, 'get_time', {});
 * ```
 */
export function createToolModule(logger: Logger, config: ToolModuleConfig = {}): ToolModule {
  const { enableServerPlugins = true, enableSystemControl = true, pluginManager } = config;

  // 创建管理器
  const manager = new ToolManager(logger);

  // 创建执行器
  const executors: ToolModule["executors"] = {};

  // 服务端插件执行器
  if (enableServerPlugins) {
    const serverPlugin = new ServerPluginExecutor(logger, pluginManager);
    if (pluginManager) {
      serverPlugin.loadPluginsFromManager();
    }
    manager.registerExecutor(serverPlugin);
    executors.serverPlugin = serverPlugin;
    logger.debug("Server plugin executor registered");
  }

  // 系统控制执行器
  if (enableSystemControl) {
    const systemControl = new SystemControlExecutor(logger);
    manager.registerExecutor(systemControl);
    executors.systemControl = systemControl;
    logger.debug("System control executor registered");
  }

  logger.info(`Tool module initialized with ${Object.keys(executors).length} executors`);

  return { manager, executors };
}

/**
 * 创建 Elysia 插件形式的工具模块
 * 符合 Elysia 最佳实践的模块化设计
 */
import { Elysia } from "elysia";

export const toolsPlugin = (config: { logger: Logger; pluginManager?: PluginManager }) =>
  new Elysia({ name: "tools" }).derive(() => {
    const toolModule = createToolModule(config.logger, {
      enableServerPlugins: true,
      enableSystemControl: true,
      pluginManager: config.pluginManager,
    });

    return {
      toolManager: toolModule.manager,
      toolExecutors: toolModule.executors,
    };
  });
