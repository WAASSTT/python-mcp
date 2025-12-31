import { requireAuth } from '@/common/middleware/auth';
import { AppError } from '@/common/middleware/error-handler';
import { agents, db } from '@/db';
import { and, eq } from 'drizzle-orm';
import { Elysia, t } from 'elysia';

/**
 * 创建智能体请求体
 */
const CreateAgentSchema = t.Object({
  agentCode: t.Optional(t.String()),
  agentName: t.String({ minLength: 1, maxLength: 100 }),
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
});

/**
 * 更新智能体请求体
 */
const UpdateAgentSchema = t.Object({
  agentCode: t.Optional(t.String()),
  agentName: t.Optional(t.String({ minLength: 1, maxLength: 100 })),
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
});

/**
 * Agent 模块路由
 * 处理智能体相关功能
 */
export const agentRoutes = new Elysia({ prefix: '/agent' })
  .use(requireAuth)

  /**
   * 获取用户的智能体列表
   */
  .get(
    '/list',
    async ({ user }) => {
      const userAgents = await db
        .select()
        .from(agents)
        .where(eq(agents.userId, Number(user!.id)));

      return {
        code: 0,
        msg: 'success',
        data: userAgents,
      };
    },
    {
      detail: {
        tags: ['智能体管理'],
        summary: '获取用户智能体列表',
      },
    }
  )

  /**
   * 获取智能体详情
   */
  .get(
    '/:id',
    async ({ params: { id }, user }) => {
      const [agent] = await db
        .select()
        .from(agents)
        .where(and(eq(agents.id, id), eq(agents.userId, Number(user!.id))))
        .limit(1);

      if (!agent) {
        throw new AppError(404, '智能体不存在', 'AGENT_NOT_FOUND');
      }

      return {
        code: 0,
        msg: 'success',
        data: agent,
      };
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      detail: {
        tags: ['智能体管理'],
        summary: '获取智能体详情',
      },
    }
  )

  /**
   * 创建智能体
   */
  .post(
    '',
    async ({ body, user }) => {
      const agentId = `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const [newAgent] = await db
        .insert(agents)
        .values({
          id: agentId,
          userId: Number(user!.id),
          ...body,
          creator: Number(user!.id),
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      return {
        code: 0,
        msg: 'success',
        data: agentId,
      };
    },
    {
      body: CreateAgentSchema,
      detail: {
        tags: ['智能体管理'],
        summary: '创建智能体',
      },
    }
  )

  /**
   * 更新智能体
   */
  .put(
    '/:id',
    async ({ params: { id }, body, user }) => {
      // 检查智能体是否存在且属于当前用户
      const [existingAgent] = await db
        .select()
        .from(agents)
        .where(and(eq(agents.id, id), eq(agents.userId, Number(user!.id))))
        .limit(1);

      if (!existingAgent) {
        throw new AppError(404, '智能体不存在', 'AGENT_NOT_FOUND');
      }

      // 更新智能体
      const [updatedAgent] = await db
        .update(agents)
        .set({
          ...body,
          updater: Number(user!.id),
          updatedAt: new Date(),
        })
        .where(eq(agents.id, id))
        .returning();

      return {
        code: 0,
        msg: 'success',
      };
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      body: UpdateAgentSchema,
      detail: {
        tags: ['智能体管理'],
        summary: '更新智能体',
      },
    }
  )

  /**
   * 删除智能体
   */
  .delete(
    '/:id',
    async ({ params: { id }, user }) => {
      // 检查智能体是否存在且属于当前用户
      const [existingAgent] = await db
        .select()
        .from(agents)
        .where(and(eq(agents.id, id), eq(agents.userId, Number(user!.id))))
        .limit(1);

      if (!existingAgent) {
        throw new AppError(404, '智能体不存在', 'AGENT_NOT_FOUND');
      }

      // 删除智能体
      await db.delete(agents).where(eq(agents.id, id));

      return {
        code: 0,
        msg: 'success',
      };
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      detail: {
        tags: ['智能体管理'],
        summary: '删除智能体',
      },
    }
  );
