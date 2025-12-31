import { requireAuth, requireRole } from '@/common/middleware/auth';
import { serverMonitor } from '@/common/services/external';
import { Elysia, t } from 'elysia';

/**
 * 服务器端管理模块
 */
export const serverManageRoutes = new Elysia({ prefix: '/sys/server' })
  .use(requireAuth)
  .use(requireRole(['admin', 'superAdmin']))

  /**
   * 获取服务器列表
   */
  .get(
    '/list',
    async () => {
      const servers = await serverMonitor.getServerList();

      return {
        code: 0,
        data: servers,
      };
    },
    {
      detail: {
        tags: ['服务器管理'],
        summary: '获取服务器列表',
      },
    }
  )

  /**
   * 触发服务器动作
   */
  .post(
    '/emit-action',
    async ({ body }) => {
      const { serverId, action, params } = body;

      console.log(`服务器 ${serverId} 执行动作: ${action}`, params);

      // 实际项目中应该通过消息队列或RPC调用相应的服务器执行动作
      // 支持的动作可能包括: restart, stop, reload-config, clear-cache 等

      return {
        code: 0,
        message: `动作 ${action} 已发送到服务器 ${serverId}`,
        data: {
          serverId,
          action,
          timestamp: new Date().toISOString(),
          status: 'pending',
        },
      };
    },
    {
      body: t.Object({
        serverId: t.String(),
        action: t.String(),
        params: t.Optional(t.Any()),
      }),
      detail: {
        tags: ['服务器管理'],
        summary: '触发服务器动作',
      },
    }
  )

  /**
   * 获取服务器状态
   */
  .get(
    '/:serverId/status',
    async ({ params }) => {
      const { serverId } = params;

      // 实际项目中应该查询真实的服务器状态
      const status = {
        serverId,
        status: 'online',
        cpu: Math.random() * 100,
        memory: Math.random() * 100,
        disk: Math.random() * 100,
        network: {
          rx: Math.random() * 1000,
          tx: Math.random() * 1000,
        },
        timestamp: new Date().toISOString(),
      };

      return {
        code: 0,
        data: status,
      };
    },
    {
      params: t.Object({
        serverId: t.String(),
      }),
      detail: {
        tags: ['服务器管理'],
        summary: '获取服务器状态',
      },
    }
  )

  /**
   * 获取服务器日志
   */
  .get(
    '/:serverId/logs',
    async ({ params, query }) => {
      const { serverId } = params;
      const { lines = 100, level } = query as any;

      // 实际项目中应该读取真实的服务器日志
      const logs = Array.from({ length: Number(lines) }, (_, i) => ({
        timestamp: new Date(Date.now() - i * 1000).toISOString(),
        level: level || ['info', 'warn', 'error'][Math.floor(Math.random() * 3)],
        message: `日志消息 ${i + 1}`,
        serverId,
      }));

      return {
        code: 0,
        data: {
          serverId,
          logs,
          total: logs.length,
        },
      };
    },
    {
      params: t.Object({
        serverId: t.String(),
      }),
      query: t.Object({
        lines: t.Optional(t.Number()),
        level: t.Optional(t.String()),
      }),
      detail: {
        tags: ['服务器管理'],
        summary: '获取服务器日志',
      },
    }
  );
