import { requireAuth, requireRole } from '@/common/middleware/auth';
import { AppError } from '@/common/middleware/error-handler';
import { generateStringId } from '@/common/utils';
import { db, voiceClones, voiceResources } from '@/db';
import { and, desc, eq, sql } from 'drizzle-orm';
import { Elysia, t } from 'elysia';

/**
 * 声音克隆管理
 */
export const voiceCloneRoutes = new Elysia({ prefix: '/voice-clone' })
  .use(requireAuth)

  /**
   * 获取我的克隆声音列表
   */
  .get(
    '/list',
    async ({ user, query }) => {
      const { page = 1, limit = 10 } = query as any;

      const list = await db
        .select()
        .from(voiceClones)
        .where(eq(voiceClones.userId, Number(user!.id)))
        .orderBy(desc(voiceClones.createDate))
        .limit(Number(limit))
        .offset((Number(page) - 1) * Number(limit));

      const [{ count }] = await db
        .select({ count: sql`count(*)` })
        .from(voiceClones)
        .where(eq(voiceClones.userId, Number(user!.id)));

      return {
        code: 0,
        data: {
          list,
          total: Number(count),
        },
      };
    },
    {
      query: t.Object({
        page: t.Optional(t.Number()),
        limit: t.Optional(t.Number()),
      }),
      detail: {
        tags: ['声音克隆'],
        summary: '获取我的克隆声音列表',
      },
    }
  )

  /**
   * 上传声音文件进行克隆
   */
  .post(
    '/upload',
    async ({ body, user }) => {
      const { voiceName, audioBase64, duration } = body;

      const id = generateStringId('voice_clone');

      // 创建克隆任务
      await db.insert(voiceClones).values({
        id,
        userId: Number(user!.id),
        name: voiceName,
        voice: audioBase64,
        trainStatus: 0, // 处理中
        creator: Number(user!.id),
        createDate: new Date(),
      });

      // 这里应该调用声音克隆服务进行处理
      // 简化处理：直接标记为成功
      setTimeout(async () => {
        await db
          .update(voiceClones)
          .set({
            trainStatus: 1, // 成功
            voiceId: `voice_${id}`,
          })
          .where(eq(voiceClones.id, id));
      }, 3000);

      return {
        code: 0,
        msg: '克隆任务已创建',
        data: { id },
      };
    },
    {
      body: t.Object({
        voiceName: t.String(),
        audioBase64: t.String(),
        duration: t.Optional(t.Number()),
      }),
      detail: {
        tags: ['声音克隆'],
        summary: '上传声音文件进行克隆',
      },
    }
  )

  /**
   * 获取克隆任务状态
   */
  .get(
    '/:id/status',
    async ({ params: { id }, user }) => {
      const [clone] = await db.select().from(voiceClones).where(eq(voiceClones.id, id)).limit(1);

      if (!clone) {
        throw new AppError(404, '克隆任务不存在');
      }

      if (clone.userId !== Number(user!.id)) {
        throw new AppError(403, '无权访问');
      }

      return {
        code: 0,
        data: {
          status: clone.trainStatus,
          voiceId: clone.voiceId,
          msg: clone.trainStatus === 0 ? '处理中' : clone.trainStatus === 1 ? '成功' : '失败',
        },
      };
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      detail: {
        tags: ['声音克隆'],
        summary: '获取克隆任务状态',
      },
    }
  )

  /**
   * 试听克隆声音
   */
  .post(
    '/:id/play',
    async ({ params: { id }, body, user }) => {
      const { text } = body;

      const [clone] = await db.select().from(voiceClones).where(eq(voiceClones.id, id)).limit(1);

      if (!clone) {
        throw new AppError(404, '克隆声音不存在');
      }

      if (clone.userId !== Number(user!.id)) {
        throw new AppError(403, '无权访问');
      }

      if (clone.trainStatus !== 1) {
        throw new AppError(400, '声音克隆未完成');
      }

      // 这里应该调用 TTS 服务生成音频
      // 简化处理：返回模拟的音频 URL
      return {
        code: 0,
        data: {
          audioUrl: `/api/audio/tts/${clone.voiceId}/${Date.now()}.mp3`,
        },
      };
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      body: t.Object({
        text: t.String(),
      }),
      detail: {
        tags: ['声音克隆'],
        summary: '试听克隆声音',
      },
    }
  )

  /**
   * 更新克隆声音名称
   */
  .put(
    '/:id/name',
    async ({ params: { id }, body, user }) => {
      const [clone] = await db.select().from(voiceClones).where(eq(voiceClones.id, id)).limit(1);

      if (!clone) {
        throw new AppError(404, '克隆声音不存在');
      }

      if (clone.userId !== Number(user!.id)) {
        throw new AppError(403, '无权访问');
      }

      await db
        .update(voiceClones)
        .set({
          name: body.voiceName,
        })
        .where(eq(voiceClones.id, id));

      return {
        code: 0,
        msg: '更新成功',
      };
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      body: t.Object({
        voiceName: t.String(),
      }),
      detail: {
        tags: ['声音克隆'],
        summary: '更新克隆声音名称',
      },
    }
  )

  /**
   * 删除克隆声音
   */
  .delete(
    '/:id',
    async ({ params: { id }, user }) => {
      const [clone] = await db.select().from(voiceClones).where(eq(voiceClones.id, id)).limit(1);

      if (!clone) {
        throw new AppError(404, '克隆声音不存在');
      }

      if (clone.userId !== Number(user!.id)) {
        throw new AppError(403, '无权访问');
      }

      await db.delete(voiceClones).where(eq(voiceClones.id, id));

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
        tags: ['声音克隆'],
        summary: '删除克隆声音',
      },
    }
  );

/**
 * 声音资源管理
 */
export const voiceResourceRoutes = new Elysia({ prefix: '/voice-resource' })
  .use(requireAuth)

  /**
   * 获取声音资源列表
   */
  .get(
    '/list',
    async ({ query }) => {
      const { page = 1, limit = 20, platform } = query as any;

      const conditions = [];
      if (platform) {
        conditions.push(eq(voiceResources.platform, platform));
      }

      const queryBuilder = db.select().from(voiceResources);
      const list = await (conditions.length > 0
        ? queryBuilder.where(and(...conditions))
        : queryBuilder
      )
        .orderBy(desc(voiceResources.sort))
        .limit(Number(limit))
        .offset((Number(page) - 1) * Number(limit));

      return {
        code: 0,
        data: list,
      };
    },
    {
      query: t.Object({
        page: t.Optional(t.Number()),
        limit: t.Optional(t.Number()),
        platform: t.Optional(t.String()),
      }),
      detail: {
        tags: ['声音资源'],
        summary: '获取声音资源列表',
      },
    }
  )

  /**
   * 获取 TTS 平台列表
   */
  .get(
    '/platforms',
    async () => {
      const platforms = await db
        .selectDistinct({ platform: voiceResources.platform })
        .from(voiceResources);

      return {
        code: 0,
        data: platforms.map(p => p.platform),
      };
    },
    {
      detail: {
        tags: ['声音资源'],
        summary: '获取 TTS 平台列表',
      },
    }
  )

  // ========== 管理员接口 ==========

  .use(requireRole(['admin', 'superAdmin']))

  /**
   * 创建声音资源（管理员）
   */
  .post(
    '/create',
    async ({ body }) => {
      const id = generateStringId('voice_res');

      await db.insert(voiceResources).values({
        id,
        voiceId: body.voiceId,
        name: body.voiceName,
        platform: body.platform,
        language: body.language,
        gender: body.gender,
        sampleUrl: body.sampleUrl,
        sort: body.sort,
      });

      return {
        code: 0,
        msg: '创建成功',
        data: { id },
      };
    },
    {
      body: t.Object({
        voiceName: t.String(),
        voiceId: t.String(),
        platform: t.String(),
        language: t.Optional(t.String()),
        gender: t.Optional(t.String()),
        sampleUrl: t.Optional(t.String()),
        sort: t.Optional(t.Number()),
      }),
      detail: {
        tags: ['声音资源'],
        summary: '创建声音资源（管理员）',
      },
    }
  )

  /**
   * 更新声音资源（管理员）
   */
  .put(
    '/:id',
    async ({ params: { id }, body }) => {
      await db
        .update(voiceResources)
        .set({
          ...body,
          updateDate: new Date(),
        })
        .where(eq(voiceResources.id, id));

      return {
        code: 0,
        msg: '更新成功',
      };
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      body: t.Object({
        voiceName: t.Optional(t.String()),
        sampleUrl: t.Optional(t.String()),
        sort: t.Optional(t.Number()),
      }),
      detail: {
        tags: ['声音资源'],
        summary: '更新声音资源（管理员）',
      },
    }
  )

  /**
   * 删除声音资源（管理员）
   */
  .delete(
    '/:id',
    async ({ params: { id } }) => {
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
        summary: '删除声音资源（管理员）',
      },
    }
  );
