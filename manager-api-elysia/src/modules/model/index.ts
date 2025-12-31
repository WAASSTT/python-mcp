import { requireAuth, requireRole } from '@/common/middleware/auth';
import { AppError } from '@/common/middleware/error-handler';
import { generateStringId } from '@/common/utils';
import { db, modelProviders, models, timbres } from '@/db';
import { and, eq, like, sql } from 'drizzle-orm';
import { Elysia, t } from 'elysia';

/**
 * 模型管理模块路由
 */
export const modelRoutes = new Elysia({ prefix: '/model' })
  .use(requireAuth)

  /**
   * 获取所有模型名称（简化信息）
   */
  .get(
    '/names',
    async ({ query }) => {
      const { modelType, modelName } = query as any;

      let conditions = [];
      if (modelType) {
        conditions.push(eq(models.modelType, modelType));
      }
      if (modelName) {
        conditions.push(like(models.modelName, `%${modelName}%`));
      }

      const modelList = await db
        .select({
          id: models.id,
          modelCode: models.modelCode,
          modelName: models.modelName,
          modelType: models.modelType,
          isDefault: models.isDefault,
          isEnabled: models.isEnabled,
        })
        .from(models)
        .where(conditions.length > 0 ? and(...conditions) : undefined);

      return {
        code: 0,
        data: modelList,
      };
    },
    {
      query: t.Object({
        modelType: t.String(),
        modelName: t.Optional(t.String()),
      }),
      detail: {
        tags: ['模型管理'],
        summary: '获取所有模型名称',
      },
    }
  )

  /**
   * 获取 LLM 模型信息
   */
  .get(
    '/llm/names',
    async ({ query }) => {
      const { modelName } = query as any;

      let conditions = [eq(models.modelType, 'LLM')];
      if (modelName) {
        conditions.push(like(models.modelName, `%${modelName}%`));
      }

      const llmModelList = await db
        .select({
          id: models.id,
          modelCode: models.modelCode,
          modelName: models.modelName,
          isDefault: models.isDefault,
          isEnabled: models.isEnabled,
        })
        .from(models)
        .where(and(...conditions));

      return {
        code: 0,
        data: llmModelList,
      };
    },
    {
      query: t.Object({
        modelName: t.Optional(t.String()),
      }),
      detail: {
        tags: ['模型管理'],
        summary: '获取LLM模型信息',
      },
    }
  )

  /**
   * 获取模型供应器列表
   */
  .get(
    '/providers/:modelType',
    async ({ params }) => {
      const { modelType } = params;

      const providerList = await db
        .select()
        .from(modelProviders)
        .where(eq(modelProviders.modelType, modelType));

      return {
        code: 0,
        data: providerList,
      };
    },
    {
      params: t.Object({
        modelType: t.String(),
      }),
      detail: {
        tags: ['模型管理'],
        summary: '获取模型供应器列表',
      },
    }
  )

  /**
   * 获取模型配置列表（分页）
   */
  .get(
    '/list',
    async ({ query }) => {
      const { modelType, modelName, page = 1, limit = 10 } = query as any;

      let conditions = [];
      if (modelType) {
        conditions.push(eq(models.modelType, modelType));
      }
      if (modelName) {
        conditions.push(like(models.modelName, `%${modelName}%`));
      }

      const list = await db
        .select()
        .from(models)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .limit(Number(limit))
        .offset((Number(page) - 1) * Number(limit));

      const [{ count }] = await db
        .select({ count: sql`count(*)` })
        .from(models)
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
        modelType: t.String(),
        modelName: t.Optional(t.String()),
        page: t.Optional(t.Number()),
        limit: t.Optional(t.Number()),
      }),
      detail: {
        tags: ['模型管理'],
        summary: '获取模型配置列表',
      },
    }
  )

  /**
   * 获取单个模型配置
   */
  .get(
    '/detail/:id',
    async ({ params }) => {
      const [model] = await db.select().from(models).where(eq(models.id, params.id)).limit(1);

      if (!model) {
        throw new AppError(404, '模型配置不存在');
      }

      return {
        code: 0,
        data: model,
      };
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      detail: {
        tags: ['模型管理'],
        summary: '获取模型配置',
      },
    }
  )

  /**
   * 新增模型配置（需要管理员权限）
   */
  .use(requireRole(['admin', 'superAdmin']))
  .post(
    '/:modelType/:provideCode',
    async ({ params, body, user }) => {
      const { modelType, provideCode } = params;
      const { modelCode, modelName, configJson, docLink, remark, sort } = body;

      const id = generateStringId('model');

      await db.insert(models).values({
        id,
        modelType,
        modelCode,
        modelName,
        isDefault: 0,
        isEnabled: 1,
        configJson,
        docLink,
        remark,
        sort: sort || 0,
        creator: Number(user!.id),
        createDate: new Date(),
      });

      const [newModel] = await db.select().from(models).where(eq(models.id, id)).limit(1);

      return {
        code: 0,
        msg: '创建成功',
        data: newModel,
      };
    },
    {
      params: t.Object({
        modelType: t.String(),
        provideCode: t.String(),
      }),
      body: t.Object({
        modelCode: t.String(),
        modelName: t.String(),
        configJson: t.Optional(t.Any()),
        docLink: t.Optional(t.String()),
        remark: t.Optional(t.String()),
        sort: t.Optional(t.Number()),
      }),
      detail: {
        tags: ['模型管理'],
        summary: '新增模型配置',
      },
    }
  )

  /**
   * 编辑模型配置（需要管理员权限）
   */
  .put(
    '/:modelType/:provideCode/:id',
    async ({ params, body, user }) => {
      const { id } = params;
      const { modelCode, modelName, configJson, docLink, remark, sort } = body;

      const [existing] = await db.select().from(models).where(eq(models.id, id)).limit(1);

      if (!existing) {
        throw new AppError(404, '模型配置不存在');
      }

      await db
        .update(models)
        .set({
          modelCode,
          modelName,
          configJson,
          docLink,
          remark,
          sort,
          updater: Number(user!.id),
          updateDate: new Date(),
        })
        .where(eq(models.id, id));

      const [updatedModel] = await db.select().from(models).where(eq(models.id, id)).limit(1);

      return {
        code: 0,
        msg: '更新成功',
        data: updatedModel,
      };
    },
    {
      params: t.Object({
        modelType: t.String(),
        provideCode: t.String(),
        id: t.String(),
      }),
      body: t.Object({
        modelCode: t.Optional(t.String()),
        modelName: t.Optional(t.String()),
        configJson: t.Optional(t.Any()),
        docLink: t.Optional(t.String()),
        remark: t.Optional(t.String()),
        sort: t.Optional(t.Number()),
      }),
      detail: {
        tags: ['模型管理'],
        summary: '编辑模型配置',
      },
    }
  )

  /**
   * 删除模型配置（需要管理员权限）
   */
  .delete(
    '/detail/:id',
    async ({ params }) => {
      const { id } = params;

      const [existing] = await db.select().from(models).where(eq(models.id, id)).limit(1);

      if (!existing) {
        throw new AppError(404, '模型配置不存在');
      }

      await db.delete(models).where(eq(models.id, id));

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
        summary: '删除模型配置',
      },
    }
  )

  /**
   * 启用/禁用模型配置（需要管理员权限）
   */
  .put(
    '/enable/:id/:status',
    async ({ params, user }) => {
      const { id, status } = params;

      const [existing] = await db.select().from(models).where(eq(models.id, id)).limit(1);

      if (!existing) {
        throw new AppError(404, '模型配置不存在');
      }

      await db
        .update(models)
        .set({
          isEnabled: Number(status),
          updater: Number(user!.id),
          updateDate: new Date(),
        })
        .where(eq(models.id, id));

      return {
        code: 0,
        message: status === '1' ? '已启用' : '已禁用',
      };
    },
    {
      params: t.Object({
        id: t.String(),
        status: t.String(),
      }),
      detail: {
        tags: ['模型管理'],
        summary: '启用/关闭模型配置',
      },
    }
  )

  /**
   * 设置默认模型（需要管理员权限）
   */
  .put(
    '/default/:id',
    async ({ params, user }) => {
      const { id } = params;

      const [existing] = await db.select().from(models).where(eq(models.id, id)).limit(1);

      if (!existing) {
        throw new AppError(404, '模型配置不存在');
      }

      // 将同类型的其他模型设置为非默认
      if (existing.modelType) {
        await db
          .update(models)
          .set({
            isDefault: 0,
            updater: Number(user!.id),
            updateDate: new Date(),
          })
          .where(eq(models.modelType, existing.modelType));
      }

      // 设置当前模型为默认并启用
      await db
        .update(models)
        .set({
          isDefault: 1,
          isEnabled: 1,
          updater: Number(user!.id),
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
        summary: '设置默认模型',
      },
    }
  )

  /**
   * 获取模型的音色列表
   */
  .get(
    '/detail/:id/voices',
    async ({ params, query }) => {
      const { id: modelId } = params;
      const { voiceName } = query as any;

      let conditions = [eq(timbres.ttsModelId, modelId)];
      if (voiceName) {
        conditions.push(like(timbres.name, `%${voiceName}%`));
      }

      const voiceList = await db
        .select()
        .from(timbres)
        .where(and(...conditions));

      return {
        code: 0,
        data: voiceList,
      };
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      query: t.Object({
        voiceName: t.Optional(t.String()),
      }),
      detail: {
        tags: ['模型管理'],
        summary: '获取模型音色',
      },
    }
  );
