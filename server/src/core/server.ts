import { errorHandler } from "@/middleware/error";
import { metricsMiddleware } from "@/middleware/metrics";
import { createToolModule } from "@/providers/tools";
import type { AppConfig } from "@/types/config";
import { ProviderFactory } from "@/utils/factory";
import type { Logger } from "@/utils/logger";
import { bearer } from "@elysiajs/bearer";
import { cors } from "@elysiajs/cors";
import { jwt } from "@elysiajs/jwt";
import { swagger } from "@elysiajs/swagger";
import { Elysia } from "elysia";
import { createWebSocketServer } from "./websocket";

/**
 * App Decorators 类型
 */
export interface AppDecorators {
  config: AppConfig;
  logger: Logger;
  factory: ProviderFactory;
}

/**
 * 创建 Elysia 应用实例
 */
export function createApp(config: AppConfig, appLogger: Logger) {
  const factory = new ProviderFactory(config, appLogger);

  // 初始化工具管理器
  const toolModule = createToolModule(appLogger, {
    enableServerPlugins: true,
    enableSystemControl: true,
  });

  const app = new Elysia()
    // CORS
    .use(
      cors({
        origin: true,
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      }),
    )

    // Swagger 文档
    .use(
      swagger({
        documentation: {
          info: {
            title: "Elysia AI Server API",
            version: "1.0.0",
            description: "AI Server with LLM, ASR, TTS, vLLM, Intent, Memory modules",
          },
          tags: [
            { name: "LLM", description: "Large Language Model endpoints" },
            { name: "ASR", description: "Automatic Speech Recognition endpoints" },
            { name: "TTS", description: "Text-to-Speech endpoints" },
            { name: "vLLM", description: "Vision Language Model endpoints" },
            { name: "Intent", description: "Intent Recognition endpoints" },
            { name: "Memory", description: "Memory Management endpoints" },
            { name: "Tools", description: "Tool Management endpoints" },
            { name: "Health", description: "Health check endpoints" },
          ],
        },
      }),
    )

    // JWT 认证
    .use(
      jwt({
        name: "jwt",
        secret: config.server.auth_key || "test-secret-key",
      }),
    )

    // Bearer Token
    .use(bearer())

    // 错误处理
    .use(errorHandler)

    // 性能监控
    .use(metricsMiddleware(appLogger))

    // 健康检查
    .get(
      "/health",
      () => ({
        status: "ok",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      }),
      {
        detail: {
          tags: ["Health"],
          summary: "Health check",
          description: "Check if the server is running",
        },
      },
    )

    // 根路径
    .get("/", () => ({
      name: "Elysia AI Server",
      version: "1.0.0",
      documentation: "/swagger",
    }))

    // 共享状态
    .decorate("config", config)
    .decorate("logger", appLogger)
    .decorate("factory", factory)
    .state("toolManager", toolModule.manager)

    // WebSocket 支持
    .use(createWebSocketServer(config, appLogger));

  return app;
}

export type App = ReturnType<typeof createApp>;
