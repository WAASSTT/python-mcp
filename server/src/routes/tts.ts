import { Elysia, t } from "elysia";

/**
 * TTS API 路由
 */
export const ttsRoutes = new Elysia({ prefix: "/api/tts" })
  .post(
    "/synthesize",
    async ({ body, factory, set }: any) => {
      try {
        const { text, voice, speed, format, stream = false, provider } = body;
        const ttsProvider = await factory.getTTSProvider(provider);

        if (stream) {
          const streamResponse = ttsProvider.synthesizeStream(text, { voice, speed, format });

          // 使用 Response 和 ReadableStream
          const readable = new ReadableStream({
            async start(controller) {
              try {
                for await (const chunk of streamResponse) {
                  controller.enqueue(chunk);
                }
              } finally {
                controller.close();
              }
            },
          });
          return new Response(readable, {
            headers: {
              "Content-Type": "audio/mpeg",
              "Cache-Control": "no-cache",
              Connection: "keep-alive",
            },
          });
        }

        const audioBuffer = await ttsProvider.synthesize(text, { voice, speed, format });

        return new Response(audioBuffer, {
          headers: {
            "Content-Type": `audio/${format || "mp3"}`,
            "Content-Length": audioBuffer.length.toString(),
          },
        });
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
        voice: t.Optional(t.String()),
        speed: t.Optional(t.Number()),
        format: t.Optional(t.Union([t.Literal("mp3"), t.Literal("opus"), t.Literal("pcm")])),
        stream: t.Optional(t.Boolean()),
        provider: t.Optional(t.String()),
      }),
      detail: {
        tags: ["TTS"],
        summary: "Synthesize speech",
        description: "Convert text to speech",
      },
    },
  )
  .get(
    "/providers",
    ({ config }: any) => ({
      success: true,
      data: {
        default: config.tts.default,
        providers: Object.keys(config.tts.providers),
      },
    }),
    {
      detail: {
        tags: ["TTS"],
        summary: "List TTS providers",
        description: "Get available TTS providers",
      },
    },
  );
