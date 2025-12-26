/**
 * 类型定义 - 与服务端保持一致
 */

// 消息类型
export const MessageType = {
  HELLO: "hello",
  TEXT: "text",
  AUDIO: "audio",
  CONFIG: "config",
  CONTROL: "control",
  ERROR: "error",
  STT: "stt",
  TTS: "tts",
  LLM: "llm",
} as const;

export type MessageType = (typeof MessageType)[keyof typeof MessageType];

// 消息角色
export type MessageRole = "user" | "assistant" | "system";

// 设备信息
export interface DeviceInfo {
  macAddress?: string;
  deviceModel?: string;
  userAgent?: string;
  screenResolution?: string;
}

// 聊天消息
export interface ChatMessage {
  role: MessageRole;
  content: string;
  timestamp: Date;
}

// WebSocket 消息基础结构
export interface WSMessage {
  type: MessageType;
  data?: any;
  session_id?: string;
  timestamp?: string;
}

// 配置消息
export interface ConfigMessage {
  type: typeof MessageType.CONFIG;
  deviceInfo: DeviceInfo;
}

// 文本消息
export interface TextMessage {
  type: typeof MessageType.TEXT;
  text: string;
  session_id?: string;
}

// 控制消息
export interface ControlMessage {
  type: typeof MessageType.CONTROL;
  command: string;
  params?: Record<string, any>;
}

// 错误消息
export interface ErrorMessage {
  type: typeof MessageType.ERROR;
  error: string;
  details?: string;
}

// ASR 结果消息 (STT)
export interface STTResultMessage {
  type: typeof MessageType.STT;
  text: string;
  session_id?: string;
}

// TTS 音频消息
export interface TTSMessage {
  type: typeof MessageType.TTS;
  state?: "start" | "end";
  data?: ArrayBuffer;
}

// LLM 响应消息
export interface LLMResponseMessage {
  type: typeof MessageType.LLM;
  text?: string;
  state?: "start" | "end";
  finished?: boolean;
}

// 连接状态
export const ConnectionStatus = {
  DISCONNECTED: "disconnected",
  CONNECTING: "connecting",
  CONNECTED: "connected",
  RECONNECTING: "reconnecting",
  ERROR: "error",
} as const;

export type ConnectionStatus = (typeof ConnectionStatus)[keyof typeof ConnectionStatus];

// 录音状态
export const RecordingStatus = {
  IDLE: "idle",
  RECORDING: "recording",
  PAUSED: "paused",
  PROCESSING: "processing",
} as const;

export type RecordingStatus = (typeof RecordingStatus)[keyof typeof RecordingStatus];

// 会话信息
export interface SessionInfo {
  sessionId: string;
  deviceId: string;
  startTime: Date;
  messages: ChatMessage[];
}

// WebSocket 配置
export interface WebSocketConfig {
  url: string;
  clientId: string;
  deviceId: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  heartbeatInterval?: number;
}

// 音频配置
export interface AudioConfig {
  sampleRate: number;
  channels: number;
  bitDepth: number;
  bufferSize: number;
}
