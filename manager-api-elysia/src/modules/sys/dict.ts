import { and, desc, eq, like, sql } from 'drizzle-orm';
import { integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { Elysia, t } from 'elysia';
import { requireAuth, requireRole } from '../../common/middleware/auth';
import { AppError } from '../../common/middleware/error-handler';
import { db } from '../../db';

// 字典类型表 (需要在 schema.ts 中定义)
export const sysDictType = pgTable('sys_dict_type', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  dictType: text('dict_type').notNull().unique(),
  dictName: text('dict_name').notNull(),
  remark: text('remark'),
  sort: integer('sort').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 字典数据表
export const sysDictData = pgTable('sys_dict_data', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  dictTypeId: integer('dict_type_id').notNull(),
  dictLabel: text('dict_label').notNull(),
  dictValue: text('dict_value').notNull(),
  sort: integer('sort').default(0),
  remark: text('remark'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

/**
 * 字典类型管理路由
 */
export const dictTypeRoutes = new Elysia({ prefix: '/admin/dict/type', tags: ['字典类型管理'] })
  .use(requireAuth)
  .use(requireRole(['superAdmin']))

  /**
   * 分页查询字典类型
   */
  .get(
    '/page',
    async ({ query }) => {
      const { page = 1, limit = 10, dictType, dictName } = query as any;
      const offset = (Number(page) - 1) * Number(limit);

      // 构建查询条件
      const conditions = [];
      if (dictType) {
        conditions.push(like(sysDictType.dictType, `%${dictType}%`));
      }
      if (dictName) {
        conditions.push(like(sysDictType.dictName, `%${dictName}%`));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      // 查询数据
      const list = await db
        .select()
        .from(sysDictType)
        .where(whereClause)
        .orderBy(desc(sysDictType.createdAt))
        .limit(Number(limit))
        .offset(offset);

      // 查询总数
      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(sysDictType)
        .where(whereClause);

      const total = Number(countResult[0]?.count || 0);

      return {
        code: 0,
        msg: 'success',
        data: {
          list,
          total,
          page: Number(page),
          limit: Number(limit),
        },
      };
    },
    {
      detail: {
        summary: '分页查询字典类型',
        tags: ['字典类型管理'],
      },
    }
  )

  /**
   * 获取字典类型详情
   */
  .get(
    '/:id',
    async ({ params: { id } }) => {
      const dictType = await db
        .select()
        .from(sysDictType)
        .where(eq(sysDictType.id, Number(id)))
        .limit(1);

      if (!dictType.length) {
        throw new AppError(404, '字典类型不存在');
      }

      return { code: 0, msg: 'success', data: dictType[0] };
    },
    {
      detail: {
        summary: '获取字典类型详情',
        tags: ['字典类型管理'],
      },
    }
  )

  /**
   * 保存字典类型
   */
  .post(
    '/save',
    async ({ body }) => {
      const { dictType, dictName, remark, sort } = body as any;

      // 检查字典类型是否已存在
      const existing = await db
        .select()
        .from(sysDictType)
        .where(eq(sysDictType.dictType, dictType))
        .limit(1);

      if (existing.length > 0) {
        throw new AppError(400, '字典类型已存在');
      }

      await db.insert(sysDictType).values({
        dictType,
        dictName,
        remark,
        sort: sort || 0,
      });

      return { code: 0, msg: '保存成功' };
    },
    {
      body: t.Object({
        dictType: t.String(),
        dictName: t.String(),
        remark: t.Optional(t.String()),
        sort: t.Optional(t.Number()),
      }),
      detail: {
        summary: '保存字典类型',
        tags: ['字典类型管理'],
      },
    }
  )

  /**
   * 修改字典类型
   */
  .put(
    '/update',
    async ({ body }) => {
      const { id, dictType, dictName, remark, sort } = body as any;

      const existing = await db
        .select()
        .from(sysDictType)
        .where(eq(sysDictType.id, Number(id)))
        .limit(1);

      if (!existing.length) {
        throw new AppError(404, '字典类型不存在');
      }

      await db
        .update(sysDictType)
        .set({
          dictType,
          dictName,
          remark,
          sort: sort || 0,
          updatedAt: new Date(),
        })
        .where(eq(sysDictType.id, Number(id)));

      return { code: 0, msg: '修改成功' };
    },
    {
      body: t.Object({
        id: t.Number(),
        dictType: t.String(),
        dictName: t.String(),
        remark: t.Optional(t.String()),
        sort: t.Optional(t.Number()),
      }),
      detail: {
        summary: '修改字典类型',
        tags: ['字典类型管理'],
      },
    }
  )

  /**
   * 删除字典类型
   */
  .post(
    '/delete',
    async ({ body }) => {
      const { ids } = body as { ids: number[] };

      if (!ids || ids.length === 0) {
        throw new AppError(400, 'ID不能为空');
      }

      // 先删除关联的字典数据
      for (const id of ids) {
        await db.delete(sysDictData).where(eq(sysDictData.dictTypeId, id));
      }

      // 删除字典类型
      for (const id of ids) {
        await db.delete(sysDictType).where(eq(sysDictType.id, id));
      }

      return { code: 0, msg: '删除成功' };
    },
    {
      body: t.Object({
        ids: t.Array(t.Number()),
      }),
      detail: {
        summary: '删除字典类型',
        tags: ['字典类型管理'],
      },
    }
  );

/**
 * 字典数据管理路由
 */
export const dictDataRoutes = new Elysia({ prefix: '/admin/dict/data', tags: ['字典数据管理'] })
  .use(requireAuth)
  .use(requireRole(['superAdmin']))

  /**
   * 分页查询字典数据
   */
  .get(
    '/page',
    async ({ query }) => {
      const { page = 1, limit = 10, dictTypeId, dictLabel, dictValue } = query as any;

      if (!dictTypeId) {
        throw new AppError(400, 'dictTypeId不能为空');
      }

      const offset = (Number(page) - 1) * Number(limit);

      // 构建查询条件
      const conditions = [eq(sysDictData.dictTypeId, Number(dictTypeId))];
      if (dictLabel) {
        conditions.push(like(sysDictData.dictLabel, `%${dictLabel}%`));
      }
      if (dictValue) {
        conditions.push(like(sysDictData.dictValue, `%${dictValue}%`));
      }

      const whereClause = and(...conditions);

      // 查询数据
      const list = await db
        .select()
        .from(sysDictData)
        .where(whereClause)
        .orderBy(desc(sysDictData.sort))
        .limit(Number(limit))
        .offset(offset);

      // 查询总数
      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(sysDictData)
        .where(whereClause);

      const total = Number(countResult[0]?.count || 0);

      return {
        code: 0,
        msg: 'success',
        data: {
          list,
          total,
          page: Number(page),
          limit: Number(limit),
        },
      };
    },
    {
      detail: {
        summary: '分页查询字典数据',
        tags: ['字典数据管理'],
      },
    }
  )

  /**
   * 获取字典数据详情
   */
  .get(
    '/:id',
    async ({ params: { id } }) => {
      const dictData = await db
        .select()
        .from(sysDictData)
        .where(eq(sysDictData.id, Number(id)))
        .limit(1);

      if (!dictData.length) {
        throw new AppError(404, '字典数据不存在');
      }

      return { code: 0, msg: 'success', data: dictData[0] };
    },
    {
      detail: {
        summary: '获取字典数据详情',
        tags: ['字典数据管理'],
      },
    }
  )

  /**
   * 新增字典数据
   */
  .post(
    '/save',
    async ({ body }) => {
      const { dictTypeId, dictLabel, dictValue, remark, sort } = body as any;

      await db.insert(sysDictData).values({
        dictTypeId: Number(dictTypeId),
        dictLabel,
        dictValue,
        remark,
        sort: sort || 0,
      });

      return { code: 0, msg: '新增成功' };
    },
    {
      body: t.Object({
        dictTypeId: t.Number(),
        dictLabel: t.String(),
        dictValue: t.String(),
        remark: t.Optional(t.String()),
        sort: t.Optional(t.Number()),
      }),
      detail: {
        summary: '新增字典数据',
        tags: ['字典数据管理'],
      },
    }
  )

  /**
   * 修改字典数据
   */
  .put(
    '/update',
    async ({ body }) => {
      const { id, dictTypeId, dictLabel, dictValue, remark, sort } = body as any;

      const existing = await db
        .select()
        .from(sysDictData)
        .where(eq(sysDictData.id, Number(id)))
        .limit(1);

      if (!existing.length) {
        throw new AppError(404, '字典数据不存在');
      }

      await db
        .update(sysDictData)
        .set({
          dictTypeId: Number(dictTypeId),
          dictLabel,
          dictValue,
          remark,
          sort: sort || 0,
          updatedAt: new Date(),
        })
        .where(eq(sysDictData.id, Number(id)));

      return { code: 0, msg: '修改成功' };
    },
    {
      body: t.Object({
        id: t.Number(),
        dictTypeId: t.Number(),
        dictLabel: t.String(),
        dictValue: t.String(),
        remark: t.Optional(t.String()),
        sort: t.Optional(t.Number()),
      }),
      detail: {
        summary: '修改字典数据',
        tags: ['字典数据管理'],
      },
    }
  )

  /**
   * 删除字典数据
   */
  .post(
    '/delete',
    async ({ body }) => {
      const { ids } = body as { ids: number[] };

      if (!ids || ids.length === 0) {
        throw new AppError(400, 'ID不能为空');
      }

      for (const id of ids) {
        await db.delete(sysDictData).where(eq(sysDictData.id, id));
      }

      return { code: 0, msg: '删除成功' };
    },
    {
      body: t.Object({
        ids: t.Array(t.Number()),
      }),
      detail: {
        summary: '删除字典数据',
        tags: ['字典数据管理'],
      },
    }
  )

  /**
   * 根据字典类型获取字典数据列表
   */
  .get(
    '/type/:dictType',
    async ({ params: { dictType } }) => {
      // 先查找字典类型
      const typeResult = await db
        .select()
        .from(sysDictType)
        .where(eq(sysDictType.dictType, dictType))
        .limit(1);

      if (!typeResult.length) {
        throw new AppError(404, '字典类型不存在');
      }

      // 查询字典数据
      const list = await db
        .select()
        .from(sysDictData)
        .where(eq(sysDictData.dictTypeId, typeResult[0].id))
        .orderBy(desc(sysDictData.sort));

      return {
        code: 0,
        msg: 'success',
        data: list.map(item => ({
          label: item.dictLabel,
          value: item.dictValue,
        })),
      };
    },
    {
      detail: {
        summary: '获取字典数据列表',
        tags: ['字典数据管理'],
      },
    }
  );
