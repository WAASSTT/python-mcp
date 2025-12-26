<template>
  <div class="voice-assistant">
    <div class="container">
      <!-- 顶部标题区 -->
      <div class="header">
        <div class="header-content">
          <h1 class="title">
            <span class="title-icon">🎙️</span>
            <span>AI 语音助手</span>
          </h1>
          <n-tag :type="connectionTagType" size="large" class="status-tag" round>
            <template #icon>
              <span class="status-dot" :class="{ 'status-dot-active': store.isConnected }"></span>
            </template>
            {{ connectionStatusText }}
          </n-tag>
        </div>
      </div>

      <n-space vertical :size="24" class="main-content">
        <!-- 连接卡片 -->
        <n-card class="glass-card connection-card" :bordered="false">
          <n-space vertical :size="16">
            <n-input-group>
              <n-input
                v-model:value="store.wsUrl"
                placeholder="输入 WebSocket 服务器地址..."
                :disabled="store.isConnected"
                size="large"
                class="ws-input"
              >
                <template #prefix>
                  <n-icon :component="LinkIcon" size="20" />
                </template>
              </n-input>
              <n-button
                :type="store.isConnected ? 'error' : 'primary'"
                :loading="isConnecting"
                :disabled="isConnecting"
                @click="toggleConnection"
                size="large"
                class="connect-btn"
              >
                <template #icon>
                  <n-icon :component="store.isConnected ? DisconnectIcon : ConnectIcon" />
                </template>
                {{ store.isConnected ? '断开连接' : '连接服务器' }}
              </n-button>
            </n-input-group>

            <!-- 设备信息 -->
            <n-collapse arrow-placement="right" :default-expanded-names="[]">
              <n-collapse-item title="⚙️ 连接配置" name="config">
                <n-space vertical :size="12">
                  <n-form-item label="设备 ID" label-placement="left">
                    <n-input
                      v-model:value="store.deviceId"
                      placeholder="设备唯一标识"
                      :disabled="store.isConnected"
                      size="small"
                    >
                      <template #prefix>
                        <span>📱</span>
                      </template>
                    </n-input>
                  </n-form-item>
                  <n-form-item label="客户端 ID" label-placement="left">
                    <n-input
                      v-model:value="store.clientId"
                      placeholder="客户端唯一标识"
                      :disabled="store.isConnected"
                      size="small"
                      readonly
                    >
                      <template #prefix>
                        <span>🆔</span>
                      </template>
                    </n-input>
                  </n-form-item>
                </n-space>
              </n-collapse-item>
            </n-collapse>

            <!-- 实时 ASR 显示 -->
            <transition name="slide-fade">
              <n-alert
                v-if="store.asrText || store.asrFinal"
                type="info"
                class="asr-alert"
                closable
              >
                <template #icon>
                  <span class="asr-icon">🎵</span>
                </template>
                <template #header>
                  <span class="asr-header">实时语音识别</span>
                </template>
                <div v-if="store.asrFinal" class="asr-final">{{ store.asrFinal }}</div>
                <div v-if="store.asrText" class="asr-interim">
                  {{ store.asrText }} <span class="typing-cursor">|</span>
                </div>
              </n-alert>
            </transition>

            <!-- 错误提示 -->
            <transition name="slide-fade">
              <n-alert
                v-if="store.lastError"
                type="error"
                closable
                @close="store.lastError = null"
                class="error-alert"
              >
                <template #icon>
                  <span>⚠️</span>
                </template>
                {{ store.lastError }}
              </n-alert>
            </transition>

            <!-- 重连提示 -->
            <transition name="slide-fade">
              <n-alert
                v-if="store.connectionStatus === 'reconnecting'"
                type="warning"
                class="reconnect-alert"
              >
                <template #icon>
                  <span class="reconnect-icon">🔄</span>
                </template>
                <template #header>
                  <div class="reconnect-header">
                    <span>正在重新连接...</span>
                    <n-button size="tiny" quaternary @click="stopReconnect"> 停止重连 </n-button>
                  </div>
                </template>
                <div class="reconnect-info">
                  连接已断开，正在尝试自动重连。如果持续失败，请检查服务器是否正常运行。
                </div>
              </n-alert>
            </transition>
          </n-space>
        </n-card>

        <!-- 消息列表 -->
        <n-card class="glass-card messages-card" :bordered="false">
          <template #header>
            <div class="messages-header">
              <span class="messages-title">
                <span class="messages-icon">💬</span>
                对话记录
                <n-badge
                  :value="store.messages.length"
                  :max="99"
                  v-if="store.messages.length > 0"
                />
              </span>
              <n-button
                size="small"
                @click="store.clearMessages"
                quaternary
                class="clear-btn"
                v-if="store.messages.length > 0"
              >
                <template #icon>
                  <n-icon :component="ClearIcon" />
                </template>
                清空记录
              </n-button>
            </div>
          </template>

          <n-scrollbar style="max-height: 500px" ref="scrollbarRef" class="messages-scrollbar">
            <transition-group name="message-list" tag="div" class="messages-list">
              <div
                v-for="msg in store.messages"
                :key="msg.timestamp.getTime()"
                class="message-wrapper"
                :class="msg.role"
              >
                <div class="message-bubble" :class="msg.role">
                  <div class="message-header">
                    <span class="message-role">
                      <span class="role-icon">{{ msg.role === 'user' ? '👤' : '🤖' }}</span>
                      {{ msg.role === 'user' ? '你' : 'AI助手' }}
                    </span>
                    <n-text depth="3" class="message-time">
                      {{ formatTime(msg.timestamp) }}
                    </n-text>
                  </div>
                  <div class="message-content">{{ msg.content }}</div>
                </div>
              </div>
            </transition-group>

            <n-empty
              v-if="store.messages.length === 0"
              description="暂无对话记录，开始你的第一次对话吧！"
              class="empty-state"
            >
              <template #icon>
                <span class="empty-icon">💭</span>
              </template>
            </n-empty>
          </n-scrollbar>
        </n-card>

        <!-- 输入控制区 -->
        <n-card class="glass-card input-card" :bordered="false">
          <n-space vertical :size="16">
            <div class="input-wrapper">
              <n-input
                v-model:value="store.currentInput"
                type="textarea"
                placeholder="输入你想说的话... (Ctrl/Cmd + Enter 发送)"
                :autosize="{ minRows: 3, maxRows: 6 }"
                :disabled="!store.isConnected"
                @keydown="handleKeydown"
                size="large"
                class="text-input"
              />
            </div>

            <div class="control-panel">
              <n-space :size="12">
                <n-button
                  type="primary"
                  :disabled="!store.isConnected || !store.currentInput.trim()"
                  @click="sendText"
                  size="large"
                  class="send-btn"
                  strong
                >
                  <template #icon>
                    <n-icon :component="SendIcon" />
                  </template>
                  发送消息
                </n-button>

                <!-- 录音控制 -->
                <transition name="fade" mode="out-in">
                  <n-button
                    v-if="!store.isRecording"
                    key="start"
                    type="success"
                    :disabled="!store.canRecord"
                    @click="startRecording"
                    size="large"
                    class="record-btn"
                  >
                    <template #icon>
                      <n-icon :component="MicIcon" />
                    </template>
                    语音输入
                  </n-button>

                  <n-button
                    v-else
                    key="stop"
                    type="error"
                    @click="stopRecording"
                    size="large"
                    class="recording-btn"
                  >
                    <template #icon>
                      <n-icon :component="StopIcon" />
                    </template>
                    停止录音
                  </n-button>
                </transition>

                <n-button
                  v-if="store.isPlayingAudio"
                  type="warning"
                  @click="store.stopAudio"
                  size="large"
                  class="stop-audio-btn"
                >
                  <template #icon>
                    <span>🔇</span>
                  </template>
                  停止播放
                </n-button>
              </n-space>
            </div>
          </n-space>
        </n-card>

        <!-- 系统信息 -->
        <n-card class="glass-card info-card" :bordered="false">
          <template #header>
            <span class="info-title">
              <span class="info-icon">📊</span>
              系统状态
            </span>
          </template>
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">连接状态</div>
              <n-tag :type="connectionTagType" size="medium" round>
                {{ connectionStatusText }}
              </n-tag>
            </div>
            <div class="info-item">
              <div class="info-label">录音状态</div>
              <n-tag :type="recordingTagType" size="medium" round>
                {{ recordingStatusText }}
              </n-tag>
            </div>
            <div class="info-item">
              <div class="info-label">消息总数</div>
              <div class="info-value">{{ store.messages.length }}</div>
            </div>
            <div class="info-item">
              <div class="info-label">音频播放</div>
              <n-tag :type="store.isPlayingAudio ? 'success' : 'default'" size="medium" round>
                <template #icon>
                  <span>{{ store.isPlayingAudio ? '🔊' : '🔇' }}</span>
                </template>
                {{ store.isPlayingAudio ? '播放中' : '空闲' }}
              </n-tag>
            </div>
          </div>
        </n-card>
      </n-space>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useVoiceStore } from '@/stores/voice';
import { ConnectionStatus, RecordingStatus } from '@/types';
import {
  NAlert,
  NBadge,
  NButton,
  NCard,
  NCollapse,
  NCollapseItem,
  NEmpty,
  NFormItem,
  NIcon,
  NInput,
  NInputGroup,
  NScrollbar,
  NSpace,
  NTag,
  NText,
  useMessage,
} from 'naive-ui';
import { computed, nextTick, ref, watch } from 'vue';

// Icons
const LinkIcon = { render: () => '🔗' };
const SendIcon = { render: () => '📤' };
const MicIcon = { render: () => '🎤' };
const StopIcon = { render: () => '⏹️' };
const ConnectIcon = { render: () => '🔌' };
const DisconnectIcon = { render: () => '⚡' };
const ClearIcon = { render: () => '🗑️' };

const store = useVoiceStore();
const message = useMessage();
const scrollbarRef = ref();
const isConnecting = ref(false);

// 连接状态相关
const connectionStatusText = computed(() => {
  const statusMap: Record<string, string> = {
    [ConnectionStatus.DISCONNECTED]: '未连接',
    [ConnectionStatus.CONNECTING]: '连接中...',
    [ConnectionStatus.CONNECTED]: '已连接',
    [ConnectionStatus.RECONNECTING]: '重连中...',
    [ConnectionStatus.ERROR]: '连接错误',
  };
  return statusMap[store.connectionStatus] || '未知';
});

const connectionTagType = computed<'default' | 'info' | 'success' | 'warning' | 'error'>(() => {
  const typeMap: Record<string, 'default' | 'info' | 'success' | 'warning' | 'error'> = {
    [ConnectionStatus.DISCONNECTED]: 'default',
    [ConnectionStatus.CONNECTING]: 'info',
    [ConnectionStatus.CONNECTED]: 'success',
    [ConnectionStatus.RECONNECTING]: 'warning',
    [ConnectionStatus.ERROR]: 'error',
  };
  return typeMap[store.connectionStatus] || 'default';
});

// 录音状态相关
const recordingStatusText = computed(() => {
  const statusMap: Record<string, string> = {
    [RecordingStatus.IDLE]: '空闲',
    [RecordingStatus.RECORDING]: '录音中',
    [RecordingStatus.PAUSED]: '已暂停',
    [RecordingStatus.PROCESSING]: '处理中',
  };
  return statusMap[store.recordingStatus] || '未知';
});

const recordingTagType = computed<'default' | 'info' | 'success' | 'warning' | 'error'>(() => {
  const typeMap: Record<string, 'default' | 'info' | 'success' | 'warning' | 'error'> = {
    [RecordingStatus.IDLE]: 'default',
    [RecordingStatus.RECORDING]: 'error',
    [RecordingStatus.PAUSED]: 'warning',
    [RecordingStatus.PROCESSING]: 'info',
  };
  return typeMap[store.recordingStatus] || 'default';
});

// 连接/断开
async function toggleConnection() {
  if (store.isConnected) {
    store.disconnect();
    message.info('已断开连接');
  } else {
    isConnecting.value = true;
    try {
      await store.connect();
      message.success('连接成功');
    } catch (error) {
      message.error('连接失败: ' + (error as Error).message);
    } finally {
      isConnecting.value = false;
    }
  }
}

// 停止重连
function stopReconnect() {
  store.disconnect();
  message.info('已停止重连');
}

// 处理键盘事件
function handleKeydown(e: KeyboardEvent) {
  // Ctrl+Enter 或 Cmd+Enter 发送消息
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    e.preventDefault();
    sendText();
  }
}

// 发送文本消息
function sendText() {
  const text = store.currentInput.trim();
  if (!text) return;

  store.sendTextMessage(text);
  store.currentInput = '';

  // 滚动到底部
  nextTick(() => {
    scrollToBottom();
  });
}

// 开始录音
async function startRecording() {
  try {
    await store.startRecording();
    message.info('开始录音');
  } catch (error) {
    message.error('录音失败: ' + (error as Error).message);
  }
}

// 停止录音
function stopRecording() {
  store.stopRecording();
  message.info('停止录音');
}

// 格式化时间
function formatTime(date: Date): string {
  const d = new Date(date);
  return `${d.getHours().toString().padStart(2, '0')}:${d
    .getMinutes()
    .toString()
    .padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;
}

// 滚动到底部
function scrollToBottom() {
  if (scrollbarRef.value) {
    scrollbarRef.value.scrollTo({ top: scrollbarRef.value.scrollHeight });
  }
}

// 监听消息变化，自动滚动
watch(
  () => store.messages.length,
  () => {
    nextTick(() => {
      scrollToBottom();
    });
  }
);
</script>

<style lang="scss" scoped>
.voice-assistant {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 0;
  position: relative;
  overflow: hidden;

  // 背景装饰
  &::before {
    content: '';
    position: absolute;
    top: -50%;
    right: -10%;
    width: 500px;
    height: 500px;
    background: radial-gradient(circle, rgba(240, 147, 251, 0.3) 0%, transparent 70%);
    border-radius: 50%;
    animation: float 20s infinite ease-in-out;
  }

  &::after {
    content: '';
    position: absolute;
    bottom: -30%;
    left: -5%;
    width: 400px;
    height: 400px;
    background: radial-gradient(circle, rgba(102, 126, 234, 0.3) 0%, transparent 70%);
    border-radius: 50%;
    animation: float 15s infinite ease-in-out reverse;
  }

  .container {
    max-width: 1000px;
    margin: 0 auto;
    padding: 40px 20px;
    position: relative;
    z-index: 1;
  }
}

// 顶部标题区
.header {
  margin-bottom: 32px;
  animation: fadeIn 0.6s ease;

  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 24px 32px;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(20px);
    border-radius: 24px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  }

  .title {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 32px;
    font-weight: 700;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    margin: 0;

    .title-icon {
      font-size: 36px;
      animation: pulse 2s infinite;
    }
  }

  .status-tag {
    font-weight: 600;
    padding: 8px 20px;
    font-size: 14px;

    .status-dot {
      display: inline-block;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: currentColor;
      margin-right: 4px;

      &.status-dot-active {
        animation: pulse 2s infinite;
      }
    }
  }
}

// 主内容区
.main-content {
  animation: fadeIn 0.8s ease 0.2s both;
}

// 玻璃卡片效果
.glass-card {
  background: rgba(255, 255, 255, 0.95) !important;
  backdrop-filter: blur(20px);
  border-radius: 20px !important;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1) !important;
  border: 1px solid rgba(255, 255, 255, 0.3) !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15) !important;
  }

  :deep(.n-card-header) {
    padding: 20px 24px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  }

  :deep(.n-card__content) {
    padding: 24px;
  }
}

// 连接卡片
.connection-card {
  .ws-input {
    flex: 1;

    :deep(input) {
      border-radius: 12px 0 0 12px;
      font-size: 14px;
    }
  }

  .connect-btn {
    border-radius: 0 12px 12px 0 !important;
    font-weight: 600;
    min-width: 140px;
  }

  // 配置折叠面板
  :deep(.n-collapse) {
    margin-top: 8px;

    .n-collapse-item {
      border-radius: 8px;
      overflow: hidden;

      .n-collapse-item__header {
        padding: 10px 16px;
        font-size: 13px;
        font-weight: 500;
        background: rgba(102, 126, 234, 0.05);
        transition: all 0.3s ease;

        &:hover {
          background: rgba(102, 126, 234, 0.1);
        }
      }

      .n-collapse-item__content-wrapper {
        padding: 16px;
        background: rgba(248, 249, 250, 0.5);
      }
    }

    .n-form-item {
      margin-bottom: 0;

      .n-form-item-label {
        min-width: 80px;
        font-size: 13px;
        color: #666;
      }

      .n-input {
        font-size: 13px;

        input {
          border-radius: 8px;
        }
      }
    }
  }

  .asr-alert,
  .error-alert,
  .reconnect-alert {
    border-radius: 12px;
    animation: slideInRight 0.4s ease;

    .asr-icon,
    .reconnect-icon {
      font-size: 20px;
    }

    .reconnect-icon {
      animation: spin 1.5s linear infinite;
    }

    .asr-header,
    .reconnect-header {
      font-weight: 600;
      font-size: 14px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
    }

    .reconnect-info {
      font-size: 13px;
      color: #666;
      margin-top: 8px;
      line-height: 1.6;
    }

    .asr-final {
      font-weight: 600;
      color: #333;
      margin-bottom: 8px;
      font-size: 15px;
    }

    .asr-interim {
      color: #666;
      font-style: italic;
      display: flex;
      align-items: center;
      gap: 4px;

      .typing-cursor {
        animation: blink 1s infinite;
        color: #667eea;
        font-weight: bold;
      }
    }
  }
}

// 旋转动画
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

// 消息卡片
.messages-card {
  .messages-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;

    .messages-title {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 18px;
      font-weight: 600;

      .messages-icon {
        font-size: 22px;
      }
    }

    .clear-btn {
      transition: all 0.3s ease;

      &:hover {
        color: #f87171;
      }
    }
  }

  .messages-scrollbar {
    :deep(.n-scrollbar-content) {
      padding-right: 8px;
    }
  }

  .messages-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .message-wrapper {
    display: flex;
    animation: slideInRight 0.4s ease;

    &.user {
      justify-content: flex-end;
      animation: slideInRight 0.4s ease;
    }

    &.assistant {
      justify-content: flex-start;
      animation: slideInLeft 0.4s ease;
    }
  }

  .message-bubble {
    max-width: 75%;
    padding: 16px 20px;
    border-radius: 18px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    transition: all 0.3s ease;

    &:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
      transform: translateY(-1px);
    }

    &.user {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border-bottom-right-radius: 4px;
    }

    &.assistant {
      background: #f8f9fa;
      color: #333;
      border-bottom-left-radius: 4px;
    }

    .message-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
      gap: 12px;

      .message-role {
        display: flex;
        align-items: center;
        gap: 6px;
        font-weight: 600;
        font-size: 13px;

        .role-icon {
          font-size: 16px;
        }
      }

      .message-time {
        font-size: 11px;
        opacity: 0.8;
      }
    }

    .message-content {
      white-space: pre-wrap;
      word-wrap: break-word;
      line-height: 1.6;
      font-size: 14px;
    }
  }

  .empty-state {
    margin: 60px 0;

    .empty-icon {
      font-size: 64px;
      display: block;
      margin-bottom: 16px;
    }
  }
}

// 输入卡片
.input-card {
  .input-wrapper {
    .text-input {
      :deep(textarea) {
        border-radius: 12px;
        font-size: 15px;
        line-height: 1.6;
        resize: none;
      }
    }
  }

  .control-panel {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .send-btn,
    .record-btn,
    .recording-btn,
    .stop-audio-btn {
      font-weight: 600;
      border-radius: 12px;
      transition: all 0.3s ease;

      &:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      }
    }

    .recording-btn {
      animation: pulse 1.5s infinite;
    }
  }
}

// 信息卡片
.info-card {
  .info-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 16px;
    font-weight: 600;

    .info-icon {
      font-size: 20px;
    }
  }

  .info-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
  }

  .info-item {
    padding: 16px;
    background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
    border-radius: 12px;
    border: 1px solid rgba(0, 0, 0, 0.06);
    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    }

    .info-label {
      font-size: 12px;
      color: #666;
      margin-bottom: 8px;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .info-value {
      font-size: 24px;
      font-weight: 700;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      background-clip: text;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
  }
}

// 动画
@keyframes float {
  0%,
  100% {
    transform: translateY(0) rotate(0deg);
  }
  50% {
    transform: translateY(-20px) rotate(5deg);
  }
}

@keyframes blink {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0;
  }
}

// 过渡动画
.slide-fade-enter-active {
  animation: slideInRight 0.4s ease;
}

.slide-fade-leave-active {
  animation: slideInRight 0.3s ease reverse;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.message-list-enter-active {
  animation: slideInRight 0.4s ease;
}

.message-list-leave-active {
  position: absolute;
  opacity: 0;
}

.message-list-move {
  transition: transform 0.4s ease;
}

// 响应式设计
@media (max-width: 768px) {
  .voice-assistant {
    .container {
      padding: 20px 12px;
    }
  }

  .header {
    .header-content {
      flex-direction: column;
      gap: 16px;
      padding: 20px;
    }

    .title {
      font-size: 24px;
    }
  }

  .glass-card {
    border-radius: 16px !important;

    :deep(.n-card-header),
    :deep(.n-card__content) {
      padding: 16px;
    }
  }

  .message-bubble {
    max-width: 90%;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }

  .control-panel {
    flex-direction: column;
    gap: 12px;

    :deep(.n-space) {
      width: 100%;
      flex-direction: column;

      .n-button {
        width: 100%;
      }
    }
  }
}
</style>
