/**
 * 公共类型定义
 */

/**
 * 分页请求参数
 */
export interface PageParams {
  page?: number;
  limit?: number;
  order?: string;
  asc?: boolean;
}

/**
 * 分页响应数据
 */
export interface PageData<T> {
  list: T[];
  total: number;
  page: number;
  limit: number;
}

/**
 * 标准响应格式
 */
export interface Result<T = any> {
  code: number;
  message: string;
  data?: T;
}

/**
 * 用户信息
 */
export interface UserInfo {
  id: string;
  username: string;
  realName?: string;
  email?: string;
  mobile?: string;
  roleId?: string;
  status: number;
}

/**
 * JWT Payload
 */
export interface JwtPayload {
  id: string;
  username: string;
  role: string;
}
