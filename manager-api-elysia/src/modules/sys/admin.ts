import { requireAuth, requireRole } from '@/common/middleware/auth';
import { AppError } from '@/common/middleware/error-handler';
import { db, devices, users } from '@/db';
import { and, eq, like, sql } from 'drizzle-orm';
import { Elysia, t } from 'elysia';

/**
 * 管理员功能模块
 */
export const adminRoutes = new Elysia({ prefix: '/admin' })
  .use(requireAuth)
  .use(requireRole(['admin', 'superAdmin']))

  /**
   * 获取用户列表
   */
  .get(
    '/users',
    async ({ query }) => {
      const { page = 1, limit = 10, username, status } = query as any;

      let conditions = [];
      if (username) {
        conditions.push(like(users.username, `%${username}%`));
      }
      if (status !== undefined) {
        conditions.push(eq(users.status, Number(status)));
      }

      const userList = await db
        .select({
          id: users.id,
          username: users.username,
          status: users.status,
          superAdmin: users.superAdmin,
          createDate: users.createDate,
          updateDate: users.updateDate,
        })
        .from(users)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .limit(Number(limit))
        .offset((Number(page) - 1) * Number(limit));

      const [{ count }] = await db
        .select({ count: sql`count(*)` })
        .from(users)
        .where(conditions.length > 0 ? and(...conditions) : undefined);

      return {
        code: 0,
        data: {
          list: userList,
          total: Number(count),
          page: Number(page),
          limit: Number(limit),
        },
      };
    },
    {
      query: t.Object({
        page: t.Optional(t.Number()),
        limit: t.Optional(t.Number()),
        username: t.Optional(t.String()),
        status: t.Optional(t.Number()),
      }),
      detail: {
        tags: ['管理员功能'],
        summary: '获取用户列表',
      },
    }
  )

  /**
   * 更新用户信息
   */
  .put(
    '/users/:id',
    async ({ params, body, user }) => {
      const { id } = params;
      const { username, realName, email, mobile, status, roleId } = body;

      const [existing] = await db
        .select()
        .from(users)
        .where(eq(users.id, Number(id)))
        .limit(1);

      if (!existing) {
        throw new AppError(404, '用户不存在');
      }

      await db
        .update(users)
        .set({
          username,
          realName,
          email,
          mobile,
          status,
          roleId,
          updater: Number(user!.id),
          updateDate: new Date(),
        })
        .where(eq(users.id, Number(id)));

      return {
        code: 0,
        msg: '更新成功',
      };
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      body: t.Object({
        username: t.Optional(t.String()),
        realName: t.Optional(t.String()),
        email: t.Optional(t.String()),
        mobile: t.Optional(t.String()),
        status: t.Optional(t.Number()),
        roleId: t.Optional(t.String()),
      }),
      detail: {
        tags: ['管理员功能'],
        summary: '更新用户信息',
      },
    }
  )

  /**
   * 删除用户
   */
  .delete(
    '/users/:id',
    async ({ params, user }) => {
      const { id } = params;

      // 不能删除自己
      if (Number(id) === Number(user!.id)) {
        throw new AppError(400, '不能删除当前登录用户');
      }

      const [existing] = await db
        .select()
        .from(users)
        .where(eq(users.id, Number(id)))
        .limit(1);

      if (!existing) {
        throw new AppError(404,'用户不存在');
      }

      await db.delete(users).where(eq(users.id, Number(id)));

      return {
        code: 0,
        msg: '删除成功',
      };
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      detail: {
        tags: ['管理员功能'],
        summary: '删除用户',
      },
    }
  )

  /**
   * 修改用户状态
   */
  .put(
    '/users/:id/status/:status',
    async ({ params, user }) => {
      const { id, status } = params;

      const [existing] = await db
        .select()
        .from(users)
        .where(eq(users.id, Number(id)))
        .limit(1);

      if (!existing) {
        throw new AppError(404,'用户不存在');
      }

      await db
        .update(users)
        .set({
          status: Number(status),
          updater: Number(user!.id),
          updateDate: new Date(),
        })
        .where(eq(users.id, Number(id)));

      return {
        code: 0,
        message: status === '1' ? '已启用' : '已禁用',
      };
    },
    {
      params: t.Object({
        id: t.String(),
        status: t.String(),
      }),
      detail: {
        tags: ['管理员功能'],
        summary: '修改用户状态',
      },
    }
  )

  /**
   * 获取所有设备
   */
  .get(
    '/devices',
    async ({ query }) => {
      const { page = 1, limit = 10, macAddress, userId } = query as any;

      let conditions = [];
      if (macAddress) {
        conditions.push(like(devices.macAddress, `%${macAddress}%`));
      }
      if (userId) {
        conditions.push(eq(devices.userId, Number(userId)));
      }

      const deviceList = await db
        .select()
        .from(devices)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .limit(Number(limit))
        .offset((Number(page) - 1) * Number(limit));

      const [{ count }] = await db
        .select({ count: sql`count(*)` })
        .from(devices)
        .where(conditions.length > 0 ? and(...conditions) : undefined);

      return {
        code: 0,
        data: {
          list: deviceList,
          total: Number(count),
          page: Number(page),
          limit: Number(limit),
        },
      };
    },
    {
      query: t.Object({
        page: t.Optional(t.Number()),
        limit: t.Optional(t.Number()),
        macAddress: t.Optional(t.String()),
        userId: t.Optional(t.Number()),
      }),
      detail: {
        tags: ['管理员功能'],
        summary: '获取所有设备',
      },
    }
  );
