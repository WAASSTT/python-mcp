import { requireAuth, requireRole } from '@/common/middleware/auth';
import { AppError } from '@/common/middleware/error-handler';
import { generateStringId } from '@/common/utils';
import { db, otaPackages } from '@/db';
import { and, desc, eq, gte } from 'drizzle-orm';
import { Elysia, t } from 'elysia';

/**
 * OTA 升级管理
 */
export const otaRoutes = new Elysia({ prefix: '/ota' })

  /**
   * 检查更新（设备端调用）
   */
  .post(
    '/check-update',
    async ({ body }) => {
      const { deviceModel, currentVersion } = body;

      // 查询该设备型号的最新版本
      const [latestPackage] = await db
        .select()
        .from(otaPackages)
        .where(
          and(
            eq(otaPackages.deviceModel, deviceModel),
            eq(otaPackages.status, 1), // 已发布
            gte(otaPackages.version, currentVersion)
          )
        )
        .orderBy(desc(otaPackages.version))
        .limit(1);

      if (!latestPackage || latestPackage.version === currentVersion) {
        return {
          code: 0,
          data: {
            hasUpdate: false,
            msg: '当前已是最新版本',
          },
        };
      }

      return {
        code: 0,
        data: {
          hasUpdate: true,
          version: latestPackage.version,
          fileUrl: latestPackage.filePath,
          fileSize: latestPackage.fileSize,
          md5: latestPackage.md5,
          forceUpdate: latestPackage.forceUpdate,
          description: latestPackage.description,
        },
      };
    },
    {
      body: t.Object({
        deviceModel: t.String(),
        currentVersion: t.String(),
      }),
      detail: {
        tags: ['OTA 升级'],
        summary: '检查更新（设备端调用）',
      },
    }
  )

  /**
   * 下载升级包（设备端调用）
   */
  .get(
    '/download/:packageId',
    async ({ params: { packageId } }) => {
      const [pkg] = await db
        .select()
        .from(otaPackages)
        .where(eq(otaPackages.id, packageId))
        .limit(1);

      if (!pkg) {
        throw new AppError(404, '升级包不存在');
      }

      // 增加下载次数
      await db
        .update(otaPackages)
        .set({
          downloadCount: (pkg.downloadCount || 0) + 1,
          updateDate: new Date(),
        })
        .where(eq(otaPackages.id, packageId));

      // 返回文件 URL（实际应该返回文件流或重定向到文件服务器）
      return {
        code: 0,
        data: {
          url: pkg.filePath,
        },
      };
    },
    {
      params: t.Object({
        packageId: t.String(),
      }),
      detail: {
        tags: ['OTA 升级'],
        summary: '下载升级包（设备端调用）',
      },
    }
  )

  // ========== 管理端接口 ==========

  .use(requireAuth)
  .use(requireRole(['admin', 'superAdmin']))

  /**
   * 获取升级包列表（管理员）
   */
  .get(
    '/packages',
    async ({ query }) => {
      const { page = 1, limit = 10, deviceModel } = query as any;

      const conditions = [];
      if (deviceModel) {
        conditions.push(eq(otaPackages.deviceModel, deviceModel));
      }

      const queryBuilder = db.select().from(otaPackages);
      const list = await (conditions.length > 0
        ? queryBuilder.where(and(...conditions))
        : queryBuilder
      )
        .orderBy(desc(otaPackages.createDate))
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
        deviceModel: t.Optional(t.String()),
      }),
      detail: {
        tags: ['OTA 升级'],
        summary: '获取升级包列表（管理员）',
      },
    }
  )

  /**
   * 创建升级包（管理员）
   */
  .post(
    '/package',
    async ({ body }) => {
      const id = generateStringId('ota');

      await db.insert(otaPackages).values({
        id,
        version: body.version,
        deviceModel: body.deviceModel,
        filePath: body.fileUrl,
        fileSize: body.fileSize,
        md5: body.md5,
        description: body.description,
        forceUpdate: body.forceUpdate ? 1 : 0,
        downloadCount: 0,
        status: 0, // 草稿
      });

      return {
        code: 0,
        msg: '创建成功',
        data: { id },
      };
    },
    {
      body: t.Object({
        version: t.String(),
        deviceModel: t.String(),
        fileUrl: t.String(),
        fileSize: t.Number(),
        md5: t.String(),
        description: t.Optional(t.String()),
        forceUpdate: t.Optional(t.Boolean()),
      }),
      detail: {
        tags: ['OTA 升级'],
        summary: '创建升级包（管理员）',
      },
    }
  )

  /**
   * 更新升级包（管理员）
   */
  .put(
    '/package/:id',
    async ({ params: { id }, body }) => {
      const updateData: any = {
        updateDate: new Date(),
      };

      // 只复制允许的字段
      if (body.version !== undefined) updateData.version = body.version;
      if (body.description !== undefined) updateData.description = body.description;
      if (body.status !== undefined) updateData.status = body.status;
      if (body.forceUpdate !== undefined) updateData.forceUpdate = body.forceUpdate ? 1 : 0;

      await db.update(otaPackages).set(updateData).where(eq(otaPackages.id, id));

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
        version: t.Optional(t.String()),
        description: t.Optional(t.String()),
        forceUpdate: t.Optional(t.Boolean()),
        status: t.Optional(t.Number()),
      }),
      detail: {
        tags: ['OTA 升级'],
        summary: '更新升级包（管理员）',
      },
    }
  )

  /**
   * 发布升级包（管理员）
   */
  .post(
    '/package/:id/publish',
    async ({ params: { id } }) => {
      await db
        .update(otaPackages)
        .set({
          status: 1, // 已发布
          updateDate: new Date(),
        })
        .where(eq(otaPackages.id, id));

      return {
        code: 0,
        msg: '发布成功',
      };
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      detail: {
        tags: ['OTA 升级'],
        summary: '发布升级包（管理员）',
      },
    }
  )

  /**
   * 删除升级包（管理员）
   */
  .delete(
    '/package/:id',
    async ({ params: { id } }) => {
      await db.delete(otaPackages).where(eq(otaPackages.id, id));

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
        tags: ['OTA 升级'],
        summary: '删除升级包（管理员）',
      },
    }
  );
