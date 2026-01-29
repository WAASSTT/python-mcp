/**
 * MCP 执行器
 * 负责执行 MCP 工具调用
 */

import type { Logger } from "../utils/logger";
import type { McpBase, McpContext, McpResult } from "./mcp-base";
import { createMcpContext } from "./mcp-base";
import { McpRegistry } from "./mcp-registry";

// ============= 类型定义 =============

/** 执行选项 */
interface ExecuteOptions {
  timeout?: number; // 超时时间（毫秒）
  retries?: number; // 重试次数
  context?: Partial<McpContext>; // 执行上下文
}

/** 执行统计 */
interface ExecutionStats {
  toolName: string;
  success: boolean;
  duration: number;
  timestamp: number;
}

// ============= MCP 执行器类 =============

/** MCP 工具执行器 */
export class McpExecutor {
  private logger: Logger;
  private stats: ExecutionStats[] = [];
  private maxStatsSize = 1000;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  /** 执行工具 */
  async execute(
    toolName: string,
    params: Record<string, unknown>,
    options: ExecuteOptions = {},
  ): Promise<McpResult> {
    const startTime = Date.now();

    try {
      // 获取工具
      const tool = McpRegistry.get(toolName);
      if (!tool) {
        return this.recordFailure(toolName, startTime, "Tool not found");
      }

      // 创建上下文
      const context = createMcpContext(options.context);

      // 执行（带超时和重试）
      const result = await this.executeWithOptions(tool, params, context, options);

      // 记录统计
      this.recordSuccess(toolName, startTime);

      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return this.recordFailure(toolName, startTime, message);
    }
  }

  /** 带选项的执行 */
  private async executeWithOptions(
    tool: McpBase,
    params: Record<string, unknown>,
    context: McpContext,
    options: ExecuteOptions,
  ): Promise<McpResult> {
    const { timeout = 30000, retries = 0 } = options;

    // 执行函数
    const executeOnce = async () => {
      if (timeout > 0) {
        return this.executeWithTimeout(tool, params, context, timeout);
      }
      return tool.execute(params, context);
    };

    // 重试逻辑
    let lastError: Error | undefined;
    for (let i = 0; i <= retries; i++) {
      try {
        return await executeOnce();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        if (i < retries) {
          this.logger.warn(`Tool ${tool.name} failed, retrying... (${i + 1}/${retries})`);
          await this.sleep(Math.pow(2, i) * 1000); // 指数退避
        }
      }
    }

    throw lastError || new Error("Execution failed");
  }

  /** 带超时的执行 */
  private async executeWithTimeout(
    tool: McpBase,
    params: Record<string, unknown>,
    context: McpContext,
    timeout: number,
  ): Promise<McpResult> {
    return Promise.race([tool.execute(params, context), this.timeoutPromise(timeout)]);
  }

  /** 超时 Promise */
  private timeoutPromise(ms: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`Execution timeout after ${ms}ms`)), ms);
    });
  }

  /** 休眠 */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /** 批量执行 */
  async executeBatch(
    calls: Array<{ tool: string; params: Record<string, unknown> }>,
    options: ExecuteOptions = {},
  ): Promise<McpResult[]> {
    return Promise.all(calls.map(({ tool, params }) => this.execute(tool, params, options)));
  }

  /** 并行执行 */
  async executeParallel(
    calls: Array<{ tool: string; params: Record<string, unknown> }>,
    maxConcurrency: number = 5,
    options: ExecuteOptions = {},
  ): Promise<McpResult[]> {
    const results: McpResult[] = [];
    const queue = [...calls];

    const executeNext = async (): Promise<void> => {
      const call = queue.shift();
      if (!call) return;

      const result = await this.execute(call.tool, call.params, options);
      results.push(result);

      if (queue.length > 0) {
        await executeNext();
      }
    };

    // 启动并发执行
    const workers = Array.from({ length: Math.min(maxConcurrency, calls.length) }, () =>
      executeNext(),
    );

    await Promise.all(workers);
    return results;
  }

  /** 记录成功 */
  private recordSuccess(toolName: string, startTime: number): void {
    const duration = Date.now() - startTime;
    this.recordStats({
      toolName,
      success: true,
      duration,
      timestamp: Date.now(),
    });
    this.logger.info(`✅ Tool ${toolName} executed successfully (${duration}ms)`);
  }

  /** 记录失败 */
  private recordFailure(toolName: string, startTime: number, error: string): McpResult {
    const duration = Date.now() - startTime;
    this.recordStats({
      toolName,
      success: false,
      duration,
      timestamp: Date.now(),
    });
    this.logger.error(`❌ Tool ${toolName} failed: ${error}`);
    return {
      success: false,
      error,
    };
  }

  /** 记录统计 */
  private recordStats(stat: ExecutionStats): void {
    this.stats.push(stat);
    if (this.stats.length > this.maxStatsSize) {
      this.stats.shift();
    }
  }

  /** 获取统计信息 */
  getStats() {
    const total = this.stats.length;
    const successful = this.stats.filter((s) => s.success).length;
    const failed = total - successful;
    const avgDuration = this.stats.reduce((sum, s) => sum + s.duration, 0) / total || 0;

    const byTool = new Map<string, { count: number; avgDuration: number }>();
    for (const stat of this.stats) {
      const existing = byTool.get(stat.toolName) || { count: 0, avgDuration: 0 };
      byTool.set(stat.toolName, {
        count: existing.count + 1,
        avgDuration: (existing.avgDuration * existing.count + stat.duration) / (existing.count + 1),
      });
    }

    return {
      total,
      successful,
      failed,
      successRate: total > 0 ? (successful / total) * 100 : 0,
      avgDuration,
      byTool: Object.fromEntries(byTool),
    };
  }

  /** 清除统计 */
  clearStats(): void {
    this.stats = [];
  }
}

// ============= 导出 =============

export default McpExecutor;
