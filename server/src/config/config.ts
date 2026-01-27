import type { AppConfig } from "@/types/config";
import { getEnvConfig, getSelectedProviderConfigs, type EnvConfig } from "./env";

/**
 * 从环境变量构建配置
 * 与 Python 版本的 data/.config.yaml 功能等价
 *
 * 配置优先级: .env.production > .env.example > 代码默认值
 */
export function buildConfigFromEnv(): AppConfig {
  let env: EnvConfig;
  try {
    env = getEnvConfig();
  } catch {
    // 如果环境变量不完整，使用默认值
    env = getDefaultEnv();
  }

  const selectedProviders = getSelectedProviderConfigs(env);

  return {
    // 服务器配置
    server: {
      ip: env.SERVER_IP,
      port: env.SERVER_PORT,
      http_port: env.SERVER_HTTP_PORT,
      websocket: env.SERVER_WEBSOCKET || `ws://${env.SERVER_IP}:${env.SERVER_PORT}/ws/v1`,
      vision_explain:
        env.SERVER_VISION_EXPLAIN ||
        `http://${env.SERVER_IP}:${env.SERVER_HTTP_PORT}/mcp/vision/explain`,
      auth_key: env.SERVER_AUTH_KEY || "",
      timezone_offset: env.SERVER_TIMEZONE_OFFSET,
      auth: {
        enabled: env.SERVER_AUTH_ENABLED,
        allowed_devices: env.SERVER_AUTH_ALLOWED_DEVICES
          ? env.SERVER_AUTH_ALLOWED_DEVICES.split(",").filter(Boolean)
          : [],
      },
    },

    // 日志配置
    log: {
      log_level: env.LOG_LEVEL,
      log_dir: env.LOG_DIR,
      log_file: env.LOG_FILE || "server.log",
      data_dir: env.DATA_DIR,
    },

    // 模块选择 (与 Python 版本的 selected_module 对应)
    selected_module: {
      VAD: env.SELECTED_VAD,
      ASR: env.SELECTED_ASR,
      LLM: env.SELECTED_LLM,
      VLLM: env.SELECTED_VLLM,
      TTS: env.SELECTED_TTS,
      Memory: env.SELECTED_MEMORY,
      Intent: env.SELECTED_INTENT,
    },

    // VAD 配置
    vad: {
      default: env.SELECTED_VAD === "SileroVAD" ? "silero" : "simple",
      providers: {
        silero: {
          type: "silero",
          threshold: env.VAD_THRESHOLD,
          threshold_low: env.VAD_THRESHOLD_LOW,
          min_silence_duration_ms: env.VAD_MIN_SILENCE_DURATION_MS,
          model_dir: env.VAD_MODEL_DIR,
        },
        simple: {
          type: "simple",
          threshold: env.VAD_THRESHOLD,
          threshold_low: env.VAD_THRESHOLD_LOW,
          min_silence_duration_ms: env.VAD_MIN_SILENCE_DURATION_MS,
        },
      },
    },

    // ASR 配置
    asr: {
      default: "doubao_stream",
      providers: {
        doubao_stream: {
          type: "doubao_stream",
          appid: env.ASR_DOUBAOSTREAM_APPID,
          access_token: env.ASR_DOUBAOSTREAM_ACCESS_TOKEN,
          cluster: env.ASR_DOUBAOSTREAM_CLUSTER,
          stream_mode: env.ASR_DOUBAOSTREAM_STREAM_MODE,
          resource_id: env.ASR_DOUBAOSTREAM_RESOURCE_ID,
          end_window_size: env.ASR_DOUBAOSTREAM_END_WINDOW_SIZE,
          output_dir: env.ASR_DOUBAOSTREAM_OUTPUT_DIR,
        },
      },
    },

    // LLM 配置
    llm: {
      default: getLLMProviderKey(env.SELECTED_LLM),
      providers: {
        ali: {
          type: "openai",
          api_base: env.LLM_ALI_BASE_URL,
          api_key: env.LLM_ALI_API_KEY,
          model: env.LLM_ALI_MODEL,
          temperature: env.LLM_ALI_TEMPERATURE,
          max_tokens: env.LLM_ALI_MAX_TOKENS,
          top_p: env.LLM_ALI_TOP_P,
          frequency_penalty: env.LLM_ALI_FREQUENCY_PENALTY,
          stream: true,
        },
        chatglm: {
          type: "openai",
          api_base: env.LLM_CHATGLM_BASE_URL,
          api_key: env.LLM_CHATGLM_API_KEY,
          model: env.LLM_CHATGLM_MODEL,
          stream: true,
        },
        openai: {
          type: "openai",
          api_base: env.LLM_OPENAI_BASE_URL,
          api_key: env.LLM_OPENAI_API_KEY,
          model: env.LLM_OPENAI_MODEL,
          temperature: 0.7,
          max_tokens: 2000,
          stream: true,
        },
        doubao: {
          type: "openai",
          api_base: env.LLM_DOUBAO_BASE_URL,
          api_key: env.LLM_DOUBAO_API_KEY,
          model: env.LLM_DOUBAO_MODEL,
          stream: true,
        },
      },
    },

    // TTS 配置
    tts: {
      default: "huoshan_double_stream",
      providers: {
        huoshan_double_stream: {
          type: "huoshan_double_stream",
          ws_url: env.TTS_HUOSHAN_STREAM_WS_URL,
          appid: env.TTS_HUOSHAN_STREAM_APPID,
          access_token: env.TTS_HUOSHAN_STREAM_ACCESS_TOKEN,
          resource_id: env.TTS_HUOSHAN_STREAM_RESOURCE_ID,
          speaker: env.TTS_HUOSHAN_STREAM_SPEAKER,
          enable_ws_reuse: env.TTS_HUOSHAN_STREAM_ENABLE_WS_REUSE,
          speech_rate: env.TTS_HUOSHAN_STREAM_SPEECH_RATE,
          loudness_rate: env.TTS_HUOSHAN_STREAM_LOUDNESS_RATE,
          pitch: env.TTS_HUOSHAN_STREAM_PITCH,
        },
      },
    },

    // vLLM 配置
    vllm: {
      default: "openai",
      providers: {
        chatglm: {
          type: "openai",
          api_base: env.VLLM_CHATGLM_BASE_URL,
          api_key: env.VLLM_CHATGLM_API_KEY,
          model: env.VLLM_CHATGLM_MODEL,
        },
        xunfei: {
          type: "xunfei",
          api_base: env.VLLM_XUNFEI_BASE_URL,
          api_key: env.VLLM_XUNFEI_API_KEY,
          model: env.VLLM_XUNFEI_MODEL,
        },
      },
    },

    // Intent 配置
    intent: {
      default: "function_call",
      providers: {
        function_call: {
          type: "function_call",
          functions: env.INTENT_FUNCTION_CALL_FUNCTIONS.split(",").filter(Boolean),
        },
      },
    },

    // Memory 配置
    memory: {
      default: "local",
      providers: {
        local: {
          type: env.MEMORY_LOCAL_TYPE,
          llm: env.MEMORY_LOCAL_LLM,
        },
      },
    },

    // 插件配置
    plugins: {
      get_weather: {
        api_host: env.PLUGIN_WEATHER_API_HOST,
        api_key: env.PLUGIN_WEATHER_API_KEY,
        default_location: env.PLUGIN_WEATHER_DEFAULT_LOCATION,
      },
    },

    // MCP 配置
    mcp_endpoint: env.MCP_ENDPOINT || undefined,

    // Manager API 配置
    manager_api: {
      url: env.MANAGER_API_URL || undefined,
      secret: env.MANAGER_API_SECRET || undefined,
    },

    // 提示词模板
    prompt_template: env.PROMPT_TEMPLATE,

    // 其他配置
    delete_audio: env.DELETE_AUDIO,
    close_connection_no_voice_time: env.CLOSE_CONNECTION_NO_VOICE_TIME,
    tts_timeout: env.TTS_TIMEOUT,
    enable_wakeup_words_response_cache: env.ENABLE_WAKEUP_WORDS_RESPONSE_CACHE,
    enable_greeting: env.ENABLE_GREETING,
    enable_stop_tts_notify: env.ENABLE_STOP_TTS_NOTIFY,
    enable_websocket_ping: env.ENABLE_WEBSOCKET_PING,
    tts_audio_send_delay: env.TTS_AUDIO_SEND_DELAY,

    exit_commands: ["退出", "关闭", "exit", "quit"],

    // WebSocket 音频配置
    audio_params: {
      format: "opus",
      sample_rate: 16000,
      channels: 1,
      frame_duration: 60,
    },

    // 性能优化配置
    optimization: {
      enable_cache: true,
      cache_ttl: 3600,
      enable_pooling: true,
      pool_size: 10,
      enable_gc_optimization: true,
      gc_interval: 300,
      enable_metrics: true,
      metrics_interval: 60,
    },
  };
}

/**
 * 根据 LLM 类型名获取配置键名
 */
function getLLMProviderKey(llmType: string): string {
  const mapping: Record<string, string> = {
    AliLLM: "ali",
    ChatGLM: "chatglm",
    OpenAILLM: "openai",
    DoubaoLLM: "doubao",
  };
  return mapping[llmType] || "chatglm";
}

/**
 * 获取默认环境变量配置
 */
function getDefaultEnv(): EnvConfig {
  return {
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

    // 模块选择 - 默认配置（使用与 Python server 一致的 providers）
    SELECTED_VAD: "SileroVAD",
    SELECTED_ASR: "DoubaoStreamASR",
    SELECTED_LLM: "AliLLM",
    SELECTED_VLLM: "XunfeiSparkLLM",
    SELECTED_TTS: "HuoshanDoubleStreamTTS",
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
}

/**
 * 默认导出的配置
 */
export const config: AppConfig = buildConfigFromEnv();

export default config;
