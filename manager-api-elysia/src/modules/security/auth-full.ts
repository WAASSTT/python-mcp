import { AppError } from '@/common/middleware/error-handler';
import { generateId, hashPassword, verifyPassword } from '@/common/utils';
import { config } from '@/config';
import { db, roles, users } from '@/db';
import { verifySmsCode } from '@/modules/sms';
import { bearer } from '@elysiajs/bearer';
import { jwt } from '@elysiajs/jwt';
import { eq } from 'drizzle-orm';
import { Elysia, t } from 'elysia';

/**
 * 完整的认证和授权模块
 */
export const securityFullRoutes = new Elysia({ prefix: '/auth' })
  .use(
    jwt({
      name: 'jwt',
      secret: config.jwt.secret,
      exp: config.jwt.expiresIn,
    })
  )
  .use(bearer())

  /**
   * 用户注册（手机号 + 密码）
   */
  .post(
    '/register',
    async ({ body, jwt }) => {
      const { username, password, phone, smsCode, email } = body;

      // 验证短信验证码
      if (!verifySmsCode('register', phone, smsCode)) {
        throw new AppError(400, '验证码错误或已过期');
      }

      // 检查用户名是否已存在
      const [existingUsername] = await db
        .select()
        .from(users)
        .where(eq(users.username, username))
        .limit(1);

      if (existingUsername) {
        throw new AppError(400, '用户名已存在');
      }

      // 检查手机号是否已存在
      const [existingPhone] = await db.select().from(users).where(eq(users.mobile, phone)).limit(1);

      if (existingPhone) {
        throw new AppError(400, '手机号已注册');
      }

      // 创建用户
      const userId = generateId();
      const hashedPassword = await hashPassword(password);

      await db.insert(users).values({
        id: userId,
        username,
        password: hashedPassword,
        mobile: phone,
        email,
        status: 1, // 正常状态
        roleId: 'role_user', // 默认用户角色
      });

      // 生成 JWT token
      const token = await jwt.sign({
        userId,
        username,
        roleId: 'role_user',
      });

      return {
        code: 0,
        msg: '注册成功',
        data: {
          token,
          user: {
            id: userId,
            username,
            phone,
            email,
          },
        },
      };
    },
    {
      body: t.Object({
        username: t.String(),
        password: t.String(),
        phone: t.String(),
        smsCode: t.String(),
        email: t.Optional(t.String()),
      }),
      detail: {
        tags: ['认证授权'],
        summary: '用户注册',
      },
    }
  )

  /**
   * 用户名密码登录
   */
  .post(
    '/login',
    async ({ body, jwt }) => {
      const { username, password } = body;

      // 查询用户
      const [user] = await db.select().from(users).where(eq(users.username, username)).limit(1);

      if (!user) {
        throw new AppError(404, '用户不存在');
      }

      // 验证密码
      const isValid = await verifyPassword(password, user.password);
      if (!isValid) {
        throw new AppError(401, '密码错误');
      }

      // 检查用户状态
      if (user.status !== 1) {
        throw new AppError(403, '账号已被禁用');
      }

      // 生成 JWT token
      const token = await jwt.sign({
        userId: user.id,
        username: user.username,
        roleId: user.roleId,
      });

      return {
        code: 0,
        msg: '登录成功',
        data: {
          token,
          user: {
            id: user.id,
            username: user.username,
            mobile: user.mobile,
            email: user.email,
            roleId: user.roleId,
          },
        },
      };
    },
    {
      body: t.Object({
        username: t.String(),
        password: t.String(),
      }),
      detail: {
        tags: ['认证授权'],
        summary: '用户名密码登录',
      },
    }
  )

  /**
   * 手机号验证码登录
   */
  .post(
    '/login-sms',
    async ({ body, jwt }) => {
      const { phone, smsCode } = body;

      // 验证短信验证码
      if (!verifySmsCode('login', phone, smsCode)) {
        throw new AppError(400, '验证码错误或已过期');
      }

      // 查询用户
      const [user] = await db.select().from(users).where(eq(users.mobile, phone)).limit(1);

      if (!user) {
        throw new AppError(404, '用户不存在');
      }

      // 检查用户状态
      if (user.status !== 1) {
        throw new AppError(403, '账号已被禁用');
      }

      // 生成 JWT token
      const token = await jwt.sign({
        userId: user.id,
        username: user.username,
        roleId: user.roleId,
      });

      return {
        code: 0,
        msg: '登录成功',
        data: {
          token,
          user: {
            id: user.id,
            username: user.username,
            mobile: user.mobile,
            email: user.email,
            roleId: user.roleId,
          },
        },
      };
    },
    {
      body: t.Object({
        phone: t.String(),
        smsCode: t.String(),
      }),
      detail: {
        tags: ['认证授权'],
        summary: '手机号验证码登录',
      },
    }
  )

  /**
   * 重置密码（忘记密码）
   */
  .post(
    '/reset-password',
    async ({ body }) => {
      const { phone, smsCode, newPassword } = body;

      // 验证短信验证码
      if (!verifySmsCode('reset', phone, smsCode)) {
        throw new AppError(400, '验证码错误或已过期');
      }

      // 查询用户
      const [user] = await db.select().from(users).where(eq(users.mobile, phone)).limit(1);

      if (!user) {
        throw new AppError(404, '用户不存在');
      }

      // 更新密码
      const hashedPassword = await hashPassword(newPassword);
      await db
        .update(users)
        .set({
          password: hashedPassword,
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
        phone: t.String(),
        smsCode: t.String(),
        newPassword: t.String(),
      }),
      detail: {
        tags: ['认证授权'],
        summary: '重置密码',
      },
    }
  )

  /**
   * 获取当前用户信息
   */
  .get(
    '/user-info',
    async ({ bearer, jwt }) => {
      if (!bearer) {
        throw new AppError(401, '未提供认证令牌');
      }

      const payload = await jwt.verify(bearer);
      if (!payload) {
        throw new AppError(401, '无效的令牌');
      }

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, payload.userId as string))
        .limit(1);

      if (!user) {
        throw new AppError(404, '用户不存在');
      }

      // 查询角色信息
      const [role] = user.roleId
        ? await db.select().from(roles).where(eq(roles.id, user.roleId)).limit(1)
        : [];

      return {
        code: 0,
        data: {
          id: user.id,
          username: user.username,
          mobile: user.mobile,
          email: user.email,
          status: user.status,
          roleId: user.roleId,
          roleName: role?.name,
          permissions: role?.permissions ? JSON.parse(role.permissions) : [],
        },
      };
    },
    {
      detail: {
        tags: ['认证授权'],
        summary: '获取当前用户信息',
      },
    }
  )

  /**
   * 修改密码（需要验证旧密码）
   */
  .post(
    '/change-password',
    async ({ bearer, jwt, body }) => {
      if (!bearer) {
        throw new AppError(401, '未提供认证令牌');
      }

      const payload = await jwt.verify(bearer);
      if (!payload) {
        throw new AppError(401, '无效的令牌');
      }

      const { oldPassword, newPassword } = body;

      // 查询用户
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, payload.userId as string))
        .limit(1);

      if (!user) {
        throw new AppError(404, '用户不存在');
      }

      // 验证旧密码
      const isValid = await verifyPassword(oldPassword, user.password);
      if (!isValid) {
        throw new AppError(400, '旧密码错误');
      }

      // 更新密码
      const hashedPassword = await hashPassword(newPassword);
      await db
        .update(users)
        .set({
          password: hashedPassword,
          updateDate: new Date(),
        })
        .where(eq(users.id, user.id));

      return {
        code: 0,
        msg: '密码修改成功',
      };
    },
    {
      body: t.Object({
        oldPassword: t.String(),
        newPassword: t.String(),
      }),
      detail: {
        tags: ['认证授权'],
        summary: '修改密码',
      },
    }
  )

  /**
   * 登出
   */
  .post(
    '/logout',
    async () => {
      // 这里应该将 token 加入黑名单（使用 Redis）
      // 简化处理：直接返回成功
      return {
        code: 0,
        msg: '登出成功',
      };
    },
    {
      detail: {
        tags: ['认证授权'],
        summary: '登出',
      },
    }
  )

  /**
   * 刷新 token
   */
  .post(
    '/refresh-token',
    async ({ bearer, jwt }) => {
      if (!bearer) {
        throw new AppError(401, '未提供认证令牌');
      }

      const payload = await jwt.verify(bearer);
      if (!payload) {
        throw new AppError(401, '无效的令牌');
      }

      // 生成新 token
      const newToken = await jwt.sign({
        userId: payload.userId,
        username: payload.username,
        roleId: payload.roleId,
      });

      return {
        code: 0,
        data: {
          token: newToken,
        },
      };
    },
    {
      detail: {
        tags: ['认证授权'],
        summary: '刷新令牌',
      },
    }
  );
