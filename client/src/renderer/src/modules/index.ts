/**
 * 库入口
 * 导出所有模块
 */

// 应用主入口
export { App, getApp, initializeApp } from "./app";

// 工具模块
export { BlockingQueue } from "./utils/blocking-queue";
export { logger, type LogEntry, type LogType } from "./utils/logger";

// 配置模块
export {
  configManager,
  type ConnectionConfig,
  type DeviceConfig,
} from "./config/manager";

// 音频模块
export {
  checkOpusLoaded,
  initOpusDecoder,
  initOpusEncoder,
  isOpusReady,
  type OpusDecoder,
  type OpusEncoder,
} from "./core/audio/opus-codec";
export { AudioPlayer, getAudioPlayer } from "./core/audio/player";
export {
  AudioRecorder,
  MediaRecorderOpusEncoder,
  type AudioDataCallback,
  type RecordingCallback,
  type VisualizerCallback,
} from "./core/audio/recorder";
export {
  createStreamingContext,
  StreamingContext,
} from "./core/audio/stream-context";

// 网络模块
export {
  webSocketConnect,
  type OTAResponse,
} from "./core/network/ota-connector";
export {
  getWebSocketHandler,
  WebSocketHandler,
  type ConnectionStateCallback,
  type MessageCallback,
  type SessionEmotionCallback,
  type SessionStateCallback,
} from "./core/network/websocket";

// MCP 模块
export {
  getMCPToolsManager,
  type MCPTool,
  type MCPToolProperty,
} from "./core/mcp/tools";

// UI 模块
export { getUIController, UIController } from "./ui/controller";
