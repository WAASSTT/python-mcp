import { bearer } from "@elysiajs/bearer";
import { jwt } from "@elysiajs/jwt";
import { Elysia } from "elysia";

/**
 * JWT 认证中间件（需要先注入 jwt 和 bearer 插件）
 */
export const authMiddleware = new Elysia({ name: "auth" })
  .use(bearer())
  .use(
    jwt({
      name: "jwt",
      secret: process.env.JWT_SECRET || "default-secret-key-change-me",
    }),
  )
  .derive(async ({ bearer, jwt, set }) => {
    if (!bearer) {
      set.status = 401;
      throw new Error("Unauthorized: Missing authentication token");
    }

    const payload = await jwt.verify(bearer);

    if (!payload) {
      set.status = 401;
      throw new Error("Unauthorized: Invalid token");
    }

    return {
      user: payload,
    };
  });

/**
 * 可选认证中间件（需要先注入 jwt 和 bearer 插件）
 */
export const optionalAuthMiddleware = new Elysia({ name: "optional-auth" })
  .use(bearer())
  .use(
    jwt({
      name: "jwt",
      secret: process.env.JWT_SECRET || "default-secret-key-change-me",
    }),
  )
  .derive(async ({ bearer, jwt }) => {
    if (!bearer) {
      return { user: null };
    }

    const payload = await jwt.verify(bearer);

    return {
      user: payload || null,
    };
  });
