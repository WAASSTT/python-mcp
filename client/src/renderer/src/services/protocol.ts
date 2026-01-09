/**
 * 协议定义 - 与服务端对齐
 */

// ==================== 消息类型 ====================

export enum ServerMessageType {
  HELLO = "hello",
  LISTEN = "listen",
  TEXT = "text",
  AUDIO = "audio",
  ABORT = "abort",
  STT = "stt", // 语音识别结果
  TTS = "tts", // 语音合成
  ERROR = "error", // 错误消息
  PONG = "pong", // 心跳响应
  IOT = "iot", // IoT 消息
  MCP = "mcp", // MCP 消息
  SERVER = "server", // 服务器消息
  PING = "ping", // 心跳
}

export enum ListenMode {
  WAKEUP = 0, // 唤醒词模式
  ALWAYS = 1, // 持续监听
  AUTO = 0, // 自动模式 (别名)
  MANUAL = 1, // 手动模式 (别名)
  REALTIME = 2, // 实时模式
}

export enum ListenState {
  IDLE = 0, // 空闲
  LISTENING = 1, // 监听中
  PROCESSING = 2, // 处理中
  START = 1, // 开始 (别名)
  STOP = 0, // 停止 (别名)
  DETECT = 2, // 检测中 (别名)
}

export enum TTSState {
  IDLE = 0, // 空闲
  PLAYING = 1, // 播放中
  PAUSED = 2, // 暂停
  START = 1, // 开始 (别名)
  STOP = 0, // 停止 (别名)
  SENTENCE_START = 1, // 句子开始 (别名)
}

// ==================== 消息结构 ====================

export interface HelloMessage {
  type: "hello";
  deviceId: string;
  deviceName: string;
  clientId: string;
  token?: string;
  audio_params?: {
    format: string;
    sample_rate: number;
    channels: number;
    frame_duration: number;
  };
  features?: {
    mcp?: boolean;
    [key: string]: unknown;
  };
}

export interface ListenMessage {
  type: "listen";
  mode: ListenMode;
  state: ListenState;
  text?: string;
}

export interface TextMessage {
  type: "text";
  text: string;
  sessionId?: string;
}

export interface AbortMessage {
  type: "abort";
  reason?: string;
}

// ==================== 消息创建器 ====================

export function createHelloMessage(
  deviceId?: string,
  deviceName?: string,
  clientId?: string,
  token?: string
): HelloMessage {
  return {
    type: "hello",
    deviceId: deviceId || "unknown",
    deviceName: deviceName || "Desktop Client",
    clientId: clientId || "desktop",
    token,
    audio_params: {
      format: "opus",
      sample_rate: 16000,
      channels: 1,
      frame_duration: 60,
    },
  };
}

export function createListenMessage(
  state: ListenState,
  mode?: ListenMode,
  text?: string
): ListenMessage {
  return {
    type: "listen",
    mode: mode !== undefined ? mode : ListenMode.AUTO,
    state,
    text,
  };
}

export function createTextMessage(
  text: string,
  sessionId?: string
): TextMessage {
  return {
    type: "text",
    text,
    sessionId,
  };
}

export function createAbortMessage(reason?: string): AbortMessage {
  const msg: AbortMessage = {
    type: "abort",
  };
  if (reason) {
    msg.reason = reason;
  }
  return msg;
}
