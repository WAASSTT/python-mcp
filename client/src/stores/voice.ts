/**
 * 语音助手状态管理
 */

import {
  ConnectionStatus,
  RecordingStatus,
  type ChatMessage,
  type DeviceInfo,
  type WSMessage,
} from "@/types";
import { AudioRecorder } from "@/utils/audio";
import { WebSocketManager } from "@/utils/websocket";
import { defineStore } from "pinia";
import { computed, ref } from "vue";

export const useVoiceStore = defineStore(
  "voice",
  () => {
    // ========== 状态 ==========
    const wsManager = ref<WebSocketManager | null>(null);
    const audioRecorder = ref<AudioRecorder | null>(null);

    // 连接状态
    const connectionStatus = ref<ConnectionStatus>(ConnectionStatus.DISCONNECTED);
    const recordingStatus = ref<RecordingStatus>(RecordingStatus.IDLE);

    // WebSocket 配置
    const wsUrl = ref("ws://localhost:8000/ws");
    const clientId = ref(crypto.randomUUID());
    const deviceId = ref("web-client-" + crypto.randomUUID().substring(0, 8));
    const deviceInfo = ref<DeviceInfo>({
      deviceModel: "Web Client",
      userAgent: navigator.userAgent,
      screenResolution: `${window.screen.width}x${window.screen.height}`,
    });

    // 消息相关
    const messages = ref<ChatMessage[]>([]);
    const sessionId = ref<string>("");
    const currentInput = ref("");

    // ASR 实时结果
    const asrText = ref("");
    const asrFinal = ref("");

    // LLM 流式响应
    const llmStreaming = ref(false);
    const llmStreamText = ref("");

    // TTS 音频播放
    const audioQueue = ref<ArrayBuffer[]>([]);
    const isPlayingAudio = ref(false);

    // 错误状态
    const lastError = ref<string | null>(null);

    // ========== 计算属性 ==========
    const isConnected = computed(() => connectionStatus.value === ConnectionStatus.CONNECTED);

    const isRecording = computed(() => recordingStatus.value === RecordingStatus.RECORDING);

    const canRecord = computed(
      () => isConnected.value && recordingStatus.value === RecordingStatus.IDLE,
    );

    // ========== 连接管理 ==========
    function initWebSocket() {
      if (wsManager.value) {
        return;
      }

      wsManager.value = new WebSocketManager({
        url: wsUrl.value,
        clientId: clientId.value,
        deviceId: deviceId.value,
        reconnectInterval: 3000,
        maxReconnectAttempts: 5,
        heartbeatInterval: 30000,
      });

      // 监听连接状态变化
      wsManager.value.onConnectionChange((status) => {
        connectionStatus.value = status;
        console.log("[Store] 连接状态:", status);
      });

      // 监听消息
      wsManager.value.onMessage(handleWSMessage);
    }

    async function connect() {
      if (!wsManager.value) {
        initWebSocket();
      }

      try {
        await wsManager.value!.connect(deviceInfo.value);
        console.log("[Store] 连接成功");
      } catch (error) {
        console.error("[Store] 连接失败:", error);
        throw error;
      }
    }

    function disconnect() {
      if (wsManager.value) {
        wsManager.value.disconnect();
      }

      if (audioRecorder.value) {
        audioRecorder.value.destroy();
        audioRecorder.value = null;
      }

      // 清空状态
      messages.value = [];
      sessionId.value = "";
      asrText.value = "";
      asrFinal.value = "";
      llmStreaming.value = false;
      llmStreamText.value = "";
      audioQueue.value = [];
      isPlayingAudio.value = false;
      lastError.value = null;
    }

    // ========== 消息处理 ==========
    function handleWSMessage(message: WSMessage) {
      console.log("[Store] 收到消息:", message);

      switch (message.type) {
        case "hello":
          handleHello(message);
          break;
        case "stt":
          handleSTTResult(message);
          break;
        case "llm":
          handleLLMResponse(message);
          break;
        case "tts":
          handleTTSMessage(message);
          break;
        case "error":
          handleError(message);
          break;
        default:
          console.log("[Store] 未处理的消息类型:", message.type);
      }
    }

    function handleHello(message: WSMessage) {
      // 从服务器接收 session_id
      if (message.session_id) {
        sessionId.value = message.session_id;
        console.log("[Store] 握手成功, session_id:", sessionId.value);
      }
    }

    function handleSTTResult(message: WSMessage) {
      const { text } = message.data || {};

      // STT 结果总是最终结果
      if (text) {
        asrFinal.value = text;
        asrText.value = "";
        addMessage("user", text);
      }
    }

    function handleLLMResponse(message: WSMessage) {
      const { text, finished, state } = message.data || {};

      if (state === "start") {
        // LLM 开始响应
        llmStreaming.value = true;
        llmStreamText.value = "";
        console.log("[Store] LLM 开始生成");
      } else if (finished || state === "end") {
        // LLM 完成，添加助手回复
        llmStreaming.value = false;
        const finalText = text || llmStreamText.value;
        if (finalText) {
          addMessage("assistant", finalText);
        }
        llmStreamText.value = "";
      } else if (text) {
        // 流式响应，实时累加显示
        llmStreamText.value += text;
      }
    }

    function handleTTSMessage(message: WSMessage) {
      const { state } = message.data || {};

      if (state === "start") {
        console.log("[Store] TTS 开始播放");
      } else if (state === "end") {
        console.log("[Store] TTS 结束");
      }

      // 如果是二进制音频数据（在 WebSocket 处理中已经处理）
      if (message.data instanceof ArrayBuffer) {
        audioQueue.value.push(message.data);

        // 如果没在播放，开始播放
        if (!isPlayingAudio.value) {
          playNextAudio();
        }
      }
    }

    function handleError(message: WSMessage) {
      const error = message.data?.error || "未知错误";
      lastError.value = error;
      console.error("[Store] 服务器错误:", error);

      // 3秒后清除错误
      setTimeout(() => {
        lastError.value = null;
      }, 3000);
    }

    // ========== 消息管理 ==========
    function addMessage(role: "user" | "assistant" | "system", content: string) {
      messages.value.push({
        role,
        content,
        timestamp: new Date(),
      });
    }

    function clearMessages() {
      messages.value = [];
    }

    function sendTextMessage(text: string) {
      if (!wsManager.value || !isConnected.value) {
        console.warn("[Store] 未连接，无法发送消息");
        lastError.value = "请先连接到服务器";
        setTimeout(() => (lastError.value = null), 3000);
        return;
      }

      const trimmedText = text.trim();
      if (!trimmedText) {
        return;
      }

      try {
        wsManager.value.sendText(trimmedText, sessionId.value);
        addMessage("user", trimmedText);
        currentInput.value = ""; // 清空输入
      } catch (error) {
        console.error("[Store] 发送消息失败:", error);
        lastError.value = "发送消息失败";
        setTimeout(() => (lastError.value = null), 3000);
      }
    }

    // ========== 音频录制 ==========
    async function initAudioRecorder() {
      if (audioRecorder.value) {
        return;
      }

      audioRecorder.value = new AudioRecorder({
        sampleRate: 16000,
        channels: 1,
        bitDepth: 16,
        bufferSize: 4096,
      });

      await audioRecorder.value.init();

      // 监听录音状态变化
      audioRecorder.value.onStatusChange((status) => {
        recordingStatus.value = status;
        console.log("[Store] 录音状态:", status);
      });

      // 监听音频数据
      audioRecorder.value.onAudioData((audioData) => {
        // 发送音频数据到服务器
        if (wsManager.value && isConnected.value) {
          wsManager.value.sendBinary(audioData);
        }
      });
    }

    async function startRecording() {
      if (!isConnected.value) {
        throw new Error("未连接到服务器");
      }

      if (!audioRecorder.value) {
        await initAudioRecorder();
      }

      await audioRecorder.value!.start();
      asrText.value = "";
      asrFinal.value = "";
    }

    function stopRecording() {
      if (audioRecorder.value) {
        audioRecorder.value.stop();
      }
    }

    // ========== 音频播放 ==========
    async function playNextAudio() {
      if (audioQueue.value.length === 0) {
        isPlayingAudio.value = false;
        return;
      }

      isPlayingAudio.value = true;
      const audioData = audioQueue.value.shift()!;

      try {
        await playAudioBuffer(audioData);
      } catch (error) {
        console.error("[Store] 音频播放失败:", error);
      }

      // 播放下一个
      playNextAudio();
    }

    async function playAudioBuffer(audioData: ArrayBuffer): Promise<void> {
      return new Promise((resolve, reject) => {
        try {
          const audioContext = new AudioContext({ sampleRate: 24000 });

          // 将 PCM Int16 数据转换为 Float32
          const int16Array = new Int16Array(audioData);
          const float32Array = new Float32Array(int16Array.length);
          for (let i = 0; i < int16Array.length; i++) {
            float32Array[i] = (int16Array[i] ?? 0) / 32768.0; // 转换为 -1.0 到 1.0
          }

          // 创建 AudioBuffer
          const audioBuffer = audioContext.createBuffer(
            1, // 单声道
            float32Array.length,
            24000, // 采样率
          );
          audioBuffer.getChannelData(0).set(float32Array);

          const source = audioContext.createBufferSource();
          source.buffer = audioBuffer;
          source.connect(audioContext.destination);

          source.onended = () => {
            audioContext.close();
            resolve();
          };

          source.start(0);
        } catch (error) {
          console.error("[Store] 播放音频失败:", error);
          reject(error);
        }
      });
    }

    function stopAudio() {
      audioQueue.value = [];
      isPlayingAudio.value = false;
    }

    // ========== 导出 ==========
    return {
      // 状态
      connectionStatus,
      recordingStatus,
      wsUrl,
      clientId,
      deviceId,
      deviceInfo,
      messages,
      sessionId,
      currentInput,
      asrText,
      asrFinal,
      llmStreaming,
      llmStreamText,
      isPlayingAudio,
      lastError,

      // 计算属性
      isConnected,
      isRecording,
      canRecord,

      // 连接管理
      connect,
      disconnect,

      // 消息管理
      addMessage,
      clearMessages,
      sendTextMessage,

      // 音频录制
      startRecording,
      stopRecording,

      // 音频播放
      stopAudio,
    };
  },
  {
    persist: {
      key: "voice-store",
      storage: localStorage,
      pick: ["wsUrl"], // 只持久化 wsUrl,不持久化 messages/clientId/deviceId
    },
  },
);
