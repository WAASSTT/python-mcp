/**
 * MCP 基类
 * Model Context Protocol 工具的基础接口
 */

// ============= 类型定义 =============

/** MCP 工具参数定义 */
export interface McpParameter {
  name: string;
  type: "string" | "number" | "boolean" | "object" | "array";
  description: string;
  required?: boolean;
  default?: unknown;
}

/** MCP 工具定义 */
export interface McpToolDefinition {
  name: string;
  description: string;
  parameters: McpParameter[];
  examples?: Array<{
    input: Record<string, unknown>;
    output: unknown;
  }>;
}

/** MCP 执行上下文 */
export interface McpContext {
  userId?: string;
  sessionId?: string;
  deviceId?: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

/** MCP 执行结果 */
export interface McpResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: Record<string, unknown>;
}

// ============= MCP 基类 =============

/** MCP 工具抽象基类 */
export abstract class McpBase {
  /** 工具定义 */
  abstract get definition(): McpToolDefinition;

  /** 执行工具 */
  abstract execute(params: Record<string, unknown>, context: McpContext): Promise<McpResult>;

  /** 验证参数 */
  protected validateParams(params: Record<string, unknown>): string[] {
    const errors: string[] = [];
    const { parameters } = this.definition;

    for (const param of parameters) {
      const value = params[param.name];

      // 检查必需参数
      if (param.required && value === undefined) {
        errors.push(`Missing required parameter: ${param.name}`);
        continue;
      }

      // 跳过可选的未提供参数
      if (value === undefined) continue;

      // 检查类型
      const actualType = Array.isArray(value) ? "array" : typeof value;
      if (actualType !== param.type) {
        errors.push(`Parameter ${param.name} should be ${param.type}, got ${actualType}`);
      }
    }

    return errors;
  }

  /** 创建成功结果 */
  protected success<T>(data: T, metadata?: Record<string, unknown>): McpResult<T> {
    return {
      success: true,
      data,
      metadata,
    };
  }

  /** 创建失败结果 */
  protected failure(error: string, metadata?: Record<string, unknown>): McpResult {
    return {
      success: false,
      error,
      metadata,
    };
  }

  /** 工具名称 */
  get name(): string {
    return this.definition.name;
  }

  /** 工具描述 */
  get description(): string {
    return this.definition.description;
  }
}

// ============= 工具函数 =============

/** 创建 MCP 上下文 */
export const createMcpContext = (options: Partial<McpContext> = {}): McpContext => ({
  timestamp: Date.now(),
  ...options,
});

/** 格式化工具定义为 OpenAI function */
export const toOpenAIFunction = (tool: McpBase) => {
  const { name, description, parameters } = tool.definition;

  return {
    name,
    description,
    parameters: {
      type: "object",
      properties: parameters.reduce(
        (acc, param) => {
          acc[param.name] = {
            type: param.type,
            description: param.description,
          };
          return acc;
        },
        {} as Record<string, unknown>,
      ),
      required: parameters.filter((p) => p.required).map((p) => p.name),
    },
  };
};

/** 格式化工具定义为 Anthropic tool */
export const toAnthropicTool = (tool: McpBase) => {
  const { name, description, parameters } = tool.definition;

  return {
    name,
    description,
    input_schema: {
      type: "object",
      properties: parameters.reduce(
        (acc, param) => {
          acc[param.name] = {
            type: param.type,
            description: param.description,
          };
          return acc;
        },
        {} as Record<string, unknown>,
      ),
      required: parameters.filter((p) => p.required).map((p) => p.name),
    },
  };
};

// ============= 导出 =============

export default McpBase;
