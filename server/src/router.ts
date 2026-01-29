/**
 * 统一路由管理
 * 整合所有 API 路由
 */

import type { Elysia } from "elysia";
import type { AppConfig } from "./types/config";
import type { Logger } from "./utils/logger";

// ============= 路由类型 =============

export interface RouteContext {
  config: AppConfig;
  logger: Logger;
}

// ============= LLM 路由 =============

export const llmRoutes = (app: Elysia, context: RouteContext) =>
  app.group("/v1/llm", (app) =>
    app
      .post(
        "/chat",
        async ({ body, set }) => {
          const { messages: _messages, model, stream = false } = body as any;

          try {
            if (stream) {
              set.headers["content-type"] = "text/event-stream";
              // 流式响应处理
              return new Response(
                new ReadableStream({
                  async start(controller) {
                    controller.enqueue(
                      new TextEncoder().encode('data: {"content":"Hello from LLM"}\n\n'),
                    );
                    controller.close();
                  },
                }),
              );
            }

            return {
              content: "Hello from LLM",
              model: model || context.config.llm.default,
            };
          } catch (error) {
            set.status = 500;
            return {
              error: error instanceof Error ? error.message : "Unknown error",
            };
          }
        },
        {
          detail: {
            tags: ["LLM"],
            summary: "Chat with LLM",
            description: "Send messages to language model",
          },
        },
      )
      .get(
        "/models",
        () => ({
          models: ["chatglm", "openai", "ali", "doubao"],
        }),
        {
          detail: {
            tags: ["LLM"],
            summary: "List available models",
          },
        },
      ),
  );

// ============= ASR 路由 =============

export const asrRoutes = (app: Elysia, _context: RouteContext) =>
  app.group("/v1/asr", (app) =>
    app.post(
      "/recognize",
      async ({ body: _body, set }) => {
        try {
          // ASR 识别逻辑
          return {
            text: "Recognized text",
            confidence: 0.95,
          };
        } catch (error) {
          set.status = 500;
          return {
            error: error instanceof Error ? error.message : "Unknown error",
          };
        }
      },
      {
        detail: {
          tags: ["ASR"],
          summary: "Speech recognition",
          description: "Convert audio to text",
        },
      },
    ),
  );

// ============= TTS 路由 =============

export const ttsRoutes = (app: Elysia, _context: RouteContext) =>
  app.group("/v1/tts", (app) =>
    app.post(
      "/synthesize",
      async ({ body, set }) => {
        const { text: _text, voice: _voice } = body as any;

        try {
          // TTS 合成逻辑
          return new Response(new Uint8Array(), {
            headers: {
              "content-type": "audio/opus",
            },
          });
        } catch (error) {
          set.status = 500;
          return {
            error: error instanceof Error ? error.message : "Unknown error",
          };
        }
      },
      {
        detail: {
          tags: ["TTS"],
          summary: "Text to speech",
          description: "Convert text to audio",
        },
      },
    ),
  );

// ============= vLLM 路由 =============

export const vllmRoutes = (app: Elysia, _context: RouteContext) =>
  app.group("/v1/vllm", (app) =>
    app.post(
      "/analyze",
      async ({ body: _body, set }) => {
        try {
          return {
            description: "Image analysis result",
            confidence: 0.9,
          };
        } catch (error) {
          set.status = 500;
          return {
            error: error instanceof Error ? error.message : "Unknown error",
          };
        }
      },
      {
        detail: {
          tags: ["vLLM"],
          summary: "Vision model analysis",
          description: "Analyze images with vision models",
        },
      },
    ),
  );

// ============= Memory 路由 =============

export const memoryRoutes = (app: Elysia, _context: RouteContext) =>
  app.group("/v1/memory", (app) =>
    app
      .post(
        "/add",
        async ({ body, set }) => {
          try {
            const { content: _content, metadata: _metadata } = body as any;
            return {
              id: "memory-id",
              success: true,
            };
          } catch (error) {
            set.status = 500;
            return {
              error: error instanceof Error ? error.message : "Unknown error",
            };
          }
        },
        {
          detail: {
            tags: ["Memory"],
            summary: "Add memory",
          },
        },
      )
      .get(
        "/search",
        async ({ query: _query, set }) => {
          try {
            return {
              results: [],
            };
          } catch (error) {
            set.status = 500;
            return {
              error: error instanceof Error ? error.message : "Unknown error",
            };
          }
        },
        {
          detail: {
            tags: ["Memory"],
            summary: "Search memories",
          },
        },
      ),
  );

// ============= MCP Tools 路由 =============

export const mcpRoutes = (app: Elysia, _context: RouteContext) =>
  app.group("/v1/mcp", (app) =>
    app
      .get(
        "/tools",
        () => {
          // 返回可用工具列表
          return {
            tools: [],
          };
        },
        {
          detail: {
            tags: ["MCP"],
            summary: "List available tools",
          },
        },
      )
      .post(
        "/execute",
        async ({ body, set }) => {
          try {
            const { tool: _tool, params: _params } = body as any;
            // 执行工具
            return {
              success: true,
              result: {},
            };
          } catch (error) {
            set.status = 500;
            return {
              error: error instanceof Error ? error.message : "Unknown error",
            };
          }
        },
        {
          detail: {
            tags: ["MCP"],
            summary: "Execute tool",
          },
        },
      ),
  );

// ============= 健康检查和指标 =============

export const systemRoutes = (app: Elysia, _context: RouteContext) =>
  app
    .get(
      "/health",
      () => ({
        status: "ok",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      }),
      {
        detail: {
          tags: ["System"],
          summary: "Health check",
        },
      },
    )
    .get(
      "/metrics",
      async () => {
        const { getMetrics } = await import("./middleware");
        return getMetrics();
      },
      {
        detail: {
          tags: ["System"],
          summary: "Get metrics",
        },
      },
    );

// ============= 注册所有路由 =============

export const registerRoutes = (app: any, context: RouteContext) => {
  context.logger.info("Registering routes...");

  app
    .use((app: any) => systemRoutes(app, context))
    .use((app: any) => llmRoutes(app, context))
    .use((app: any) => asrRoutes(app, context))
    .use((app: any) => ttsRoutes(app, context))
    .use((app: any) => vllmRoutes(app, context))
    .use((app: any) => memoryRoutes(app, context))
    .use((app: any) => mcpRoutes(app, context));

  context.logger.info("✅ Routes registered");

  return app;
};

export default registerRoutes;
