import type { AppConfig } from "@/types/config";
import pino from "pino";

/**
 * 创建日志记录器
 * 兼容两种参数形式:
 * 1. 完整的 AppConfig 对象
 * 2. 仅 log 配置对象
 */
export function createLogger(configOrLog: AppConfig | AppConfig["log"] | any) {
  const isDev = process.env.NODE_ENV !== "production";

  // 判断是完整 AppConfig 还是 log 配置
  const logConfig = "log" in configOrLog ? configOrLog.log : configOrLog;

  // 获取日志级别，兼容不同的字段名
  const logLevel = (logConfig.log_level || logConfig.level || "info").toLowerCase();

  return pino({
    level: logLevel,
    transport: isDev
      ? {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "yyyy-mm-dd HH:MM:ss",
            ignore: "pid,hostname",
            singleLine: false,
          },
        }
      : undefined,
    formatters: {
      level: (label) => {
        return { level: label.toUpperCase() };
      },
      bindings: (bindings) => {
        return {
          pid: bindings.pid,
          host: bindings.hostname,
        };
      },
    },
    timestamp: () => `,"time":"${new Date().toISOString()}"`,
  });
}

export type Logger = ReturnType<typeof createLogger>;
