import { ContextDataProvider } from "@/chat/context-provider";
import { Dialogue } from "@/chat/dialogue";
import { PromptManager } from "@/chat/prompt-manager";
import type { McpExecutor } from "@/mcp/mcp-executor";
import type { Message } from "@/types/providers";
import type { Logger } from "@/utils/logger";

/**
 * 聊天处理器配置
 */
export interface ChatConfig {
  enableDialogue?: boolean;
  enablePrompt?: boolean;
  enableContext?: boolean;
  enablePlugins?: boolean;
  maxDialogueLength?: number;
}

/**
 * 聊天请求
 */
export interface ChatRequest {
  message: string;
  sessionId?: string;
  speakerName?: string;
  deviceId?: string;
}

/**
 * 聊天处理器
 * 集成对话管理、提示词、上下文和 MCP 工具系统
 */
export class ChatHandler {
  private dialogues: Map<string, Dialogue> = new Map();
  private promptManager: PromptManager;
  private contextProvider: ContextDataProvider;
  private mcpExecutor?: McpExecutor;
  private config: ChatConfig;
  private logger: Logger;

  constructor(
    promptManager: PromptManager,
    contextProvider: ContextDataProvider,
    mcpExecutor: McpExecutor,
    logger: Logger,
    config: ChatConfig = {},
  ) {
    this.promptManager = promptManager;
    this.contextProvider = contextProvider;
    this.mcpExecutor = mcpExecutor;
    this.logger = logger;

    this.config = {
      enableDialogue: true,
      enablePrompt: true,
      enableContext: true,
      enablePlugins: true,
      maxDialogueLength: 20,
      ...config,
    };
  }

  /**
   * 处理聊天请求
   */
  async processChat(request: ChatRequest): Promise<{
    messages: Message[];
    tools?: any[];
    systemPrompt?: string;
  }> {
    const { message, sessionId = "default", speakerName, deviceId } = request;

    // 1. 获取或创建对话
    const dialogue = this.getOrCreateDialogue(sessionId);

    // 2. 添加用户消息
    dialogue.addUserMessage(message);

    // 3. 构建系统提示词
    let systemPrompt: string | undefined;
    if (this.config.enablePrompt) {
      const contextData = this.config.enableContext ? await this.contextProvider.fetchAll() : "";

      systemPrompt = await this.promptManager.buildSystemPrompt({
        speakerName,
        currentTime: this.getCurrentTime(),
        memory: this.formatMemory(dialogue.getRecentMessages(10)),
        dynamicContext: contextData,
      });
    }

    // 4. 获取工具定义（使用 MCP 系统）
    let tools: any[] | undefined;
    if (this.config.enablePlugins && this.mcpExecutor) {
      const mcpTools = (await import("@/mcp/mcp-registry")).McpRegistry.exportForLLM();
      tools = mcpTools.map((tool) => ({
        type: "function",
        function: tool,
      }));
    }

    // 5. 返回格式化的消息
    return {
      messages: dialogue.getLLMDialogue(),
      tools,
      systemPrompt,
    };
  }

  /**
   * 处理 LLM 响应（包含工具调用）
   */
  async processResponse(
    sessionId: string,
    response: any,
  ): Promise<{
    content?: string;
    toolResults?: any[];
    needsContinue: boolean;
  }> {
    const dialogue = this.dialogues.get(sessionId);
    if (!dialogue) {
      throw new Error(`Session ${sessionId} not found`);
    }

    // 如果有 tool_calls，执行工具
    if (response.tool_calls && response.tool_calls.length > 0) {
      // 添加助手消息（包含工具调用）
      dialogue.addAssistantMessage(response.content, response.tool_calls);

      // 执行工具（使用 MCP 系统）
      const toolResults = await Promise.all(
        response.tool_calls.map(async (toolCall: any) => {
          let result;

          if (this.mcpExecutor) {
            try {
              const mcpResult = await this.mcpExecutor.execute(
                toolCall.function.name,
                JSON.parse(toolCall.function.arguments || "{}"),
                {
                  context: {
                    sessionId,
                    userId: sessionId,
                    timestamp: Date.now(),
                  },
                },
              );

              result = {
                success: mcpResult.success,
                result: mcpResult.data,
                error: mcpResult.error,
              };
            } catch (error: any) {
              this.logger.error(`[ChatHandler] MCP 工具执行失败:`, error);
              result = {
                success: false,
                error: error.message,
              };
            }
          } else {
            result = {
              success: false,
              error: "MCP executor not available",
            };
          }

          // 添加工具结果到对话
          dialogue.addToolMessage(JSON.stringify(result), toolCall.id);

          return {
            toolCallId: toolCall.id,
            name: toolCall.function.name,
            result,
          };
        }),
      );

      return {
        toolResults,
        needsContinue: true, // 需要继续调用 LLM
      };
    }

    // 普通响应
    if (response.content) {
      dialogue.addAssistantMessage(response.content);
    }

    return {
      content: response.content,
      needsContinue: false,
    };
  }

  /**
   * 获取或创建对话
   */
  private getOrCreateDialogue(sessionId: string): Dialogue {
    if (!this.dialogues.has(sessionId)) {
      const dialogue = new Dialogue({
        maxMessages: this.config.maxDialogueLength,
        autoCleanup: true,
        keepSystemMessage: true,
      });
      this.dialogues.set(sessionId, dialogue);
      this.logger.info(`[ChatHandler] 创建新对话: ${sessionId}`);
    }
    return this.dialogues.get(sessionId)!;
  }

  /**
   * 格式化记忆
   */
  private formatMemory(messages: any[]): string {
    if (messages.length === 0) {
      return "";
    }

    const formatted = messages
      .filter((msg) => msg.role !== "system")
      .map((msg) => {
        const role = msg.role === "user" ? "用户" : "助手";
        return `${role}: ${msg.content || "[无内容]"}`;
      })
      .join("\n");

    return formatted ? `\n### 最近对话记忆\n${formatted}` : "";
  }

  /**
   * 获取当前时间
   */
  private getCurrentTime(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hour = String(now.getHours()).padStart(2, "0");
    const minute = String(now.getMinutes()).padStart(2, "0");
    const weekday = this.promptManager.getWeekdayName(now);

    return `当前时间：${year}年${month}月${day}日 ${hour}:${minute} ${weekday}`;
  }

  /**
   * 清理对话
   */
  clearDialogue(sessionId: string): boolean {
    return this.dialogues.delete(sessionId);
  }

  /**
   * 获取对话
   */
  getDialogue(sessionId: string): Dialogue | undefined {
    return this.dialogues.get(sessionId);
  }

  /**
   * 获取所有对话ID
   */
  getSessionIds(): string[] {
    return Array.from(this.dialogues.keys());
  }

  /**
   * 清理所有对话
   */
  clearAll(): void {
    this.dialogues.clear();
  }

  /**
   * 导出对话
   */
  exportDialogue(sessionId: string): any {
    const dialogue = this.dialogues.get(sessionId);
    return dialogue ? dialogue.export() : null;
  }
}
