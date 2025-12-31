import { requireAuth, requireRole } from '@/common/middleware/auth';
import { AppError } from '@/common/middleware/error-handler';
import { generateStringId } from '@/common/utils';
import { db, modelProviders, models } from '@/db';
import { desc, eq } from 'drizzle-orm';
import { Elysia, t } from 'elysia';

/**
 * 模型提供商管理
 */
export const modelProviderRoutes = new Elysia({ prefix: '/model' })
  .use(requireAuth)

  /**
   * 获取所有模型提供商
   */
  .get(
    '/providers',
    async () => {
      const providers = await db.select().from(modelProviders).orderBy(desc(modelProviders.sort));

      return {
        code: 0,
        data: providers,
      };
    },
    {
      detail: {
        tags: ['模型管理'],
        summary: '获取模型提供商列表',
      },
    }
  )

  /**
   * 获取模型提供商详情
   */
  .get(
    '/provider/:id',
    async ({ params: { id } }) => {
      const [provider] = await db
        .select()
        .from(modelProviders)
        .where(eq(modelProviders.id, id))
        .limit(1);

      if (!provider) {
        throw new AppError(404, '提供商不存在');
      }

      return {
        code: 0,
        data: provider,
      };
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      detail: {
        tags: ['模型管理'],
        summary: '获取模型提供商详情',
      },
    }
  )

  /**
   * 获取某提供商的所有模型
   */
  .get(
    '/provider/:id/models',
    async ({ params: { id } }) => {
      // TODO: models 表中没有 providerId 字段，需要根据实际业务逻辑实现
      // 暂时返回空列表
      const modelList: any[] = [];

      return {
        code: 0,
        data: modelList,
      };
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      detail: {
        tags: ['模型管理'],
        summary: '获取某提供商的所有模型',
      },
    }
  )

  // ========== 管理员接口 ==========

  .use(requireRole(['admin', 'superAdmin']))

  /**
   * 创建模型提供商（管理员）
   */
  .post(
    '/provider',
    async ({ body }) => {
      const id = generateStringId('provider');

      await db.insert(modelProviders).values({
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
        code: t.String(),
        type: t.String(),
        apiEndpoint: t.Optional(t.String()),
        description: t.Optional(t.String()),
        sort: t.Optional(t.Number()),
      }),
      detail: {
        tags: ['模型管理'],
        summary: '创建模型提供商（管理员）',
      },
    }
  )

  /**
   * 更新模型提供商（管理员）
   */
  .put(
    '/provider/:id',
    async ({ params: { id }, body }) => {
      await db
        .update(modelProviders)
        .set({
          ...body,
          updateDate: new Date(),
        })
        .where(eq(modelProviders.id, id));

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
        apiEndpoint: t.Optional(t.String()),
        description: t.Optional(t.String()),
        sort: t.Optional(t.Number()),
      }),
      detail: {
        tags: ['模型管理'],
        summary: '更新模型提供商（管理员）',
      },
    }
  )

  /**
   * 删除模型提供商（管理员）
   */
  .delete(
    '/provider/:id',
    async ({ params: { id } }) => {
      // TODO: models 表中没有 providerId 字段，无法检查关联模型
      // 暂时跳过检查
      // const [{ count }] = await db
      //   .select({ count: sql`count(*)` })
      //   .from(models)
      //   .where(eq(models.providerId, id));
      // if (Number(count) > 0) {
      //   throw new AppError(400, '该提供商下还有模型，无法删除');
      // }

      await db.delete(modelProviders).where(eq(modelProviders.id, id));

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
        tags: ['模型管理'],
        summary: '删除模型提供商（管理员）',
      },
    }
  )

  /**
   * 创建模型（管理员）
   */
  .post(
    '/create',
    async ({ body }) => {
      const id = generateStringId('model');

      await db.insert(models).values({
        id,
        modelType: body.modelType,
        modelCode: body.modelCode,
        modelName: body.modelName,
        isDefault: 0,
        isEnabled: 1,
        configJson: body.configJson,
        docLink: body.docLink,
        remark: body.remark,
        sort: body.sort || 0,
        createDate: new Date(),
      });

      return {
        code: 0,
        msg: '创建成功',
        data: { id },
      };
    },
    {
      body: t.Object({
        modelType: t.String(),
        modelCode: t.String(),
        modelName: t.String(),
        configJson: t.Optional(t.Any()),
        docLink: t.Optional(t.String()),
        remark: t.Optional(t.String()),
        sort: t.Optional(t.Number()),
      }),
      detail: {
        tags: ['模型管理'],
        summary: '创建模型（管理员）',
      },
    }
  )

  /**
   * 更新模型（管理员）
   */
  .put(
    '/config/:id',
    async ({ params: { id }, body }) => {
      await db
        .update(models)
        .set({
          ...body,
          updateDate: new Date(),
        })
        .where(eq(models.id, id));

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
        modelName: t.Optional(t.String()),
        modelCode: t.Optional(t.String()),
        configJson: t.Optional(t.Any()),
        docLink: t.Optional(t.String()),
        remark: t.Optional(t.String()),
        sort: t.Optional(t.Number()),
      }),
      detail: {
        tags: ['模型管理'],
        summary: '更新模型（管理员）',
      },
    }
  )

  /**
   * 启用/禁用模型（管理员）
   */
  .put(
    '/config/:id/status',
    async ({ params: { id }, body }) => {
      await db
        .update(models)
        .set({
          isEnabled: body.isEnabled,
          updateDate: new Date(),
        })
        .where(eq(models.id, id));

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
        isEnabled: t.Number(),
      }),
      detail: {
        tags: ['模型管理'],
        summary: '启用/禁用模型（管理员）',
      },
    }
  )

  /**
   * 设置默认模型（管理员）
   */
  .post(
    '/config/:id/set-default',
    async ({ params: { id } }) => {
      // 先取消所有默认模型
      await db.update(models).set({
        isDefault: 0,
        updateDate: new Date(),
      });

      // 设置新的默认模型
      await db
        .update(models)
        .set({
          isDefault: 1,
          updateDate: new Date(),
        })
        .where(eq(models.id, id));

      return {
        code: 0,
        msg: '设置成功',
      };
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      detail: {
        tags: ['模型管理'],
        summary: '设置默认模型（管理员）',
      },
    }
  );
