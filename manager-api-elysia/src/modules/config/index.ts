import { db, devices, models } from '@/db';
import { and, eq } from 'drizzle-orm';
import { Elysia, t } from 'elysia';

/**
 * 配置管理模块路由
 */
export const configRoutes = new Elysia({ prefix: '/config' })

  /**
   * 获取公共配置
   */
  .get(
    '/',
    async () => {
      return {
        code: 0,
        msg: '获取成功',
        data: {
          systemName: '小智后台管理系统',
          version: '1.0.0',
        },
      };
    },
    {
      detail: {
        tags: ['配置管理'],
        summary: '获取公共配置',
      },
    }
  )

  /**
   * 服务端获取配置接口
   */
  .post(
    '/server-base',
    async () => {
      // 获取所有启用的模型配置
      const enabledModels = await db.select().from(models).where(eq(models.isEnabled, 1));

      // 按模型类型分组
      const modelsByType = enabledModels.reduce((acc: any, model) => {
        const type = model.modelType || 'unknown';
        if (!acc[type]) {
          acc[type] = [];
        }
        acc[type].push(model);
        return acc;
      }, {});

      // 构建配置对象
      const config = {
        models: modelsByType,
        system: {
          name: '小智AI系统',
          version: '1.0.0',
        },
        features: {
          enableVoiceClone: true,
          enableKnowledge: true,
          enableMcp: true,
        },
      };

      return {
        code: 0,
        data: config,
      };
    },
    {
      detail: {
        tags: ['配置管理'],
        summary: '服务端获取配置接口',
      },
    }
  )

  /**
   * 获取智能体模型配置
   */
  .post(
    '/agent-models',
    async ({ body }) => {
      const { macAddress, selectedModule } = body;

      // 根据MAC地址查找设备
      const [device] = await db
        .select()
        .from(devices)
        .where(eq(devices.macAddress, macAddress))
        .limit(1);

      if (!device || !device.agentId) {
        return {
          code: 404,
          msg: '设备未绑定智能体',
        };
      }

      // 获取对应模块类型的模型
      let modelConditions: any[] = [eq(models.isEnabled, 1)];

      if (selectedModule) {
        modelConditions.push(eq(models.modelType, selectedModule));
      }

      const availableModels = await db
        .select()
        .from(models)
        .where(and(...modelConditions));

      return {
        code: 0,
        data: {
          agentId: device.agentId,
          models: availableModels,
        },
      };
    },
    {
      body: t.Object({
        macAddress: t.String(),
        selectedModule: t.Optional(t.String()),
      }),
      detail: {
        tags: ['配置管理'],
        summary: '获取智能体模型配置',
      },
    }
  );
