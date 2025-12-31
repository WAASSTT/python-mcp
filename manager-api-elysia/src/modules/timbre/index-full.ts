import { requireAuth, requireRole } from '@/common/middleware/auth';
import { AppError } from '@/common/middleware/error-handler';
import { generateStringId } from '@/common/utils';
import { db, timbres } from '@/db';
import { and, desc, eq, like, sql } from 'drizzle-orm';
import { Elysia, t } from 'elysia';

/**
 * 音色管理
 */
export const timbreRoutes = new Elysia({ prefix: '/timbre' })
  .use(requireAuth)

  /**
   * 获取音色列表（分页）
   */
  .get(
    '/page',
    async ({ query }) => {
      const { page = 1, limit = 20, keyword, language, gender } = query as any;

      const conditions = [];
      // 关键词搜索
      if (keyword) {
        conditions.push(like(timbres.name, `%${keyword}%`));
      }

      // 语言筛选
      if (language) {
        conditions.push(eq(timbres.language, language));
      }

      // 性别筛选
      if (gender) {
        conditions.push(eq(timbres.gender, gender));
      }

      const queryBuilder = db.select().from(timbres);
      const list = await (conditions.length > 0
        ? queryBuilder.where(and(...conditions))
        : queryBuilder
      )
        .orderBy(desc(timbres.sort))
        .limit(Number(limit))
        .offset((Number(page) - 1) * Number(limit));

      const [{ count }] = await db.select({ count: sql`count(*)` }).from(timbres);

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
        keyword: t.Optional(t.String()),
        language: t.Optional(t.String()),
        gender: t.Optional(t.String()),
      }),
      detail: {
        tags: ['音色管理'],
        summary: '获取音色列表（分页）',
      },
    }
  )

  /**
   * 获取所有音色
   */
  .get(
    '/all',
    async () => {
      const list = await db.select().from(timbres).orderBy(desc(timbres.sort));

      return {
        code: 0,
        data: list,
      };
    },
    {
      detail: {
        tags: ['音色管理'],
        summary: '获取所有音色',
      },
    }
  )

  /**
   * 获取音色详情
   */
  .get(
    '/:id',
    async ({ params: { id } }) => {
      const [timbre] = await db.select().from(timbres).where(eq(timbres.id, id)).limit(1);

      if (!timbre) {
        throw new AppError(404, '音色不存在');
      }

      return {
        code: 0,
        data: timbre,
      };
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      detail: {
        tags: ['音色管理'],
        summary: '获取音色详情',
      },
    }
  )

  /**
   * 根据 voiceId 获取音色
   */
  .get(
    '/voice/:voiceId',
    async ({ params: { voiceId } }) => {
      const [timbre] = await db.select().from(timbres).where(eq(timbres.voiceId, voiceId)).limit(1);

      if (!timbre) {
        throw new AppError(404, '音色不存在');
      }

      return {
        code: 0,
        data: timbre,
      };
    },
    {
      params: t.Object({
        voiceId: t.String(),
      }),
      detail: {
        tags: ['音色管理'],
        summary: '根据 voiceId 获取音色',
      },
    }
  )

  /**
   * 获取可用语言列表
   */
  .get(
    '/languages/list',
    async () => {
      const languages = await db.selectDistinct({ language: timbres.language }).from(timbres);

      return {
        code: 0,
        data: languages.map(l => l.language).filter(Boolean),
      };
    },
    {
      detail: {
        tags: ['音色管理'],
        summary: '获取可用语言列表',
      },
    }
  )

  // ========== 管理员接口 ==========

  .use(requireRole(['admin', 'superAdmin']))

  /**
   * 创建音色（管理员）
   */
  .post(
    '/create',
    async ({ body }) => {
      const id = generateStringId('timbre');

      await db.insert(timbres).values({
        id,
        ...body,
      });

      return {
        code: 0,
        msg: '创建成功',
        data: { id },
      };
    },
    {
      body: t.Object({
        name: t.String(),
        voiceId: t.String(),
        language: t.String(),
        gender: t.String(),
        description: t.Optional(t.String()),
        sampleUrl: t.Optional(t.String()),
        provider: t.Optional(t.String()),
        sort: t.Optional(t.Number()),
      }),
      detail: {
        tags: ['音色管理'],
        summary: '创建音色（管理员）',
      },
    }
  )

  /**
   * 更新音色（管理员）
   */
  .put(
    '/:id',
    async ({ params: { id }, body }) => {
      await db
        .update(timbres)
        .set({
          ...body,
          updateDate: new Date(),
        })
        .where(eq(timbres.id, id));

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
        name: t.Optional(t.String()),
        description: t.Optional(t.String()),
        sampleUrl: t.Optional(t.String()),
        sort: t.Optional(t.Number()),
      }),
      detail: {
        tags: ['音色管理'],
        summary: '更新音色（管理员）',
      },
    }
  )

  /**
   * 删除音色（管理员）
   */
  .delete(
    '/:id',
    async ({ params: { id } }) => {
      await db.delete(timbres).where(eq(timbres.id, id));

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
        tags: ['音色管理'],
        summary: '删除音色（管理员）',
      },
    }
  )

  /**
   * 批量导入音色（管理员）
   */
  .post(
    '/batch-import',
    async ({ body }) => {
      const { timbres: timbreList } = body;

      for (const timbre of timbreList) {
        const id = generateStringId('timbre');

        await db.insert(timbres).values({
          id,
          ...timbre,
        });
      }

      return {
        code: 0,
        message: `成功导入 ${timbreList.length} 个音色`,
      };
    },
    {
      body: t.Object({
        timbres: t.Array(
          t.Object({
            name: t.String(),
            voiceId: t.String(),
            language: t.String(),
            gender: t.String(),
            description: t.Optional(t.String()),
            sampleUrl: t.Optional(t.String()),
            provider: t.Optional(t.String()),
            sort: t.Optional(t.Number()),
          })
        ),
      }),
      detail: {
        tags: ['音色管理'],
        summary: '批量导入音色（管理员）',
      },
    }
  );
