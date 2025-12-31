import { requireAuth } from '@/common/middleware/auth';
import { generateStringId } from '@/common/utils';
import { agentVoicePrints, db } from '@/db';
import { eq } from 'drizzle-orm';
import { Elysia, t } from 'elysia';

/**
 * 智能体声纹管理路由
 */
export const agentVoicePrintRoutes = new Elysia({ prefix: '/agent-voice-print' })
  .use(requireAuth)

  /**
   * 创建声纹
   */
  .post(
    '/',
    async ({ body, user }) => {
      const vpId = generateStringId('vp');

      const [newVP] = await db
        .insert(agentVoicePrints)
        .values({
          id: vpId,
          ...body,
          creator: Number(user!.id),
          createDate: new Date(),
        })
        .returning();

      return {
        code: 0,
        data: newVP,
      };
    },
    {
      body: t.Object({
        agentId: t.String(),
        audioId: t.Optional(t.String()),
        sourceName: t.String(),
        introduce: t.Optional(t.String()),
      }),
      detail: {
        tags: ['智能体声纹'],
        summary: '创建声纹',
      },
    }
  )

  /**
   * 更新声纹
   */
  .put(
    '/',
    async ({ body }) => {
      const [updated] = await db
        .update(agentVoicePrints)
        .set({
          sourceName: body.sourceName,
          audioId: body.audioId,
          introduce: body.introduce,
          updateDate: new Date(),
        })
        .where(eq(agentVoicePrints.id, body.id))
        .returning();

      return {
        code: 0,
        data: updated,
      };
    },
    {
      body: t.Object({
        id: t.String(),
        sourceName: t.String(),
        audioId: t.Optional(t.String()),
        introduce: t.Optional(t.String()),
      }),
      detail: {
        tags: ['智能体声纹'],
        summary: '更新声纹',
      },
    }
  )

  /**
   * 删除声纹
   */
  .delete(
    '/:id',
    async ({ params: { id } }) => {
      await db.delete(agentVoicePrints).where(eq(agentVoicePrints.id, id));

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
        tags: ['智能体声纹'],
        summary: '删除声纹',
      },
    }
  )

  /**
   * 获取智能体的声纹列表
   */
  .get(
    '/list/:agentId',
    async ({ params: { agentId } }) => {
      const list = await db
        .select()
        .from(agentVoicePrints)
        .where(eq(agentVoicePrints.agentId, agentId));

      return {
        code: 0,
        data: list,
      };
    },
    {
      params: t.Object({
        agentId: t.String(),
      }),
      detail: {
        tags: ['智能体声纹'],
        summary: '获取智能体的声纹列表',
      },
    }
  );
