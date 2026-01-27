import { Elysia, t } from "elysia";

/**
 * ASR API 路由
 */
export const asrRoutes = new Elysia({ prefix: "/api/asr" })
  .post(
    "/transcribe",
    async ({ body, factory, set }: any) => {
      try {
        const { audio, language, provider } = body;
        const asrProvider = await factory.getASRProvider(provider);

        // 将 File 转换为 Buffer
        const buffer = Buffer.from(await audio.arrayBuffer());
        const text = await asrProvider.transcribe(buffer, { language });

        return {
          success: true,
          data: {
            text,
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
        audio: t.File(),
        language: t.Optional(t.String()),
        provider: t.Optional(t.String()),
      }),
      detail: {
        tags: ["ASR"],
        summary: "Transcribe audio",
        description: "Convert audio to text",
      },
    },
  )
  .get(
    "/providers",
    ({ config }: any) => ({
      success: true,
      data: {
        default: config.asr.default,
        providers: Object.keys(config.asr.providers),
      },
    }),
    {
      detail: {
        tags: ["ASR"],
        summary: "List ASR providers",
        description: "Get available ASR providers",
      },
    },
  );
