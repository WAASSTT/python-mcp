import type { BaseLLMProvider, Intent, Message } from "@/types/providers";
import { IntentProvider } from "../base";

/**
 * LLM Intent Provider 配置
 */
export interface LlmIntentConfig {
  llm?: BaseLLMProvider;
  history_count?: number;
  temperature?: number;
  functions?: FunctionDefinition[];
}

/**
 * 函数定义
 */
interface FunctionDefinition {
  name: string;
  description: string;
  parameters?: Record<string, any>;
}

/**
 * 默认意图识别函数定义
 */
const DEFAULT_FUNCTIONS: FunctionDefinition[] = [
  {
    name: "continue_chat",
    description: "继续正常对话，不执行任何特殊操作",
  },
  {
    name: "exit_chat",
    description: "用户想要结束对话、说再见、退出",
  },
  {
    name: "play_music",
    description: "用户想要播放音乐或歌曲",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "歌曲名称、歌手名或音乐类型",
        },
      },
    },
  },
  {
    name: "weather",
    description: "用户想要查询天气",
    parameters: {
      type: "object",
      properties: {
        location: {
          type: "string",
          description: "查询天气的地点",
        },
      },
    },
  },
  {
    name: "iot_control",
    description: "用户想要控制智能设备（如灯、空调、电视等）",
    parameters: {
      type: "object",
      properties: {
        device: {
          type: "string",
          description: "设备名称",
        },
        action: {
          type: "string",
          description: "操作动作（如：打开、关闭、调节等）",
        },
        value: {
          type: "string",
          description: "操作值（如温度、亮度等）",
        },
      },
    },
  },
];

/**
 * 意图识别系统提示词
 */
const INTENT_SYSTEM_PROMPT = `你是一个意图识别助手。根据用户的输入，判断用户的意图并返回对应的函数调用。

可用的意图类型：
- continue_chat: 普通对话，没有特殊意图
- exit_chat: 用户想要结束对话
- play_music: 用户想要播放音乐
- weather: 用户想要查询天气
- iot_control: 用户想要控制智能设备

请分析用户输入并返回 JSON 格式的结果：
{"function_call": {"name": "意图名称", "arguments": {...参数}}}

如果是普通对话，返回：
{"function_call": {"name": "continue_chat"}}`;

/**
 * LLM-based Intent Provider
 * 使用 LLM 进行意图识别
 */
export class LlmProvider extends IntentProvider {
  private llm?: BaseLLMProvider;
  private historyCount: number;
  private temperature: number;
  private functions: FunctionDefinition[];

  constructor(config: LlmIntentConfig, logger: any) {
    super(config, logger);
    this.llm = config.llm;
    this.historyCount = config.history_count || 5;
    this.temperature = config.temperature || 0.1;
    this.functions = config.functions || DEFAULT_FUNCTIONS;
    this.logger.info("LLM Intent provider initialized");
  }

  /**
   * 设置 LLM Provider
   */
  setLLMProvider(llm: BaseLLMProvider): void {
    this.llm = llm;
  }

  async recognize(text: string, dialogueHistory?: Message[]): Promise<Intent> {
    try {
      // 如果没有 LLM，使用规则匹配
      if (!this.llm) {
        return this.ruleBasedRecognize(text);
      }

      // 构建消息
      const messages: Message[] = [{ role: "system", content: INTENT_SYSTEM_PROMPT }];

      // 添加对话历史
      if (dialogueHistory && dialogueHistory.length > 0) {
        const historyStart = Math.max(0, dialogueHistory.length - this.historyCount);
        for (let i = historyStart; i < dialogueHistory.length; i++) {
          messages.push(dialogueHistory[i]);
        }
      }

      // 添加当前用户输入
      messages.push({ role: "user", content: text });

      // 调用 LLM
      const response = await this.llm.chat(messages, {
        temperature: this.temperature,
        max_tokens: 200,
      });

      // 解析响应
      const responseText = typeof response === "string" ? response : "";
      return this.parseIntentResponse(responseText, text);
    } catch (error: any) {
      this.logger.error("LLM Intent recognition error:", error);
      // 回退到规则匹配
      return this.ruleBasedRecognize(text);
    }
  }

  /**
   * 解析意图响应
   */
  private parseIntentResponse(response: string, originalText: string): Intent {
    try {
      // 尝试从响应中提取 JSON
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.function_call) {
          const { name, arguments: args } = parsed.function_call;

          // 映射函数名到意图
          const intentMapping: Record<string, string> = {
            continue_chat: "general",
            exit_chat: "exit",
            play_music: "play_music",
            weather: "weather",
            iot_control: "iot",
          };

          return this.createIntent(
            intentMapping[name] || "general",
            0.9,
            args || { text: originalText },
          );
        }
      }
    } catch (error) {
      this.logger.debug({ err: error }, "Failed to parse intent response");
    }

    return this.createIntent("general", 0.8, { text: originalText });
  }

  /**
   * 基于规则的意图识别（回退方案）
   */
  private ruleBasedRecognize(text: string): Intent {
    const lowerText = text.toLowerCase();

    // 退出意图
    const exitPatterns = ["再见", "拜拜", "退出", "结束", "bye", "goodbye", "exit"];
    if (exitPatterns.some((p) => lowerText.includes(p))) {
      return this.createIntent("exit", 0.9);
    }

    // 播放音乐意图
    const musicPatterns = ["播放", "放歌", "唱歌", "音乐", "play music", "play song"];
    if (musicPatterns.some((p) => lowerText.includes(p))) {
      // 尝试提取歌曲名
      const query = text.replace(/播放|放歌|唱歌|音乐|给我|来一首|来首/g, "").trim();
      return this.createIntent("play_music", 0.85, { query: query || text });
    }

    // 天气意图
    const weatherPatterns = ["天气", "气温", "温度", "下雨", "weather", "forecast"];
    if (weatherPatterns.some((p) => lowerText.includes(p))) {
      // 尝试提取地点
      const locationMatch = text.match(/(.+?)的?天气/);
      const location = locationMatch ? locationMatch[1] : undefined;
      return this.createIntent("weather", 0.85, { location });
    }

    // IoT 控制意图
    const iotPatterns = [
      { pattern: /(打开|开启|开)(.+?)(灯|空调|电视|风扇|窗帘)/, action: "on" },
      { pattern: /(关闭|关掉|关)(.+?)(灯|空调|电视|风扇|窗帘)/, action: "off" },
      { pattern: /(调高|增加|升高)(.+?)/, action: "increase" },
      { pattern: /(调低|减少|降低)(.+?)/, action: "decrease" },
    ];

    for (const { pattern, action } of iotPatterns) {
      const match = text.match(pattern);
      if (match) {
        return this.createIntent("iot", 0.85, {
          device: match[3] || match[2],
          action,
        });
      }
    }

    // 默认继续对话
    return this.createIntent("general", 0.8, { text });
  }
}

export default LlmProvider;
