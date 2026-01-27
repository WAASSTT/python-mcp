import { loadConfig } from "@/config/loader";
import { createApp } from "@/core/server";
import { registerRoutes } from "@/routes";
import { createLogger } from "@/utils/logger";
import { getOptimizationManager } from "@/utils/optimize";

/**
 * 主入口
 */
async function main() {
  console.log("🚀 Starting Elysia AI Server...\n");

  // 加载配置
  const config = await loadConfig();
  console.log("✅ Configuration loaded");

  // 创建日志
  const logger = createLogger(config);
  logger.info("✅ Logger initialized");

  // 创建应用（包含 WebSocket 支持）
  const app = createApp(config, logger);
  logger.info("✅ Application created");

  // 注册路由
  registerRoutes(app);
  logger.info("✅ Routes registered");

  // 启动优化管理器
  const optimizer = getOptimizationManager(config, logger);
  optimizer.start();
  logger.info("✅ Optimization manager started");

  // 启动服务器
  app.listen(config.server.port, () => {
    logger.info("");
    logger.info("═══════════════════════════════════════════════════════");
    logger.info(`🎉 Elysia AI Server is running!`);
    logger.info("═══════════════════════════════════════════════════════");
    logger.info(`📡 HTTP Server:     http://${config.server.ip}:${config.server.port}`);
    logger.info(`🔌 WebSocket:       ws://${config.server.ip}:${config.server.port}/ws/v1`);
    logger.info(`📚 API Docs:        http://localhost:${config.server.port}/swagger`);
    logger.info(`📊 Metrics:         http://localhost:${config.server.port}/metrics`);
    logger.info(`🏥 Health Check:    http://localhost:${config.server.port}/health`);
    logger.info("═══════════════════════════════════════════════════════");
    logger.info("");
    logger.info(`🔧 Environment:     ${process.env.NODE_ENV || "development"}`);
    logger.info(`📝 Log Level:       ${config.log.log_level}`);
    logger.info(`🎯 Default LLM:     ${config.llm.default}`);
    logger.info(`🎤 Default ASR:     ${config.asr.default}`);
    logger.info(`🔊 Default TTS:     ${config.tts.default}`);
    logger.info(`👁️  Default vLLM:    ${config.vllm.default}`);
    logger.info(`🧠 Default Memory:  ${config.memory.default}`);
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
}

// 启动应用
main().catch((error) => {
  console.error("❌ Failed to start server:", error);
  process.exit(1);
});
