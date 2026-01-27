import { loadConfig } from "@/config/loader";
import type { App } from "@/core/server";
import { createApp } from "@/core/server";
import { registerRoutes } from "@/routes";
import { createLogger } from "@/utils/logger";
import { beforeAll, describe, expect, it } from "bun:test";

describe("Elysia AI Server", () => {
  let app: App;

  beforeAll(async () => {
    // 加载配置
    const config = await loadConfig();
    const logger = createLogger(config);

    // 创建应用并注册路由
    app = createApp(config, logger);
    registerRoutes(app);
  });

  describe("Health Check", () => {
    it("should return ok status", async () => {
      const response = await app.handle(new Request("http://localhost/health"));
      const data: any = await response.json();

      expect(data).toBeDefined();
      expect(data.status).toBe("ok");
      expect(data.timestamp).toBeDefined();
    });
  });

  describe("Root Endpoint", () => {
    it("should return server info", async () => {
      const response = await app.handle(new Request("http://localhost/"));
      const data: any = await response.json();

      expect(data).toBeDefined();
      expect(data.name).toBe("Elysia AI Server");
      expect(data.version).toBe("1.0.0");
      expect(data.documentation).toBe("/swagger");
    });
  });

  describe("LLM API", () => {
    it("should handle llm endpoint", async () => {
      const response = await app.handle(new Request("http://localhost/api/llm/providers"));

      expect(response).toBeDefined();
      expect(response.status).toBe(200);
    });
  });

  describe("ASR API", () => {
    it("should handle asr endpoint", async () => {
      const response = await app.handle(new Request("http://localhost/api/asr/providers"));

      expect(response).toBeDefined();
      expect(response.status).toBe(200);
    });
  });

  describe("TTS API", () => {
    it("should handle tts endpoint", async () => {
      const response = await app.handle(new Request("http://localhost/api/tts/providers"));

      expect(response).toBeDefined();
      expect(response.status).toBe(200);
    });
  });

  describe("vLLM API", () => {
    it("should handle vision endpoint", async () => {
      const response = await app.handle(new Request("http://localhost/api/vision/providers"));

      expect(response).toBeDefined();
      expect(response.status).toBe(200);
    });
  });

  describe("Intent API", () => {
    it("should handle intent endpoint", async () => {
      const response = await app.handle(new Request("http://localhost/api/intent/providers"));

      expect(response).toBeDefined();
      expect(response.status).toBe(200);
    });

    it("should handle intent recognition", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/intent/recognize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: "播放音乐",
            provider: "function_call",
          }),
        }),
      );

      if (response.status !== 200) {
        const error = await response.json();
        console.log("Error response:", error);
      }

      expect(response).toBeDefined();
      expect(response.status).toBe(200);
    });
  });
});
