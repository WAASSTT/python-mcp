/**
 * 工具类型枚举 - 支持多种工具来源
 */
export enum ToolType {
  /** 服务端插件 - 在服务器上执行的函数 */
  SERVER_PLUGIN = "server_plugin",
  /** 服务端 MCP - 使用 MCP 协议的服务端工具 */
  SERVER_MCP = "server_mcp",
  /** MCP 端点 - 外部 MCP 服务 */
  MCP_ENDPOINT = "mcp_endpoint",
  /** 系统控制 - 影响连接状态的操作 */
  SYSTEM_CTL = "system_ctl",
  /** 切换角色 - 修改系统提示词 */
  CHANGE_ROLE = "change_role",
}

/**
 * 工具执行后的动作类型
 */
export enum Action {
  /** 继续处理，执行下一步操作 */
  CONTINUE = "CONTINUE",
  /** 中断处理，返回结果 */
  BREAK = "BREAK",
  /** 工具未找到 */
  NOTFOUND = "NOTFOUND",
  /** 执行出错 */
  ERROR = "ERROR",
  /** 无需处理 */
  NONE = "NONE",
  /** 直接响应 */
  RESPONSE = "RESPONSE",
  /** 需要再次调用 LLM */
  REQLLM = "REQLLM",
}

/**
 * 工具函数定义 - OpenAI 格式
 */
export interface FunctionDefinition {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: {
      type: "object";
      properties: Record<string, any>;
      required?: string[];
    };
  };
}

/**
 * 工具定义接口
 */
export interface ToolDefinition {
  /** 工具名称 */
  name: string;
  /** 工具类型 */
  toolType: ToolType;
  /** OpenAI 格式的函数描述 */
  description: FunctionDefinition;
  /** 执行器实例引用（内部使用） */
  executor?: ToolExecutor;
}

/**
 * 工具执行结果
 */
export interface ActionResponse {
  /** 动作类型 */
  action: Action;
  /** 响应文本 */
  response: string;
  /** 附加数据 */
  data?: any;
  /** 是否需要更新系统提示词 */
  updatePrompt?: string;
  /** 是否需要退出 */
  shouldExit?: boolean;
}

/**
 * 工具执行上下文
 */
export interface ToolContext {
  /** 连接处理器 */
  conn?: any;
  /** 会话 ID */
  sessionId?: string;
  /** 设备 ID */
  deviceId?: string;
  /** 说话人名称 */
  speakerName?: string;
  /** 对话历史 */
  dialogue?: any;
  /** 日志器 */
  logger?: any;
}

/**
 * 工具执行器接口 - 所有工具执行器必须实现此接口
 */
export interface ToolExecutor {
  /** 执行器类型 */
  readonly type: ToolType;

  /**
   * 获取该执行器管理的所有工具
   */
  getTools(): Promise<Record<string, ToolDefinition>>;

  /**
   * 执行工具调用
   * @param context 执行上下文
   * @param toolName 工具名称
   * @param params 工具参数
   */
  execute(
    context: ToolContext,
    toolName: string,
    params: Record<string, any>,
  ): Promise<ActionResponse>;

  /**
   * 检查工具是否可用
   */
  isAvailable?(toolName: string): Promise<boolean>;
}

/**
 * 工具管理器接口
 */
export interface IToolManager {
  /**
   * 注册工具执行器
   */
  registerExecutor(executor: ToolExecutor): void;

  /**
   * 注销工具执行器
   */
  unregisterExecutor(toolType: ToolType): void;

  /**
   * 获取所有工具定义
   */
  getAllTools(): Promise<Record<string, ToolDefinition>>;

  /**
   * 获取所有工具的函数描述（OpenAI格式）
   */
  getFunctionDescriptions(): Promise<FunctionDefinition[]>;

  /**
   * 检查是否存在指定工具
   */
  hasTool(toolName: string): Promise<boolean>;

  /**
   * 获取工具类型
   */
  getToolType(toolName: string): Promise<ToolType | null>;

  /**
   * 执行工具调用
   */
  executeTool(
    context: ToolContext,
    toolName: string,
    params: Record<string, any>,
  ): Promise<ActionResponse>;

  /**
   * 处理 LLM 函数调用
   */
  handleLLMFunctionCall(
    context: ToolContext,
    functionCall: {
      name: string;
      id: string;
      arguments: string;
    },
  ): Promise<ActionResponse>;

  /**
   * 刷新工具缓存
   */
  refreshCache(): void;
}

/**
 * 函数项 - 用于函数注册
 */
export interface FunctionItem<T = any> {
  name: string;
  description: FunctionDefinition;
  handler: (context: ToolContext, params: T) => Promise<ActionResponse>;
  type: ToolType;
}

/**
 * 创建工具定义的辅助函数
 */
export function createToolDefinition(
  name: string,
  description: string,
  parameters: {
    type: "object";
    properties: Record<string, any>;
    required?: string[];
  },
  toolType: ToolType = ToolType.SERVER_PLUGIN,
): ToolDefinition {
  return {
    name,
    toolType,
    description: {
      type: "function",
      function: {
        name,
        description,
        parameters,
      },
    },
  };
}

/**
 * 创建成功的动作响应
 */
export function createSuccessResponse(
  response: string,
  data?: any,
  action: Action = Action.CONTINUE,
): ActionResponse {
  return { action, response, data };
}

/**
 * 创建错误的动作响应
 */
export function createErrorResponse(error: string | Error): ActionResponse {
  return {
    action: Action.ERROR,
    response: error instanceof Error ? error.message : error,
  };
}

/**
 * 创建需要继续调用 LLM 的响应
 */
export function createReqLLMResponse(response: string, data?: any): ActionResponse {
  return {
    action: Action.REQLLM,
    response,
    data,
  };
}

/**
 * 创建直接响应
 */
export function createDirectResponse(response: string, data?: any): ActionResponse {
  return {
    action: Action.RESPONSE,
    response,
    data,
  };
}
