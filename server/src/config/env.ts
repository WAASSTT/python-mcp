/**
 * 环境变量配置
 * 从 .env 文件和环境变量加载配置
 *
 * 配置优先级: .env.production > .env.example > 代码默认值
 * 等价于 Python 版本的: data/.config.yaml > config.yaml
 */

import { existsSync } from "fs";
import { resolve } from "path";

/**
 * 环境变量配置接口
 */
export interface EnvConfig {
  // === 服务器配置 ===
  SERVER_IP: string;
  SERVER_PORT: number;
  SERVER_HTTP_PORT: number;
  SERVER_WEBSOCKET: string;
  SERVER_VISION_EXPLAIN: string;
  SERVER_AUTH_ENABLED: boolean;
  SERVER_AUTH_KEY: string;
  SERVER_AUTH_ALLOWED_DEVICES: string;
  SERVER_TIMEZONE_OFFSET: string;

  // === 日志配置 ===
  LOG_LEVEL: "DEBUG" | "INFO" | "WARN" | "ERROR";
  LOG_DIR: string;
  LOG_FILE: string;
  DATA_DIR: string;

  // === 基础配置 ===
  DELETE_AUDIO: boolean;
  CLOSE_CONNECTION_NO_VOICE_TIME: number;
  TTS_TIMEOUT: number;
  ENABLE_WAKEUP_WORDS_RESPONSE_CACHE: boolean;
  ENABLE_GREETING: boolean;
  ENABLE_STOP_TTS_NOTIFY: boolean;
  ENABLE_WEBSOCKET_PING: boolean;
  TTS_AUDIO_SEND_DELAY: number;

  // === 模块选择 ===
  SELECTED_VAD: string;
  SELECTED_ASR: string;
  SELECTED_LLM: string;
  SELECTED_VLLM: string;
  SELECTED_TTS: string;
  SELECTED_MEMORY: string;
  SELECTED_INTENT: string;

  // === VAD 配置 ===
  VAD_TYPE: string;
  VAD_THRESHOLD: number;
  VAD_THRESHOLD_LOW: number;
  VAD_MIN_SILENCE_DURATION_MS: number;
  VAD_MODEL_DIR: string;

  // === ASR - FunASR ===
  ASR_FUNASR_TYPE: string;
  ASR_FUNASR_MODEL_DIR: string;
  ASR_FUNASR_OUTPUT_DIR: string;

  // === ASR - DoubaoStream ===
  ASR_DOUBAOSTREAM_TYPE: string;
  ASR_DOUBAOSTREAM_APPID: string;
  ASR_DOUBAOSTREAM_ACCESS_TOKEN: string;
  ASR_DOUBAOSTREAM_CLUSTER: string;
  ASR_DOUBAOSTREAM_STREAM_MODE: string;
  ASR_DOUBAOSTREAM_RESOURCE_ID: string;
  ASR_DOUBAOSTREAM_END_WINDOW_SIZE: number;
  ASR_DOUBAOSTREAM_OUTPUT_DIR: string;

  // === LLM - Ali ===
  LLM_ALI_TYPE: string;
  LLM_ALI_BASE_URL: string;
  LLM_ALI_API_KEY: string;
  LLM_ALI_MODEL: string;
  LLM_ALI_TEMPERATURE: number;
  LLM_ALI_MAX_TOKENS: number;
  LLM_ALI_TOP_P: number;
  LLM_ALI_FREQUENCY_PENALTY: number;

  // === LLM - ChatGLM ===
  LLM_CHATGLM_TYPE: string;
  LLM_CHATGLM_BASE_URL: string;
  LLM_CHATGLM_MODEL: string;
  LLM_CHATGLM_API_KEY: string;

  // === LLM - OpenAI ===
  LLM_OPENAI_TYPE: string;
  LLM_OPENAI_BASE_URL: string;
  LLM_OPENAI_MODEL: string;
  LLM_OPENAI_API_KEY: string;

  // === LLM - Doubao ===
  LLM_DOUBAO_TYPE: string;
  LLM_DOUBAO_BASE_URL: string;
  LLM_DOUBAO_MODEL: string;
  LLM_DOUBAO_API_KEY: string;

  // === VLLM - ChatGLM ===
  VLLM_CHATGLM_TYPE: string;
  VLLM_CHATGLM_BASE_URL: string;
  VLLM_CHATGLM_MODEL: string;
  VLLM_CHATGLM_API_KEY: string;

  // === VLLM - Xunfei ===
  VLLM_XUNFEI_TYPE: string;
  VLLM_XUNFEI_BASE_URL: string;
  VLLM_XUNFEI_MODEL: string;
  VLLM_XUNFEI_API_KEY: string;

  // === TTS - Edge ===
  TTS_EDGE_TYPE: string;
  TTS_EDGE_VOICE: string;
  TTS_EDGE_OUTPUT_DIR: string;

  // === TTS - Huoshan Stream ===
  TTS_HUOSHAN_STREAM_TYPE: string;
  TTS_HUOSHAN_STREAM_WS_URL: string;
  TTS_HUOSHAN_STREAM_APPID: string;
  TTS_HUOSHAN_STREAM_ACCESS_TOKEN: string;
  TTS_HUOSHAN_STREAM_RESOURCE_ID: string;
  TTS_HUOSHAN_STREAM_SPEAKER: string;
  TTS_HUOSHAN_STREAM_ENABLE_WS_REUSE: boolean;
  TTS_HUOSHAN_STREAM_SPEECH_RATE: number;
  TTS_HUOSHAN_STREAM_LOUDNESS_RATE: number;
  TTS_HUOSHAN_STREAM_PITCH: number;

  // === Memory 配置 ===
  MEMORY_LOCAL_TYPE: string;
  MEMORY_LOCAL_LLM: string;

  // === Intent 配置 ===
  INTENT_FUNCTION_CALL_TYPE: string;
  INTENT_FUNCTION_CALL_FUNCTIONS: string;

  // === 插件配置 - 和风天气 ===
  PLUGIN_WEATHER_API_HOST: string;
  PLUGIN_WEATHER_API_KEY: string;
  PLUGIN_WEATHER_DEFAULT_LOCATION: string;

  // === MCP 配置 ===
  MCP_ENDPOINT: string;

  // === Manager API 配置 ===
  MANAGER_API_URL: string;
  MANAGER_API_SECRET: string;

  // === 提示词模板 ===
  PROMPT_TEMPLATE: string;

  // === Node 环境 ===
  NODE_ENV: string;
}

/**
 * 默认环境变量值 - 对应 .env.example 的默认配置
 */
const defaults: Partial<EnvConfig> = {
  // 服务器配置
  SERVER_IP: "0.0.0.0",
  SERVER_PORT: 30000,
  SERVER_HTTP_PORT: 30003,
  SERVER_WEBSOCKET: "websocket",
  SERVER_VISION_EXPLAIN: "",
  SERVER_AUTH_ENABLED: false,
  SERVER_AUTH_KEY: "",
  SERVER_AUTH_ALLOWED_DEVICES: "",
  SERVER_TIMEZONE_OFFSET: "+8",

  // 日志配置
  LOG_LEVEL: "INFO",
  LOG_DIR: "logs",
  LOG_FILE: "",
  DATA_DIR: "data",

  // 基础配置
  DELETE_AUDIO: true,
  CLOSE_CONNECTION_NO_VOICE_TIME: 120,
  TTS_TIMEOUT: 10,
  ENABLE_WAKEUP_WORDS_RESPONSE_CACHE: true,
  ENABLE_GREETING: true,
  ENABLE_STOP_TTS_NOTIFY: true,
  ENABLE_WEBSOCKET_PING: true,
  TTS_AUDIO_SEND_DELAY: 0,

  // 模块选择 - 默认配置
  SELECTED_VAD: "SileroVAD",
  SELECTED_ASR: "FunASR",
  SELECTED_LLM: "ChatGLM",
  SELECTED_VLLM: "ChatGLM",
  SELECTED_TTS: "EdgeTTS",
  SELECTED_MEMORY: "mem_local_short",
  SELECTED_INTENT: "function_call",

  // VAD 配置
  VAD_TYPE: "SileroVAD",
  VAD_THRESHOLD: 0.5,
  VAD_THRESHOLD_LOW: 0.3,
  VAD_MIN_SILENCE_DURATION_MS: 200,
  VAD_MODEL_DIR: "models/snakers4_silero-vad",

  // ASR - FunASR
  ASR_FUNASR_TYPE: "FunASR",
  ASR_FUNASR_MODEL_DIR: "models/SenseVoiceSmall",
  ASR_FUNASR_OUTPUT_DIR: "tmp/asr",

  // ASR - DoubaoStream
  ASR_DOUBAOSTREAM_TYPE: "DoubaoStreamASR",
  ASR_DOUBAOSTREAM_APPID: "",
  ASR_DOUBAOSTREAM_ACCESS_TOKEN: "",
  ASR_DOUBAOSTREAM_CLUSTER: "volcengine_input_common",
  ASR_DOUBAOSTREAM_STREAM_MODE: "bigmodel_async",
  ASR_DOUBAOSTREAM_RESOURCE_ID: "volc.seedasr.sauc.duration",
  ASR_DOUBAOSTREAM_END_WINDOW_SIZE: 800,
  ASR_DOUBAOSTREAM_OUTPUT_DIR: "tmp/asr",

  // LLM - Ali
  LLM_ALI_TYPE: "AliLLM",
  LLM_ALI_BASE_URL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
  LLM_ALI_API_KEY: "",
  LLM_ALI_MODEL: "qwen-turbo",
  LLM_ALI_TEMPERATURE: 0.7,
  LLM_ALI_MAX_TOKENS: 500,
  LLM_ALI_TOP_P: 0.9,
  LLM_ALI_FREQUENCY_PENALTY: 0,

  // LLM - ChatGLM
  LLM_CHATGLM_TYPE: "ChatGLM",
  LLM_CHATGLM_BASE_URL: "https://open.bigmodel.cn/api/paas/v4",
  LLM_CHATGLM_MODEL: "GLM-4-Flash-250414",
  LLM_CHATGLM_API_KEY: "",

  // LLM - OpenAI
  LLM_OPENAI_TYPE: "OpenAILLM",
  LLM_OPENAI_BASE_URL: "https://api.openai.com/v1",
  LLM_OPENAI_MODEL: "gpt-4-turbo-preview",
  LLM_OPENAI_API_KEY: "",

  // LLM - Doubao
  LLM_DOUBAO_TYPE: "DoubaoLLM",
  LLM_DOUBAO_BASE_URL: "https://ark.cn-beijing.volces.com/api/v3",
  LLM_DOUBAO_MODEL: "",
  LLM_DOUBAO_API_KEY: "",

  // VLLM - ChatGLM
  VLLM_CHATGLM_TYPE: "ChatGLM",
  VLLM_CHATGLM_BASE_URL: "https://open.bigmodel.cn/api/paas/v4",
  VLLM_CHATGLM_MODEL: "GLM-4V-Flash",
  VLLM_CHATGLM_API_KEY: "",

  // VLLM - Xunfei
  VLLM_XUNFEI_TYPE: "XunfeiSparkLLM",
  VLLM_XUNFEI_BASE_URL: "wss://spark-api.cn-huabei-1.xf-yun.com/v1/assistants",
  VLLM_XUNFEI_MODEL: "lite",
  VLLM_XUNFEI_API_KEY: "",

  // TTS - Edge
  TTS_EDGE_TYPE: "EdgeTTS",
  TTS_EDGE_VOICE: "zh-CN-XiaoxiaoNeural",
  TTS_EDGE_OUTPUT_DIR: "tmp/tts",

  // TTS - Huoshan Stream
  TTS_HUOSHAN_STREAM_TYPE: "HuoshanDoubleStreamTTS",
  TTS_HUOSHAN_STREAM_WS_URL: "wss://openspeech.bytedance.com/api/v3/tts/bidirection",
  TTS_HUOSHAN_STREAM_APPID: "",
  TTS_HUOSHAN_STREAM_ACCESS_TOKEN: "",
  TTS_HUOSHAN_STREAM_RESOURCE_ID: "volc.service_type.10029",
  TTS_HUOSHAN_STREAM_SPEAKER: "zh_female_xinlingjitang_moon_bigtts",
  TTS_HUOSHAN_STREAM_ENABLE_WS_REUSE: true,
  TTS_HUOSHAN_STREAM_SPEECH_RATE: 0,
  TTS_HUOSHAN_STREAM_LOUDNESS_RATE: 0,
  TTS_HUOSHAN_STREAM_PITCH: 0,

  // Memory 配置
  MEMORY_LOCAL_TYPE: "mem_local_short",
  MEMORY_LOCAL_LLM: "llm",

  // Intent 配置
  INTENT_FUNCTION_CALL_TYPE: "function_call",
  INTENT_FUNCTION_CALL_FUNCTIONS: "get_weather",

  // 插件配置 - 和风天气
  PLUGIN_WEATHER_API_HOST: "",
  PLUGIN_WEATHER_API_KEY: "",
  PLUGIN_WEATHER_DEFAULT_LOCATION: "无锡",

  // MCP 配置
  MCP_ENDPOINT: "",

  // Manager API 配置
  MANAGER_API_URL: "",
  MANAGER_API_SECRET: "",

  // 提示词模板
  PROMPT_TEMPLATE: "agent-base",

  // Node 环境
  NODE_ENV: "development",
};

/**
 * 获取环境变量值
 */
function getEnv<K extends keyof EnvConfig>(key: K, defaultValue?: EnvConfig[K]): EnvConfig[K] {
  const value = process.env[key];

  if (value === undefined) {
    const def = defaultValue ?? defaults[key];
    if (def === undefined) {
      throw new Error(`Environment variable ${key} is required but not set`);
    }
    return def as EnvConfig[K];
  }

  // 类型转换
  const defValue = defaultValue ?? defaults[key];
  if (typeof defValue === "number") {
    return parseFloat(value) as EnvConfig[K];
  }
  if (typeof defValue === "boolean") {
    return (value.toLowerCase() === "true" || value === "1") as EnvConfig[K];
  }

  return value as EnvConfig[K];
}

/**
 * 获取所有环境变量配置
 */
export function getEnvConfig(): EnvConfig {
  return {
    // 服务器配置
    SERVER_IP: getEnv("SERVER_IP"),
    SERVER_PORT: getEnv("SERVER_PORT"),
    SERVER_HTTP_PORT: getEnv("SERVER_HTTP_PORT"),
    SERVER_WEBSOCKET: getEnv("SERVER_WEBSOCKET"),
    SERVER_VISION_EXPLAIN: getEnv("SERVER_VISION_EXPLAIN"),
    SERVER_AUTH_ENABLED: getEnv("SERVER_AUTH_ENABLED"),
    SERVER_AUTH_KEY: getEnv("SERVER_AUTH_KEY"),
    SERVER_AUTH_ALLOWED_DEVICES: getEnv("SERVER_AUTH_ALLOWED_DEVICES"),
    SERVER_TIMEZONE_OFFSET: getEnv("SERVER_TIMEZONE_OFFSET"),

    // 日志配置
    LOG_LEVEL: getEnv("LOG_LEVEL"),
    LOG_DIR: getEnv("LOG_DIR"),
    LOG_FILE: getEnv("LOG_FILE"),
    DATA_DIR: getEnv("DATA_DIR"),

    // 基础配置
    DELETE_AUDIO: getEnv("DELETE_AUDIO"),
    CLOSE_CONNECTION_NO_VOICE_TIME: getEnv("CLOSE_CONNECTION_NO_VOICE_TIME"),
    TTS_TIMEOUT: getEnv("TTS_TIMEOUT"),
    ENABLE_WAKEUP_WORDS_RESPONSE_CACHE: getEnv("ENABLE_WAKEUP_WORDS_RESPONSE_CACHE"),
    ENABLE_GREETING: getEnv("ENABLE_GREETING"),
    ENABLE_STOP_TTS_NOTIFY: getEnv("ENABLE_STOP_TTS_NOTIFY"),
    ENABLE_WEBSOCKET_PING: getEnv("ENABLE_WEBSOCKET_PING"),
    TTS_AUDIO_SEND_DELAY: getEnv("TTS_AUDIO_SEND_DELAY"),

    // 模块选择
    SELECTED_VAD: getEnv("SELECTED_VAD"),
    SELECTED_ASR: getEnv("SELECTED_ASR"),
    SELECTED_LLM: getEnv("SELECTED_LLM"),
    SELECTED_VLLM: getEnv("SELECTED_VLLM"),
    SELECTED_TTS: getEnv("SELECTED_TTS"),
    SELECTED_MEMORY: getEnv("SELECTED_MEMORY"),
    SELECTED_INTENT: getEnv("SELECTED_INTENT"),

    // VAD 配置
    VAD_TYPE: getEnv("VAD_TYPE"),
    VAD_THRESHOLD: getEnv("VAD_THRESHOLD"),
    VAD_THRESHOLD_LOW: getEnv("VAD_THRESHOLD_LOW"),
    VAD_MIN_SILENCE_DURATION_MS: getEnv("VAD_MIN_SILENCE_DURATION_MS"),
    VAD_MODEL_DIR: getEnv("VAD_MODEL_DIR"),

    // ASR - FunASR
    ASR_FUNASR_TYPE: getEnv("ASR_FUNASR_TYPE"),
    ASR_FUNASR_MODEL_DIR: getEnv("ASR_FUNASR_MODEL_DIR"),
    ASR_FUNASR_OUTPUT_DIR: getEnv("ASR_FUNASR_OUTPUT_DIR"),

    // ASR - DoubaoStream
    ASR_DOUBAOSTREAM_TYPE: getEnv("ASR_DOUBAOSTREAM_TYPE"),
    ASR_DOUBAOSTREAM_APPID: getEnv("ASR_DOUBAOSTREAM_APPID"),
    ASR_DOUBAOSTREAM_ACCESS_TOKEN: getEnv("ASR_DOUBAOSTREAM_ACCESS_TOKEN"),
    ASR_DOUBAOSTREAM_CLUSTER: getEnv("ASR_DOUBAOSTREAM_CLUSTER"),
    ASR_DOUBAOSTREAM_STREAM_MODE: getEnv("ASR_DOUBAOSTREAM_STREAM_MODE"),
    ASR_DOUBAOSTREAM_RESOURCE_ID: getEnv("ASR_DOUBAOSTREAM_RESOURCE_ID"),
    ASR_DOUBAOSTREAM_END_WINDOW_SIZE: getEnv("ASR_DOUBAOSTREAM_END_WINDOW_SIZE"),
    ASR_DOUBAOSTREAM_OUTPUT_DIR: getEnv("ASR_DOUBAOSTREAM_OUTPUT_DIR"),

    // LLM - Ali
    LLM_ALI_TYPE: getEnv("LLM_ALI_TYPE"),
    LLM_ALI_BASE_URL: getEnv("LLM_ALI_BASE_URL"),
    LLM_ALI_API_KEY: getEnv("LLM_ALI_API_KEY"),
    LLM_ALI_MODEL: getEnv("LLM_ALI_MODEL"),
    LLM_ALI_TEMPERATURE: getEnv("LLM_ALI_TEMPERATURE"),
    LLM_ALI_MAX_TOKENS: getEnv("LLM_ALI_MAX_TOKENS"),
    LLM_ALI_TOP_P: getEnv("LLM_ALI_TOP_P"),
    LLM_ALI_FREQUENCY_PENALTY: getEnv("LLM_ALI_FREQUENCY_PENALTY"),

    // LLM - ChatGLM
    LLM_CHATGLM_TYPE: getEnv("LLM_CHATGLM_TYPE"),
    LLM_CHATGLM_BASE_URL: getEnv("LLM_CHATGLM_BASE_URL"),
    LLM_CHATGLM_MODEL: getEnv("LLM_CHATGLM_MODEL"),
    LLM_CHATGLM_API_KEY: getEnv("LLM_CHATGLM_API_KEY"),

    // LLM - OpenAI
    LLM_OPENAI_TYPE: getEnv("LLM_OPENAI_TYPE"),
    LLM_OPENAI_BASE_URL: getEnv("LLM_OPENAI_BASE_URL"),
    LLM_OPENAI_MODEL: getEnv("LLM_OPENAI_MODEL"),
    LLM_OPENAI_API_KEY: getEnv("LLM_OPENAI_API_KEY"),

    // LLM - Doubao
    LLM_DOUBAO_TYPE: getEnv("LLM_DOUBAO_TYPE"),
    LLM_DOUBAO_BASE_URL: getEnv("LLM_DOUBAO_BASE_URL"),
    LLM_DOUBAO_MODEL: getEnv("LLM_DOUBAO_MODEL"),
    LLM_DOUBAO_API_KEY: getEnv("LLM_DOUBAO_API_KEY"),

    // VLLM - ChatGLM
    VLLM_CHATGLM_TYPE: getEnv("VLLM_CHATGLM_TYPE"),
    VLLM_CHATGLM_BASE_URL: getEnv("VLLM_CHATGLM_BASE_URL"),
    VLLM_CHATGLM_MODEL: getEnv("VLLM_CHATGLM_MODEL"),
    VLLM_CHATGLM_API_KEY: getEnv("VLLM_CHATGLM_API_KEY"),

    // VLLM - Xunfei
    VLLM_XUNFEI_TYPE: getEnv("VLLM_XUNFEI_TYPE"),
    VLLM_XUNFEI_BASE_URL: getEnv("VLLM_XUNFEI_BASE_URL"),
    VLLM_XUNFEI_MODEL: getEnv("VLLM_XUNFEI_MODEL"),
    VLLM_XUNFEI_API_KEY: getEnv("VLLM_XUNFEI_API_KEY"),

    // TTS - Edge
    TTS_EDGE_TYPE: getEnv("TTS_EDGE_TYPE"),
    TTS_EDGE_VOICE: getEnv("TTS_EDGE_VOICE"),
    TTS_EDGE_OUTPUT_DIR: getEnv("TTS_EDGE_OUTPUT_DIR"),

    // TTS - Huoshan Stream
    TTS_HUOSHAN_STREAM_TYPE: getEnv("TTS_HUOSHAN_STREAM_TYPE"),
    TTS_HUOSHAN_STREAM_WS_URL: getEnv("TTS_HUOSHAN_STREAM_WS_URL"),
    TTS_HUOSHAN_STREAM_APPID: getEnv("TTS_HUOSHAN_STREAM_APPID"),
    TTS_HUOSHAN_STREAM_ACCESS_TOKEN: getEnv("TTS_HUOSHAN_STREAM_ACCESS_TOKEN"),
    TTS_HUOSHAN_STREAM_RESOURCE_ID: getEnv("TTS_HUOSHAN_STREAM_RESOURCE_ID"),
    TTS_HUOSHAN_STREAM_SPEAKER: getEnv("TTS_HUOSHAN_STREAM_SPEAKER"),
    TTS_HUOSHAN_STREAM_ENABLE_WS_REUSE: getEnv("TTS_HUOSHAN_STREAM_ENABLE_WS_REUSE"),
    TTS_HUOSHAN_STREAM_SPEECH_RATE: getEnv("TTS_HUOSHAN_STREAM_SPEECH_RATE"),
    TTS_HUOSHAN_STREAM_LOUDNESS_RATE: getEnv("TTS_HUOSHAN_STREAM_LOUDNESS_RATE"),
    TTS_HUOSHAN_STREAM_PITCH: getEnv("TTS_HUOSHAN_STREAM_PITCH"),

    // Memory 配置
    MEMORY_LOCAL_TYPE: getEnv("MEMORY_LOCAL_TYPE"),
    MEMORY_LOCAL_LLM: getEnv("MEMORY_LOCAL_LLM"),

    // Intent 配置
    INTENT_FUNCTION_CALL_TYPE: getEnv("INTENT_FUNCTION_CALL_TYPE"),
    INTENT_FUNCTION_CALL_FUNCTIONS: getEnv("INTENT_FUNCTION_CALL_FUNCTIONS"),

    // 插件配置 - 和风天气
    PLUGIN_WEATHER_API_HOST: getEnv("PLUGIN_WEATHER_API_HOST"),
    PLUGIN_WEATHER_API_KEY: getEnv("PLUGIN_WEATHER_API_KEY"),
    PLUGIN_WEATHER_DEFAULT_LOCATION: getEnv("PLUGIN_WEATHER_DEFAULT_LOCATION"),

    // MCP 配置
    MCP_ENDPOINT: getEnv("MCP_ENDPOINT"),

    // Manager API 配置
    MANAGER_API_URL: getEnv("MANAGER_API_URL"),
    MANAGER_API_SECRET: getEnv("MANAGER_API_SECRET"),

    // 提示词模板
    PROMPT_TEMPLATE: getEnv("PROMPT_TEMPLATE"),

    // Node 环境
    NODE_ENV: getEnv("NODE_ENV"),
  };
}

/**
 * 根据选择的模块获取对应的 Provider 配置
 */
export function getSelectedProviderConfigs(env: EnvConfig) {
  return {
    vad: {
      type: env.VAD_TYPE,
      threshold: env.VAD_THRESHOLD,
      thresholdLow: env.VAD_THRESHOLD_LOW,
      minSilenceDurationMs: env.VAD_MIN_SILENCE_DURATION_MS,
      modelDir: env.VAD_MODEL_DIR,
    },

    asr:
      env.SELECTED_ASR === "DoubaoStreamASR"
        ? {
            type: env.ASR_DOUBAOSTREAM_TYPE,
            appid: env.ASR_DOUBAOSTREAM_APPID,
            accessToken: env.ASR_DOUBAOSTREAM_ACCESS_TOKEN,
            cluster: env.ASR_DOUBAOSTREAM_CLUSTER,
            streamMode: env.ASR_DOUBAOSTREAM_STREAM_MODE,
            resourceId: env.ASR_DOUBAOSTREAM_RESOURCE_ID,
            endWindowSize: env.ASR_DOUBAOSTREAM_END_WINDOW_SIZE,
            outputDir: env.ASR_DOUBAOSTREAM_OUTPUT_DIR,
          }
        : {
            type: env.ASR_FUNASR_TYPE,
            modelDir: env.ASR_FUNASR_MODEL_DIR,
            outputDir: env.ASR_FUNASR_OUTPUT_DIR,
          },

    llm: (() => {
      switch (env.SELECTED_LLM) {
        case "AliLLM":
          return {
            type: env.LLM_ALI_TYPE,
            baseUrl: env.LLM_ALI_BASE_URL,
            apiKey: env.LLM_ALI_API_KEY,
            model: env.LLM_ALI_MODEL,
            temperature: env.LLM_ALI_TEMPERATURE,
            maxTokens: env.LLM_ALI_MAX_TOKENS,
            topP: env.LLM_ALI_TOP_P,
            frequencyPenalty: env.LLM_ALI_FREQUENCY_PENALTY,
          };
        case "OpenAILLM":
          return {
            type: env.LLM_OPENAI_TYPE,
            baseUrl: env.LLM_OPENAI_BASE_URL,
            apiKey: env.LLM_OPENAI_API_KEY,
            model: env.LLM_OPENAI_MODEL,
          };
        case "DoubaoLLM":
          return {
            type: env.LLM_DOUBAO_TYPE,
            baseUrl: env.LLM_DOUBAO_BASE_URL,
            apiKey: env.LLM_DOUBAO_API_KEY,
            model: env.LLM_DOUBAO_MODEL,
          };
        default: // ChatGLM
          return {
            type: env.LLM_CHATGLM_TYPE,
            baseUrl: env.LLM_CHATGLM_BASE_URL,
            apiKey: env.LLM_CHATGLM_API_KEY,
            model: env.LLM_CHATGLM_MODEL,
          };
      }
    })(),

    vllm: (() => {
      switch (env.SELECTED_VLLM) {
        case "XunfeiSparkLLM":
          return {
            type: env.VLLM_XUNFEI_TYPE,
            baseUrl: env.VLLM_XUNFEI_BASE_URL,
            apiKey: env.VLLM_XUNFEI_API_KEY,
            model: env.VLLM_XUNFEI_MODEL,
          };
        default: // ChatGLM
          return {
            type: env.VLLM_CHATGLM_TYPE,
            baseUrl: env.VLLM_CHATGLM_BASE_URL,
            apiKey: env.VLLM_CHATGLM_API_KEY,
            model: env.VLLM_CHATGLM_MODEL,
          };
      }
    })(),

    tts:
      env.SELECTED_TTS === "HuoshanDoubleStreamTTS"
        ? {
            type: env.TTS_HUOSHAN_STREAM_TYPE,
            wsUrl: env.TTS_HUOSHAN_STREAM_WS_URL,
            appid: env.TTS_HUOSHAN_STREAM_APPID,
            accessToken: env.TTS_HUOSHAN_STREAM_ACCESS_TOKEN,
            resourceId: env.TTS_HUOSHAN_STREAM_RESOURCE_ID,
            speaker: env.TTS_HUOSHAN_STREAM_SPEAKER,
            enableWsReuse: env.TTS_HUOSHAN_STREAM_ENABLE_WS_REUSE,
            speechRate: env.TTS_HUOSHAN_STREAM_SPEECH_RATE,
            loudnessRate: env.TTS_HUOSHAN_STREAM_LOUDNESS_RATE,
            pitch: env.TTS_HUOSHAN_STREAM_PITCH,
          }
        : {
            type: env.TTS_EDGE_TYPE,
            voice: env.TTS_EDGE_VOICE,
            outputDir: env.TTS_EDGE_OUTPUT_DIR,
          },

    memory: {
      type: env.MEMORY_LOCAL_TYPE,
      llm: env.MEMORY_LOCAL_LLM,
    },

    intent: {
      type: env.INTENT_FUNCTION_CALL_TYPE,
      functions: env.INTENT_FUNCTION_CALL_FUNCTIONS.split(",").filter(Boolean),
    },
  };
}

/**
 * 检查必需的环境变量
 */
export function validateEnvConfig(): { valid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  const env = getEnvConfig();

  // 检查 ASR 配置
  if (env.SELECTED_ASR === "DoubaoStreamASR") {
    if (!env.ASR_DOUBAOSTREAM_APPID || !env.ASR_DOUBAOSTREAM_ACCESS_TOKEN) {
      errors.push("DoubaoStreamASR requires ASR_DOUBAOSTREAM_APPID and ASR_DOUBAOSTREAM_ACCESS_TOKEN");
    }
  } else if (env.SELECTED_ASR === "FunASR") {
    if (!env.ASR_FUNASR_MODEL_DIR) {
      warnings.push("FunASR model directory not set, will use default");
    }
  }

  // 检查 LLM 配置
  switch (env.SELECTED_LLM) {
    case "AliLLM":
      if (!env.LLM_ALI_API_KEY) {
        errors.push("AliLLM requires LLM_ALI_API_KEY");
      }
      break;
    case "OpenAILLM":
      if (!env.LLM_OPENAI_API_KEY) {
        errors.push("OpenAILLM requires LLM_OPENAI_API_KEY");
      }
      break;
    case "DoubaoLLM":
      if (!env.LLM_DOUBAO_API_KEY) {
        errors.push("DoubaoLLM requires LLM_DOUBAO_API_KEY");
      }
      break;
    case "ChatGLM":
      // ChatGLM 有免费 API，不需要 key 也可以使用
      break;
  }

  // 检查 TTS 配置
  if (env.SELECTED_TTS === "HuoshanDoubleStreamTTS") {
    if (!env.TTS_HUOSHAN_STREAM_APPID || !env.TTS_HUOSHAN_STREAM_ACCESS_TOKEN) {
      errors.push("HuoshanDoubleStreamTTS requires TTS_HUOSHAN_STREAM_APPID and TTS_HUOSHAN_STREAM_ACCESS_TOKEN");
    }
  }

  // 检查天气插件配置
  const intentFunctions = env.INTENT_FUNCTION_CALL_FUNCTIONS.split(",");
  if (intentFunctions.includes("get_weather")) {
    if (!env.PLUGIN_WEATHER_API_KEY) {
      warnings.push("Weather plugin enabled but PLUGIN_WEATHER_API_KEY not set");
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * 加载环境文件
 * 优先级: .env.production > .env.local > .env
 */
export function loadEnvFiles(): void {
  const envFiles = [".env", ".env.local", ".env.production"];

  for (const file of envFiles) {
    const filePath = resolve(process.cwd(), file);
    if (existsSync(filePath)) {
      // 使用 Bun 或 Node 的方式加载 env 文件
      // Bun: 自动加载 .env 文件
      // Node: 需要 dotenv 包
      console.log(`Loaded env file: ${file}`);
    }
  }
}
