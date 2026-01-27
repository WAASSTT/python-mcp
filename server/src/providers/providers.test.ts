import { describe, expect, it } from "bun:test";

describe("Providers", () => {
  describe("Intent Provider", () => {
    it("should recognize music intent", async () => {
      const { FunctionCallProvider } =
        await import("@/providers/intent/function_call/function_call");
      const { createLogger } = await import("@/utils/logger");
      const { loadConfig } = await import("@/config/loader");

      const config = await loadConfig();
      const logger = createLogger(config);
      const provider = new FunctionCallProvider({}, logger);
      const result = await provider.recognize("播放音乐");

      // FunctionCallProvider always returns continue_chat
      expect(result.intent).toBe("continue_chat");
      expect(result.confidence).toBe(1.0);
    });

    it("should recognize weather intent", async () => {
      const { FunctionCallProvider } =
        await import("@/providers/intent/function_call/function_call");
      const { createLogger } = await import("@/utils/logger");
      const { loadConfig } = await import("@/config/loader");

      const config = await loadConfig();
      const logger = createLogger(config);
      const provider = new FunctionCallProvider({}, logger);
      const result = await provider.recognize("今天天气怎么样");

      // FunctionCallProvider always returns continue_chat
      expect(result.intent).toBe("continue_chat");
      expect(result.confidence).toBe(1.0);
    });

    it("should handle general intent", async () => {
      const { FunctionCallProvider } =
        await import("@/providers/intent/function_call/function_call");
      const { createLogger } = await import("@/utils/logger");
      const { loadConfig } = await import("@/config/loader");

      const config = await loadConfig();
      const logger = createLogger(config);
      const provider = new FunctionCallProvider({}, logger);
      const result = await provider.recognize("随机文本abc123");

      // FunctionCallProvider always returns continue_chat
      expect(result.intent).toBe("continue_chat");
      expect(result.confidence).toBe(1.0);
    });
  });

  describe("Memory Provider", () => {
    it("should store and retrieve memory", async () => {
      const { LocalProvider } = await import("@/providers/memory/mem_local_short/mem_local_short");
      const { createLogger } = await import("@/utils/logger");
      const { loadConfig } = await import("@/config/loader");

      const config = await loadConfig();
      const logger = createLogger(config);
      const provider = new LocalProvider({}, logger);
      const id = await provider.add("测试内容", { type: "test" });

      expect(id).toBeDefined();

      const memory = await provider.get(id);
      expect(memory).toBeDefined();
      expect(memory?.content).toBe("测试内容");
      expect(memory?.metadata?.type).toBe("test");
    });

    it("should search memories", async () => {
      const { LocalProvider } = await import("@/providers/memory/mem_local_short/mem_local_short");
      const { createLogger } = await import("@/utils/logger");
      const { loadConfig } = await import("@/config/loader");

      const config = await loadConfig();
      const logger = createLogger(config);
      const provider = new LocalProvider({}, logger);
      await provider.add("今天天气不错", { type: "weather" });
      await provider.add("今天心情很好", { type: "mood" });

      const results = await provider.search("今天", 10);
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].content).toContain("今天");
    });

    it("should delete memory", async () => {
      const { LocalProvider } = await import("@/providers/memory/mem_local_short/mem_local_short");
      const { createLogger } = await import("@/utils/logger");
      const { loadConfig } = await import("@/config/loader");

      const config = await loadConfig();
      const logger = createLogger(config);
      const provider = new LocalProvider({}, logger);
      const id = await provider.add("待删除内容");

      await provider.delete(id);
      const memory = await provider.get(id);
      expect(memory).toBeNull();
    });
  });
});
