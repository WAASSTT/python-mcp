import { config } from '@/config';
import { jwt } from '@elysiajs/jwt';
import { Elysia } from 'elysia';
import { AppError } from './error-handler';

/**
 * JWT 认证中间件
 */
export const authMiddleware = new Elysia({ name: 'auth' })
  .use(
    jwt({
      name: 'jwt',
      secret: config.jwt.secret,
    })
  )
  .derive(async ({ jwt, request, headers }) => {
    // 从 Authorization header 获取 token
    const authorization = headers['authorization'];

    if (!authorization?.startsWith('Bearer ')) {
      return { user: null };
    }

    const token = authorization.substring(7);

    try {
      const payload = await jwt.verify(token);

      if (!payload) {
        return { user: null };
      }

      return {
        user: payload as {
          id: string;
          username: string;
          role: string;
        },
      };
    } catch (error) {
      return { user: null };
    }
  })
  .as('scoped');

/**
 * 要求认证的防护
 */
export const requireAuth = new Elysia({ name: 'require-auth' })
  .use(authMiddleware)
  .onBeforeHandle(({ user }) => {
    if (!user) {
      throw new AppError(401, '请先登录', 'UNAUTHORIZED');
    }
  })
  .as('scoped');

/**
 * 要求特定角色的防护
 */
export const requireRole = (roles: string[]) =>
  new Elysia({ name: 'require-role' })
    .use(requireAuth)
    .onBeforeHandle(({ user }) => {
      if (!user || !roles.includes(user.role)) {
        throw new AppError(403, '没有权限访问此资源', 'FORBIDDEN');
      }
    })
    .as('scoped');
