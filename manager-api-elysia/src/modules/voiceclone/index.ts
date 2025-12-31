import { requireAuth } from '@/common/middleware/auth';
import { db } from '@/db';
import { desc, eq } from 'drizzle-orm';
import { integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { Elysia } from 'elysia';

// 声音克隆记录表（需要在schema中定义）
export const voiceClones = pgTable('voice_clones', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  userId: integer('user_id').notNull(),
  name: text('name').notNull(),
  audioUrl: text('audio_url'),
  status: text('status').default('pending'),
  voiceId: text('voice_id'),
  createdAt: timestamp('created_at').defaultNow(),
});

/**
 * 声音克隆模块路由
 */
export const voiceCloneRoutes = new Elysia({ prefix: '/voiceclone' })
  .use(requireAuth)

  /**
   * 获取声音克隆列表
   */
  .get(
    '/list',
    async ({ user, query }) => {
      const { page = 1, limit = 10 } = query as { page?: number; limit?: number };
      const offset = (Number(page) - 1) * Number(limit);

      // 获取当前用户的声音克隆列表
      const cloneList = await db
        .select()
        .from(voiceClones)
        .where(eq(voiceClones.userId, Number(user!.id)))
        .orderBy(desc(voiceClones.createdAt))
        .limit(Number(limit))
        .offset(offset);

      return {
        code: 0,
        msg: '获取成功',
        data: cloneList,
      };
    },
    {
      detail: {
        tags: ['声音克隆'],
        summary: '获取声音克隆列表',
      },
    }
  );
