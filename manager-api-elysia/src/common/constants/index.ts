/**
 * 常量定义
 */

/**
 * HTTP 状态码
 */
export enum HttpStatus {
  OK = 200,
  CREATED = 201,
  NO_CONTENT = 204,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  INTERNAL_ERROR = 500,
}

/**
 * 用户状态
 */
export enum UserStatus {
  DISABLED = 0,
  ENABLED = 1,
}

/**
 * 实体状态
 */
export enum EntityStatus {
  DISABLED = 0,
  ENABLED = 1,
}

/**
 * 错误代码
 */
export enum ErrorCode {
  // 通用错误
  SUCCESS = 0,
  ERROR = 1,
  VALIDATION_ERROR = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  INTERNAL_ERROR = 500,

  // 业务错误
  LOGIN_FAILED = 1001,
  ACCOUNT_DISABLED = 1002,
  USER_NOT_FOUND = 1003,
  WRONG_PASSWORD = 1004,
  AGENT_NOT_FOUND = 2001,
  DEVICE_NOT_FOUND = 3001,
}

/**
 * 默认分页大小
 */
export const DEFAULT_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE = 100;
