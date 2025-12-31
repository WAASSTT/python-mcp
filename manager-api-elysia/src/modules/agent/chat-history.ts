import { requireAuth } from '@/common/middleware/auth';
import { RedisKeys, RedisService } from '@/common/services/redis';
import { generateStringId } from '@/common/utils';
import { agentChatHistory, db } from '@/db';
import { and, desc, eq } from 'drizzle-orm';
import { integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { Elysia, t } from 'elysia';

// 聊天记录举报表（需要在schema中定义）
export const chatReports = pgTable('chat_reports', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  chatId: text('chat_id').notNull(),
  userId: integer('user_id').notNull(),
  reason: text('reason').notNull(),
  description: text('description'),
  status: text('status').default('pending'),
  createdAt: timestamp('created_at').defaultNow(),
});

/**
 * 聊天历史管理路由
 */
export const chatHistoryRoutes = new Elysia({ prefix: '/chat-history' })
  .use(requireAuth)

  /**
   * 举报聊天记录
   */
  .post(
    '/report',
    async ({ body, user }) => {
      const { chatId, reason, description } = body;

      // 保存举报记录到数据库
      await db.insert(chatReports).values({
        chatId,
        userId: Number(user!.id),
        reason,
        description,
        status: 'pending',
      });

      console.info('聊天记录举报', { chatId, reason, userId: user!.id });

      return {
        code: 0,
        msg: '举报成功，感谢您的反馈',
      };
    },
    {
      body: t.Object({
        chatId: t.String(),
        reason: t.String(),
        description: t.Optional(t.String()),
      }),
      detail: {
        tags: ['聊天历史'],
        summary: '举报聊天记录',
      },
    }
  )

  /**
   * 获取下载链接
   */
  .post(
    '/getDownloadUrl/:agentId/:sessionId',
    async ({ params, user }) => {
      const { agentId, sessionId } = params;

      // 生成下载令牌
      const token = generateStringId('download');

      // 保存到 Redis，30分钟过期
      const downloadData = JSON.stringify({ agentId, sessionId, userId: user!.id });
      await RedisService.set(RedisKeys.chatHistoryDownload(token), downloadData, 1800);

      console.debug('生成聊天历史下载令牌', { token, agentId, sessionId });

      return {
        code: 0,
        data: {
          downloadUrl: `/chat-history/download/${token}/current`,
          expiresIn: 1800,
        },
      };
    },
    {
      params: t.Object({
        agentId: t.String(),
        sessionId: t.String(),
      }),
      detail: {
        tags: ['聊天历史'],
        summary: '获取聊天记录下载链接',
      },
    }
  )

  /**
   * 下载当前会话聊天记录
   */
  .get(
    '/download/:uuid/current',
    async ({ params: { uuid }, set }) => {
      // 从 Redis 获取会话信息
      const downloadData = await RedisService.get(RedisKeys.chatHistoryDownload(uuid));

      if (!downloadData) {
        throw new Error('下载链接已过期或无效');
      }

      const { agentId, sessionId } = JSON.parse(downloadData);

      // 获取聊天历史记录
      const records = await db
        .select()
        .from(agentChatHistory)
        .where(
          and(eq(agentChatHistory.agentId, agentId), eq(agentChatHistory.sessionId, sessionId))
        )
        .orderBy(desc(agentChatHistory.createdAt))
        .limit(1000);

      // 删除已使用的令牌
      await RedisService.delete(RedisKeys.chatHistoryDownload(uuid));

      console.info('下载聊天历史', { uuid, agentId, sessionId, count: records.length });

      // 返回JSON格式
      set.headers['Content-Type'] = 'application/json';
      set.headers['Content-Disposition'] = `attachment; filename="chat-history-${sessionId}.json"`;

      return JSON.stringify(records, null, 2);
    },
    {
      params: t.Object({
        uuid: t.String(),
      }),
      detail: {
        tags: ['聊天历史'],
        summary: '下载当前会话聊天记录',
      },
    }
  );
