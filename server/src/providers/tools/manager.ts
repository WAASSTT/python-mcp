import type { Logger } from "@/utils/logger";
import type {
  ActionResponse,
  FunctionDefinition,
  IToolManager,
  ToolContext,
  ToolDefinition,
  ToolExecutor,
} from "./base";
import { Action, ToolType } from "./base";

/**
 * 统一工具管理器
 * 管理所有类型的工具执行器，提供统一的工具调用接口
 */
export class ToolManager implements IToolManager {
  private logger: Logger;
  private executors: Map<ToolType, ToolExecutor>;
  private cachedTools: Record<string, ToolDefinition> | null;
  private cachedFunctionDescriptions: FunctionDefinition[] | null;

  constructor(logger: Logger) {
    this.logger = logger;
    this.executors = new Map();
    this.cachedTools = null;
    this.cachedFunctionDescriptions = null;
  }

  /**
   * 注册工具执行器
   */
  registerExecutor(executor: ToolExecutor): void {
    this.executors.set(executor.type, executor);
    this.invalidateCache();
    this.logger.debug(`Registered tool executor: ${executor.type}`);
  }

  /**
   * 注销工具执行器
   */
  unregisterExecutor(toolType: ToolType): void {
    this.executors.delete(toolType);
    this.invalidateCache();
    this.logger.debug(`Unregistered tool executor: ${toolType}`);
  }

  /**
   * 使缓存失效
   */
  private invalidateCache(): void {
    this.cachedTools = null;
    this.cachedFunctionDescriptions = null;
  }

  /**
   * 刷新工具缓存
   */
  refreshCache(): void {
    this.invalidateCache();
  }

  /**
   * 获取所有工具定义
   */
  async getAllTools(): Promise<Record<string, ToolDefinition>> {
    if (this.cachedTools !== null) {
      return this.cachedTools;
    }

    const allTools: Record<string, ToolDefinition> = {};

    for (const [toolType, executor] of this.executors.entries()) {
      try {
        const tools = await executor.getTools();
        for (const [name, definition] of Object.entries(tools)) {
          if (name in allTools) {
            this.logger.warn(
              `Tool name conflict: ${name} (${toolType} vs ${allTools[name].toolType})`,
            );
          }
          allTools[name] = {
            ...definition,
            executor,
          };
        }
      } catch (error) {
        this.logger.error(`Error getting tools from ${toolType}: ${error}`);
      }
    }

    this.cachedTools = allTools;
    this.logger.debug(`Cached ${Object.keys(allTools).length} tools`);
    return allTools;
  }

  /**
   * 获取所有工具的函数描述（OpenAI格式）
   */
  async getFunctionDescriptions(): Promise<FunctionDefinition[]> {
    if (this.cachedFunctionDescriptions !== null) {
      return this.cachedFunctionDescriptions;
    }

    const descriptions: FunctionDefinition[] = [];
    const tools = await this.getAllTools();

    for (const toolDefinition of Object.values(tools)) {
      descriptions.push(toolDefinition.description);
    }

    this.cachedFunctionDescriptions = descriptions;
    return descriptions;
  }

  /**
   * 检查是否存在指定工具
   */
  async hasTool(toolName: string): Promise<boolean> {
    const tools = await this.getAllTools();
    return toolName in tools;
  }

  /**
   * 获取工具类型
   */
  async getToolType(toolName: string): Promise<ToolType | null> {
    const tools = await this.getAllTools();
    const toolDef = tools[toolName];
    return toolDef ? toolDef.toolType : null;
  }

  /**
   * 获取工具定义
   */
  async getToolInfo(toolName: string): Promise<ToolDefinition | null> {
    const tools = await this.getAllTools();
    return tools[toolName] || null;
  }

  /**
   * 执行工具调用
   */
  async executeTool(
    context: ToolContext,
    toolName: string,
    params: Record<string, any>,
  ): Promise<ActionResponse> {
    try {
      // 查找工具
      const tools = await this.getAllTools();
      const tool = tools[toolName];

      if (!tool) {
        return {
          action: Action.NOTFOUND,
          response: `工具 ${toolName} 未找到`,
        };
      }

      // 获取对应的执行器
      const executor = tool.executor || this.executors.get(tool.toolType);
      if (!executor) {
        return {
          action: Action.ERROR,
          response: `工具类型 ${tool.toolType} 的执行器未注册`,
        };
      }

      // 执行工具
      this.logger.info(`执行工具: ${toolName}, 参数: ${JSON.stringify(params)}`);
      const result = await executor.execute(context, toolName, params);
      this.logger.debug(`工具执行结果: ${JSON.stringify(result)}`);

      return result;
    } catch (error) {
      this.logger.error(`工具 ${toolName} 执行失败: ${error}`);
      return {
        action: Action.ERROR,
        response: `工具执行失败: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * 处理 LLM 函数调用
   * 解析 LLM 返回的 function_call 并执行对应工具
   */
  async handleLLMFunctionCall(
    context: ToolContext,
    functionCall: {
      name: string;
      id: string;
      arguments: string;
    },
  ): Promise<ActionResponse> {
    const { name, arguments: argsStr } = functionCall;

    // 解析参数
    let params: Record<string, any> = {};
    try {
      if (argsStr && argsStr.trim()) {
        params = JSON.parse(argsStr);
      }
    } catch (error) {
      this.logger.error(`解析函数参数失败: ${error}`);
      return {
        action: Action.ERROR,
        response: `参数解析失败: ${error instanceof Error ? error.message : String(error)}`,
      };
    }

    // 执行工具
    return this.executeTool(context, name, params);
  }

  /**
   * 批量执行工具调用
   */
  async executeToolCalls(
    context: ToolContext,
    toolCalls: Array<{
      id: string;
      function: { name: string; arguments: string };
    }>,
  ): Promise<Array<{ id: string; result: ActionResponse }>> {
    const results: Array<{ id: string; result: ActionResponse }> = [];

    for (const toolCall of toolCalls) {
      const result = await this.handleLLMFunctionCall(context, {
        name: toolCall.function.name,
        id: toolCall.id,
        arguments: toolCall.function.arguments,
      });

      results.push({ id: toolCall.id, result });

      // 如果工具返回了需要中断的动作，停止执行后续工具
      if (result.action === Action.BREAK || result.action === Action.ERROR) {
        this.logger.debug(`工具链执行在 ${toolCall.function.name} 处中断`);
        break;
      }
    }

    return results;
  }

  /**
   * 列出所有可用工具
   */
  async listAllTools(): Promise<string[]> {
    const tools = await this.getAllTools();
    return Object.keys(tools);
  }

  /**
   * 按类型筛选工具
   */
  async getToolsByType(toolType: ToolType): Promise<Record<string, ToolDefinition>> {
    const tools = await this.getAllTools();
    const filtered: Record<string, ToolDefinition> = {};

    for (const [name, definition] of Object.entries(tools)) {
      if (definition.toolType === toolType) {
        filtered[name] = definition;
      }
    }

    return filtered;
  }

  /**
   * 获取工具统计信息
   */
  async getStats(): Promise<{
    totalTools: number;
    byType: Record<string, number>;
    executors: string[];
  }> {
    const tools = await this.getAllTools();
    const byType: Record<string, number> = {};

    for (const definition of Object.values(tools)) {
      byType[definition.toolType] = (byType[definition.toolType] || 0) + 1;
    }

    return {
      totalTools: Object.keys(tools).length,
      byType,
      executors: Array.from(this.executors.keys()),
    };
  }
}
