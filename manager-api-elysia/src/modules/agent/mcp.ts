import { requireAuth } from '@/common/middleware/auth';
import { mcpClient } from '@/common/services/external';
import { Elysia, t } from 'elysia';

/**
 * Agent MCP 访问点管理
 */
export const agentMcpRoutes = new Elysia({ prefix: '/agent' })
  .use(requireAuth)

  /**
   * 获取 Agent 的 MCP 访问地址
   */
  .get(
    '/:id/mcp/address',
    async ({ params }) => {
      const { id: agentId } = params;

      try {
        const data = await mcpClient.getAddress(agentId);
        console.debug('获取MCP地址', { agentId });

        return {
          code: 0,
          data,
        };
      } catch (error) {
        console.error('获取MCP地址失败', error as Error);
        throw error;
      }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      detail: {
        tags: ['智能体管理'],
        summary: '获取Agent的MCP访问地址',
      },
    }
  )

  /**
   * 获取 Agent 的 MCP 工具列表
   */
  .get(
    '/:id/mcp/tools',
    async ({ params }) => {
      const { id: agentId } = params;

      // 这里应该从 MCP 服务获取实际的工具列表
      const tools = [
        {
          name: 'search',
          description: '搜索工具',
          parameters: {
            query: 'string',
          },
        },
        {
          name: 'calculator',
          description: '计算器',
          parameters: {
            expression: 'string',
          },
        },
        {
          name: 'weather',
          description: '天气查询',
          parameters: {
            location: 'string',
          },
        },
      ];

      return {
        code: 0,
        data: {
          agentId,
          tools,
          total: tools.length,
        },
      };
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      detail: {
        tags: ['智能体管理'],
        summary: '获取Agent的MCP工具列表',
      },
    }
  );
