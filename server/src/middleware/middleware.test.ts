import { describe, expect, it } from "bun:test";
import { Elysia } from "elysia";

describe("Middleware", () => {
  describe("Error Handler", () => {
    it("should handle errors gracefully", async () => {
      const { errorHandler } = await import("@/middleware/error");

      const app = new Elysia().use(errorHandler).get("/error", () => {
        throw new Error("Test error");
      });

      const response = await app.handle(new Request("http://localhost/error"));

      expect(response.status).toBe(500);
    });
  });

  describe("Metrics Middleware", () => {
    it("should collect metrics", async () => {
      const { metricsMiddleware } = await import("@/middleware/metrics");
      const { createLogger } = await import("@/utils/logger");
      const { loadConfig } = await import("@/config/loader");

      const config = await loadConfig();
      const logger = createLogger(config);

      const app = new Elysia()
        .use(metricsMiddleware(logger))
        .get("/test", () => ({ message: "ok" }));

      const response = await app.handle(new Request("http://localhost/test"));
      expect(response.status).toBe(200);
    });
  });
});
