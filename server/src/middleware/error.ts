import { Elysia } from "elysia";

/**
 * 错误处理中间件
 */
export const errorHandler = new Elysia({ name: "error-handler" }).onError(
  ({ code, error, set }) => {
    // 日志记录
    console.error(`[Error] ${code}:`, error);

    // 设置响应状态
    switch (code) {
      case "VALIDATION":
        set.status = 400;
        return {
          success: false,
          error: "Validation Error",
          message: error.message,
        };

      case "NOT_FOUND":
        set.status = 404;
        return {
          success: false,
          error: "Not Found",
          message: "The requested resource was not found",
        };

      case "PARSE":
        set.status = 400;
        return {
          success: false,
          error: "Parse Error",
          message: "Failed to parse request body",
        };

      case "INTERNAL_SERVER_ERROR":
        set.status = 500;
        return {
          success: false,
          error: "Internal Server Error",
          message: error.message || "An unexpected error occurred",
        };

      case "UNKNOWN":
        set.status = 500;
        return {
          success: false,
          error: "Unknown Error",
          message: error.message || "An unknown error occurred",
        };

      default:
        set.status = 500;
        return {
          success: false,
          error: code,
          message: (error as any)?.message || "An error occurred",
        };
    }
  },
);
