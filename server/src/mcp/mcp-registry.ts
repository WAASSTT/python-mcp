/**
 * MCP 注册表
 * 统一管理所有 MCP 工具
 */

import type { McpBase } from "./mcp-base";

// ============= 类型定义 =============

/** 工具类别 */
export type ToolCategory = "system" | "filesystem" | "network" | "database" | "api" | "custom";

/** 工具元数据 */
export interface ToolMetadata {
  category: ToolCategory;
  version: string;
  author?: string;
  tags?: string[];
  deprecated?: boolean;
}

/** 注册的工具信息 */
interface RegisteredTool {
  tool: McpBase;
  metadata: ToolMetadata;
  registeredAt: number;
}

// ============= MCP 注册表类 =============

/** MCP 工具注册表 */
export class McpRegistry {
  private static tools = new Map<string, RegisteredTool>();
  private static aliases = new Map<string, string>();

  /** 注册工具 */
  static register(tool: McpBase, metadata: ToolMetadata, aliases: string[] = []): void {
    const name = tool.name;

    // 检查重复
    if (this.tools.has(name)) {
      throw new Error(`Tool ${name} is already registered`);
    }

    // 注册工具
    this.tools.set(name, {
      tool,
      metadata,
      registeredAt: Date.now(),
    });

    // 注册别名
    for (const alias of aliases) {
      this.aliases.set(alias, name);
    }

    console.log(`✅ Registered MCP tool: ${name} (${metadata.category})`);
  }

  /** 注销工具 */
  static unregister(name: string): boolean {
    // 移除别名
    for (const [alias, toolName] of this.aliases.entries()) {
      if (toolName === name) {
        this.aliases.delete(alias);
      }
    }

    // 移除工具
    return this.tools.delete(name);
  }

  /** 获取工具 */
  static get(nameOrAlias: string): McpBase | undefined {
    // 尝试直接获取
    const direct = this.tools.get(nameOrAlias);
    if (direct) return direct.tool;

    // 尝试通过别名获取
    const actualName = this.aliases.get(nameOrAlias);
    if (actualName) {
      return this.tools.get(actualName)?.tool;
    }

    return undefined;
  }

  /** 检查工具是否存在 */
  static has(nameOrAlias: string): boolean {
    return this.tools.has(nameOrAlias) || this.aliases.has(nameOrAlias);
  }

  /** 获取所有工具 */
  static getAll(): McpBase[] {
    return Array.from(this.tools.values()).map((rt) => rt.tool);
  }

  /** 按类别获取工具 */
  static getByCategory(category: ToolCategory): McpBase[] {
    return Array.from(this.tools.values())
      .filter((rt) => rt.metadata.category === category)
      .map((rt) => rt.tool);
  }

  /** 获取工具元数据 */
  static getMetadata(name: string): ToolMetadata | undefined {
    return this.tools.get(name)?.metadata;
  }

  /** 获取所有工具名称 */
  static getNames(): string[] {
    return Array.from(this.tools.keys());
  }

  /** 获取工具统计 */
  static getStats() {
    const byCategory = new Map<ToolCategory, number>();

    for (const { metadata } of this.tools.values()) {
      byCategory.set(metadata.category, (byCategory.get(metadata.category) || 0) + 1);
    }

    return {
      total: this.tools.size,
      byCategory: Object.fromEntries(byCategory),
      aliases: this.aliases.size,
    };
  }

  /** 清空注册表 */
  static clear(): void {
    this.tools.clear();
    this.aliases.clear();
  }

  /** 搜索工具 */
  static search(query: string): McpBase[] {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.tools.values())
      .filter(({ tool, metadata }) => {
        const nameMatch = tool.name.toLowerCase().includes(lowerQuery);
        const descMatch = tool.description.toLowerCase().includes(lowerQuery);
        const tagsMatch = metadata.tags?.some((tag) => tag.toLowerCase().includes(lowerQuery));
        return nameMatch || descMatch || tagsMatch;
      })
      .map((rt) => rt.tool);
  }

  /** 导出工具列表（用于 LLM） */
  static exportForLLM(): Array<{
    name: string;
    description: string;
    parameters: unknown;
  }> {
    return Array.from(this.tools.values())
      .filter((rt) => !rt.metadata.deprecated)
      .map(({ tool }) => ({
        name: tool.name,
        description: tool.description,
        parameters: tool.definition.parameters,
      }));
  }
}

// ============= 批量注册辅助函数 =============

/** 批量注册工具 */
export const registerTools = (
  tools: Array<{
    tool: McpBase;
    metadata: ToolMetadata;
    aliases?: string[];
  }>,
): void => {
  for (const { tool, metadata, aliases } of tools) {
    McpRegistry.register(tool, metadata, aliases);
  }
};

// ============= 导出 =============

export default McpRegistry;
