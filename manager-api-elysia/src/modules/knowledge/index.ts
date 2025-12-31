import { requireAuth } from '@/common/middleware/auth';
import { db, knowledgeBases } from '@/db';
import { eq } from 'drizzle-orm';
import { Elysia, t } from 'elysia';

/**
 * 知识库管理模块路由
 */
export const knowledgeRoutes = new Elysia({ prefix: '/knowledge' })
  .use(requireAuth)

  /**
   * 获取知识库列表
   */
  .get(
    '/list',
    async ({ user }) => {
      const userKnowledgeBases = await db
        .select()
        .from(knowledgeBases)
        .where(eq(knowledgeBases.creator, Number(user!.id)));

      return {
        code: 0,
        msg: '获取成功',
        data: userKnowledgeBases,
      };
    },
    {
      detail: {
        tags: ['知识库管理'],
        summary: '获取知识库列表',
      },
    }
  )

  /**
   * 创建知识库
   */
  .post(
    '/',
    async ({ body, user }) => {
      const kbId = `kb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const [newKB] = await db
        .insert(knowledgeBases)
        .values({
          id: kbId,
          creator: Number(user!.id),
          ...body,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      return {
        code: 0,
        msg: '创建成功',
        data: newKB,
      };
    },
    {
      body: t.Object({
        name: t.String(),
        description: t.Optional(t.String()),
        datasetId: t.Optional(t.String()),
        ragModelId: t.Optional(t.String()),
      }),
      detail: {
        tags: ['知识库管理'],
        summary: '创建知识库',
      },
    }
  );
