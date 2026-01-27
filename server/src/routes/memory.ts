import { Elysia, t } from "elysia";

/**
 * Memory API 路由 - 记忆管理
 */
export const memoryRoutes = new Elysia({ prefix: "/api/memory" })
  .post(
    "/add",
    async ({ body, factory, set }: any) => {
      try {
        const { content, metadata } = body;
        const memoryProvider = await factory.getMemoryProvider();

        const id = await memoryProvider.add(content, metadata);

        return {
          success: true,
          data: { id },
        };
      } catch (error: any) {
        set.status = 500;
        return {
          success: false,
          error: error.message,
        };
      }
    },
    {
      body: t.Object({
        content: t.String(),
        metadata: t.Optional(t.Record(t.String(), t.Any())),
      }),
      detail: {
        tags: ["Memory"],
        summary: "Add memory",
        description: "Add a new memory entry",
      },
    },
  )
  .post(
    "/search",
    async ({ body, factory, set }: any) => {
      try {
        const { query, limit = 10 } = body;
        const memoryProvider = await factory.getMemoryProvider();

        const results = await memoryProvider.search(query, limit);

        return {
          success: true,
          data: results,
        };
      } catch (error: any) {
        set.status = 500;
        return {
          success: false,
          error: error.message,
        };
      }
    },
    {
      body: t.Object({
        query: t.String(),
        limit: t.Optional(t.Number()),
      }),
      detail: {
        tags: ["Memory"],
        summary: "Search memories",
        description: "Search for memory entries",
      },
    },
  )
  .get(
    "/:id",
    async ({ params, factory, set }: any) => {
      try {
        const memoryProvider = await factory.getMemoryProvider();
        const entry = await memoryProvider.get(params.id);

        if (!entry) {
          set.status = 404;
          return {
            success: false,
            error: "Memory not found",
          };
        }

        return {
          success: true,
          data: entry,
        };
      } catch (error: any) {
        set.status = 500;
        return {
          success: false,
          error: error.message,
        };
      }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      detail: {
        tags: ["Memory"],
        summary: "Get memory",
        description: "Get a memory entry by ID",
      },
    },
  )
  .delete(
    "/:id",
    async ({ params, factory, set }: any) => {
      try {
        const memoryProvider = await factory.getMemoryProvider();
        const deleted = await memoryProvider.delete(params.id);

        return {
          success: true,
          data: { deleted },
        };
      } catch (error: any) {
        set.status = 500;
        return {
          success: false,
          error: error.message,
        };
      }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      detail: {
        tags: ["Memory"],
        summary: "Delete memory",
        description: "Delete a memory entry",
      },
    },
  )
  .delete(
    "/clear",
    async ({ factory, set }: any) => {
      try {
        const memoryProvider = await factory.getMemoryProvider();
        await memoryProvider.clear();

        return {
          success: true,
          message: "All memories cleared",
        };
      } catch (error: any) {
        set.status = 500;
        return {
          success: false,
          error: error.message,
        };
      }
    },
    {
      detail: {
        tags: ["Memory"],
        summary: "Clear all memories",
        description: "Delete all memory entries",
      },
    },
  );
