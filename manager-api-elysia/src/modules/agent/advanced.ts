import { requireAuth } from '@/common/middleware/auth';
import { AppError } from '@/common/middleware/error-handler';
import { agentChatAudios, agentChatHistory, agents, db, devices } from '@/db';
import { and, desc, eq, sql } from 'drizzle-orm';
import { Elysia, t } from 'elysia';

/**
 * Agent 高级功能模块
 * 包括聊天记录、音频、记忆管理等
 */
export const agentAdvancedRoutes = new Elysia({ prefix: '/agent' })
  .use(requireAuth)

  /**
   * 保存智能体记忆（通过设备MAC地址）
   */
  .put(
    '/saveMemory/:macAddress',
    async ({ params, body }) => {
      const { macAddress } = params;
      const { summaryMemory } = body;

      // 查找设备
      const [device] = await db
        .select()
        .from(devices)
        .where(eq(devices.macAddress, macAddress))
        .limit(1);

      if (!device || !device.agentId) {
        throw new AppError(404, '设备不存在或未绑定智能体');
      }

      // 更新智能体记忆
      await db
        .update(agents)
        .set({
          summaryMemory,
          updatedAt: new Date(),
        })
        .where(eq(agents.id, device.agentId));

      return {
        code: 0,
        msg: 'success',
      };
    },
    {
      params: t.Object({
        macAddress: t.String(),
      }),
      body: t.Object({
        summaryMemory: t.String(),
      }),
      detail: {
        tags: ['智能体管理'],
        summary: '保存智能体记忆',
      },
    }
  )

  /**
   * 生成并保存聊天记录总结（异步）
   */
  .post(
    '/chat-summary/:sessionId/save',
    async ({ params }) => {
      const { sessionId } = params;

      // 这里应该异步调用 LLM 服务生成总结
      // 简化实现：直接返回成功，实际应该启动后台任务
      console.log(`启动会话 ${sessionId} 的聊天记录总结生成任务`);

      // 实际实现中应该：
      // 1. 从数据库获取会话的所有聊天记录
      // 2. 调用 LLM API 生成总结
      // 3. 保存总结到智能体的 summaryMemory 字段

      return {
        code: 0,
        msg: 'success',
      };
    },
    {
      params: t.Object({
        sessionId: t.String(),
      }),
      detail: {
        tags: ['智能体管理'],
        summary: '生成并保存聊天记录总结',
      },
    }
  )

  /**
   * 获取智能体的会话列表
   */
  .get(
    '/:id/sessions',
    async ({ params, query, user }) => {
      const { id } = params;
      const { page = 1, limit = 10 } = query as any;

      // 检查权限
      const [agent] = await db
        .select()
        .from(agents)
        .where(and(eq(agents.id, id), eq(agents.userId, Number(user!.id))))
        .limit(1);

      if (!agent) {
        throw new AppError(403, '没有权限查看该智能体的会话');
      }

      // 查询会话列表（按sessionId分组）
      const sessions = await db
        .select({
          sessionId: agentChatHistory.sessionId,
          agentId: agentChatHistory.agentId,
          macAddress: agentChatHistory.macAddress,
          messageCount: sql<number>`count(*)`,
          lastMessageTime: sql<Date>`max(${agentChatHistory.createdAt})`,
          firstMessageTime: sql<Date>`min(${agentChatHistory.createdAt})`,
        })
        .from(agentChatHistory)
        .where(eq(agentChatHistory.agentId, id))
        .groupBy(agentChatHistory.sessionId, agentChatHistory.agentId, agentChatHistory.macAddress)
        .orderBy(desc(sql`max(${agentChatHistory.createdAt})`))
        .limit(Number(limit))
        .offset((Number(page) - 1) * Number(limit));

      const [{ count }] = await db
        .select({ count: sql<number>`count(distinct ${agentChatHistory.sessionId})` })
        .from(agentChatHistory)
        .where(eq(agentChatHistory.agentId, id));

      return {
        code: 0,
        data: {
          list: sessions,
          total: Number(count),
          page: Number(page),
          limit: Number(limit),
        },
      };
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      query: t.Object({
        page: t.Optional(t.Number()),
        limit: t.Optional(t.Number()),
      }),
      detail: {
        tags: ['智能体管理'],
        summary: '获取智能体会话列表',
      },
    }
  )

  /**
   * 获取会话的聊天记录
   */
  .get(
    '/:id/chat-history/:sessionId',
    async ({ params, user }) => {
      const { id, sessionId } = params;

      // 检查权限
      const [agent] = await db
        .select()
        .from(agents)
        .where(and(eq(agents.id, id), eq(agents.userId, Number(user!.id))))
        .limit(1);

      if (!agent) {
        throw new AppError(403, '没有权限查看该智能体的聊天记录');
      }

      // 查询聊天记录
      const chatHistory = await db
        .select()
        .from(agentChatHistory)
        .where(and(eq(agentChatHistory.agentId, id), eq(agentChatHistory.sessionId, sessionId)))
        .orderBy(agentChatHistory.createdAt);

      return {
        code: 0,
        data: chatHistory,
      };
    },
    {
      params: t.Object({
        id: t.String(),
        sessionId: t.String(),
      }),
      detail: {
        tags: ['智能体管理'],
        summary: '获取会话聊天记录',
      },
    }
  )

  /**
   * 获取智能体最近的聊天记录（用户消息）
   */
  .get(
    '/:id/chat-history/user',
    async ({ params, user }) => {
      const { id } = params;

      // 检查权限
      const [agent] = await db
        .select()
        .from(agents)
        .where(and(eq(agents.id, id), eq(agents.userId, Number(user!.id))))
        .limit(1);

      if (!agent) {
        throw new AppError(403, '没有权限查看该智能体的聊天记录');
      }

      // 查询最近50条用户消息
      const recentMessages = await db
        .select()
        .from(agentChatHistory)
        .where(and(eq(agentChatHistory.agentId, id), eq(agentChatHistory.chatType, 1)))
        .orderBy(desc(agentChatHistory.createdAt))
        .limit(50);

      return {
        code: 0,
        data: recentMessages,
      };
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      detail: {
        tags: ['智能体管理'],
        summary: '获取智能体最近用户消息',
      },
    }
  )

  /**
   * 根据音频ID获取音频内容
   */
  .get(
    '/:id/chat-history/audio',
    async ({ params }) => {
      const { id } = params;

      const [audioData] = await db
        .select()
        .from(agentChatAudios)
        .where(eq(agentChatAudios.id, id))
        .limit(1);

      if (!audioData) {
        throw new AppError(404, '音频不存在');
      }

      return {
        code: 0,
        data: audioData.audio,
      };
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      detail: {
        tags: ['智能体管理'],
        summary: '获取音频内容',
      },
    }
  )

  /**
   * 获取音频下载令牌
   */
  .post(
    '/audio/:audioId',
    async ({ params }) => {
      const { audioId } = params;

      // 检查音频是否存在
      const [audioData] = await db
        .select()
        .from(agentChatAudios)
        .where(eq(agentChatAudios.id, audioId))
        .limit(1);

      if (!audioData) {
        throw new AppError(404, '音频不存在');
      }

      // 生成临时访问令牌
      const token = `audio_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // 实际项目中应该将token存储到Redis，设置过期时间
      // 这里简化处理，直接返回token

      return {
        code: 0,
        data: token,
      };
    },
    {
      params: t.Object({
        audioId: t.String(),
      }),
      detail: {
        tags: ['智能体管理'],
        summary: '获取音频下载令牌',
      },
    }
  )

  /**
   * 播放音频（通过令牌）
   */
  .get(
    '/play/:token',
    async ({ params, set }) => {
      const { token } = params;

      // 实际项目中应该从Redis获取audioId
      // 这里简化处理

      // 模拟返回音频数据
      set.headers['Content-Type'] = 'audio/mpeg';
      set.headers['Content-Disposition'] = 'inline';

      return new Uint8Array(0); // 实际应该返回真实的音频数据
    },
    {
      params: t.Object({
        token: t.String(),
      }),
      detail: {
        tags: ['智能体管理'],
        summary: '播放音频',
      },
    }
  );
