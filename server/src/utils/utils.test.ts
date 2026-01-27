import { describe, expect, it } from "bun:test";

describe("Utils", () => {
  describe("Helpers", () => {
    it("should retry function on failure", async () => {
      const { retry } = await import("@/utils/helpers");

      let attempts = 0;
      const fn = async () => {
        attempts++;
        if (attempts < 3) {
          throw new Error("Failed");
        }
        return "success";
      };

      const result = await retry(fn, { retries: 3, delay: 10 });
      expect(result).toBe("success");
      expect(attempts).toBe(3);
    });

    it("should timeout long-running operation", async () => {
      const { timeout } = await import("@/utils/helpers");

      const longOperation = new Promise((resolve) => {
        setTimeout(() => resolve("done"), 1000);
      });

      try {
        await timeout(longOperation, 100);
        expect(true).toBe(false); // Should not reach here
      } catch (error: any) {
        expect(error.message).toContain("timed out");
      }
    });

    it("should batch process items", async () => {
      const { batch } = await import("@/utils/helpers");

      const items = [1, 2, 3, 4, 5];
      const processor = async (batch: number[]) => {
        return batch.map((item) => item * 2);
      };

      const results = await batch(items, 2, processor);
      expect(results).toEqual([2, 4, 6, 8, 10]);
    });
  });

  describe("Logger", () => {
    it("should create logger with config", async () => {
      const { createLogger } = await import("@/utils/logger");
      const { loadConfig } = await import("@/config/loader");

      const config = await loadConfig();
      const logger = createLogger(config);

      expect(logger).toBeDefined();
      expect(logger.info).toBeDefined();
      expect(logger.error).toBeDefined();
      expect(logger.warn).toBeDefined();
      expect(logger.debug).toBeDefined();
    });
  });

  describe("Factory", () => {
    it("should create factory instance", async () => {
      const { ProviderFactory } = await import("@/utils/factory");
      const { loadConfig } = await import("@/config/loader");
      const { createLogger } = await import("@/utils/logger");

      const config = await loadConfig();
      const logger = createLogger(config);
      const factory = new ProviderFactory(config, logger);

      expect(factory).toBeDefined();
      expect(factory.getLLMProvider).toBeDefined();
      expect(factory.getIntentProvider).toBeDefined();
      expect(factory.getMemoryProvider).toBeDefined();
    });
  });
});
