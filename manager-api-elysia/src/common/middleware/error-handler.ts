import { Elysia } from 'elysia';

/**
 * 自定义错误类
 */
export class AppError extends Error {
  constructor(public statusCode: number, public message: string, public code?: string) {
    super(message);
    this.name = 'AppError';
  }
}

/**
 * 错误处理中间件
 */
export const errorHandler = new Elysia({ name: 'error-handler' })
  .onError(({ code, error, set }) => {
    console.error('错误:', error);

    // 处理自定义应用错误
    if (error instanceof AppError) {
      set.status = error.statusCode;
      return {
        code: error.code || 'ERROR',
        message: error.message,
        timestamp: new Date().toISOString(),
      };
    }

    // 处理验证错误
    if (code === 'VALIDATION') {
      set.status = 400;
      return {
        code: 'VALIDATION_ERROR',
        message: '请求参数验证失败',
        errors: error.message,
        timestamp: new Date().toISOString(),
      };
    }

    // 处理 404 错误
    if (code === 'NOT_FOUND') {
      set.status = 404;
      return {
        code: 'NOT_FOUND',
        message: '请求的资源不存在',
        timestamp: new Date().toISOString(),
      };
    }

    // 处理其他错误
    set.status = 500;
    const errorMessage = 'message' in error ? error.message : '服务器内部错误';
    return {
      code: 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'development' ? errorMessage : '服务器内部错误',
      timestamp: new Date().toISOString(),
    };
  })
  .as('global');
