/**
 * Elysia AI Server - 主入口
 * 使用现代化的扁平结构和模块化设计
 */

import { bearer } from "@elysiajs/bearer";
import { cors } from "@elysiajs/cors";
import { jwt } from "@elysiajs/jwt";
import { swagger } from "@elysiajs/swagger";
import { Elysia } from "elysia";

import { config, printConfigSummary, validateConfig } from "@/config";
import { authMiddleware, corsConfig, errorHandler, metricsMiddleware } from "@/middleware";
import { initializeModelFactory } from "@/models/model-factory";
import { registerRoutes } from "@/router";
import { createLogger } from "@/utils/logger";
import { getOptimizationManager } from "@/utils/optimize";
import { createWebSocketHandlers } from "@/websocket";

/**
 * 创建应用实例
 */
const createApp = () => {
  const logger = createLogger(config);
  const wsHandlers = createWebSocketHandlers(logger);

  const app = new Elysia()
    // CORS
    .use(cors(corsConfig))

    // Swagger 文档
    .use(
      swagger({
        documentation: {
          info: {
            title: "Elysia AI Server API",
            version: "2.0.0",
            description: "现代化 AI Server - LLM, ASR, TTS, vLLM, Intent, Memory, MCP",
          },
          tags: [
            { name: "System", description: "系统健康检查和指标" },
            { name: "LLM", description: "大语言模型" },
            { name: "ASR", description: "语音识别" },
            { name: "TTS", description: "语音合成" },
            { name: "vLLM", description: "视觉模型" },
            { name: "Memory", description: "记忆管理" },
            { name: "MCP", description: "MCP 工具" },
          ],
        },
      }),
    )

    // JWT 认证
    .use(
      jwt({
        name: "jwt",
        secret: config.server.auth_key || "dev-secret-key",
      }),
    )

    // Bearer Token
    .use(bearer())

    // 错误处理
    .use(errorHandler)

    // 性能监控
    .use(metricsMiddleware(logger))

    // 认证（如果启用）
    .use(authMiddleware(config.server.auth))

    // WebSocket
    .ws("/ws/v1", {
      open: wsHandlers.open as any,
      message: wsHandlers.message as any,
      close: wsHandlers.close as any,
      error: wsHandlers.error as any,
    })

    // 装饰器 - 让路由可以访问 context
    .decorate("config", config)
    .decorate("logger", logger)
    .decorate("wsManager", wsHandlers.manager);

  // 注册路由
  registerRoutes(app, { config, logger });

  return { app, logger, wsHandlers };
};

/**
 * 主函数
 */
const main = async () => {
  console.log("🚀 Starting Elysia AI Server v2.0...\n");

  // 验证配置
  const { valid, errors } = validateConfig(config);
  if (!valid) {
    console.error("❌ Configuration validation failed:");
    errors.forEach((error) => console.error(`  - ${error}`));
    process.exit(1);
  }

  // 打印配置摘要
  printConfigSummary(config);

  // 初始化模型工厂
  initializeModelFactory();
  console.log("✅ Model factory initialized");

  // 创建应用
  const { app, logger } = createApp();
  logger.info("✅ Application created");

  // 启动优化管理器
  const optimizer = getOptimizationManager(config, logger);
  optimizer.start();
  logger.info("✅ Optimization manager started");

  // 启动服务器
  app.listen(config.server.port, () => {
    logger.info("");
    logger.info("═══════════════════════════════════════════════════════");
    logger.info("🎉 Elysia AI Server v2.0 is running!");
    logger.info("═══════════════════════════════════════════════════════");
    logger.info(`📡 HTTP Server:     http://${config.server.ip}:${config.server.port}`);
    logger.info(`🔌 WebSocket:       ws://${config.server.ip}:${config.server.port}/ws/v1`);
    logger.info(`📚 API Docs:        http://localhost:${config.server.port}/swagger`);
    logger.info(`📊 Metrics:         http://localhost:${config.server.port}/metrics`);
    logger.info(`🏥 Health Check:    http://localhost:${config.server.port}/health`);
    logger.info("═══════════════════════════════════════════════════════");
    logger.info(`🔧 Environment:     ${process.env.NODE_ENV || "development"}`);
    logger.info(`📝 Log Level:       ${config.log.log_level}`);
    logger.info(`🎯 Default LLM:     ${config.llm.default}`);
    logger.info(`🎤 Default ASR:     ${config.asr.default}`);
    logger.info(`🔊 Default TTS:     ${config.tts.default}`);
    logger.info(`👁️  Default vLLM:    ${config.vllm.default}`);
    logger.info(`🧠 Default Memory:  ${config.memory.default}`);
    logger.info(`🔧 MCP Tools:       ${config.mcp_endpoint || "Not configured"}`);
    logger.info("═══════════════════════════════════════════════════════");
    logger.info("");
  });

  // 优雅关闭
  const shutdown = async () => {
    logger.info("\n🛑 Shutting down gracefully...");

    optimizer.stop();
    logger.info("✅ Optimization manager stopped");

    await app.stop();
    logger.info("✅ Server stopped");

    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
};

// 启动应用
main().catch((error) => {
  console.error("❌ Failed to start server:");
  console.error(error);
  process.exit(1);
});
