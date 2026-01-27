import { ContextDataProvider } from "@/chat/context-provider";
import { Dialogue } from "@/chat/dialogue";
import { PromptManager } from "@/chat/prompt-manager";
import { PluginManager } from "@/plugins/plugin-manager";
import type { ToolManager } from "@/providers/tools";
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
 * 集成对话管理、提示词、上下文和插件系统
 * @deprecated Use ToolManager instead of PluginManager
 */
export class ChatHandler {
  private dialogues: Map<string, Dialogue> = new Map();
  private promptManager: PromptManager;
  private contextProvider: ContextDataProvider;
  private pluginManager?: PluginManager;
  private toolManager?: ToolManager;
  private config: ChatConfig;
  private logger: Logger;

  constructor(
    promptManager: PromptManager,
    contextProvider: ContextDataProvider,
    pluginManagerOrToolManager: PluginManager | ToolManager,
    logger: Logger,
    config: ChatConfig = {},
  ) {
    this.promptManager = promptManager;
    this.contextProvider = contextProvider;
    this.logger = logger;

    // 兼容新旧系统
    if ("getAllTools" in pluginManagerOrToolManager) {
      this.toolManager = pluginManagerOrToolManager as ToolManager;
    } else {
      this.pluginManager = pluginManagerOrToolManager as PluginManager;
    }

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
    const { message, sessionId = "default", speakerName, deviceId: _deviceId } = request;

    // 1. 获取或创建对话
    let dialogue = this.getOrCreateDialogue(sessionId);

    // 2. 解析说话人信息
    const { speaker, content } = this.promptManager.parseSpeakerMessage(message);
    const finalSpeakerName = speaker || speakerName;

    // 3. 添加用户消息
    dialogue.addUserMessage(content, finalSpeakerName);

    // 4. 构建系统提示词
    let systemPrompt: string | undefined;
    if (this.config.enablePrompt) {
      const contextData = this.config.enableContext ? await this.contextProvider.fetchAll() : "";

      // 获取记忆摘要
      const recentMessages = dialogue.getRecentMessages(5);
      const memory = this.formatMemory(recentMessages);

      systemPrompt = await this.promptManager.buildSystemPrompt({
        currentTime: this.getCurrentTime(),
        dynamicContext: contextData,
        memory,
        speakerName: finalSpeakerName,
      });
    }

    // 5. 获取对话历史
    const messages = dialogue.getLLMDialogue();

    // 6. 添加系统提示词
    if (systemPrompt && messages[0]?.role !== "system") {
      messages.unshift({
        role: "system",
        content: systemPrompt,
      });
    }

    // 7. 获取工具定义
    let tools: any[] | undefined;
    if (this.config.enablePlugins) {
      if (this.toolManager) {
        // 使用新的 ToolManager
        const allTools = await this.toolManager.getAllTools();
        tools = Object.values(allTools).map((tool: any) => ({
          type: "function",
          function: {
            name: tool.name,
            description: tool.description,
            parameters: tool.parameters,
          },
        }));
      } else if (this.pluginManager) {
        // 向后兼容旧的 PluginManager
        tools = this.pluginManager.getToolDefinitions();
      }
    }

    return {
      messages,
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

      // 执行工具
      const toolResults = await Promise.all(
        response.tool_calls.map(async (toolCall: any) => {
          let result;

          if (this.toolManager) {
            // 使用新的 ToolManager
            try {
              const toolResult = await this.toolManager.handleLLMFunctionCall(
                {
                  sessionId,
                  deviceId: sessionId,
                },
                {
                  id: toolCall.id,
                  name: toolCall.function.name,
                  arguments: toolCall.function.arguments,
                },
              );

              result = {
                success: toolResult.action !== "ERROR",
                result: toolResult.data || toolResult.response,
                error: toolResult.action === "ERROR" ? toolResult.response : undefined,
              };
            } catch (error: any) {
              result = {
                success: false,
                error: error.message,
              };
            }
          } else if (this.pluginManager) {
            // 向后兼容旧的 PluginManager
            result = await this.pluginManager.executeFromToolCall(toolCall);
          } else {
            result = {
              success: false,
              error: "No tool manager available",
            };
          }

          // 添加工具响应消息
          dialogue.addToolMessage(JSON.stringify(result.result || result), toolCall.id);

          return result;
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
