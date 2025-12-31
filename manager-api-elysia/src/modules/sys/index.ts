import { requireAuth, requireRole } from '@/common/middleware/auth';
import { db, users } from '@/db';
import { eq, sql } from 'drizzle-orm';
import { Elysia, t } from 'elysia';
import { sysDictData, sysDictType } from './dict';
import { sysParams } from './params';

/**
 * 系统管理模块路由
 * 包括用户管理、角色管理、字典管理等
 */
export const sysRoutes = new Elysia({ prefix: '/sys' })
  .use(requireAuth)

  /**
   * 获取系统参数
   */
  .get(
    '/params',
    async ({ query }) => {
      const { paramCode } = query as { paramCode?: string };

      let params;
      if (paramCode) {
        params = await db.select().from(sysParams).where(eq(sysParams.paramCode, paramCode));
      } else {
        params = await db.select().from(sysParams).limit(100);
      }

      return {
        code: 0,
        msg: '获取成功',
        data: params,
      };
    },
    {
      detail: {
        tags: ['系统管理'],
        summary: '获取系统参数',
      },
    }
  )

  /**
   * 获取字典数据
   */
  .get(
    '/dict/:type',
    async ({ params: { type } }) => {
      // 查找字典类型
      const dictType = await db
        .select()
        .from(sysDictType)
        .where(eq(sysDictType.dictType, type))
        .limit(1);

      if (!dictType.length) {
        return {
          code: 0,
          msg: '字典类型不存在',
          data: [],
        };
      }

      // 获取字典数据
      const dictData = await db
        .select()
        .from(sysDictData)
        .where(eq(sysDictData.dictTypeId, dictType[0].id));

      return {
        code: 0,
        msg: '获取成功',
        data: dictData,
      };
    },
    {
      params: t.Object({
        type: t.String(),
      }),
      detail: {
        tags: ['系统管理'],
        summary: '获取字典数据',
      },
    }
  )

  /**
   * 用户管理 - 仅管理员可访问
   */
  .group('/admin', app =>
    app
      .use(requireRole(['admin', 'superAdmin']))

      .get(
        '/users',
        async ({ query }) => {
          const { page = 1, limit = 10 } = query as { page?: number; limit?: number };
          const offset = (Number(page) - 1) * Number(limit);

          // 获取用户列表
          const usersList = await db
            .select({
              id: users.id,
              username: users.username,
              realName: users.realName,
              email: users.email,
              mobile: users.mobile,
              status: users.status,
              superAdmin: users.superAdmin,
              roleId: users.roleId,
              createDate: users.createDate,
            })
            .from(users)
            .limit(Number(limit))
            .offset(offset);

          // 获取总数
          const totalResult = await db.select({ count: sql<number>`count(*)` }).from(users);
          const total = Number(totalResult[0]?.count || 0);

          return {
            code: 0,
            msg: '获取成功',
            data: {
              list: usersList,
              total,
              page: Number(page),
              limit: Number(limit),
            },
          };
        },
        {
          detail: {
            tags: ['系统管理'],
            summary: '获取用户列表（管理员）',
          },
        }
      )
  );
