import { AppError } from '@/common/middleware/error-handler';
import { smsClient } from '@/common/services/external';
import { RedisService } from '@/common/services/redis';
import { db, users } from '@/db';
import { eq } from 'drizzle-orm';
import { Elysia, t } from 'elysia';

/**
 * 短信验证服务
 */
export const smsRoutes = new Elysia({ prefix: '/sms' })

  /**
   * 发送注册验证码
   */
  .post(
    '/send-register-code',
    async ({ body }) => {
      const { phone } = body;

      // 检查手机号是否已注册
      const [existingUser] = await db.select().from(users).where(eq(users.mobile, phone)).limit(1);

      if (existingUser) {
        throw new AppError(400, '该手机号已注册');
      }

      // 生成 6 位验证码
      const code = Math.floor(100000 + Math.random() * 900000).toString();

      // 存储验证码到 Redis（5分钟有效期）
      await RedisService.set(`sms:register:${phone}`, code, 5 * 60);
      // 发送验证码（可配置具体 provider）
      await smsClient.sendVerificationCode(phone, code, 'register');

      return {
        code: 0,
        msg: '验证码已发送',
        // 开发环境下返回验证码方便测试
        data: process.env.NODE_ENV === 'development' ? { code } : undefined,
      };
    },
    {
      body: t.Object({
        phone: t.String(),
      }),
      detail: {
        tags: ['短信验证'],
        summary: '发送注册验证码',
      },
    }
  )

  /**
   * 发送登录验证码
   */
  .post(
    '/send-login-code',
    async ({ body }) => {
      const { phone } = body;

      // 检查手机号是否已注册
      const [user] = await db.select().from(users).where(eq(users.mobile, phone)).limit(1);

      if (!user) {
        throw new AppError(404, '该手机号未注册');
      }

      // 生成 6 位验证码
      const code = Math.floor(100000 + Math.random() * 900000).toString();

      // 存储验证码到 Redis（5分钟有效期）
      await RedisService.set(`sms:login:${phone}`, code, 5 * 60);
      // 发送验证码
      await smsClient.sendVerificationCode(phone, code, 'login');

      return {
        code: 0,
        msg: '验证码已发送',
        data: process.env.NODE_ENV === 'development' ? { code } : undefined,
      };
    },
    {
      body: t.Object({
        phone: t.String(),
      }),
      detail: {
        tags: ['短信验证'],
        summary: '发送登录验证码',
      },
    }
  )

  /**
   * 发送重置密码验证码
   */
  .post(
    '/send-reset-code',
    async ({ body }) => {
      const { phone } = body;

      // 检查手机号是否已注册
      const [user] = await db.select().from(users).where(eq(users.mobile, phone)).limit(1);

      if (!user) {
        throw new AppError(404, '该手机号未注册');
      }

      // 生成 6 位验证码
      const code = Math.floor(100000 + Math.random() * 900000).toString();

      // 存储验证码到 Redis（5分钟有效期）
      await RedisService.set(`sms:reset:${phone}`, code, 5 * 60);
      // 发送验证码
      await smsClient.sendVerificationCode(phone, code, 'reset');

      return {
        code: 0,
        msg: '验证码已发送',
        data: process.env.NODE_ENV === 'development' ? { code } : undefined,
      };
    },
    {
      body: t.Object({
        phone: t.String(),
      }),
      detail: {
        tags: ['短信验证'],
        summary: '发送重置密码验证码',
      },
    }
  );

/**
 * 验证短信验证码
 */
export async function verifySmsCode(
  type: 'register' | 'login' | 'reset',
  phone: string,
  code: string
): Promise<boolean> {
  const key = `sms:${type}:${phone}`;
  const stored = await RedisService.get(key);

  if (!stored) return false;

  if (stored === code) {
    await RedisService.delete(key);
    return true;
  }

  return false;
}
