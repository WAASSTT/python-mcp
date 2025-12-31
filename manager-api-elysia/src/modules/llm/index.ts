import { requireAuth } from '@/common/middleware/auth';
import { llmClient } from '@/common/services/external';
import { Elysia, t } from 'elysia';

/**
 * LLM 服务模块
 * 对应 Java 项目的 llm 模块
 */
export const llmRoutes = new Elysia({ prefix: '/llm' })
  .use(requireAuth)

  /**
   * LLM 服务健康检查
   */
  .get(
    '/health',
    async () => {
      const isHealthy = await llmClient.healthCheck();

      return {
        code: 0,
        message: isHealthy ? 'LLM 服务正常' : 'LLM 服务异常',
        data: {
          status: isHealthy ? 'healthy' : 'unhealthy',
          timestamp: new Date().toISOString(),
        },
      };
    },
    {
      detail: {
        tags: ['LLM服务'],
        summary: 'LLM服务健康检查',
      },
    }
  )

  /**
   * 聊天补全
   */
  .post(
    '/chat/completions',
    async ({ body }) => {
      const { model, messages, temperature, maxTokens, stream } = body;

      try {
        const result = await llmClient.chatCompletion(messages, model);

        console.info('LLM聊天补全请求', { model, messageCount: messages.length });

        return {
          code: 0,
          data: result,
        };
      } catch (error) {
        console.error('LLM聊天补全失败', error as Error);
        throw error;
      }
    },
    {
      body: t.Object({
        model: t.String(),
        messages: t.Array(
          t.Object({
            role: t.String(),
            content: t.String(),
          })
        ),
        temperature: t.Optional(t.Number()),
        maxTokens: t.Optional(t.Number()),
        stream: t.Optional(t.Boolean()),
      }),
      detail: {
        tags: ['LLM服务'],
        summary: '聊天补全',
      },
    }
  )

  /**
   * 文本嵌入
   */
  .post(
    '/embeddings',
    async ({ body }) => {
      const { model, input } = body;

      // 这里需要对接实际的嵌入服务
      return {
        code: 0,
        data: {
          object: 'list',
          data: [
            {
              object: 'embedding',
              embedding: [], // 实际的嵌入向量
              index: 0,
            },
          ],
          model,
          usage: {
            prompt_tokens: 8,
            total_tokens: 8,
          },
        },
      };
    },
    {
      body: t.Object({
        model: t.String(),
        input: t.Union([t.String(), t.Array(t.String())]),
      }),
      detail: {
        tags: ['LLM服务'],
        summary: '文本嵌入',
      },
    }
  );
