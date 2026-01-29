/**
 * 统一中间件管理
 * 合并所有中间件到一个文件，使用现代化语法
 */

import type { Elysia } from "elysia";
import type { Logger } from "./utils/logger";

// ============= 错误处理中间件 =============

/** 自定义错误类 */
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string,
  ) {
    super(message);
    this.name = "AppError";
  }
}

/** 错误处理中间件 */
export const errorHandler = (app: Elysia) =>
  app.onError(({ code, error, set }) => {
    // 处理自定义错误
    if (error instanceof AppError) {
      set.status = error.statusCode;
      return {
        error: error.message,
        code: error.code,
        timestamp: new Date().toISOString(),
      };
    }

    // 处理验证错误
    if (code === "VALIDATION") {
      set.status = 400;
      return {
        error: "Validation failed",
        details: (error as Error).message,
        timestamp: new Date().toISOString(),
      };
    }

    // 处理 404
    if (code === "NOT_FOUND") {
      set.status = 404;
      return {
        error: "Resource not found",
        timestamp: new Date().toISOString(),
      };
    }

    // 处理未知错误
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("❌ Unhandled error:", error);
    set.status = 500;
    return {
      error: "Internal server error",
      message: process.env.NODE_ENV === "development" ? errorMessage : undefined,
      timestamp: new Date().toISOString(),
    };
  });

// ============= 性能监控中间件 =============

/** 请求指标 */
interface RequestMetrics {
  totalRequests: number;
  successRequests: number;
  failedRequests: number;
  avgResponseTime: number;
  requestsByPath: Map<string, number>;
}

/** 全局指标 */
const metrics: RequestMetrics = {
  totalRequests: 0,
  successRequests: 0,
  failedRequests: 0,
  avgResponseTime: 0,
  requestsByPath: new Map(),
};

/** 响应时间累计（用于计算平均值） */
let totalResponseTime = 0;

/** 性能监控中间件 */
export const metricsMiddleware = (logger: Logger) => (app: Elysia) =>
  app
    .derive(({ request }) => {
      const startTime = Date.now();
      return { startTime };
    })
    .onAfterHandle(({ request, startTime, set }) => {
      const duration = Date.now() - startTime;
      const path = new URL(request.url).pathname;

      // 更新指标
      metrics.totalRequests++;
      const status = typeof set.status === "number" ? set.status : 200;
      if (status < 400) {
        metrics.successRequests++;
      } else {
        metrics.failedRequests++;
      }

      // 更新响应时间
      totalResponseTime += duration;
      metrics.avgResponseTime = totalResponseTime / metrics.totalRequests;

      // 更新路径统计
      metrics.requestsByPath.set(path, (metrics.requestsByPath.get(path) || 0) + 1);

      // 记录慢请求
      if (duration > 1000) {
        logger.warn(`Slow request: ${request.method} ${path} took ${duration}ms`);
      }

      // 记录日志
      logger.debug(`${request.method} ${path} - ${status} - ${duration}ms`);
    });

/** 获取指标数据 */
export const getMetrics = () => ({
  ...metrics,
  requestsByPath: Object.fromEntries(metrics.requestsByPath),
});

/** 重置指标 */
export const resetMetrics = () => {
  metrics.totalRequests = 0;
  metrics.successRequests = 0;
  metrics.failedRequests = 0;
  metrics.avgResponseTime = 0;
  totalResponseTime = 0;
  metrics.requestsByPath.clear();
};

// ============= 认证中间件 =============

/** 认证配置 */
interface AuthConfig {
  enabled: boolean;
  allowed_devices: string[];
}

/** Bearer Token 认证中间件 */
export const authMiddleware = (config: AuthConfig) => (app: Elysia) => {
  if (!config.enabled) return app;

  return app.derive(() => {
    // Authentication logic would go here
    return {};
  });
};

/** 设备认证中间件 */
export const deviceAuthMiddleware = (config: AuthConfig) => (app: Elysia) => {
  if (!config.enabled || config.allowed_devices.length === 0) {
    return app;
  }

  return app.derive(({ headers }) => {
    const deviceId = headers["x-device-id"];

    if (!deviceId) {
      throw new AppError("Missing device ID", 401, "MISSING_DEVICE_ID");
    }

    if (!config.allowed_devices.includes(deviceId)) {
      throw new AppError("Device not authorized", 403, "DEVICE_NOT_ALLOWED");
    }

    return { deviceId };
  });
};

// ============= 限流中间件 =============

/** 限流配置 */
interface RateLimitConfig {
  windowMs: number; // 时间窗口（毫秒）
  maxRequests: number; // 最大请求数
}

/** 限流存储 */
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/** 限流中间件 */
export const rateLimitMiddleware = (config: RateLimitConfig) => (app: Elysia) =>
  app.derive(({ request }) => {
    const identifier = request.headers.get("x-forwarded-for") || "anonymous";
    const now = Date.now();
    const record = rateLimitStore.get(identifier);

    // 检查限流
    if (record) {
      if (now < record.resetTime) {
        if (record.count >= config.maxRequests) {
          throw new AppError(
            "Too many requests, please try again later",
            429,
            "RATE_LIMIT_EXCEEDED",
          );
        }
        record.count++;
      } else {
        // 重置计数
        rateLimitStore.set(identifier, {
          count: 1,
          resetTime: now + config.windowMs,
        });
      }
    } else {
      // 新记录
      rateLimitStore.set(identifier, {
        count: 1,
        resetTime: now + config.windowMs,
      });
    }

    return {};
  });

/** 清理过期的限流记录 */
export const cleanupRateLimitStore = () => {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (now >= value.resetTime) {
      rateLimitStore.delete(key);
    }
  }
};

// 定期清理（每分钟）
setInterval(cleanupRateLimitStore, 60000);

// ============= CORS 中间件（配置） =============

/** CORS 配置 */
export const corsConfig = {
  origin: true,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"] as string[],
  allowedHeaders: ["Content-Type", "Authorization", "X-Device-Id", "X-Requested-With"],
};

// ============= 请求日志中间件 =============

/** 请求日志中间件 */
export const requestLoggerMiddleware = (logger: Logger) => (app: Elysia) =>
  app.onRequest(({ request }) => {
    const url = new URL(request.url);
    logger.info(`➡️  ${request.method} ${url.pathname}`);
  });

// ============= 导出所有中间件 =============

export const middleware = {
  errorHandler,
  metricsMiddleware,
  authMiddleware,
  deviceAuthMiddleware,
  rateLimitMiddleware,
  requestLoggerMiddleware,
  corsConfig,
} as const;

export default middleware;
