export interface ServerConfig {
  ip: string;
  port: number;
  http_port: number;
  websocket: string;
  vision_explain?: string;
  websocket_timeout?: number;
  websocket_compression?: boolean;
  max_payload_size?: number;
  auth_key: string;
  timezone_offset: string;
  auth: {
    enabled: boolean;
    allowed_devices: string[];
    expire_seconds?: number;
  };
}

/**
 * VAD Provider 配置
 */
export interface VADProviderConfig {
  type: string;
  threshold?: number;
  threshold_low?: number;
  min_silence_duration_ms?: number;
  model_dir?: string;
  [key: string]: any;
}

export interface LogConfig {
  log_level: "DEBUG" | "INFO" | "WARN" | "ERROR";
  log_dir: string;
  log_file: string;
  data_dir: string;
}

export interface LLMProviderConfig {
  type: string;
  api_key?: string;
  api_base?: string;
  model: string;
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
  [key: string]: any;
}

export interface ASRProviderConfig {
  type: string;
  api_key?: string;
  model?: string;
  language?: string;
  model_path?: string;
  [key: string]: any;
}

export interface TTSProviderConfig {
  type: string;
  api_key?: string;
  voice?: string;
  model?: string;
  speed?: number;
  [key: string]: any;
}

export interface VLLMProviderConfig {
  type: string;
  api_key?: string;
  model: string;
  max_tokens?: number;
  detail?: string;
  [key: string]: any;
}

export interface IntentProviderConfig {
  type: string;
  model?: string;
  threshold?: number;
  [key: string]: any;
}

export interface MemoryProviderConfig {
  type: string;
  vector_db?: string;
  embedding_model?: string;
  redis_url?: string;
  max_tokens?: number;
  [key: string]: any;
}

export interface AppConfig {
  server: ServerConfig;
  log: LogConfig;

  /**
   * 模块选择 (与 Python 版本兼容)
   */
  selected_module?: {
    VAD?: string;
    ASR?: string;
    LLM?: string;
    VLLM?: string;
    TTS?: string;
    Memory?: string;
    Intent?: string;
  };

  /**
   * VAD 配置
   */
  vad?: {
    default: string;
    providers: Record<string, VADProviderConfig>;
  };

  llm: {
    default: string;
    providers: Record<string, LLMProviderConfig>;
  };
  asr: {
    default: string;
    providers: Record<string, ASRProviderConfig>;
  };
  tts: {
    default: string;
    providers: Record<string, TTSProviderConfig>;
  };
  vllm: {
    default: string;
    providers: Record<string, VLLMProviderConfig>;
  };
  intent: {
    default: string;
    providers: Record<string, IntentProviderConfig>;
  };
  memory: {
    default: string;
    providers: Record<string, MemoryProviderConfig>;
  };

  /**
   * 插件配置
   */
  plugins?: Record<string, any>;

  /**
   * MCP 配置
   */
  mcp_endpoint?: string;

  /**
   * 管理 API 配置
   */
  manager_api?: {
    url?: string;
    secret?: string;
  };

  delete_audio: boolean;
  close_connection_no_voice_time: number;
  tts_timeout: number;
  enable_wakeup_words_response_cache: boolean;
  enable_greeting: boolean;
  enable_stop_tts_notify?: boolean;
  enable_websocket_ping: boolean;
  tts_audio_send_delay?: number;
  exit_commands: string[];
  audio_params?: {
    format?: string;
    sample_rate?: number;
    channels?: number;
    frame_duration?: number;
  };
  optimization?: {
    enable_cache?: boolean;
    cache_ttl?: number;
    enable_pooling?: boolean;
    pool_size?: number;
    enable_gc_optimization?: boolean;
    gc_interval?: number;
    enable_metrics?: boolean;
    metrics_interval?: number;
    enable_request_dedup?: boolean;
    enable_load_balancing?: boolean;
    [key: string]: any;
  };
  agent?: {
    base_prompt?: string;
    welcome_message?: string;
    prompt_template?: string;
    [key: string]: any;
  };

  /**
   * IoT 配置
   */
  iot?: {
    enabled?: boolean;
    mqtt_host?: string;
    mqtt_port?: number;
    mqtt_topic?: string;
    devices?: Record<string, any>;
    [key: string]: any;
  };

  /**
   * 提示词模板配置 - 可以是字符串或对象
   */
  prompt_template?:
    | string
    | {
        system_prompt?: string;
        [key: string]: any;
      };

  /**
   * 是否从 API 读取配置
   */
  read_config_from_api?: boolean;
}

export type ProviderType = "vad" | "llm" | "asr" | "tts" | "vllm" | "intent" | "memory";
