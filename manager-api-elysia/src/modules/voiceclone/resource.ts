import { requireAuth } from '@/common/middleware/auth';
import { AppError } from '@/common/middleware/error-handler';
import { generateStringId } from '@/common/utils';
import { db, voiceResources } from '@/db';
import { and, desc, eq, like, sql } from 'drizzle-orm';
import { Elysia, t } from 'elysia';

/**
 * 声音资源管理模块
 */
export const voiceResourceFullRoutes = new Elysia({ prefix: '/voice-resource' })
  .use(requireAuth)

  /**
   * 获取声音资源列表
   */
  .get(
    '/list',
    async ({ query, user }) => {
      const { page = 1, limit = 10, name, platform } = query as any;

      let conditions: any[] = [];

      // 只查询用户自己的或者公共的声音资源
      if (name) {
        conditions.push(like(voiceResources.name, `%${name}%`));
      }
      if (platform) {
        conditions.push(eq(voiceResources.platform, platform));
      }

      const list = await db
        .select()
        .from(voiceResources)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(voiceResources.createDate))
        .limit(Number(limit))
        .offset((Number(page) - 1) * Number(limit));

      const [{ count }] = await db
        .select({ count: sql`count(*)` })
        .from(voiceResources)
        .where(conditions.length > 0 ? and(...conditions) : undefined);

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
        name: t.Optional(t.String()),
        platform: t.Optional(t.String()),
      }),
      detail: {
        tags: ['声音资源'],
        summary: '获取声音资源列表',
      },
    }
  )

  /**
   * 获取单个声音资源详情
   */
  .get(
    '/:id',
    async ({ params }) => {
      const [resource] = await db
        .select()
        .from(voiceResources)
        .where(eq(voiceResources.id, params.id))
        .limit(1);

      if (!resource) {
        throw new AppError(404, '声音资源不存在');
      }

      return {
        code: 0,
        data: resource,
      };
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      detail: {
        tags: ['声音资源'],
        summary: '获取声音资源详情',
      },
    }
  )

  /**
   * 创建声音资源
   */
  .post(
    '/',
    async ({ body, user }) => {
      const { name, platform, voiceId, language, gender, sampleUrl, config } = body;

      const id = generateStringId('voice_res');

      await db.insert(voiceResources).values({
        id,
        name,
        userId: Number(user!.id),
        platform,
        voiceId,
        language,
        gender,
        sampleUrl,
        config,
        status: 1,
        creator: Number(user!.id),
        createDate: new Date(),
      });

      const [newResource] = await db
        .select()
        .from(voiceResources)
        .where(eq(voiceResources.id, id))
        .limit(1);

      return {
        code: 0,
        msg: '创建成功',
        data: newResource,
      };
    },
    {
      body: t.Object({
        name: t.String({ minLength: 1, maxLength: 100 }),
        platform: t.String(),
        voiceId: t.String(),
        language: t.Optional(t.String()),
        gender: t.Optional(t.String()),
        sampleUrl: t.Optional(t.String()),
        config: t.Optional(t.Any()),
      }),
      detail: {
        tags: ['声音资源'],
        summary: '创建声音资源',
      },
    }
  )

  /**
   * 删除声音资源
   */
  .delete(
    '/:id',
    async ({ params, user }) => {
      const { id } = params;

      const [existing] = await db
        .select()
        .from(voiceResources)
        .where(eq(voiceResources.id, id))
        .limit(1);

      if (!existing) {
        throw new AppError(404, '声音资源不存在');
      }

      // 检查权限
      if (existing.userId !== Number(user!.id)) {
        throw new AppError(403, '无权限删除此资源');
      }

      await db.delete(voiceResources).where(eq(voiceResources.id, id));

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
        tags: ['声音资源'],
        summary: '删除声音资源',
      },
    }
  )

  /**
   * 获取用户的声音资源
   */
  .get(
    '/user/:userId',
    async ({ params }) => {
      const { userId } = params;

      const resources = await db
        .select()
        .from(voiceResources)
        .where(eq(voiceResources.userId, Number(userId)));

      return {
        code: 0,
        data: resources,
      };
    },
    {
      params: t.Object({
        userId: t.String(),
      }),
      detail: {
        tags: ['声音资源'],
        summary: '获取用户声音资源',
      },
    }
  )

  /**
   * 获取 TTS 平台列表
   */
  .get(
    '/platforms',
    async () => {
      // 返回支持的 TTS 平台列表
      const platforms = [
        { code: 'openai', name: 'OpenAI TTS', description: 'OpenAI 文本转语音' },
        { code: 'azure', name: 'Azure TTS', description: '微软 Azure 语音服务' },
        { code: 'google', name: 'Google TTS', description: 'Google 文本转语音' },
        { code: 'elevenlabs', name: 'ElevenLabs', description: 'ElevenLabs AI 语音' },
        { code: 'custom', name: '自定义', description: '自定义 TTS 服务' },
      ];

      return {
        code: 0,
        data: platforms,
      };
    },
    {
      detail: {
        tags: ['声音资源'],
        summary: '获取TTS平台列表',
      },
    }
  );
