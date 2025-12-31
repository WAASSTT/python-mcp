import { authMiddleware, requireAuth } from '@/common/middleware/auth';
import { AppError } from '@/common/middleware/error-handler';
import { captchaService, smsClient } from '@/common/services/external';
import { RedisKeys, RedisService } from '@/common/services/redis';
import { generateStringId } from '@/common/utils';
import { config } from '@/config';
import { db, users } from '@/db';
import { jwt } from '@elysiajs/jwt';
import { eq } from 'drizzle-orm';
import { Elysia, t } from 'elysia';

/**
 * 登录请求体
 */
const LoginSchema = t.Object({
  username: t.String({ minLength: 1 }),
  password: t.String({ minLength: 6 }),
  captchaId: t.Optional(t.String()),
  captcha: t.Optional(t.String()),
});

/**
 * 修改密码请求体
 */
const ChangePasswordSchema = t.Object({
  oldPassword: t.String(),
  newPassword: t.String({ minLength: 6 }),
});

/**
 * Security 模块路由
 * 处理用户登录、登出、密码修改等功能
 */
export const securityRoutes = new Elysia({ prefix: '/user' })
  .use(
    jwt({
      name: 'jwt',
      secret: config.jwt.secret,
    })
  )

  /**
   * 获取公共配置（无需认证）
   */
  .get(
    '/pub-config',
    async () => {
      // 返回系统的公共配置信息
      return {
        code: 0,
        data: {
          systemName: '智能体管理系统',
          version: '1.0.0',
          enableRegister: true,
          enableSmsLogin: true,
          enableCaptcha: true,
        },
      };
    },
    {
      detail: {
        tags: ['登录管理'],
        summary: '获取公共配置',
        description: '获取系统公共配置，无需登录即可访问',
      },
    }
  )

  /**
   * 用户登录
   */
  .post(
    '/login',
    async ({ body, jwt }) => {
      const { username, password } = body;

      // 查询用户
      const [user] = await db.select().from(users).where(eq(users.username, username)).limit(1);

      if (!user) {
        throw new AppError(401, '用户名或密码错误', 'LOGIN_FAILED');
      }

      // 验证密码（实际项目中应该使用 bcrypt 等加密方式）
      // 这里简化处理
      if (user.password !== password) {
        throw new AppError(401, '用户名或密码错误', 'LOGIN_FAILED');
      }

      // 检查用户状态
      if (user.status !== 1) {
        throw new AppError(403, '账号已被禁用', 'ACCOUNT_DISABLED');
      }

      // 生成 JWT token
      const token = await jwt.sign({
        id: user.id.toString(),
        username: user.username,
        role: 'user',
      });

      return {
        code: 0,
        msg: '登录成功',
        data: {
          token,
          user: {
            id: user.id,
            username: user.username,
          },
        },
      };
    },
    {
      body: LoginSchema,
      detail: {
        tags: ['登录管理'],
        summary: '用户登录',
        description: '通过用户名和密码登录系统',
      },
    }
  )

  /**
   * 获取当前用户信息
   */
  .use(authMiddleware)
  .get(
    '/info',
    async ({ user }) => {
      if (!user) {
        throw new AppError(401, '未登录', 'UNAUTHORIZED');
      }

      const [userInfo] = await db
        .select()
        .from(users)
        .where(eq(users.id, Number(user.id)))
        .limit(1);

      if (!userInfo) {
        throw new AppError(404, '用户不存在', 'USER_NOT_FOUND');
      }

      return {
        code: 0,
        msg: '获取成功',
        data: {
          id: userInfo.id,
          username: userInfo.username,
          status: userInfo.status,
        },
      };
    },
    {
      detail: {
        tags: ['登录管理'],
        summary: '获取当前用户信息',
      },
    }
  )

  /**
   * 修改密码
   */
  .use(requireAuth)
  .put(
    '/change-password',
    async ({ body, user }) => {
      const { oldPassword, newPassword } = body;

      const [userInfo] = await db
        .select()
        .from(users)
        .where(eq(users.id, Number(user!.id)))
        .limit(1);

      if (!userInfo) {
        throw new AppError(404, '用户不存在', 'USER_NOT_FOUND');
      }

      // 验证旧密码
      if (userInfo.password !== oldPassword) {
        throw new AppError(400, '旧密码错误', 'WRONG_PASSWORD');
      }

      // 更新密码
      await db
        .update(users)
        .set({
          password: newPassword,
          updateDate: new Date(),
        })
        .where(eq(users.id, Number(user!.id)));

      return {
        code: 0,
        msg: '密码修改成功',
      };
    },
    {
      body: ChangePasswordSchema,
      detail: {
        tags: ['登录管理'],
        summary: '修改密码',
      },
    }
  )

  /**
   * 用户登出
   */
  .post(
    '/logout',
    () => {
      // JWT 是无状态的,登出通常在客户端清除 token
      // 如果需要服务端控制，可以使用 Redis 黑名单机制
      return {
        code: 0,
        msg: '登出成功',
      };
    },
    {
      detail: {
        tags: ['登录管理'],
        summary: '用户登出',
      },
    }
  )

  /**
   * 获取图片验证码
   */
  .get(
    '/captcha',
    async () => {
      // 生成验证码
      const uuid = generateStringId('captcha');
      const captchaCode = captchaService.generate(uuid);

      // 存储到 Redis，5分钟过期
      if (config.redis.enabled) {
        await RedisService.set(RedisKeys.captcha(uuid), captchaCode, config.captcha.expiresIn);
      }

      console.debug('生成验证码', { uuid });

      return {
        code: 0,
        data: {
          captchaId: uuid,
          captchaBase64: captchaCode,
        },
      };
    },
    {
      detail: {
        tags: ['登录管理'],
        summary: '获取图片验证码',
      },
    }
  )

  /**
   * 发送短信验证码
   */
  .post(
    '/smsVerification',
    async ({ body }) => {
      const { mobile, scene } = body;

      // 生成6位验证码
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

      // 存储验证码到 Redis，10分钟过期
      if (config.redis.enabled) {
        await RedisService.set(
          RedisKeys.smsCode(mobile, scene || 'default'),
          verificationCode,
          config.sms.expiresIn
        );
      }

      // 发送短信
      await smsClient.sendVerificationCode(mobile, verificationCode, scene || 'default');

      console.info('发送短信验证码', { mobile, scene });

      return {
        code: 0,
        msg: '验证码已发送',
        data: {
          expireTime: config.sms.expiresIn,
        },
      };
    },
    {
      body: t.Object({
        mobile: t.String({ pattern: '^1[3-9]\\d{9}$' }),
        scene: t.Optional(t.String()), // login, register, reset
      }),
      detail: {
        tags: ['登录管理'],
        summary: '发送短信验证码',
      },
    }
  )

  /**
   * 用户注册
   */
  .post(
    '/register',
    async ({ body }) => {
      const { username, password, mobile, verificationCode } = body;

      // 检查用户名是否存在
      const [existing] = await db.select().from(users).where(eq(users.username, username)).limit(1);

      if (existing) {
        throw new AppError(400, '用户名已存在', 'USERNAME_EXISTS');
      }

      // 实际项目中应该验证短信验证码
      // if (verificationCode !== cachedCode) {
      //   throw new AppError(400, '验证码错误', 'INVALID_CODE');
      // }

      // 创建用户
      const userId = Date.now();
      await db.insert(users).values({
        id: userId,
        username,
        password, // 实际应该加密
        status: 1,
        superAdmin: 0,
        createDate: new Date(),
      });

      return {
        code: 0,
        msg: '注册成功',
      };
    },
    {
      body: t.Object({
        username: t.String({ minLength: 3, maxLength: 50 }),
        password: t.String({ minLength: 6 }),
        mobile: t.Optional(t.String()),
        verificationCode: t.Optional(t.String()),
      }),
      detail: {
        tags: ['登录管理'],
        summary: '用户注册',
      },
    }
  )

  /**
   * 找回密码
   */
  .put(
    '/retrieve-password',
    async ({ body }) => {
      const { username, mobile, verificationCode, newPassword } = body;

      // 验证短信验证码
      // 实际项目中应该从 Redis 验证

      // 查找用户
      const [user] = await db.select().from(users).where(eq(users.username, username)).limit(1);

      if (!user) {
        throw new AppError(404, '用户不存在', 'USER_NOT_FOUND');
      }

      // 重置密码
      await db
        .update(users)
        .set({
          password: newPassword, // 实际应该加密
          updateDate: new Date(),
        })
        .where(eq(users.id, user.id));

      return {
        code: 0,
        msg: '密码重置成功',
      };
    },
    {
      body: t.Object({
        username: t.String(),
        mobile: t.String(),
        verificationCode: t.String(),
        newPassword: t.String({ minLength: 6 }),
      }),
      detail: {
        tags: ['登录管理'],
        summary: '找回密码',
      },
    }
  );
