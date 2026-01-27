import type { AppConfig } from "@/types/config";
import type { Logger } from "./logger";

/**
 * 性能优化管理器
 */
export class OptimizationManager {
  private logger: Logger;
  private config: AppConfig;
  private gcInterval: Timer | null = null;
  private metricsInterval: Timer | null = null;
  private metrics = {
    gcCount: 0,
    memoryBefore: 0,
    memoryAfter: 0,
    lastGC: 0,
  };

  constructor(config: AppConfig, logger: Logger) {
    this.config = config;
    this.logger = logger;
  }

  /**
   * 启动优化
   */
  start(): void {
    const optimization = (this.config as any).optimization;

    if (!optimization) {
      this.logger.warn("Optimization config not found");
      return;
    }

    // 启动 GC 优化
    if (optimization.enable_gc_optimization) {
      this.startGCOptimization(optimization.gc_interval || 300);
    }

    // 启动性能监控
    if (optimization.enable_metrics) {
      this.startMetricsCollection(optimization.metrics_interval || 60);
    }

    this.logger.info("Optimization manager started");
  }

  /**
   * 停止优化
   */
  stop(): void {
    if (this.gcInterval) {
      clearInterval(this.gcInterval);
      this.gcInterval = null;
    }

    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = null;
    }

    this.logger.info("Optimization manager stopped");
  }

  /**
   * 启动 GC 优化
   */
  private startGCOptimization(intervalSeconds: number): void {
    this.gcInterval = setInterval(() => {
      this.performGC();
    }, intervalSeconds * 1000);

    this.logger.info(`GC optimization enabled (interval: ${intervalSeconds}s)`);
  }

  /**
   * 执行垃圾回收
   */
  private performGC(): void {
    const memBefore = process.memoryUsage();
    this.metrics.memoryBefore = memBefore.heapUsed;

    // 手动触发 GC (需要运行时支持)
    if (global.gc) {
      global.gc();
      this.metrics.gcCount++;
      this.metrics.lastGC = Date.now();

      const memAfter = process.memoryUsage();
      this.metrics.memoryAfter = memAfter.heapUsed;
      const freed = this.metrics.memoryBefore - this.metrics.memoryAfter;

      this.logger.debug(
        {
          gc: {
            count: this.metrics.gcCount,
            memoryBefore: `${(this.metrics.memoryBefore / 1024 / 1024).toFixed(2)} MB`,
            memoryAfter: `${(this.metrics.memoryAfter / 1024 / 1024).toFixed(2)} MB`,
            freed: `${(freed / 1024 / 1024).toFixed(2)} MB`,
          },
        },
        "GC performed",
      );
    }
  }

  /**
   * 启动性能指标收集
   */
  private startMetricsCollection(intervalSeconds: number): void {
    this.metricsInterval = setInterval(() => {
      this.collectMetrics();
    }, intervalSeconds * 1000);

    this.logger.info(`Metrics collection enabled (interval: ${intervalSeconds}s)`);
  }

  /**
   * 收集性能指标
   */
  private collectMetrics(): void {
    const memory = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    this.logger.debug(
      {
        performance: {
          memory: {
            heapUsed: `${(memory.heapUsed / 1024 / 1024).toFixed(2)} MB`,
            heapTotal: `${(memory.heapTotal / 1024 / 1024).toFixed(2)} MB`,
            external: `${(memory.external / 1024 / 1024).toFixed(2)} MB`,
            rss: `${(memory.rss / 1024 / 1024).toFixed(2)} MB`,
          },
          cpu: {
            user: `${(cpuUsage.user / 1000).toFixed(2)} ms`,
            system: `${(cpuUsage.system / 1000).toFixed(2)} ms`,
          },
          uptime: `${(process.uptime() / 60).toFixed(2)} minutes`,
          gc: {
            count: this.metrics.gcCount,
            lastGC: this.metrics.lastGC ? new Date(this.metrics.lastGC).toISOString() : "Never",
          },
        },
      },
      "Performance Metrics",
    );
  }

  /**
   * 获取当前指标
   */
  getMetrics() {
    return {
      ...this.metrics,
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      uptime: process.uptime(),
    };
  }
}

// 单例
let optimizationManager: OptimizationManager | null = null;

export function getOptimizationManager(config: AppConfig, logger: Logger): OptimizationManager {
  if (!optimizationManager) {
    optimizationManager = new OptimizationManager(config, logger);
  }
  return optimizationManager;
}
