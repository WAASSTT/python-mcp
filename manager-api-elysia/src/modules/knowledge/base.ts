import { requireAuth } from '@/common/middleware/auth';
import { AppError } from '@/common/middleware/error-handler';
import { generateStringId } from '@/common/utils';
import { db, knowledgeBases } from '@/db';
import { and, desc, eq, like, sql } from 'drizzle-orm';
import { Elysia, t } from 'elysia';

/**
 * 知识库管理模块
 */
export const knowledgeBaseRoutes = new Elysia({ prefix: '/knowledge' })
  .use(requireAuth)

  /**
   * 获取知识库列表
   */
  .get(
    '/bases',
    async ({ query, user }) => {
      const { page = 1, limit = 10, name } = query as any;

      let conditions = [eq(knowledgeBases.creator, Number(user!.id))];
      if (name) {
        conditions.push(like(knowledgeBases.name, `%${name}%`));
      }

      const list = await db
        .select()
        .from(knowledgeBases)
        .where(and(...conditions))
        .orderBy(desc(knowledgeBases.createdAt))
        .limit(Number(limit))
        .offset((Number(page) - 1) * Number(limit));

      const [{ count }] = await db
        .select({ count: sql`count(*)` })
        .from(knowledgeBases)
        .where(and(...conditions));

      return {
        code: 0,
        data: {
          list,
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
        name: t.Optional(t.String()),
      }),
      detail: {
        tags: ['知识库管理'],
        summary: '获取知识库列表',
      },
    }
  )

  /**
   * 获取知识库详情
   */
  .get(
    '/base/:id',
    async ({ params }) => {
      const [knowledgeBase] = await db
        .select()
        .from(knowledgeBases)
        .where(eq(knowledgeBases.id, params.id))
        .limit(1);

      if (!knowledgeBase) {
        throw new AppError(404, '知识库不存在');
      }

      return {
        code: 0,
        data: knowledgeBase,
      };
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      detail: {
        tags: ['知识库管理'],
        summary: '获取知识库详情',
      },
    }
  )

  /**
   * 创建知识库
   */
  .post(
    '/base',
    async ({ body, user }) => {
      const { name, description, ragModelId } = body;

      const id = generateStringId('kb');
      const datasetId = `dataset_${Date.now()}`;

      await db.insert(knowledgeBases).values({
        id,
        datasetId,
        name,
        description,
        ragModelId,
        status: 1,
        creator: Number(user!.id),
        createdAt: new Date(),
      });

      const [newKnowledgeBase] = await db
        .select()
        .from(knowledgeBases)
        .where(eq(knowledgeBases.id, id))
        .limit(1);

      return {
        code: 0,
        msg: '创建成功',
        data: newKnowledgeBase,
      };
    },
    {
      body: t.Object({
        name: t.String({ minLength: 1, maxLength: 100 }),
        description: t.Optional(t.String()),
        ragModelId: t.Optional(t.String()),
      }),
      detail: {
        tags: ['知识库管理'],
        summary: '创建知识库',
      },
    }
  )

  /**
   * 更新知识库
   */
  .put(
    '/base/:id',
    async ({ params, body, user }) => {
      const { id } = params;
      const { name, description, ragModelId, status } = body;

      const [existing] = await db
        .select()
        .from(knowledgeBases)
        .where(eq(knowledgeBases.id, id))
        .limit(1);

      if (!existing) {
        throw new AppError(404, '知识库不存在');
      }

      await db
        .update(knowledgeBases)
        .set({
          name,
          description,
          ragModelId,
          status,
          updater: Number(user!.id),
          updatedAt: new Date(),
        })
        .where(eq(knowledgeBases.id, id));

      const [updated] = await db
        .select()
        .from(knowledgeBases)
        .where(eq(knowledgeBases.id, id))
        .limit(1);

      return {
        code: 0,
        msg: '更新成功',
        data: updated,
      };
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      body: t.Object({
        name: t.Optional(t.String()),
        description: t.Optional(t.String()),
        ragModelId: t.Optional(t.String()),
        status: t.Optional(t.Number()),
      }),
      detail: {
        tags: ['知识库管理'],
        summary: '更新知识库',
      },
    }
  )

  /**
   * 删除知识库
   */
  .delete(
    '/base/:id',
    async ({ params, user }) => {
      const { id } = params;

      const [existing] = await db
        .select()
        .from(knowledgeBases)
        .where(eq(knowledgeBases.id, id))
        .limit(1);

      if (!existing) {
        throw new AppError(404, '知识库不存在');
      }

      // 检查权限
      if (existing.creator !== Number(user!.id)) {
        throw new AppError(403, '无权限删除此知识库');
      }

      await db.delete(knowledgeBases).where(eq(knowledgeBases.id, id));

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
        tags: ['知识库管理'],
        summary: '删除知识库',
      },
    }
  );
