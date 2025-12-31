/**
 * 工具函数集合
 */

// 简单的ID生成器（使用时间戳 + 随机数）
let idCounter = 0;

/**
 * 生成数字ID（模拟Java的雪花算法）
 * 返回 bigint 数字ID
 */
export function generateId(prefix?: string): number {
  // 使用时间戳（毫秒） + 计数器 + 随机数生成唯一ID
  const timestamp = Date.now();
  idCounter = (idCounter + 1) % 10000;
  const random = Math.floor(Math.random() * 100);
  // 生成一个大数字ID
  return timestamp * 100000 + idCounter * 100 + random;
}

/**
 * 生成字符串ID (用于VARCHAR类型的主键)
 */
export function generateStringId(prefix: string = 'id'): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 11);
  return `${prefix}_${timestamp}_${random}`;
}

/**
 * 延迟函数
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 格式化日期
 */
export function formatDate(date: Date, format: string = 'YYYY-MM-DD HH:mm:ss'): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return format
    .replace('YYYY', String(year))
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds);
}

/**
 * 判断是否为有效的邮箱
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * 判断是否为有效的手机号
 */
export function isValidMobile(mobile: string): boolean {
  const mobileRegex = /^1[3-9]\d{9}$/;
  return mobileRegex.test(mobile);
}

/**
 * Hash password using Bun's built-in password hashing
 */
export async function hashPassword(password: string): Promise<string> {
  return await Bun.password.hash(password);
}

/**
 * Verify password using Bun's built-in password verification
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await Bun.password.verify(password, hash);
}

/**
 * 构建分页响应
 */
export function buildPageResponse<T>(
  list: T[],
  total: number,
  page: number = 1,
  limit: number = 10
) {
  return {
    list,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}
