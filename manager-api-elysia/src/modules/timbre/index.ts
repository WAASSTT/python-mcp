import { requireAuth } from '@/common/middleware/auth';
import { db } from '@/db';
import { and, desc, eq } from 'drizzle-orm';
import { integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { Elysia } from 'elysia';

// 音色表（需要在schema中定义）
export const timbres = pgTable('timbres', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  name: text('name').notNull(),
  code: text('code').notNull().unique(),
  language: text('language'),
  gender: text('gender'),
  provider: text('provider'),
  enabled: integer('enabled').default(1),
  createdAt: timestamp('created_at').defaultNow(),
});

/**
 * 音色管理模块路由
 */
export const timbreRoutes = new Elysia({ prefix: '/timbre' })
  .use(requireAuth)

  /**
   * 获取音色列表
   */
  .get(
    '/list',
    async ({ query }) => {
      const { language, gender, provider } = query as {
        language?: string;
        gender?: string;
        provider?: string;
      };

      // 构建查询条件
      const conditions = [eq(timbres.enabled, 1)];
      if (language) conditions.push(eq(timbres.language, language));
      if (gender) conditions.push(eq(timbres.gender, gender));
      if (provider) conditions.push(eq(timbres.provider, provider));

      const timbreList = await db
        .select()
        .from(timbres)
        .where(and(...conditions))
        .orderBy(desc(timbres.createdAt));

      return {
        code: 0,
        msg: '获取成功',
        data: timbreList,
      };
    },
    {
      detail: {
        tags: ['音色管理'],
        summary: '获取音色列表',
      },
    }
  );
