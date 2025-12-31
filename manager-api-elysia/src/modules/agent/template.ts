import { requireAuth, requireRole } from '@/common/middleware/auth';
import { AppError } from '@/common/middleware/error-handler';
import { generateStringId } from '@/common/utils';
import { agentTemplates, db } from '@/db';
import { desc, eq, sql } from 'drizzle-orm';
import { Elysia, t } from 'elysia';

/**
 * 智能体模板模块路由
 */
export const agentTemplateRoutes = new Elysia({ prefix: '/agent-template' })
  .use(requireAuth)

  /**
   * 获取模板分页列表
   */
  .get(
    '/page',
    async ({ query }) => {
      const { page = 1, limit = 10 } = query as any;

      const list = await db
        .select()
        .from(agentTemplates)
        .orderBy(desc(agentTemplates.sort))
        .limit(Number(limit))
        .offset((Number(page) - 1) * Number(limit));

      const [{ count }] = await db.select({ count: sql`count(*)` }).from(agentTemplates);

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
      }),
      detail: {
        tags: ['智能体模板'],
        summary: '获取模板分页列表',
      },
    }
  )

  /**
   * 获取模板详情
   */
  .get(
    '/:id',
    async ({ params: { id } }) => {
      const [template] = await db
        .select()
        .from(agentTemplates)
        .where(eq(agentTemplates.id, id))
        .limit(1);

      if (!template) {
        throw new AppError(404, '模板不存在', 'TEMPLATE_NOT_FOUND');
      }

      return {
        code: 0,
        data: template,
      };
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      detail: {
        tags: ['智能体模板'],
        summary: '获取模板详情',
      },
    }
  )

  /**
   * 创建模板（管理员）
   */
  .use(requireRole(['admin', 'superAdmin']))
  .post(
    '/',
    async ({ body, user }) => {
      const templateId = generateStringId('template');

      const [newTemplate] = await db
        .insert(agentTemplates)
        .values({
          id: templateId,
          ...body,
          creator: Number(user!.id),
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      return {
        code: 0,
        data: newTemplate,
      };
    },
    {
      body: t.Object({
        agentCode: t.Optional(t.String()),
        agentName: t.String(),
        asrModelId: t.Optional(t.String()),
        vadModelId: t.Optional(t.String()),
        llmModelId: t.Optional(t.String()),
        vllmModelId: t.Optional(t.String()),
        ttsModelId: t.Optional(t.String()),
        ttsVoiceId: t.Optional(t.String()),
        memModelId: t.Optional(t.String()),
        intentModelId: t.Optional(t.String()),
        chatHistoryConf: t.Optional(t.Number()),
        systemPrompt: t.Optional(t.String()),
        summaryMemory: t.Optional(t.String()),
        langCode: t.Optional(t.String()),
        language: t.Optional(t.String()),
        sort: t.Optional(t.Number()),
      }),
      detail: {
        tags: ['智能体模板'],
        summary: '创建模板（管理员）',
      },
    }
  )

  /**
   * 更新模板（管理员）
   */
  .put(
    '/:id',
    async ({ params: { id }, body, user }) => {
      const [updatedTemplate] = await db
        .update(agentTemplates)
        .set({
          ...body,
          updater: Number(user!.id),
          updatedAt: new Date(),
        })
        .where(eq(agentTemplates.id, id))
        .returning();

      return {
        code: 0,
        data: updatedTemplate,
      };
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      body: t.Object({
        agentCode: t.Optional(t.String()),
        agentName: t.Optional(t.String()),
        asrModelId: t.Optional(t.String()),
        vadModelId: t.Optional(t.String()),
        llmModelId: t.Optional(t.String()),
        vllmModelId: t.Optional(t.String()),
        ttsModelId: t.Optional(t.String()),
        ttsVoiceId: t.Optional(t.String()),
        memModelId: t.Optional(t.String()),
        intentModelId: t.Optional(t.String()),
        chatHistoryConf: t.Optional(t.Number()),
        systemPrompt: t.Optional(t.String()),
        summaryMemory: t.Optional(t.String()),
        langCode: t.Optional(t.String()),
        language: t.Optional(t.String()),
        sort: t.Optional(t.Number()),
      }),
      detail: {
        tags: ['智能体模板'],
        summary: '更新模板（管理员）',
      },
    }
  )

  /**
   * 删除模板（管理员）
   */
  .delete(
    '/:id',
    async ({ params: { id } }) => {
      await db.delete(agentTemplates).where(eq(agentTemplates.id, id));

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
        tags: ['智能体模板'],
        summary: '删除模板（管理员）',
      },
    }
  )

  /**
   * 批量删除模板（管理员）
   */
  .post(
    '/batch-remove',
    async ({ body }) => {
      const { ids } = body;

      for (const id of ids) {
        await db.delete(agentTemplates).where(eq(agentTemplates.id, id));
      }

      return {
        code: 0,
        msg: '批量删除成功',
      };
    },
    {
      body: t.Object({
        ids: t.Array(t.String()),
      }),
      detail: {
        tags: ['智能体模板'],
        summary: '批量删除模板（管理员）',
      },
    }
  );
