import { createContextProvider } from "@/chat/context-provider";
import { ChatHandler } from "@/chat/handler";
import { createPromptManager } from "@/chat/prompt-manager";
import { Elysia, t } from "elysia";
// @deprecated Use providers/tools instead
// import { createDefaultPluginManager } from '@/plugins';
import { createToolModule } from "@/providers/tools";

/**
 * LLM API 路由
 * 集成对话管理、提示词、上下文和插件
 */
export const llmRoutes = new Elysia({ prefix: "/api/llm" })
  .decorate("chatHandler", null as ChatHandler | null)
  .onStart(async ({ chatHandler, store }: any) => {
    // 初始化增强聊天处理器
    const promptManager = createPromptManager({
      basePrompt: "你是一个友好、专业、乐于助人的 AI 助手。",
    });

    const contextProvider = createContextProvider({
      sources: [],
    });

    // Use new ToolManager instead of deprecated PluginManager
    const logger = (store as any).logger || console;
    const toolModule = createToolModule(logger, {
      enableServerPlugins: true,
      enableSystemControl: true,
    });

    const handler = new ChatHandler(
      promptManager,
      contextProvider,
      toolModule.manager, // Pass ToolManager instead of PluginManager
      logger,
      {
        enableDialogue: true,
        enablePrompt: true,
        enableContext: true,
        enablePlugins: true,
      },
    );

    // 预加载提示词模板
    await promptManager.loadTemplate();

    (store as any).chatHandler = handler;
    console.log("[LLM] 聊天处理器已初始化");
  })
  .post(
    "/chat",
    async ({ body, factory, set, store }: any) => {
      try {
        const chatHandler = (store as any).chatHandler as ChatHandler;
        if (!chatHandler) {
          set.status = 500;
          return {
            success: false,
            error: "聊天处理器未初始化",
          };
        }

        const {
          message,
          sessionId = "default",
          speakerName,
          deviceId,
          stream = false,
          provider,
          ...options
        } = body;

        // 1. 处理聊天请求，生成消息和工具
        const { messages, tools, systemPrompt } = await chatHandler.processChat({
          message,
          sessionId,
          speakerName,
          deviceId,
        });

        // 2. 调用 LLM Provider
        const llmProvider = await factory.getLLMProvider(provider);

        // 合并选项
        const llmOptions = {
          ...options,
          ...(tools && tools.length > 0 && { tools }),
        };

        if (stream) {
          const streamResponse = await llmProvider.chatStream(messages, llmOptions);

          const readable = new ReadableStream({
            async start(controller) {
              try {
                let fullContent = "";
                for await (const chunk of streamResponse) {
                  fullContent += chunk;
                  controller.enqueue(new TextEncoder().encode(chunk));
                }

                // 处理完整响应
                await chatHandler.processResponse(sessionId, {
                  content: fullContent,
                });
              } finally {
                controller.close();
              }
            },
          });

          return new Response(readable, {
            headers: {
              "Content-Type": "text/event-stream",
              "Cache-Control": "no-cache",
              Connection: "keep-alive",
            },
          });
        }

        // 非流式响应
        let response = await llmProvider.chat(messages, llmOptions);

        // 3. 处理响应（可能包含工具调用）
        let processResult = await chatHandler.processResponse(sessionId, response);

        // 4. 如果有工具调用，继续调用 LLM
        let maxIterations = 5;
        while (processResult.needsContinue && maxIterations > 0) {
          const { messages: updatedMessages } = await chatHandler.processChat({
            message: "", // 空消息，只获取更新后的历史
            sessionId,
          });

          response = await llmProvider.chat(updatedMessages, llmOptions);
          processResult = await chatHandler.processResponse(sessionId, response);
          maxIterations--;
        }

        return {
          success: true,
          data: {
            content: processResult.content,
            toolResults: processResult.toolResults,
            sessionId,
            provider: provider || "default",
          },
        };
      } catch (error: any) {
        set.status = 500;
        return {
          success: false,
          error: error.message,
        };
      }
    },
    {
      body: t.Object({
        message: t.String(),
        sessionId: t.Optional(t.String()),
        speakerName: t.Optional(t.String()),
        deviceId: t.Optional(t.String()),
        stream: t.Optional(t.Boolean()),
        temperature: t.Optional(t.Number()),
        max_tokens: t.Optional(t.Number()),
        provider: t.Optional(t.String()),
      }),
      detail: {
        tags: ["LLM"],
        summary: "智能聊天接口",
        description: "支持对话管理、提示词、上下文和工具调用的聊天接口",
      },
    },
  )
  .get(
    "/sessions",
    ({ store }: any) => {
      const chatHandler = (store as any).chatHandler as ChatHandler;
      return {
        success: true,
        data: {
          sessions: chatHandler.getSessionIds(),
        },
      };
    },
    {
      detail: {
        tags: ["LLM"],
        summary: "获取会话列表",
      },
    },
  )
  .get(
    "/sessions/:id",
    ({ params, store, set }: any) => {
      const chatHandler = (store as any).chatHandler as ChatHandler;
      const dialogue = chatHandler.exportDialogue(params.id);

      if (!dialogue) {
        set.status = 404;
        return {
          success: false,
          error: "会话不存在",
        };
      }

      return {
        success: true,
        data: dialogue,
      };
    },
    {
      detail: {
        tags: ["LLM"],
        summary: "获取会话详情",
      },
    },
  )
  .delete(
    "/sessions/:id",
    ({ params, store }: any) => {
      const chatHandler = (store as any).chatHandler as ChatHandler;
      const deleted = chatHandler.clearDialogue(params.id);

      return {
        success: deleted,
        message: deleted ? "会话已删除" : "会话不存在",
      };
    },
    {
      detail: {
        tags: ["LLM"],
        summary: "删除会话",
      },
    },
  )
  .get(
    "/providers",
    ({ config }: any) => ({
      success: true,
      data: {
        default: config.llm.default,
        providers: Object.keys(config.llm.providers),
      },
    }),
    {
      detail: {
        tags: ["LLM"],
        summary: "获取可用的 LLM 提供者",
        description: "列出所有配置的 LLM 提供者",
      },
    },
  );
