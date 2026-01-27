import { Elysia, t } from "elysia";

/**
 * Intent API 路由
 */
export const intentRoutes = new Elysia({ prefix: "/api/intent" })
  .post(
    "/recognize",
    async ({ body, factory, set }: any) => {
      try {
        const { text, provider } = body;
        const intentProvider = await factory.getIntentProvider(provider);

        const intent = await intentProvider.recognize(text);

        return {
          success: true,
          data: intent,
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
        text: t.String(),
        provider: t.Optional(t.String()),
      }),
      detail: {
        tags: ["Intent"],
        summary: "Recognize intent",
        description: "Recognize user intent from text",
      },
    },
  )
  .get(
    "/providers",
    ({ config }: any) => ({
      success: true,
      data: {
        default: config.intent.default,
        providers: Object.keys(config.intent.providers),
      },
    }),
    {
      detail: {
        tags: ["Intent"],
        summary: "List intent providers",
        description: "Get available intent providers",
      },
    },
  );
