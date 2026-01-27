/**
 * MCP 工具管理
 */

import { logger } from "../../utils/logger";

export interface MCPToolProperty {
  name: string;
  type: "string" | "integer" | "number" | "boolean" | "array" | "object";
  description?: string;
  minimum?: number;
  maximum?: number;
}

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: "object";
    properties: Record<string, any>;
    required?: string[];
  };
  mockResponse?: any;
}

const STORAGE_KEY = "mcpTools";

class MCPToolsManager {
  #tools: MCPTool[] = [];
  #listeners: Array<() => void> = [];

  /**
   * 初始化工具列表
   */
  public async initialize(): Promise<void> {
    const savedTools = localStorage.getItem(STORAGE_KEY);
    if (savedTools) {
      try {
        this.#tools = JSON.parse(savedTools);
        logger.info(`加载了 ${this.#tools.length} 个MCP工具`);
      } catch (e) {
        logger.warning("加载MCP工具失败，使用空列表");
        this.#tools = [];
      }
    } else {
      this.#tools = [];
    }

    this.#notifyListeners();
  }

  /**
   * 添加变更监听器
   */
  public onChange(callback: () => void): void {
    this.#listeners.push(callback);
  }

  /**
   * 通知所有监听器
   */
  #notifyListeners(): void {
    this.#listeners.forEach((listener) => listener());
  }

  /**
   * 保存工具列表
   */
  #saveTools(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.#tools));
    this.#notifyListeners();
  }

  /**
   * 获取所有工具
   */
  public getTools(): MCPTool[] {
    return [...this.#tools];
  }

  /**
   * 添加工具
   */
  public addTool(tool: MCPTool): void {
    this.#tools.push(tool);
    this.#saveTools();
    logger.success(`添加工具: ${tool.name}`);
  }

  /**
   * 更新工具
   */
  public updateTool(index: number, tool: MCPTool): void {
    if (index >= 0 && index < this.#tools.length) {
      this.#tools[index] = tool;
      this.#saveTools();
      logger.success(`更新工具: ${tool.name}`);
    }
  }

  /**
   * 删除工具
   */
  public deleteTool(index: number): void {
    if (index >= 0 && index < this.#tools.length) {
      const tool = this.#tools[index];
      this.#tools.splice(index, 1);
      this.#saveTools();
      logger.success(`删除工具: ${tool.name}`);
    }
  }

  /**
   * 通过名称查找工具
   */
  public findToolByName(name: string): MCPTool | undefined {
    return this.#tools.find((tool) => tool.name === name);
  }

  /**
   * 执行工具
   */
  public executeTool(name: string, args: Record<string, any>): any {
    const tool = this.findToolByName(name);
    if (!tool) {
      logger.error(`工具不存在: ${name}`);
      return {
        success: false,
        error: `工具不存在: ${name}`,
      };
    }

    logger.info(`执行工具: ${name}`);
    logger.debug(`参数: ${JSON.stringify(args, null, 2)}`);

    // 如果有模拟返回，直接返回
    if (tool.mockResponse) {
      logger.success(`返回模拟数据: ${JSON.stringify(tool.mockResponse)}`);
      return tool.mockResponse;
    }

    // 默认返回成功
    return {
      success: true,
      message: `工具 ${name} 执行成功`,
      args,
    };
  }

  /**
   * 生成 tools/list 响应
   */
  public generateToolsListResponse(): any {
    return {
      tools: this.#tools.map((tool) => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema,
      })),
    };
  }

  /**
   * 清空所有工具
   */
  public clearAll(): void {
    this.#tools = [];
    this.#saveTools();
    logger.info("清空所有MCP工具");
  }

  /**
   * 导入工具列表
   */
  public importTools(tools: MCPTool[]): void {
    this.#tools = tools;
    this.#saveTools();
    logger.success(`导入了 ${tools.length} 个MCP工具`);
  }

  /**
   * 导出工具列表
   */
  public exportTools(): string {
    return JSON.stringify(this.#tools, null, 2);
  }
}

// 单例
let mcpToolsManagerInstance: MCPToolsManager | null = null;

/**
 * 获取 MCP 工具管理器实例
 */
export function getMCPToolsManager(): MCPToolsManager {
  if (!mcpToolsManagerInstance) {
    mcpToolsManagerInstance = new MCPToolsManager();
  }
  return mcpToolsManagerInstance;
}
