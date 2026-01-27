import type { AppConfig } from "@/types/config";
import pino from "pino";

/**
 * 创建日志记录器
 */
export function createLogger(config: AppConfig) {
  const isDev = process.env.NODE_ENV !== "production";

  return pino({
    level: config.log.log_level.toLowerCase(),
    transport: isDev
      ? {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "yyyy-MM-dd HH:mm:ss",
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
