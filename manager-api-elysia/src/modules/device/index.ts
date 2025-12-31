import { requireAuth } from '@/common/middleware/auth';
import { db, devices } from '@/db';
import { eq } from 'drizzle-orm';
import { Elysia, t } from 'elysia';

/**
 * 设备管理模块路由
 */
export const deviceRoutes = new Elysia({ prefix: '/device' })
  .use(requireAuth)

  /**
   * 获取用户设备列表
   */
  .get(
    '/list',
    async ({ user }) => {
      const userDevices = await db.select().from(devices).where(eq(devices.userId, user!.id));

      return {
        code: 0,
        msg: '获取成功',
        data: userDevices,
      };
    },
    {
      detail: {
        tags: ['设备管理'],
        summary: '获取用户设备列表',
      },
    }
  )

  /**
   * 获取设备详情
   */
  .get(
    '/:id',
    async ({ params: { id } }) => {
      const [device] = await db.select().from(devices).where(eq(devices.id, id)).limit(1);

      return {
        code: 0,
        msg: '获取成功',
        data: device,
      };
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      detail: {
        tags: ['设备管理'],
        summary: '获取设备详情',
      },
    }
  );
