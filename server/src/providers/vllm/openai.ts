import type { VisionOptions } from "@/types/providers";
import type { Logger } from "@/utils/logger";
import OpenAI from "openai/index.mjs";
import { VLLMProvider } from "./base";

/**
 * VLLM OpenAI Provider
 * 使用 OpenAI 兼容的 API 接口
 */
export class OpenAIVLLMProvider extends VLLMProvider {
  private client: OpenAI;
  private modelName: string;
  private defaultMaxTokens: number;
  private defaultTemperature: number;
  private defaultTopP: number;

  constructor(config: any, logger: Logger) {
    super(config, logger);

    this.modelName = config.model_name || config.model || "gpt-4-vision-preview";
    const apiKey = config.api_key || config.apiKey;
    const baseURL = config.base_url || config.baseUrl || config.url;
    const timeout = config.timeout ? parseInt(config.timeout) : 300000;

    this.client = new OpenAI({
      apiKey,
      baseURL,
      timeout,
    });

    // 设置默认参数
    this.defaultMaxTokens = config.max_tokens ? parseInt(config.max_tokens) : 500;
    this.defaultTemperature = config.temperature ? parseFloat(config.temperature) : 0.7;
    this.defaultTopP = config.top_p ? parseFloat(config.top_p) : 1.0;

    this.logger.info("VLLM OpenAI provider initialized");
  }

  /**
   * 分析图像
   * @param image - Base64 编码的图像或 Buffer
   * @param prompt - 分析提示词
   * @param options - 可选参数
   */
  async analyze(image: string | Buffer, prompt: string, options?: VisionOptions): Promise<string> {
    try {
      // 处理图像格式
      let base64Image: string;
      if (Buffer.isBuffer(image)) {
        base64Image = image.toString("base64");
      } else {
        base64Image = image;
      }

      // 构建消息
      const userPrompt = prompt + (options?.language === "zh" ? "(请使用中文回复)" : "");

      const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: userPrompt,
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`,
              },
            },
          ],
        },
      ];

      const requestParams: OpenAI.Chat.ChatCompletionCreateParamsNonStreaming = {
        model: this.modelName,
        messages,
        max_tokens: options?.max_tokens ?? this.defaultMaxTokens,
        temperature: options?.temperature ?? this.defaultTemperature,
        top_p: options?.top_p ?? this.defaultTopP,
        stream: false,
      };

      const response = await this.client.chat.completions.create(requestParams);

      return response.choices[0]?.message?.content || "";
    } catch (error) {
      this.logger.error(`VLLM OpenAI analyze failed: ${error}`);
      throw error;
    }
  }
}
