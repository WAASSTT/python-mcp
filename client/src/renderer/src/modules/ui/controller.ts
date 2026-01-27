/**
 * UI 控制器
 * 用于管理 UI 状态和交互
 */

import type { DeviceConfig } from "../config/manager";
import { logger, type LogEntry } from "../utils/logger";

export type ConnectionStatusCallback = (
  status: "connected" | "disconnected" | "connecting"
) => void;
export type SessionStatusCallback = (
  isSpeaking: boolean,
  emotion?: string
) => void;
export type RecordingStatusCallback = (
  isRecording: boolean,
  duration?: number
) => void;
export type AudioVisualizerCallback = (
  dataArray: Uint8Array,
  volume: number
) => void;
export type MessageCallback = (message: string, isUser: boolean) => void;

export class UIController {
  // 回调函数
  public onConnectionStatusChange: ConnectionStatusCallback | null = null;
  public onSessionStatusChange: SessionStatusCallback | null = null;
  public onRecordingStatusChange: RecordingStatusCallback | null = null;
  public onAudioVisualizerUpdate: AudioVisualizerCallback | null = null;
  public onMessageReceived: MessageCallback | null = null;
  public onLogReceived: ((entry: LogEntry) => void) | null = null;

  constructor() {
    // 监听日志
    logger.onLog((entry) => {
      if (this.onLogReceived) {
        this.onLogReceived(entry);
      }
    });
  }

  /**
   * 更新连接状态
   */
  public updateConnectionStatus(
    status: "connected" | "disconnected" | "connecting"
  ): void {
    if (this.onConnectionStatusChange) {
      this.onConnectionStatusChange(status);
    }
  }

  /**
   * 更新会话状态
   */
  public updateSessionStatus(isSpeaking: boolean, emotion?: string): void {
    if (this.onSessionStatusChange) {
      this.onSessionStatusChange(isSpeaking, emotion);
    }
  }

  /**
   * 更新录音状态
   */
  public updateRecordingStatus(isRecording: boolean, duration?: number): void {
    if (this.onRecordingStatusChange) {
      this.onRecordingStatusChange(isRecording, duration);
    }
  }

  /**
   * 更新音频可视化
   */
  public updateAudioVisualizer(dataArray: Uint8Array, volume: number): void {
    if (this.onAudioVisualizerUpdate) {
      this.onAudioVisualizerUpdate(dataArray, volume);
    }
  }

  /**
   * 添加消息
   */
  public addMessage(message: string, isUser: boolean = false): void {
    if (this.onMessageReceived) {
      this.onMessageReceived(message, isUser);
    }
  }

  /**
   * 显示设备配置
   */
  public displayDeviceConfig(config: DeviceConfig): void {
    logger.info("设备配置:");
    logger.info(`  设备ID: ${config.deviceId}`);
    logger.info(`  设备名称: ${config.deviceName}`);
    logger.info(`  客户端ID: ${config.clientId}`);
  }

  /**
   * 显示连接信息
   */
  public displayConnectionInfo(otaUrl: string, wsUrl?: string): void {
    logger.info("连接信息:");
    logger.info(`  OTA地址: ${otaUrl}`);
    if (wsUrl) {
      logger.info(`  WebSocket地址: ${wsUrl}`);
    }
  }
}

// 单例
let uiControllerInstance: UIController | null = null;

/**
 * 获取 UI 控制器实例
 */
export function getUIController(): UIController {
  if (!uiControllerInstance) {
    uiControllerInstance = new UIController();
  }
  return uiControllerInstance;
}
