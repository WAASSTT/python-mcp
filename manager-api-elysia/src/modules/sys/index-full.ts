import { requireAuth, requireRole } from '@/common/middleware/auth';
import { generateId } from '@/common/utils';
import { db, dictData, dictTypes, sysParams, users } from '@/db';
import { and, desc, eq, like, sql } from 'drizzle-orm';
import { Elysia, t } from 'elysia';

/**
 * 完整的系统管理模块
 */
export const sysRoutes = new Elysia({ prefix: '/sys' })
  .use(requireAuth)

  // ========== 系统参数管理 ==========

  /**
   * 获取系统参数
   */
  .get(
    '/params',
    async () => {
      const params = await db.select().from(sysParams);

      return {
        code: 0,
        data: params,
      };
    },
    {
      detail: {
        tags: ['系统管理'],
        summary: '获取系统参数列表',
      },
    }
  )

  /**
   * 获取单个参数值
   */
  .get(
    '/param/:key',
    async ({ params: { key } }) => {
      const [param] = await db.select().from(sysParams).where(eq(sysParams.paramKey, key)).limit(1);

      return {
        code: 0,
        data: param?.paramValue || null,
      };
    },
    {
      params: t.Object({
        key: t.String(),
      }),
      detail: {
        tags: ['系统管理'],
        summary: '获取单个参数值',
      },
    }
  )

  /**
   * 保存或更新参数（管理员）
   */
  .use(requireRole(['admin', 'superAdmin']))
  .post(
    '/param',
    async ({ body }) => {
      const { key, value, type, remark } = body;

      // 检查参数是否存在
      const [existing] = await db
        .select()
        .from(sysParams)
        .where(eq(sysParams.paramKey, key))
        .limit(1);

      if (existing) {
        // 更新
        await db
          .update(sysParams)
          .set({
            paramValue: value,
            paramType: type,
            remark,
            updateDate: new Date(),
          })
          .where(eq(sysParams.id, existing.id));
      } else {
        // 新增
        await db.insert(sysParams).values({
          id: generateId(),
          paramKey: key,
          paramValue: value,
          paramType: type,
          remark,
        });
      }

      return {
        code: 0,
        msg: '保存成功',
      };
    },
    {
      body: t.Object({
        key: t.String(),
        value: t.String(),
        type: t.Optional(t.String()),
        remark: t.Optional(t.String()),
      }),
      detail: {
        tags: ['系统管理'],
        summary: '保存或更新参数（管理员）',
      },
    }
  )

  // ========== 字典管理 ==========

  /**
   * 获取字典类型分页列表（管理员）
   */
  .get(
    '/dict-type/page',
    async ({ query }) => {
      const { page = 1, limit = 10, keyword } = query as any;

      const conditions = [];
      if (keyword) {
        conditions.push(like(dictTypes.dictName, `%${keyword}%`));
      }

      const queryBuilder = db.select().from(dictTypes);
      const list = await (conditions.length > 0
        ? queryBuilder.where(and(...conditions))
        : queryBuilder
      )
        .orderBy(desc(dictTypes.sort))
        .limit(Number(limit))
        .offset((Number(page) - 1) * Number(limit));

      const [{ count }] = await db.select({ count: sql`count(*)` }).from(dictTypes);

      return {
        code: 0,
        data: {
          list,
          total: Number(count),
        },
      };
    },
    {
      query: t.Object({
        page: t.Optional(t.Number()),
        limit: t.Optional(t.Number()),
        keyword: t.Optional(t.String()),
      }),
      detail: {
        tags: ['系统管理'],
        summary: '获取字典类型分页列表（管理员）',
      },
    }
  )

  /**
   * 创建字典类型（管理员）
   */
  .post(
    '/dict-type',
    async ({ body }) => {
      const id = generateId();

      await db.insert(dictTypes).values({
        id,
        ...body,
      });

      return {
        code: 0,
        msg: '创建成功',
        data: { id },
      };
    },
    {
      body: t.Object({
        dictType: t.String(),
        dictName: t.String(),
        remark: t.Optional(t.String()),
        sort: t.Optional(t.Number()),
      }),
      detail: {
        tags: ['系统管理'],
        summary: '创建字典类型（管理员）',
      },
    }
  )

  /**
   * 更新字典类型（管理员）
   */
  .put(
    '/dict-type/:id',
    async ({ params: { id }, body }) => {
      await db
        .update(dictTypes)
        .set({
          ...body,
          updateDate: new Date(),
        })
        .where(eq(dictTypes.id, id));

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
        dictName: t.Optional(t.String()),
        remark: t.Optional(t.String()),
        sort: t.Optional(t.Number()),
      }),
      detail: {
        tags: ['系统管理'],
        summary: '更新字典类型（管理员）',
      },
    }
  )

  /**
   * 获取字典数据
   */
  .get(
    '/dict/:type',
    async ({ params: { type } }) => {
      // 先查找字典类型
      const [dictType] = await db
        .select()
        .from(dictTypes)
        .where(eq(dictTypes.dictType, type))
        .limit(1);

      if (!dictType) {
        return {
          code: 0,
          data: [],
        };
      }

      // 查询字典数据
      const data = await db
        .select()
        .from(dictData)
        .where(eq(dictData.dictTypeId, dictType.id))
        .orderBy(desc(dictData.sort));

      return {
        code: 0,
        data,
      };
    },
    {
      params: t.Object({
        type: t.String(),
      }),
      detail: {
        tags: ['系统管理'],
        summary: '根据类型获取字典数据',
      },
    }
  )

  /**
   * 创建字典数据（管理员）
   */
  .post(
    '/dict-data',
    async ({ body }) => {
      const id = generateId();

      await db.insert(dictData).values({
        id,
        ...body,
      });

      return {
        code: 0,
        msg: '创建成功',
        data: { id },
      };
    },
    {
      body: t.Object({
        dictTypeId: t.String(),
        dictLabel: t.String(),
        dictValue: t.String(),
        sort: t.Optional(t.Number()),
        remark: t.Optional(t.String()),
        status: t.Optional(t.Number()),
      }),
      detail: {
        tags: ['系统管理'],
        summary: '创建字典数据（管理员）',
      },
    }
  )

  // ========== 用户管理（管理员） ==========

  /**
   * 获取用户列表（管理员）
   */
  .get(
    '/admin/users',
    async ({ query }) => {
      const { page = 1, limit = 10, keyword } = query as any;

      const conditions = [];
      if (keyword) {
        conditions.push(like(users.username, `%${keyword}%`));
      }

      const queryBuilder = db.select().from(users);
      const list = await (conditions.length > 0
        ? queryBuilder.where(and(...conditions))
        : queryBuilder
      )
        .limit(Number(limit))
        .offset((Number(page) - 1) * Number(limit));

      const [{ count }] = await db.select({ count: sql`count(*)` }).from(users);

      // 移除密码字段
      const safeList = list.map(({ password, ...user }) => user);

      return {
        code: 0,
        data: {
          list: safeList,
          total: Number(count),
        },
      };
    },
    {
      query: t.Object({
        page: t.Optional(t.Number()),
        limit: t.Optional(t.Number()),
        keyword: t.Optional(t.String()),
      }),
      detail: {
        tags: ['系统管理'],
        summary: '获取用户列表（管理员）',
      },
    }
  )

  /**
   * 更新用户状态（管理员）
   */
  .put(
    '/admin/user/:id/status',
    async ({ params: { id }, body }) => {
      await db
        .update(users)
        .set({
          status: body.status,
          updateDate: new Date(),
        })
        .where(eq(users.id, id));

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
        status: t.Number(),
      }),
      detail: {
        tags: ['系统管理'],
        summary: '更新用户状态（管理员）',
      },
    }
  )

  /**
   * 删除用户（管理员）
   */
  .delete(
    '/admin/user/:id',
    async ({ params: { id } }) => {
      await db.delete(users).where(eq(users.id, id));

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
        tags: ['系统管理'],
        summary: '删除用户（管理员）',
      },
    }
  );
