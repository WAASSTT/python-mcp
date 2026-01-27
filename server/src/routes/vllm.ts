import { Elysia, t } from "elysia";

/**
 * vLLM API 路由 - 视觉语言模型
 */
export const vllmRoutes = new Elysia({ prefix: "/api/vision" })
  .post(
    "/analyze",
    async ({ body, factory, set }: any) => {
      try {
        const { image, prompt, provider, ...options } = body;
        const vllmProvider = await factory.getVLLMProvider(provider);

        const result = await vllmProvider.analyze(image, prompt, options);

        return {
          success: true,
          data: {
            result,
            provider: provider || "default",
          },
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
        image: t.String({ description: "Base64 encoded image" }),
        prompt: t.String(),
        max_tokens: t.Optional(t.Number()),
        detail: t.Optional(t.Union([t.Literal("low"), t.Literal("high"), t.Literal("auto")])),
        provider: t.Optional(t.String()),
      }),
      detail: {
        tags: ["vLLM"],
        summary: "Analyze image",
        description: "Analyze image with vision language model",
      },
    },
  )
  .get(
    "/providers",
    ({ config }: any) => ({
      success: true,
      data: {
        default: config.vllm.default,
        providers: Object.keys(config.vllm.providers),
      },
    }),
    {
      detail: {
        tags: ["vLLM"],
        summary: "List vLLM providers",
        description: "Get available vision LLM providers",
      },
    },
  );
