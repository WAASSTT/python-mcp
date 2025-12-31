import { requireAuth } from '@/common/middleware/auth';
import { AppError } from '@/common/middleware/error-handler';
import { generateStringId } from '@/common/utils';
import { db, knowledgeBases, knowledgeFiles } from '@/db';
import { and, desc, eq, sql } from 'drizzle-orm';
import { Elysia, t } from 'elysia';

/**
 * 知识库文件管理
 */
export const knowledgeFileRoutes = new Elysia({ prefix: '/knowledge' })
  .use(requireAuth)

  /**
   * 上传文件到知识库
   */
  .post(
    '/:knowledgeBaseId/upload',
    async ({ params: { knowledgeBaseId }, body, user }) => {
      // 检查知识库是否存在且属于当前用户
      const [kb] = await db
        .select()
        .from(knowledgeBases)
        .where(
          and(eq(knowledgeBases.id, knowledgeBaseId), eq(knowledgeBases.creator, Number(user!.id)))
        )
        .limit(1);

      if (!kb) {
        throw new AppError(404, '知识库不存在或无权访问');
      }

      const { fileName, fileUrl, fileSize, fileType } = body;
      const id = generateStringId('kb_file');

      // 创建文件记录
      await db.insert(knowledgeFiles).values({
        id,
        knowledgeBaseId,
        fileName,
        filePath: fileUrl,
        fileSize,
        fileType,
        status: 0, // 待处理
        creator: Number(user!.id),
        createDate: new Date(),
      });

      // 这里应该异步处理文件，提取文本并存储到向量数据库
      // 简化处理：模拟异步处理
      setTimeout(async () => {
        await db
          .update(knowledgeFiles)
          .set({
            status: 1, // 处理成功
            processedAt: new Date(),
            updateDate: new Date(),
          })
          .where(eq(knowledgeFiles.id, id));
      }, 2000);

      return {
        code: 0,
        msg: '文件上传成功，正在处理',
        data: { id },
      };
    },
    {
      params: t.Object({
        knowledgeBaseId: t.String(),
      }),
      body: t.Object({
        fileName: t.String(),
        fileUrl: t.String(),
        fileSize: t.Number(),
        fileType: t.String(),
      }),
      detail: {
        tags: ['知识库'],
        summary: '上传文件到知识库',
      },
    }
  )

  /**
   * 获取知识库文件列表
   */
  .get(
    '/:knowledgeBaseId/files',
    async ({ params: { knowledgeBaseId }, user, query }) => {
      const { page = 1, limit = 10 } = query as any;

      // 检查知识库是否存在且属于当前用户
      const [kb] = await db
        .select()
        .from(knowledgeBases)
        .where(
          and(eq(knowledgeBases.id, knowledgeBaseId), eq(knowledgeBases.creator, Number(user!.id)))
        )
        .limit(1);

      if (!kb) {
        throw new AppError(404, '知识库不存在或无权访问');
      }

      const list = await db
        .select()
        .from(knowledgeFiles)
        .where(eq(knowledgeFiles.knowledgeBaseId, knowledgeBaseId))
        .orderBy(desc(knowledgeFiles.createDate))
        .limit(Number(limit))
        .offset((Number(page) - 1) * Number(limit));

      const [{ count }] = await db
        .select({ count: sql`count(*)` })
        .from(knowledgeFiles)
        .where(eq(knowledgeFiles.knowledgeBaseId, knowledgeBaseId));

      return {
        code: 0,
        data: {
          list,
          total: Number(count),
        },
      };
    },
    {
      params: t.Object({
        knowledgeBaseId: t.String(),
      }),
      query: t.Object({
        page: t.Optional(t.Number()),
        limit: t.Optional(t.Number()),
      }),
      detail: {
        tags: ['知识库'],
        summary: '获取知识库文件列表',
      },
    }
  )

  /**
   * 获取文件详情
   */
  .get(
    '/file/:fileId',
    async ({ params: { fileId }, user }) => {
      const [file] = await db
        .select()
        .from(knowledgeFiles)
        .where(eq(knowledgeFiles.id, fileId))
        .limit(1);

      if (!file) {
        throw new AppError(404, '文件不存在');
      }

      // 检查权限
      const [kb] = await db
        .select()
        .from(knowledgeBases)
        .where(
          and(
            eq(knowledgeBases.id, file.knowledgeBaseId),
            eq(knowledgeBases.creator, Number(user!.id))
          )
        )
        .limit(1);

      if (!kb) {
        throw new AppError(403, '无权访问');
      }

      return {
        code: 0,
        data: file,
      };
    },
    {
      params: t.Object({
        fileId: t.String(),
      }),
      detail: {
        tags: ['知识库'],
        summary: '获取文件详情',
      },
    }
  )

  /**
   * 重新处理文件
   */
  .post(
    '/file/:fileId/reprocess',
    async ({ params: { fileId }, user }) => {
      const [file] = await db
        .select()
        .from(knowledgeFiles)
        .where(eq(knowledgeFiles.id, fileId))
        .limit(1);

      if (!file) {
        throw new AppError(404, '文件不存在');
      }

      // 检查权限
      const [kb] = await db
        .select()
        .from(knowledgeBases)
        .where(
          and(
            eq(knowledgeBases.id, file.knowledgeBaseId),
            eq(knowledgeBases.creator, Number(user!.id))
          )
        )
        .limit(1);

      if (!kb) {
        throw new AppError(403, '无权访问');
      }

      // 更新状态为处理中
      await db
        .update(knowledgeFiles)
        .set({
          status: 0, // 待处理
          errorMessage: null,
          updateDate: new Date(),
        })
        .where(eq(knowledgeFiles.id, fileId));

      // 模拟异步处理
      setTimeout(async () => {
        await db
          .update(knowledgeFiles)
          .set({
            status: 1, // 处理成功
            processedAt: new Date(),
            updateDate: new Date(),
          })
          .where(eq(knowledgeFiles.id, fileId));
      }, 2000);

      return {
        code: 0,
        msg: '重新处理已启动',
      };
    },
    {
      params: t.Object({
        fileId: t.String(),
      }),
      detail: {
        tags: ['知识库'],
        summary: '重新处理文件',
      },
    }
  )

  /**
   * 删除文件
   */
  .delete(
    '/file/:fileId',
    async ({ params: { fileId }, user }) => {
      const [file] = await db
        .select()
        .from(knowledgeFiles)
        .where(eq(knowledgeFiles.id, fileId))
        .limit(1);

      if (!file) {
        throw new AppError(404, '文件不存在');
      }

      // 检查权限
      const [kb] = await db
        .select()
        .from(knowledgeBases)
        .where(
          and(
            eq(knowledgeBases.id, file.knowledgeBaseId),
            eq(knowledgeBases.creator, Number(user!.id))
          )
        )
        .limit(1);

      if (!kb) {
        throw new AppError(403, '无权访问');
      }

      // 删除文件
      await db.delete(knowledgeFiles).where(eq(knowledgeFiles.id, fileId));

      // 这里应该同时删除向量数据库中的数据

      return {
        code: 0,
        msg: '删除成功',
      };
    },
    {
      params: t.Object({
        fileId: t.String(),
      }),
      detail: {
        tags: ['知识库'],
        summary: '删除文件',
      },
    }
  )

  /**
   * 批量删除文件
   */
  .post(
    '/files/batch-delete',
    async ({ body, user }) => {
      const { fileIds } = body;

      for (const fileId of fileIds) {
        const [file] = await db
          .select()
          .from(knowledgeFiles)
          .where(eq(knowledgeFiles.id, fileId))
          .limit(1);

        if (!file) continue;

        // 检查权限
        const [kb] = await db
          .select()
          .from(knowledgeBases)
          .where(
            and(
              eq(knowledgeBases.id, file.knowledgeBaseId),
              eq(knowledgeBases.creator, Number(user!.id))
            )
          )
          .limit(1);

        if (!kb) continue;

        // 删除文件
        await db.delete(knowledgeFiles).where(eq(knowledgeFiles.id, fileId));
      }

      return {
        code: 0,
        msg: '批量删除成功',
      };
    },
    {
      body: t.Object({
        fileIds: t.Array(t.String()),
      }),
      detail: {
        tags: ['知识库'],
        summary: '批量删除文件',
      },
    }
  );
