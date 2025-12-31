/**
 * 应用状态管理
 * 使用 Pinia 管理全局状态
 */

import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { apiService } from '../services/api';
import { audioService } from '../services/audio';
import { wsService } from '../services/websocket';

export interface Message {
  id: string;
  type: 'user' | 'assistant' | 'system';
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

export const useAppStore = defineStore(
  'app',
  () => {
    // 设备配置
    const deviceConfig = ref<DeviceConfig>({
      deviceId: generateDeviceId(),
      deviceName: 'Web测试设备',
      clientId: 'web_test_client',
      token: '',
    });

    // OTA 服务器地址
    const otaUrl = ref('http://127.0.0.1:30003/xiaozhi/ota/');

    // WebSocket 服务器地址
    const wsUrl = ref('');

    // 连接状态
    const isOTAConnected = ref(false);
    const isWSConnected = ref(false);
    const isSessionActive = ref(false);

    // 会话信息
    const sessionStatus = ref('离线');
    const sessionEmoji = ref('😶');

    // 消息列表
    const messages = ref<Message[]>([]);

    // 日志列表
    const logs = ref<string[]>(['准备就绪，请连接服务器开始测试...']);

    // 计算属性：是否已连接
    const isConnected = computed(() => isWSConnected.value);

    /**
     * 生成设备 ID
     */
    function generateDeviceId(): string {
      // 生成类似 MAC 地址的设备 ID
      const chars = '0123456789ABCDEF';
      const parts = [];
      for (let i = 0; i < 6; i++) {
        const idx1 = Math.floor(Math.random() * 16);
        const idx2 = Math.floor(Math.random() * 16);
        parts.push(chars[idx1]! + chars[idx2]!);
      }
      return parts.join(':');
    }

    /**
     * 添加日志
     */
    function addLog(message: string, level: 'info' | 'error' | 'success' | 'warn' = 'info'): void {
      const timestamp = new Date().toLocaleTimeString();
      logs.value.push(`[${timestamp}] [${level.toUpperCase()}] ${message}`);
      console.log(`[${level.toUpperCase()}]`, message);
    }

    /**
     * 添加消息
     */
    function addMessage(message: Omit<Message, 'id' | 'timestamp'>): void {
      messages.value.push({
        ...message,
        id: `msg_${Date.now()}_${Math.random()}`,
        timestamp: Date.now(),
      });
    }

    /**
     * 连接到服务器
     */
    async function connect(): Promise<void> {
      try {
        addLog('正在连接到 OTA 服务器...');

        // 1. 获取 OTA 配置
        apiService.setBaseUrl(otaUrl.value);
        const otaResponse = await apiService.getOTAConfig(
          deviceConfig.value.deviceId,
          deviceConfig.value.clientId,
          deviceConfig.value.deviceName || 'web-client',
          '1.0.0', // 设备版本
          deviceConfig.value.token
        );

        // 服务器端直接返回配置对象，没有 code 字段
        if (!otaResponse.server_time || !otaResponse.firmware) {
          throw new Error('OTA 响应格式错误');
        }

        isOTAConnected.value = true;

        // 优先使用 websocket 配置，如果没有则使用 mqtt
        if (otaResponse.websocket) {
          wsUrl.value = otaResponse.websocket.url;
          // 如果服务器返回了 token，则更新配置中的 token
          if (otaResponse.websocket.token) {
            deviceConfig.value.token = otaResponse.websocket.token;
          }
          addLog('OTA 连接成功（WebSocket 模式）', 'success');
          addLog(`WebSocket 地址: ${wsUrl.value}`);
          addLog(`固件版本: ${otaResponse.firmware.version}`);

          // 如果有固件更新
          if (otaResponse.firmware.url) {
            addLog(`固件更新可用: ${otaResponse.firmware.url}`, 'warn');
          }
        } else if (otaResponse.mqtt) {
          addLog('OTA 连接成功（MQTT 模式）', 'success');
          addLog(`MQTT 端点: ${otaResponse.mqtt.endpoint}`, 'warn');
          throw new Error('Web 客户端暂不支持 MQTT 模式，请配置 WebSocket');
        } else {
          throw new Error('服务器未返回 WebSocket 或 MQTT 配置');
        }

        // 2. 连接 WebSocket
        addLog('正在连接到 WebSocket 服务器...');
        await wsService.connect(wsUrl.value, deviceConfig.value.deviceId, deviceConfig.value.token);

        isWSConnected.value = true;
        addLog('WebSocket 连接成功', 'success');

        // 3. 初始化音频服务
        await audioService.initialize({
          sampleRate: 16000,
          channels: 1,
          frameDuration: 60,
        });

        // 4. 注册消息处理器
        setupMessageHandlers();

        // 5. 设置初始会话状态为在线
        isSessionActive.value = false;
        sessionStatus.value = '在线';
        sessionEmoji.value = '😊';
        addLog('会话已就绪', 'success');

        // 5. 发送 hello 消息
        sendHello();

        addLog('连接完成，可以开始对话了', 'success');
      } catch (error) {
        addLog(`连接失败: ${error}`, 'error');
        isOTAConnected.value = false;
        isWSConnected.value = false;
        throw error;
      }
    }

    /**
     * 断开连接
     */
    function disconnect(): void {
      wsService.disconnect();
      audioService.destroy();
      isOTAConnected.value = false;
      isWSConnected.value = false;
      isSessionActive.value = false;
      sessionStatus.value = '离线';
      sessionEmoji.value = '😶';
      addLog('已断开连接');
    }

    /**
     * 设置消息处理器
     */
    function setupMessageHandlers(): void {
      // 监听连接状态变化
      wsService.onConnect(connected => {
        isWSConnected.value = connected;
        if (!connected) {
          isSessionActive.value = false;
          sessionStatus.value = '离线';
          sessionEmoji.value = '😶';
        }
      });

      // 处理 welcome/xiaozhi 消息（服务器的欢迎消息）
      wsService.on('xiaozhi', data => {
        addLog(`收到服务器欢迎消息: session_id=${data.session_id || 'unknown'}`, 'success');
        if (data.session_id) {
          addLog(`会话 ID: ${data.session_id}`);
        }
      });

      // 处理会话状态消息
      wsService.on('llm.session', data => {
        if (data.status === 'thinking') {
          isSessionActive.value = true;
          sessionStatus.value = '思考中';
          sessionEmoji.value = '🤔';
        } else if (data.status === 'responding') {
          isSessionActive.value = true;
          sessionStatus.value = '回复中';
          sessionEmoji.value = '💬';
        } else if (data.status === 'idle') {
          isSessionActive.value = false;
          sessionStatus.value = '在线';
          sessionEmoji.value = '😊';
        }
      });

      // 处理文本消息
      wsService.on('text', data => {
        addLog(`收到text消息: ${JSON.stringify(data)}`);
        if (data.content) {
          addMessage({
            type: 'assistant',
            content: data.content,
            isAudio: false,
          });
        }
      });

      // 监听服务器错误消息
      wsService.on('error', data => {
        addLog(`服务器错误: ${JSON.stringify(data)}`, 'error');
      });

      // 添加通配符监听器来记录所有消息
      wsService.on('*', data => {
        if (data.type && !['ping', 'pong'].includes(data.type)) {
          addLog(
            `收到消息类型: ${data.type}, 数据: ${JSON.stringify(data).substring(0, 100)}`,
            'info'
          );
        }
      });

      // 处理音频消息
      wsService.on('audio', async data => {
        if (data.data) {
          await audioService.playAudio(data.data as ArrayBuffer);
        }
      });

      // 处理 pong 消息
      wsService.on('pong', () => {
        addLog('收到心跳响应');
      });
    }

    /**
     * 发送 hello 消息
     */
    function sendHello(): void {
      wsService.send({
        type: 'hello',
        xiaozhi: {
          type: 'hello',
          version: 1,
          transport: '30000websocket',
          audio_params: {
            format: 'opus',
            sample_rate: 16000,
            channels: 1,
            frame_duration: 60,
          },
        },
      });
      addLog('发送 hello 消息');
    }

    /**
     * 发送文本消息
     */
    function sendTextMessage(text: string): void {
      if (!isConnected.value) {
        addLog('未连接到服务器', 'error');
        return;
      }

      wsService.send({
        type: 'text',
        text: text,
      });

      addMessage({
        type: 'user',
        content: text,
        isAudio: false,
      });

      addLog(`发送文本消息: ${text}`);
    }

    /**
     * 开始录音
     */
    async function startRecording(): Promise<void> {
      try {
        await audioService.startRecording();

        // 设置音频数据回调
        audioService.onData(data => {
          wsService.sendBinary(data);
        });

        addLog('开始录音，准备发送音频数据');
      } catch (error) {
        addLog(`开始录音失败: ${error}`, 'error');
        throw error;
      }
    }

    /**
     * 停止录音
     */
    async function stopRecording(): Promise<void> {
      audioService.stopRecording();

      addMessage({
        type: 'user',
        content: '[语音消息]',
        isAudio: true,
      });

      addLog('停止录音，音频数据发送完毕');
    }

    /**
     * 清空消息
     */
    function clearMessages(): void {
      messages.value = [];
    }

    /**
     * 清空日志
     */
    function clearLogs(): void {
      logs.value = [];
    }

    return {
      // 状态
      deviceConfig,
      otaUrl,
      wsUrl,
      isOTAConnected,
      isWSConnected,
      isSessionActive,
      sessionStatus,
      sessionEmoji,
      messages,
      logs,
      isConnected,

      // 方法
      connect,
      disconnect,
      sendTextMessage,
      startRecording,
      stopRecording,
      addLog,
      addMessage,
      clearMessages,
      clearLogs,
    };
  },
  {
    persist: true,
  }
);
