import type { App } from "@/core/server";
import { asrRoutes } from "./asr";
import { intentRoutes } from "./intent";
import { llmRoutes } from "./llm";
import { memoryRoutes } from "./memory";
import { toolsRoutes } from "./tools";
import { ttsRoutes } from "./tts";
import { vllmRoutes } from "./vllm";

/**
 * 注册所有路由
 */
export function registerRoutes(app: App) {
  return app
    .use(llmRoutes)
    .use(asrRoutes)
    .use(ttsRoutes)
    .use(vllmRoutes)
    .use(intentRoutes)
    .use(memoryRoutes)
    .use(toolsRoutes);
}
