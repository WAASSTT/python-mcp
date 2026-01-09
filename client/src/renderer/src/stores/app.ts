/**
 * 应用状态管理
 * 使用 Pinia 管理全局状态
 * 与服务端 xiaozhi-esp32 协议完全对齐
 */

import {
  apiService,
  audioService,
  createAbortMessage,
  createHelloMessage,
  createListenMessage,
  ListenMode,
  ListenState,
  ServerMessageType,
  TTSState,
  wsService,
} from "@/services";
import { defineStore } from "pinia";
import { computed, ref } from "vue";

// ==================== 类型定义 ====================

export interface Message {
  id: string;
  type: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
  isAudio?: boolean;
}

export interface DeviceConfig {
  deviceId: string;
  deviceName: string;
  clientId: string;
  token: string;
}

// ==================== Store 定义 ====================

export const useAppStore = defineStore(
  "app",
  () => {
    // ==================== 设备配置 ====================
    const deviceConfig = ref<DeviceConfig>({
      deviceId: generateDeviceId(),
      deviceName: "Tauri Desktop Client",
      clientId: "tauri_desktop_client",
      token: "",
    });

    // ==================== 服务器地址 ====================
    const otaUrl = ref("http://127.0.0.1:30003/xiaozhi/ota/");
    const wsUrl = ref("");

    // ==================== 连接状态 ====================
    const isOTAConnected = ref(false);
    const isWSConnected = ref(false);
    const isSessionActive = ref(false);
    const isSpeaking = ref(false);
    const currentVolume = ref(0);
    const sessionId = ref("");

    // ==================== 重连控制 ====================
    const reconnectAttempts = ref(0);
    const maxReconnectAttempts = 5;
    const reconnectDelay = ref(3000);
    const reconnecting = ref(false);

    // ==================== 会话信息 ====================
    const sessionStatus = ref("离线");
    const sessionEmoji = ref("😶");

    // ==================== 消息和日志 ====================
    const messages = ref<Message[]>([]);
    const logs = ref<string[]>(["准备就绪，请连接服务器开始测试..."]);

    // ==================== 内部状态 ====================
    let messageHandlersSetup = false;
    let lastAudioLogTime = 0;
    const AUDIO_LOG_INTERVAL = 1000;

    // ==================== 计算属性 ====================
    const isConnected = computed(() => isWSConnected.value);

    // ==================== 工具函数 ====================

    function generateDeviceId(): string {
      const chars = "0123456789ABCDEF";
      const parts: string[] = [];
      for (let i = 0; i < 6; i++) {
        const idx1 = Math.floor(Math.random() * 16);
        const idx2 = Math.floor(Math.random() * 16);
        parts.push(chars[idx1]! + chars[idx2]!);
      }
      return parts.join(":");
    }

    function addLog(
      message: string,
      level: "info" | "error" | "success" | "warn" = "info"
    ): void {
      const timestamp = new Date().toLocaleTimeString();
      logs.value.push(`[${timestamp}] [${level.toUpperCase()}] ${message}`);
      console.log(`[${level.toUpperCase()}]`, message);
    }

    function addMessage(message: Omit<Message, "id" | "timestamp">): void {
      messages.value.push({
        ...message,
        id: `msg_${Date.now()}_${Math.random()}`,
        timestamp: Date.now(),
      });
    }

    // ==================== 连接管理 ====================

    async function connect(): Promise<void> {
      try {
        // 1. 获取 OTA 配置
        if (!wsUrl.value || !deviceConfig.value.token) {
          addLog("正在连接到 OTA 服务器...");
          const otaResponse = await apiService.getOTAConfig(otaUrl.value, {
            deviceId: deviceConfig.value.deviceId,
            deviceName: deviceConfig.value.deviceName,
            clientId: deviceConfig.value.clientId,
            token: deviceConfig.value.token,
          });

          // 调试：输出服务器响应
          console.log(
            "[OTA] 服务器响应:",
            JSON.stringify(otaResponse, null, 2)
          );

          // 验证响应格式（必须有 server_time 和 firmware）
          if (!otaResponse || typeof otaResponse !== "object") {
            throw new Error("OTA 响应格式错误：响应不是有效对象");
          }

          if (!otaResponse.server_time) {
            throw new Error("OTA 响应格式错误：缺少 server_time 字段");
          }

          if (!otaResponse.firmware) {
            throw new Error("OTA 响应格式错误：缺少 firmware 字段");
          }

          isOTAConnected.value = true;

          if (otaResponse.websocket) {
            wsUrl.value = otaResponse.websocket.url;
            if (otaResponse.websocket.token) {
              deviceConfig.value.token = otaResponse.websocket.token;
            }
            addLog("OTA 连接成功（WebSocket 模式）", "success");
            addLog(`WebSocket 地址: ${wsUrl.value}`);
          } else if (otaResponse.mqtt) {
            throw new Error("客户端暂不支持 MQTT 模式");
          } else {
            throw new Error("服务器未返回 WebSocket 配置");
          }
        }

        // 2. 连接 WebSocket
        await connectWebSocket();

        addLog("连接完成，可以开始对话了", "success");
      } catch (error) {
        addLog(`连接失败: ${error}`, "error");
        isOTAConnected.value = false;
        isWSConnected.value = false;
        throw error;
      }
    }

    async function connectWebSocket(): Promise<void> {
      addLog("正在连接到 WebSocket 服务器...");

      // 设置消息处理器（在连接前设置，确保能接收连接事件）
      if (!messageHandlersSetup) {
        setupMessageHandlers();
        messageHandlersSetup = true;
      }

      // 构建带参数的 WebSocket URL
      const wsUrlWithParams = new URL(wsUrl.value);
      wsUrlWithParams.searchParams.set(
        "device-id",
        deviceConfig.value.deviceId
      );
      wsUrlWithParams.searchParams.set(
        "client-id",
        deviceConfig.value.clientId
      );
      if (deviceConfig.value.token) {
        wsUrlWithParams.searchParams.set(
          "authorization",
          `Bearer ${deviceConfig.value.token}`
        );
      }

      await wsService.connect(wsUrlWithParams.toString());

      // 等待连接状态更新（最多等待 3 秒）
      const maxWaitTime = 3000;
      const startTime = Date.now();
      while (!isWSConnected.value && Date.now() - startTime < maxWaitTime) {
        await new Promise((resolve) => setTimeout(resolve, 50));
      }

      if (!isWSConnected.value) {
        throw new Error("WebSocket 连接超时");
      }
      addLog("WebSocket 连接成功", "success");

      // 等待连接稳定
      await new Promise((resolve) => setTimeout(resolve, 50));

      // 初始化音频服务
      if (!audioService.initialized) {
        await audioService.initialize();
      }

      // 重置会话状态
      isSessionActive.value = false;
      sessionStatus.value = "在线";
      sessionEmoji.value = "😊";

      // 发送 Hello 消息
      await sendHello();
    }

    async function disconnect(): Promise<void> {
      if (isSpeaking.value) {
        await stopRecording();
      }
      await wsService.disconnect();
      isWSConnected.value = false;
      isOTAConnected.value = false;
      isSessionActive.value = false;
      sessionStatus.value = "离线";
      sessionEmoji.value = "😶";
      sessionId.value = "";
      addLog("已断开连接");
    }

    // ==================== 消息处理器 ====================

    function setupMessageHandlers(): void {
      console.log("[App] 设置消息处理器...");

      // 1. 设置音频数据回调
      setupAudioCallbacks();

      // 2. 设置 WebSocket 连接状态回调
      setupConnectionCallback();

      // 3. 注册服务端消息处理器
      registerServerMessageHandlers();

      console.log("[App] 消息处理器设置完成");
    }

    function setupAudioCallbacks(): void {
      let sentCount = 0;
      console.log("[App] 🔧 设置音频数据回调...");

      audioService.onData((data) => {
        sentCount++;
        const now = Date.now();
        if (now - lastAudioLogTime >= AUDIO_LOG_INTERVAL || sentCount <= 5) {
          lastAudioLogTime = now;
          console.log(
            `[App] 🎵 准备发送音频数据 #${sentCount}:`,
            data.length,
            "bytes, WebSocket连接状态:",
            isWSConnected.value
          );
        }

        if (!isWSConnected.value) {
          console.error("[App] ❌ WebSocket 未连接，丢弃音频数据");
          return;
        }

        try {
          wsService.sendBinary(data);
          if (sentCount <= 5) {
            console.log(`[App] ✅ 音频数据 #${sentCount} 已发送`);
          }
        } catch (error) {
          console.error(`[App] ❌ 发送音频数据失败 #${sentCount}:`, error);
        }
      });

      console.log("[App] ✅ 音频回调设置完成");
    }

    function setupConnectionCallback(): void {
      wsService.onConnect((connected) => {
        console.log("[App] 连接状态变化:", connected);
        isWSConnected.value = connected;

        if (!connected) {
          handleDisconnection();
        } else {
          handleConnection();
        }
      });
    }

    function handleDisconnection(): void {
      isSessionActive.value = false;
      sessionStatus.value = "离线";
      sessionEmoji.value = "😶";

      if (isSpeaking.value) {
        stopRecording();
      }

      if (!reconnecting.value) {
        attemptReconnect();
      }
    }

    function handleConnection(): void {
      reconnectAttempts.value = 0;
      reconnecting.value = false;
    }

    function registerServerMessageHandlers(): void {
      // Hello 响应
      wsService.on(ServerMessageType.HELLO, (data) => {
        sessionId.value = (data.session_id as string) || "";
        addLog(`收到 Hello 响应: session_id=${sessionId.value}`, "success");

        if (data.audio_params) {
          addLog(`服务器音频参数: ${JSON.stringify(data.audio_params)}`);
        }
      });

      // STT 消息（语音识别结果）
      wsService.on(ServerMessageType.STT, (data) => {
        addLog(`语音识别: ${(data.text as string) || ""}`, "info");

        if (data.text) {
          addMessage({
            type: "user",
            content: data.text as string,
            isAudio: true,
          });
        }
      });

      // TTS 消息（语音合成状态）
      wsService.on(ServerMessageType.TTS, async (data) => {
        await handleTTSMessage(data);
      });

      // 音频数据（二进制）
      wsService.onAudio(async (audioData) => {
        try {
          console.log(
            "[App] 🔊 收到服务端音频数据:",
            audioData.length,
            "bytes, 前8字节:",
            Array.from(audioData.slice(0, 8))
          );

          // 检查是否是有效的 Opus 数据（简单检查大小）
          if (audioData.length < 10) {
            console.warn(
              "[App] ⚠️ 音频数据太小，可能不是有效的 TTS 数据，跳过播放"
            );
            return;
          }

          // TODO: 新服务待实现播放功能
          // await audioRecorderService.playOpusFrame(audioData);
        } catch (error) {
          console.error("[App] 播放音频失败:", error);
        }
      });

      // 错误消息
      wsService.on(ServerMessageType.ERROR, (data) => {
        addLog(`服务器错误: ${JSON.stringify(data)}`, "error");
      });

      // Pong 消息
      wsService.on(ServerMessageType.PONG, () => {
        // 心跳响应
      });

      // 通配符监听器（调试用）
      wsService.on("*", (data) => {
        if (data.type && !["ping", "pong", "audio"].includes(data.type)) {
          console.log("[App] 收到消息:", data.type, data);
        }
      });
    }

    async function handleTTSMessage(data: any): Promise<void> {
      switch (data.state) {
        case TTSState.START:
          if (isSpeaking.value) {
            await stopRecording();
          }
          addLog("AI 开始说话...", "info");
          sessionStatus.value = "播放中";
          sessionEmoji.value = "🔊";
          isSessionActive.value = true;
          break;

        case TTSState.SENTENCE_START:
          if (data.text) {
            addLog(`AI: ${data.text}`, "info");
            addMessage({
              type: "assistant",
              content: data.text,
              isAudio: true,
            });
          }
          break;

        case TTSState.STOP:
          addLog("AI 说话完成", "success");
          sessionStatus.value = "在线";
          sessionEmoji.value = "😊";
          isSessionActive.value = false;
          break;
      }
    }

    // ==================== 协议消息发送 ====================

    async function sendHello(): Promise<void> {
      const message = createHelloMessage(
        deviceConfig.value.deviceId,
        deviceConfig.value.deviceName,
        deviceConfig.value.clientId,
        deviceConfig.value.token
      );
      await wsService.send(message);
      addLog("发送 Hello 消息");
    }

    function sendListen(
      state: "start" | "stop" | "detect",
      mode: "auto" | "manual" | "realtime" = "auto",
      text?: string
    ): void {
      const stateMap: Record<string, ListenState> = {
        start: ListenState.START,
        stop: ListenState.STOP,
        detect: ListenState.DETECT,
      };

      const modeMap: Record<string, ListenMode> = {
        auto: ListenMode.AUTO,
        manual: ListenMode.MANUAL,
        realtime: ListenMode.REALTIME,
      };

      const message = createListenMessage(
        stateMap[state]!,
        modeMap[mode],
        text
      );

      wsService.send(message);
      addLog(`发送 Listen: state=${state}, mode=${mode}`);
    }

    async function sendAbort(reason?: string): Promise<void> {
      const message = createAbortMessage(reason);
      await wsService.send(message);
      addLog("发送 Abort 消息");
    }

    // ==================== 录音控制 ====================

    async function startRecording(): Promise<void> {
      if (!isWSConnected.value) {
        addLog("无法开始录音: WebSocket 未连接", "error");
        throw new Error("WebSocket 未连接");
      }

      if (isSpeaking.value) {
        console.warn("[App] 正在录音中，忽略重复请求");
        return;
      }

      isSpeaking.value = true;
      addLog("正在启动麦克风...", "info");

      try {
        let timeoutMs = 30000;
        try {
          const perm = await (navigator as any).permissions?.query?.({
            name: "microphone",
          });
          const state = perm?.state;
          if (state === "granted") timeoutMs = 15000;
          else if (state === "prompt") timeoutMs = 60000;
          else if (state === "denied") timeoutMs = 5000;
        } catch {
          // 忽略
        }

        // 发送 Listen Start 消息
        sendListen("start", "auto");

        // 启动录音
        const timeoutPromise = new Promise<void>((_, reject) => {
          setTimeout(
            () =>
              reject(
                new Error(`启动麦克风超时(${Math.round(timeoutMs / 1000)}秒)`)
              ),
            timeoutMs
          );
        });

        await Promise.race([audioService.startRecording(), timeoutPromise]);

        addLog("开始录音", "success");
      } catch (error) {
        isSpeaking.value = false;
        const errorMsg = error instanceof Error ? error.message : String(error);
        addLog(`启动麦克风失败: ${errorMsg}`, "error");
        throw error;
      }
    }

    async function stopRecording(): Promise<void> {
      sendListen("stop");

      audioService.stopRecording();
      isSpeaking.value = false;
      currentVolume.value = 0;

      // 添加音频消息到对话记录
      addMessage({
        id: Date.now().toString(),
        type: "user",
        content: "🎤 [语音消息]",
        timestamp: Date.now(),
        isAudio: true,
      });

      addLog("停止录音");
    }

    // ==================== 重连逻辑 ====================

    async function attemptReconnect(): Promise<void> {
      if (
        reconnecting.value ||
        reconnectAttempts.value >= maxReconnectAttempts
      ) {
        if (reconnectAttempts.value >= maxReconnectAttempts) {
          addLog("已达到最大重连次数", "error");
        }
        return;
      }

      if (isWSConnected.value) {
        return;
      }

      reconnecting.value = true;
      reconnectAttempts.value++;

      const delay =
        reconnectDelay.value * Math.pow(1.5, reconnectAttempts.value - 1);
      addLog(
        `${delay / 1000}秒后尝试第${reconnectAttempts.value}次重连...`,
        "warn"
      );

      setTimeout(async () => {
        if (isWSConnected.value) {
          reconnecting.value = false;
          return;
        }

        try {
          addLog(`开始第${reconnectAttempts.value}次重连...`, "info");
          await connectWebSocket();
          addLog("重连成功！", "success");
          reconnecting.value = false;
        } catch (error) {
          addLog(`重连失败: ${error}`, "error");
          reconnecting.value = false;

          if (reconnectAttempts.value < maxReconnectAttempts) {
            attemptReconnect();
          }
        }
      }, delay);
    }

    // ==================== 其他方法 ====================

    function clearMessages(): void {
      messages.value = [];
    }

    function clearLogs(): void {
      logs.value = [];
    }

    // ==================== 导出 ====================

    return {
      deviceConfig,
      otaUrl,
      wsUrl,
      isOTAConnected,
      isWSConnected,
      isSessionActive,
      isSpeaking,
      currentVolume,
      reconnecting,
      reconnectAttempts,
      sessionStatus,
      sessionEmoji,
      sessionId,
      messages,
      logs,
      isConnected,

      connect,
      disconnect,
      sendListen,
      sendAbort,
      startRecording,
      stopRecording,
      addLog,
      addMessage,
      clearMessages,
      clearLogs,
    };
  },
  {
    persist: {
      key: "app-store",
      pick: ["deviceConfig", "otaUrl"],
    },
  }
);
