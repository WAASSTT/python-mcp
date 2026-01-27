import type { Logger } from "@/utils/logger";
import { Elysia } from "elysia";

interface RateLimitConfig {
  max: number; // 最大请求数
  window: number; // 时间窗口（毫秒）
  message?: string;
}

/**
 * 速率限制中间件
 */
export function rateLimit(config: RateLimitConfig, logger: Logger) {
  const { max, window, message = "Too many requests" } = config;
  const requests = new Map<string, number[]>();

  // 定期清理过期数据
  setInterval(() => {
    const now = Date.now();
    for (const [key, times] of requests.entries()) {
      const validTimes = times.filter((time) => now - time < window);
      if (validTimes.length === 0) {
        requests.delete(key);
      } else {
        requests.set(key, validTimes);
      }
    }
  }, window);

  return new Elysia({ name: "rate-limit" }).derive(({ request, set }) => {
    const identifier = request.headers.get("x-forwarded-for") || "unknown";
    const now = Date.now();

    // 获取该标识符的请求记录
    const userRequests = requests.get(identifier) || [];

    // 过滤有效时间窗口内的请求
    const validRequests = userRequests.filter((time) => now - time < window);

    // 检查是否超限
    if (validRequests.length >= max) {
      set.status = 429;
      logger.warn(`Rate limit exceeded for ${identifier}`);
      throw new Error(message);
    }

    // 记录本次请求
    validRequests.push(now);
    requests.set(identifier, validRequests);

    return {};
  });
}
