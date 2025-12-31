import { and, desc, eq, sql } from 'drizzle-orm';
import { integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { Elysia, t } from 'elysia';
import { requireAuth, requireRole } from '../../common/middleware/auth';
import { AppError } from '../../common/middleware/error-handler';
import { db } from '../../db';

// 系统参数表 (需要在 schema.ts 中定义)
export const sysParams = pgTable('sys_params', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  paramCode: text('param_code').notNull().unique(),
  paramValue: text('param_value'),
  paramType: integer('param_type').default(0), // 0: 系统参数 1: 用户参数
  remark: text('remark'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

/**
 * 系统参数管理路由
 */
export const paramsRoutes = new Elysia({ prefix: '/admin/params', tags: ['参数管理'] })
  .use(requireAuth)
  .use(requireRole(['superAdmin']))

  /**
   * 分页查询系统参数
   */
  .get(
    '/page',
    async ({ query }) => {
      const {
        page = 1,
        limit = 10,
        paramCode,
        orderField = 'createdAt',
        order = 'desc',
      } = query as any;
      const offset = (Number(page) - 1) * Number(limit);

      // 构建查询条件
      const conditions = [];
      if (paramCode) {
        conditions.push(
          sql`${sysParams.paramCode} LIKE ${`%${paramCode}%`} OR ${
            sysParams.remark
          } LIKE ${`%${paramCode}%`}`
        );
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      // 查询数据
      const list = await db
        .select()
        .from(sysParams)
        .where(whereClause)
        .orderBy(
          order === 'asc'
            ? sql`${sysParams[orderField as keyof typeof sysParams]} ASC`
            : desc(sysParams.createdAt)
        )
        .limit(Number(limit))
        .offset(offset);

      // 查询总数
      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(sysParams)
        .where(whereClause);

      const total = Number(countResult[0]?.count || 0);

      return {
        code: 0,
        msg: 'success',
        data: {
          list,
          total,
          page: Number(page),
          limit: Number(limit),
        },
      };
    },
    {
      detail: {
        summary: '分页查询系统参数',
        tags: ['参数管理'],
      },
    }
  )

  /**
   * 获取系统参数详情
   */
  .get(
    '/:id',
    async ({ params: { id } }) => {
      const param = await db
        .select()
        .from(sysParams)
        .where(eq(sysParams.id, Number(id)))
        .limit(1);

      if (!param.length) {
        throw new AppError(404, '参数不存在');
      }

      return { code: 0, msg: 'success', data: param[0] };
    },
    {
      detail: {
        summary: '获取系统参数详情',
        tags: ['参数管理'],
      },
    }
  )

  /**
   * 根据参数编码获取参数值
   */
  .get(
    '/code/:paramCode',
    async ({ params: { paramCode } }) => {
      const param = await db
        .select()
        .from(sysParams)
        .where(eq(sysParams.paramCode, paramCode))
        .limit(1);

      if (!param.length) {
        throw new AppError(404, '参数不存在');
      }

      return { code: 0, msg: 'success', data: param[0].paramValue };
    },
    {
      detail: {
        summary: '根据参数编码获取参数值',
        tags: ['参数管理'],
      },
    }
  )

  /**
   * 保存系统参数
   */
  .post(
    '/',
    async ({ body }) => {
      const { paramCode, paramValue, paramType, remark } = body as any;

      // 检查参数编码是否已存在
      const existing = await db
        .select()
        .from(sysParams)
        .where(eq(sysParams.paramCode, paramCode))
        .limit(1);

      if (existing.length > 0) {
        throw new AppError(400, '参数编码已存在');
      }

      await db.insert(sysParams).values({
        paramCode,
        paramValue,
        paramType: paramType || 0,
        remark,
      });

      return { code: 0, msg: '保存成功' };
    },
    {
      body: t.Object({
        paramCode: t.String(),
        paramValue: t.Optional(t.String()),
        paramType: t.Optional(t.Number()),
        remark: t.Optional(t.String()),
      }),
      detail: {
        summary: '保存系统参数',
        tags: ['参数管理'],
      },
    }
  )

  /**
   * 修改系统参数
   */
  .put(
    '/',
    async ({ body }) => {
      const { id, paramCode, paramValue, paramType, remark } = body as any;

      const existing = await db
        .select()
        .from(sysParams)
        .where(eq(sysParams.id, Number(id)))
        .limit(1);

      if (!existing.length) {
        throw new AppError(404, '参数不存在');
      }

      // 验证参数值
      await validateParam(paramCode, paramValue);

      await db
        .update(sysParams)
        .set({
          paramCode,
          paramValue,
          paramType: paramType || 0,
          remark,
          updatedAt: new Date(),
        })
        .where(eq(sysParams.id, Number(id)));

      return { code: 0, msg: '修改成功' };
    },
    {
      body: t.Object({
        id: t.Number(),
        paramCode: t.String(),
        paramValue: t.Optional(t.String()),
        paramType: t.Optional(t.Number()),
        remark: t.Optional(t.String()),
      }),
      detail: {
        summary: '修改系统参数',
        tags: ['参数管理'],
      },
    }
  )

  /**
   * 删除系统参数
   */
  .delete(
    '/',
    async ({ body }) => {
      const { ids } = body as { ids: number[] };

      if (!ids || ids.length === 0) {
        throw new AppError(400, 'ID不能为空');
      }

      for (const id of ids) {
        await db.delete(sysParams).where(eq(sysParams.id, id));
      }

      return { code: 0, msg: '删除成功' };
    },
    {
      body: t.Object({
        ids: t.Array(t.Number()),
      }),
      detail: {
        summary: '删除系统参数',
        tags: ['参数管理'],
      },
    }
  )

  /**
   * 批量获取参数 (用于配置初始化)
   */
  .post(
    '/batch',
    async ({ body }) => {
      const { paramCodes } = body as { paramCodes: string[] };

      if (!paramCodes || paramCodes.length === 0) {
        return { code: 0, msg: 'success', data: {} };
      }

      const params = await db
        .select()
        .from(sysParams)
        .where(
          sql`${sysParams.paramCode} IN (${sql.join(
            paramCodes.map(c => sql`${c}`),
            sql`, `
          )})`
        );

      const result: Record<string, string | null> = {};
      params.forEach(param => {
        result[param.paramCode] = param.paramValue;
      });

      return { code: 0, msg: 'success', data: result };
    },
    {
      body: t.Object({
        paramCodes: t.Array(t.String()),
      }),
      detail: {
        summary: '批量获取参数',
        tags: ['参数管理'],
      },
    }
  );

/**
 * 验证参数值
 */
async function validateParam(paramCode: string, paramValue: string | null | undefined) {
  if (!paramValue) return;

  // WebSocket地址列表验证
  if (paramCode === 'websocket_urls') {
    try {
      const urls = JSON.parse(paramValue);
      if (!Array.isArray(urls)) {
        throw new AppError(400, 'WebSocket地址列表格式错误');
      }
      urls.forEach((url: string) => {
        if (!url.startsWith('ws://') && !url.startsWith('wss://')) {
          throw new AppError(400, `WebSocket地址格式错误: ${url}`);
        }
      });
    } catch (e) {
      if (e instanceof AppError) throw e;
      throw new AppError(400, 'WebSocket地址列表JSON格式错误');
    }
  }

  // OTA地址验证
  if (paramCode === 'ota_url') {
    if (!paramValue.startsWith('http://') && !paramValue.startsWith('https://')) {
      throw new AppError(400, 'OTA地址格式错误');
    }
  }

  // MCP地址验证
  if (paramCode === 'mcp_url') {
    if (!paramValue.startsWith('http://') && !paramValue.startsWith('https://')) {
      throw new AppError(400, 'MCP地址格式错误');
    }
  }

  // 声纹地址验证
  if (paramCode === 'voiceprint_url') {
    if (!paramValue.startsWith('http://') && !paramValue.startsWith('https://')) {
      throw new AppError(400, '声纹地址格式错误');
    }
  }

  // MQTT密钥长度验证
  if (paramCode === 'mqtt_secret') {
    if (paramValue.length < 16) {
      throw new AppError(400, 'MQTT密钥长度不能少于16位');
    }
  }
}
