/**
 * Redis 服务封装
 * 生产环境使用真实的 Redis 连接
 */

import type { RedisClientType } from 'redis';
import { createClient } from 'redis';
import { config } from '../../config';

// Redis 客户端实例
let redisClient: RedisClientType | null = null;

/**
 * 获取 Redis 客户端
 */
export async function getRedisClient(): Promise<RedisClientType> {
  if (!redisClient) {
    if (config.redis?.enabled) {
      // 生产环境:使用真实 Redis
      redisClient = createClient({
        socket: {
          host: config.redis.host || 'localhost',
          port: config.redis.port || 6379,
        },
        password: config.redis.password,
        database: config.redis.db || 0,
      });

      redisClient.on('error', err => {
        console.error('Redis Client Error:', err);
      });

      await redisClient.connect();
    }
  }

  if (!redisClient) {
    throw new Error('Redis 未配置或未启用,请在配置文件中启用 Redis');
  }

  return redisClient;
}

/**
 * Redis 工具类
 */
export class RedisService {
  /**
   * 设置键值对
   */
  static async set(key: string, value: string, expiresIn?: number): Promise<void> {
    const client = await getRedisClient();
    if (expiresIn) {
      await client.setEx(key, expiresIn, value);
    } else {
      await client.set(key, value);
    }
  }

  /**
   * 获取值
   */
  static async get(key: string): Promise<string | null> {
    const client = await getRedisClient();
    return await client.get(key);
  }

  /**
   * 删除键
   */
  static async delete(key: string): Promise<void> {
    const client = await getRedisClient();
    await client.del(key);
  }

  /**
   * 检查键是否存在
   */
  static async exists(key: string): Promise<boolean> {
    const client = await getRedisClient();
    const result = await client.exists(key);
    return result === 1;
  }

  /**
   * 设置过期时间
   */
  static async expire(key: string, seconds: number): Promise<void> {
    const client = await getRedisClient();
    await client.expire(key, seconds);
  }

  /**
   * 获取剩余过期时间
   */
  static async ttl(key: string): Promise<number> {
    const client = await getRedisClient();
    return await client.ttl(key);
  }

  /**
   * 关闭 Redis 连接
   */
  static async close(): Promise<void> {
    if (redisClient) {
      await redisClient.quit();
      redisClient = null;
    }
  }
}

/**
 * Redis 键生成器
 */
export const RedisKeys = {
  // 聊天历史下载令牌
  chatHistoryDownload: (uuid: string) => `chat_history:download:${uuid}`,

  // 音频播放令牌
  audioPlayToken: (token: string) => `audio:play:${token}`,

  // 验证码
  captcha: (uuid: string) => `captcha:${uuid}`,

  // 短信验证码
  smsCode: (mobile: string, scene: string) => `sms:${scene}:${mobile}`,

  // 用户会话
  userSession: (userId: number) => `user:session:${userId}`,

  // 配置缓存
  configCache: (key: string) => `config:${key}`,

  // 速率限制
  rateLimit: (ip: string, endpoint: string) => `rate_limit:${ip}:${endpoint}`,
};
