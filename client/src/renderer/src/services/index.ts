/**
 * 服务统一入口
 */

export { apiService, type DeviceConfig, type OTAResponse } from "./api";
export { audioService } from "./audio";
export {
  createAbortMessage,
  createHelloMessage,
  createListenMessage,
  createTextMessage,
  ListenMode,
  ListenState,
  ServerMessageType,
  TTSState,
  type AbortMessage,
  type HelloMessage,
  type ListenMessage,
  type TextMessage,
} from "./protocol";
export {
  wsService,
  type AudioHandler,
  type MessageData,
  type MessageHandler,
} from "./websocket";
