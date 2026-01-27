import type { Logger } from "@/utils/logger";
import { Elysia } from "elysia";

/**
 * 性能监控中间件
 */
export function metricsMiddleware(logger: Logger) {
  const metrics = {
    requests: 0,
    errors: 0,
    totalDuration: 0,
    responseTimes: [] as number[],
  };

  // 每分钟输出一次统计
  setInterval(() => {
    if (metrics.requests > 0) {
      const avgResponseTime = metrics.totalDuration / metrics.requests;
      const errorRate = (metrics.errors / metrics.requests) * 100;

      logger.info(
        {
          metrics: {
            requests: metrics.requests,
            errors: metrics.errors,
            errorRate: `${errorRate.toFixed(2)}%`,
            avgResponseTime: `${avgResponseTime.toFixed(2)}ms`,
            p95: calculatePercentile(metrics.responseTimes, 0.95),
            p99: calculatePercentile(metrics.responseTimes, 0.99),
          },
        },
        "Performance Metrics",
      );

      // 重置统计
      metrics.requests = 0;
      metrics.errors = 0;
      metrics.totalDuration = 0;
      metrics.responseTimes = [];
    }
  }, 60000);

  return new Elysia({ name: "metrics" })
    .derive(() => {
      const startTime = Date.now();

      return {
        startTime,
      };
    })
    .onAfterHandle(({ startTime }) => {
      const duration = Date.now() - startTime;
      metrics.requests++;
      metrics.totalDuration += duration;
      metrics.responseTimes.push(duration);

      // 限制数组大小
      if (metrics.responseTimes.length > 1000) {
        metrics.responseTimes.shift();
      }
    })
    .onError(() => {
      metrics.errors++;
    })
    .get(
      "/metrics",
      () => ({
        success: true,
        data: {
          requests: metrics.requests,
          errors: metrics.errors,
          errorRate: metrics.requests > 0 ? (metrics.errors / metrics.requests) * 100 : 0,
          avgResponseTime: metrics.requests > 0 ? metrics.totalDuration / metrics.requests : 0,
          uptime: process.uptime(),
          memory: process.memoryUsage(),
        },
      }),
      {
        detail: {
          tags: ["Health"],
          summary: "Get metrics",
          description: "Get server performance metrics",
        },
      },
    );
}

/**
 * 计算百分位数
 */
function calculatePercentile(values: number[], percentile: number): number {
  if (values.length === 0) return 0;

  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil(sorted.length * percentile) - 1;
  return sorted[index] || 0;
}
