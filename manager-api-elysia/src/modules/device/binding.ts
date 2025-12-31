import { requireAuth } from '@/common/middleware/auth';
import { AppError } from '@/common/middleware/error-handler';
import { generateStringId } from '@/common/utils';
import { db, devices } from '@/db';
import { and, eq } from 'drizzle-orm';
import { Elysia, t } from 'elysia';

/**
 * 设备绑定管理
 */
export const deviceBindingRoutes = new Elysia({ prefix: '/device' })
  .use(requireAuth)

  /**
   * 绑定设备
   */
  .post(
    '/bind',
    async ({ body, user }) => {
      const { macAddress } = body;

      // 检查设备是否存在
      const [device] = await db
        .select()
        .from(devices)
        .where(eq(devices.macAddress, macAddress))
        .limit(1);

      if (!device) {
        throw new AppError(404, '设备不存在');
      }

      // 检查设备是否已绑定
      if (device.userId && device.userId !== Number(user!.id)) {
        throw new AppError(400, '设备已被其他用户绑定');
      }

      // 绑定设备
      await db
        .update(devices)
        .set({
          userId: Number(user!.id),
          updater: Number(user!.id),
          updateDate: new Date(),
        })
        .where(eq(devices.id, device.id));

      return {
        code: 0,
        msg: '绑定成功',
        data: {
          deviceId: device.id,
          macAddress: device.macAddress,
          alias: device.alias,
        },
      };
    },
    {
      body: t.Object({
        macAddress: t.String(),
      }),
      detail: {
        tags: ['设备管理'],
        summary: '绑定设备',
      },
    }
  )

  /**
   * 解绑设备
   */
  .post(
    '/unbind',
    async ({ body, user }) => {
      const { macAddress } = body;

      // 检查设备是否存在且属于当前用户
      const [device] = await db
        .select()
        .from(devices)
        .where(and(eq(devices.macAddress, macAddress), eq(devices.userId, Number(user!.id))))
        .limit(1);

      if (!device) {
        throw new AppError(404, '设备不存在或不属于当前用户');
      }

      // 解绑设备
      await db
        .update(devices)
        .set({
          userId: null,
          updater: Number(user!.id),
          updateDate: new Date(),
        })
        .where(eq(devices.id, device.id));

      return {
        code: 0,
        msg: '解绑成功',
      };
    },
    {
      body: t.Object({
        macAddress: t.String(),
      }),
      detail: {
        tags: ['设备管理'],
        summary: '解绑设备',
      },
    }
  )

  /**
   * 获取我的设备列表
   */
  .get(
    '/my-devices',
    async ({ user }) => {
      const deviceList = await db
        .select()
        .from(devices)
        .where(eq(devices.userId, Number(user!.id)));

      return {
        code: 0,
        data: deviceList,
      };
    },
    {
      detail: {
        tags: ['设备管理'],
        summary: '获取我的设备列表',
      },
    }
  )

  /**
   * 更新设备信息
   */
  .put(
    '/:id',
    async ({ params: { id }, body, user }) => {
      // 检查设备是否存在且属于当前用户
      const [device] = await db
        .select()
        .from(devices)
        .where(and(eq(devices.id, id), eq(devices.userId, Number(user!.id))))
        .limit(1);

      if (!device) {
        throw new AppError(404, '设备不存在或不属于当前用户');
      }

      // 更新设备信息
      await db
        .update(devices)
        .set({
          alias: body.alias,
          agentId: body.agentId,
          autoUpdate: body.autoUpdate,
          updater: Number(user!.id),
          updateDate: new Date(),
        })
        .where(eq(devices.id, device.id));

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
        alias: t.Optional(t.String()),
        agentId: t.Optional(t.String()),
        autoUpdate: t.Optional(t.Number()),
      }),
      detail: {
        tags: ['设备管理'],
        summary: '更新设备信息',
      },
    }
  )

  /**
   * 设备注册（设备端调用）
   */
  .post(
    '/register',
    async ({ body }) => {
      const { macAddress, board, appVersion } = body;

      // 检查设备是否已存在
      const [existing] = await db
        .select()
        .from(devices)
        .where(eq(devices.macAddress, macAddress))
        .limit(1);

      if (existing) {
        // 更新设备信息
        await db
          .update(devices)
          .set({
            board,
            appVersion,
            lastConnectedAt: new Date(),
            updateDate: new Date(),
          })
          .where(eq(devices.id, existing.id));

        return {
          code: 0,
          msg: '设备信息已更新',
          data: {
            deviceId: existing.id,
            macAddress: existing.macAddress,
            needBind: !existing.userId,
          },
        };
      }

      // 新设备注册
      const id = generateStringId('device');

      await db.insert(devices).values({
        id,
        macAddress,
        board,
        appVersion,
        lastConnectedAt: new Date(),
        createDate: new Date(),
      });

      return {
        code: 0,
        msg: '设备注册成功',
        data: {
          deviceId: id,
          macAddress,
          needBind: true,
        },
      };
    },
    {
      body: t.Object({
        macAddress: t.String(),
        board: t.Optional(t.String()),
        appVersion: t.Optional(t.String()),
      }),
      detail: {
        tags: ['设备管理'],
        summary: '设备注册',
      },
    }
  )

  /**
   * 设备心跳（设备端调用）
   */
  .post(
    '/heartbeat',
    async ({ body }) => {
      const { macAddress } = body;

      const [device] = await db
        .select()
        .from(devices)
        .where(eq(devices.macAddress, macAddress))
        .limit(1);

      if (!device) {
        throw new AppError(404, '设备不存在');
      }

      // 更新设备最后连接时间
      await db
        .update(devices)
        .set({
          lastConnectedAt: new Date(),
          updateDate: new Date(),
        })
        .where(eq(devices.id, device.id));

      return {
        code: 0,
        msg: 'ok',
      };
    },
    {
      body: t.Object({
        macAddress: t.String(),
      }),
      detail: {
        tags: ['设备管理'],
        summary: '设备心跳（设备端调用）',
      },
    }
  );
