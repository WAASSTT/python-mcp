/**
 * 应用主入口
 * 参考 server/test/js/app.js 重构的 TypeScript 版本
 */

import { configManager, type DeviceConfig } from "./config/manager";
import { getModernAudioPlayer } from "./core/audio/modern-player";
import { checkOpusLoaded } from "./core/audio/opus-codec";
import { AudioRecorder } from "./core/audio/recorder";
import { getMCPToolsManager } from "./core/mcp/tools";
import { getWebSocketHandler } from "./core/network/websocket";
import { getUIController } from "./ui/controller";
import { logger } from "./utils/logger";

export class App {
  // 核心实例
  private audioPlayer = getModernAudioPlayer();
  private audioRecorder: AudioRecorder | null = null;
  private websocketHandler = getWebSocketHandler();
  private mcpToolsManager = getMCPToolsManager();
  private uiController = getUIController();

  // 配置
  private deviceConfig: DeviceConfig;
  private otaUrl: string;

  // 状态
  private isConnected = false;
  private isRecording = false;

  constructor() {
    // 加载配置
    this.deviceConfig = configManager.loadDeviceConfig();
    const connectionConfig = configManager.loadConnectionConfig();
    this.otaUrl = connectionConfig.otaUrl;
  }

  /**
   * 初始化应用
   */
  public async initialize(): Promise<void> {
    logger.info("正在初始化应用...");

    // 初始化 UI 控制器
    this.setupUICallbacks();

    // 检查并加载 Opus 库
    const opusLoaded = await checkOpusLoaded();
    if (!opusLoaded) {
      logger.error("Opus库未加载，某些功能可能无法使用");
    }

    // 初始化音频播放器
    await this.audioPlayer.initialize();

    // 初始化录音器
    this.audioRecorder = new AudioRecorder();
    this.setupRecorderCallbacks();

    // 初始化 MCP 工具
    await this.mcpToolsManager.initialize();

    // 设置 WebSocket 回调
    this.setupWebSocketCallbacks();

    logger.success("应用初始化完成");
  }

  /**
   * 设置 UI 回调
   */
  private setupUICallbacks(): void {
    // UI 控制器本身会通过回调通知外部
    // 这里主要是设置一些默认行为
  }

  /**
   * 设置录音器回调
   */
  private setupRecorderCallbacks(): void {
    if (!this.audioRecorder) return;

    // 录音开始
    this.audioRecorder.onRecordingStart = () => {
      logger.info("录音已开始");
      this.isRecording = true;
      this.uiController.updateRecordingStatus(true);
    };

    // 录音停止
    this.audioRecorder.onRecordingStop = () => {
      logger.info("录音已停止");
      this.isRecording = false;
      this.uiController.updateRecordingStatus(false);
    };

    // 可视化更新
    this.audioRecorder.onVisualizerUpdate = (dataArray, volume) => {
      this.uiController.updateAudioVisualizer(dataArray, volume);
    };

    // 音频数据回调
    this.audioRecorder.onAudioData = (opusData) => {
      // 发送到服务器
      if (this.isConnected && this.websocketHandler.isConnected()) {
        this.websocketHandler.sendAudio(opusData);
      }
    };
  }

  /**
   * 设置 WebSocket 回调
   */
  private setupWebSocketCallbacks(): void {
    // 连接状态变化
    this.websocketHandler.onConnectionStateChange = (isConnected) => {
      this.isConnected = isConnected;
      const status = isConnected ? "connected" : "disconnected";
      this.uiController.updateConnectionStatus(status);

      if (!isConnected) {
        // 断开连接时，停止录音
        if (this.isRecording) {
          this.stopRecording();
        }
      }
    };

    // 会话状态变化
    this.websocketHandler.onSessionStateChange = (isSpeaking) => {
      this.uiController.updateSessionStatus(isSpeaking);

      // 服务器开始说话时，停止客户端录音
      if (isSpeaking && this.isRecording) {
        logger.info("服务器开始说话，停止录音");
        this.stopRecording();
      }
    };

    // 会话表情变化
    this.websocketHandler.onSessionEmotionChange = (emoji) => {
      this.uiController.updateSessionStatus(true, emoji);
    };

    // STT 消息
    this.websocketHandler.onSTTMessage = (message) => {
      if (message.text) {
        this.uiController.addMessage(message.text, true);
      }
    };

    // LLM 消息
    this.websocketHandler.onLLMMessage = (message) => {
      if (message.text) {
        // 移除表情后检查是否还有内容
        const textWithoutEmoji = message.text
          .replace(
            /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu,
            ""
          )
          .trim();
        if (textWithoutEmoji) {
          this.uiController.addMessage(message.text, false);
        }
      }
    };

    // MCP 消息
    this.websocketHandler.onMCPMessage = (message) => {
      this.handleMCPMessage(message);
    };
  }

  /**
   * 处理 MCP 消息
   */
  private handleMCPMessage(message: any): void {
    const payload = message.payload || {};

    if (payload.method === "tools/list") {
      // 返回工具列表
      const response = this.mcpToolsManager.generateToolsListResponse();
      this.websocketHandler.send({
        type: "mcp",
        payload: {
          jsonrpc: "2.0",
          id: payload.id,
          result: response,
        },
      });
    } else if (payload.method === "tools/call") {
      // 调用工具
      const params = payload.params || {};
      const result = this.mcpToolsManager.executeTool(
        params.name,
        params.arguments || {}
      );

      this.websocketHandler.send({
        type: "mcp",
        payload: {
          jsonrpc: "2.0",
          id: payload.id,
          result: {
            content: [
              {
                type: "text",
                text: JSON.stringify(result),
              },
            ],
          },
        },
      });
    }
  }

  /**
   * 连接到服务器
   */
  public async connect(): Promise<boolean> {
    logger.info("开始连接...");
    this.uiController.updateConnectionStatus("connecting");

    // 保存配置
    configManager.saveDeviceConfig(this.deviceConfig);
    configManager.saveConnectionConfig({ otaUrl: this.otaUrl });

    // 显示配置信息
    this.uiController.displayDeviceConfig(this.deviceConfig);
    this.uiController.displayConnectionInfo(this.otaUrl);

    // 连接 WebSocket
    const success = await this.websocketHandler.connect(
      this.otaUrl,
      this.deviceConfig
    );
    if (!success) {
      logger.error("连接失败");
      this.uiController.updateConnectionStatus("disconnected");
      return false;
    }

    // 等待连接建立
    await new Promise((resolve) => setTimeout(resolve, 500));

    // 发送 hello 握手
    const helloSuccess = await this.websocketHandler.sendHelloMessage(
      this.deviceConfig
    );
    if (!helloSuccess) {
      logger.warning("握手失败，但连接仍然建立");
    }

    return true;
  }

  /**
   * 断开连接
   */
  public disconnect(): void {
    logger.info("断开连接...");

    // 停止录音
    if (this.isRecording) {
      this.stopRecording();
    }

    // 断开 WebSocket
    this.websocketHandler.disconnect();
  }

  /**
   * 发送文本消息
   */
  public sendText(text: string): boolean {
    if (!text.trim()) {
      logger.warning("消息内容为空");
      return false;
    }

    if (!this.isConnected) {
      logger.error("未连接到服务器");
      return false;
    }

    logger.info(`发送文本: ${text}`);
    const success = this.websocketHandler.sendText(text);

    if (success) {
      this.uiController.addMessage(text, true);
    }

    return success;
  }

  /**
   * 开始录音
   */
  public async startRecording(): Promise<boolean> {
    if (!this.isConnected) {
      logger.error("未连接到服务器");
      return false;
    }

    if (this.isRecording) {
      logger.warning("已在录音中");
      return false;
    }

    if (!this.audioRecorder) {
      logger.error("录音器未初始化");
      return false;
    }

    try {
      await this.audioRecorder.startRecording();
      return true;
    } catch (error: any) {
      logger.error(`开始录音失败: ${error.message}`);
      return false;
    }
  }

  /**
   * 停止录音
   */
  public stopRecording(): void {
    if (!this.isRecording) {
      logger.warning("未在录音中");
      return;
    }

    if (this.audioRecorder) {
      this.audioRecorder.stopRecording();
    }
  }

  /**
   * 获取设备配置
   */
  public getDeviceConfig(): DeviceConfig {
    return { ...this.deviceConfig };
  }

  /**
   * 更新设备配置
   */
  public updateDeviceConfig(config: Partial<DeviceConfig>): void {
    this.deviceConfig = { ...this.deviceConfig, ...config };
    configManager.saveDeviceConfig(this.deviceConfig);
    logger.info("设备配置已更新");
  }

  /**
   * 获取 OTA URL
   */
  public getOTAUrl(): string {
    return this.otaUrl;
  }

  /**
   * 更新 OTA URL
   */
  public updateOTAUrl(url: string): void {
    this.otaUrl = url;
    configManager.saveConnectionConfig({ otaUrl: url });
    logger.info("OTA地址已更新");
  }

  /**
   * 获取连接状态
   */
  public getConnectionStatus(): boolean {
    return this.isConnected;
  }

  /**
   * 获取录音状态
   */
  public getRecordingStatus(): boolean {
    return this.isRecording;
  }

  /**
   * 获取 UI 控制器
   */
  public getUIController(): typeof this.uiController {
    return this.uiController;
  }

  /**
   * 获取 MCP 工具管理器
   */
  public getMCPToolsManager(): typeof this.mcpToolsManager {
    return this.mcpToolsManager;
  }

  /**   * 获取音频播放器
   */
  public getAudioPlayer() {
    return this.audioPlayer;
  }

  /**
   * 获取WebSocket处理器
   */
  public getWebSocketHandler() {
    return this.websocketHandler;
  }

  /**
   * 销毁应用
   */
  public destroy(): void {
    logger.info("销毁应用...");

    // 断开连接
    this.disconnect();

    // 销毁音频资源
    if (this.audioRecorder) {
      this.audioRecorder.destroy();
      this.audioRecorder = null;
    }

    this.audioPlayer.destroy();

    logger.success("应用已销毁");
  }
}

// 单例
let appInstance: App | null = null;

/**
 * 获取应用实例
 */
export function getApp(): App {
  if (!appInstance) {
    appInstance = new App();
  }
  return appInstance;
}

/**
 * 初始化并返回应用实例
 */
export async function initializeApp(): Promise<App> {
  const app = getApp();
  await app.initialize();
  return app;
}
