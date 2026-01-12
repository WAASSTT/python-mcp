/**
 * 应用状态管理 - 基于新 modules 的适配器
 */

import { initializeApp, type App } from "@/modules";
import { defineStore } from "pinia";
import { computed, ref } from "vue";

export const useAppStore = defineStore("app", () => {
  // 应用实例
  let app: App | null = null;

  // 状态
  const isConnected = ref(false);
  const isSpeaking = ref(false);
  const isRecording = ref(false);
  const currentVolume = ref(0);
  const currentEmotion = ref("😶");
  const messages = ref<
    Array<{ text: string; isUser: boolean; timestamp: Date }>
  >([]);
  const logs = ref<string[]>([]);

  // 配置
  const deviceId = ref("");
  const deviceName = ref("Electron Desktop Client");
  const clientId = ref("electron_desktop_client");
  const token = ref("");
  const otaUrl = ref("http://127.0.0.1:30003/xiaozhi/ota/");

  // 计算属性
  const connectionStatus = computed(() => {
    if (isConnected.value) return "connected";
    return "disconnected";
  });

  /**
   * 初始化应用
   */
  async function initialize() {
    if (app) {
      console.log("[AppStore] 应用已初始化");
      return;
    }

    console.log("[AppStore] 开始初始化应用...");

    // 初始化 app
    app = await initializeApp();

    // 获取配置
    const config = app.getDeviceConfig();
    deviceId.value = config.deviceId;
    deviceName.value = config.deviceName;
    clientId.value = config.clientId;
    token.value = config.token || "";
    otaUrl.value = app.getOTAUrl();

    // 设置回调
    const uiController = app.getUIController();

    // 连接状态
    uiController.onConnectionStatusChange = (status) => {
      isConnected.value = status === "connected";
      console.log("[AppStore] 连接状态变化:", status);
    };

    // 会话状态
    uiController.onSessionStatusChange = (speaking, emotion) => {
      isSpeaking.value = speaking;
      if (emotion) {
        currentEmotion.value = emotion;
      }
      console.log("[AppStore] 会话状态变化:", { speaking, emotion });
    };

    // 录音状态
    uiController.onRecordingStatusChange = (recording) => {
      isRecording.value = recording;
      console.log("[AppStore] 录音状态变化:", recording);
    };

    // 音频可视化
    uiController.onAudioVisualizerUpdate = (_dataArray, volume) => {
      currentVolume.value = volume;
    };

    // 消息接收
    uiController.onMessageReceived = (message, isUser) => {
      messages.value.push({
        text: message,
        isUser,
        timestamp: new Date(),
      });
      console.log("[AppStore] 收到消息:", { message, isUser });
    };

    // 日志接收
    uiController.onLogReceived = (entry) => {
      const timestamp = entry.timestamp.toLocaleTimeString();
      logs.value.push(`[${timestamp}] [${entry.type}] ${entry.message}`);
      // 限制日志数量
      if (logs.value.length > 100) {
        logs.value.shift();
      }
    };

    console.log("[AppStore] 应用初始化完成");
  }

  /**
   * 连接到服务器
   */
  async function connect() {
    if (!app) {
      throw new Error("应用未初始化");
    }

    console.log("[AppStore] 开始连接服务器...");

    // 更新配置
    app.updateDeviceConfig({
      deviceId: deviceId.value,
      deviceName: deviceName.value,
      clientId: clientId.value,
      token: token.value,
    });
    app.updateOTAUrl(otaUrl.value);

    // 连接
    const success = await app.connect();
    if (!success) {
      throw new Error("连接失败");
    }

    console.log("[AppStore] 连接成功");
  }

  /**
   * 断开连接
   */
  function disconnect() {
    if (!app) return;
    app.disconnect();
    console.log("[AppStore] 已断开连接");
  }

  /**
   * 发送文本消息
   */
  function sendText(text: string) {
    if (!app) {
      throw new Error("应用未初始化");
    }
    return app.sendText(text);
  }

  /**
   * 开始录音
   */
  async function startRecording() {
    if (!app) {
      throw new Error("应用未初始化");
    }

    console.log("[AppStore] 开始录音...");
    const success = await app.startRecording();
    if (!success) {
      throw new Error("开始录音失败");
    }
    console.log("[AppStore] 录音已开始");
  }

  /**
   * 停止录音
   */
  async function stopRecording() {
    if (!app) {
      throw new Error("应用未初始化");
    }

    console.log("[AppStore] 停止录音...");
    app.stopRecording();
    console.log("[AppStore] 录音已停止");
  }

  /**
   * 打断播放并开始录音
   */
  async function interruptAndStartRecording() {
    if (!app) {
      throw new Error("应用未初始化");
    }

    console.log("[AppStore] 打断播放并开始录音...");

    // 发送中止消息到服务器
    const websocketHandler = app.getWebSocketHandler();
    websocketHandler.sendAbort();

    // 停止并清空音频播放
    const audioPlayer = app.getAudioPlayer();
    audioPlayer.stop();

    // 更新状态
    isSpeaking.value = false;

    // 开始录音
    const success = await app.startRecording();
    if (!success) {
      throw new Error("开始录音失败");
    }
    console.log("[AppStore] 已打断播放并开始录音");
  }

  /**
   * 更新设备配置
   */
  function updateDeviceConfig(
    config: Partial<{
      deviceId: string;
      deviceName: string;
      clientId: string;
      token: string;
    }>
  ) {
    if (config.deviceId !== undefined) deviceId.value = config.deviceId;
    if (config.deviceName !== undefined) deviceName.value = config.deviceName;
    if (config.clientId !== undefined) clientId.value = config.clientId;
    if (config.token !== undefined) token.value = config.token;

    if (app) {
      app.updateDeviceConfig({
        deviceId: deviceId.value,
        deviceName: deviceName.value,
        clientId: clientId.value,
        token: token.value,
      });
    }
  }

  /**
   * 更新 OTA URL
   */
  function updateOTAUrl(url: string) {
    otaUrl.value = url;
    if (app) {
      app.updateOTAUrl(url);
    }
  }

  /**
   * 获取 MCP 工具管理器
   */
  function getMCPManager() {
    return app?.getMCPToolsManager();
  }

  /**
   * 销毁应用
   */
  function destroy() {
    if (app) {
      app.destroy();
      app = null;
    }
  }

  return {
    // 状态
    isConnected,
    isSpeaking,
    isRecording,
    currentVolume,
    currentEmotion,
    messages,
    logs,
    connectionStatus,

    // 配置
    deviceId,
    deviceName,
    clientId,
    token,
    otaUrl,

    // 方法
    initialize,
    connect,
    disconnect,
    sendText,
    startRecording,
    stopRecording,
    interruptAndStartRecording,
    updateDeviceConfig,
    updateOTAUrl,
    getMCPManager,
    destroy,
  };
});
