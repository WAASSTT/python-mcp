<template>
  <div class="xiaozhi-container">
    <!-- 左侧主表情区域 -->
    <div class="left-section">
      <div class="emoji-display" @click="handleEmojiClick">
        <div class="emoji-circle" :class="{
          active: appStore.isConnected,
          speaking: appStore.isRecording,
          playing: appStore.isSpeaking
        }">
          <span class="emoji-icon">{{ currentEmoji }}</span>
        </div>
        <div class="status-text">{{ statusText }}</div>
        <n-tag v-if="appStore.isConnected" type="success" size="small" :bordered="false" round>
          <template #icon>
            <span style="font-size: 8px;">●</span>
          </template>
          已连接
        </n-tag>
        <n-tag v-else type="default" size="small" :bordered="false" round>
          <template #icon>
            <span style="font-size: 8px;">●</span>
          </template>
          {{ connecting ? '连接中...' : '未连接' }}
        </n-tag>

        <!-- 音量指示器 -->
        <div v-if="appStore.isSpeaking" class="volume-indicator">
          <div class="volume-bar">
            <div class="volume-fill" :style="{
              width: appStore.currentVolume + '%',
              background: getVolumeColor(appStore.currentVolume)
            }"></div>
          </div>
          <span class="volume-text">{{ appStore.currentVolume }}%</span>
        </div>

      </div>
    </div>

    <!-- 右侧对话区域 -->
    <div class="right-section" :class="{ collapsed: !showChat }">
      <div class="chat-header">
        <div class="header-info">
          <n-icon size="20" color="#667eea">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
              <path fill="currentColor" d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
            </svg>
          </n-icon>
          <span class="header-title">对话记录</span>
          <n-badge :value="0" :max="99" type="info" />
        </div>
        <n-button text circle @click="showChat = false" class="collapse-btn">
          <template #icon>
            <n-icon size="20">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <path fill="currentColor" d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" />
              </svg>
            </n-icon>
          </template>
        </n-button>
      </div>
      <div class="chat-body" ref="messagesListRef">
        <n-empty description="暂无对话" size="large">
          <template #icon>
            <div style="font-size: 64px; opacity: 0.3;">💬</div>
          </template>
        </n-empty>
      </div>
    </div>

    <!-- 展开按钮（右侧边缘） -->
    <transition name="fade">
      <div v-show="!showChat" class="expand-btn" @click="showChat = true">
        <n-icon size="24" color="white">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path fill="currentColor" d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6 1.41-1.41z" />
          </svg>
        </n-icon>
      </div>
    </transition>
  </div>
</template>

<script lang="ts" setup>
import { useAppStore } from '@/stores/app';
import { useMessage } from 'naive-ui';
import { computed, onMounted, ref } from 'vue';

const appStore = useAppStore();
const message = useMessage();

const connecting = ref(false);
const showChat = ref(true);

// 根据音量返回颜色
function getVolumeColor(volume: number): string {
  if (volume < 30) return '#00c853';
  if (volume < 60) return '#ffd600';
  return '#ff6f00';
}

// 计算当前表情
const currentEmoji = computed(() => {
  if (!appStore.isConnected) {
    return '😴'; // 离线
  }
  if (appStore.isSpeaking) {
    return appStore.currentEmotion || '🎤'; // 服务器正在说话
  }
  if (appStore.isRecording) {
    return '🗣️'; // 用户录音中
  }
  return '😊'; // 默认待机
});

// 计算状态文本
const statusText = computed(() => {
  if (!appStore.isConnected) {
    return '点击连接';
  }
  if (appStore.isSpeaking) {
    return '点击打断';
  }
  if (appStore.isRecording) {
    return '录音中';
  }
  return '点击说话';
});

// 处理表情点击 - 开始/停止录音
function handleEmojiClick() {
  if (!appStore.isConnected) {
    console.log('[Index] 点击表情，当前未连接，开始连接...');
    autoConnect();
    return;
  }

  // 如果服务器正在说话，打断播放并开始录音
  if (appStore.isSpeaking) {
    console.log('[Index] 打断服务器播放，准备开始录音');
    appStore.interruptAndStartRecording().catch((error: any) => {
      console.error('[Index] 打断并录音失败:', error);
      message.error(error.message || '操作失败');
    });
    return;
  }

  console.log('[Index] 点击表情，当前连接状态:', {
    isConnected: appStore.isConnected,
    isRecording: appStore.isRecording,
  });

  if (appStore.isRecording) {
    appStore.stopRecording().catch((error: any) => {
      console.error('[Index] 停止录音失败:', error);
      message.error(error.message || '停止录音失败');
    });
  } else {
    appStore.startRecording().catch((error: any) => {
      console.error('[Index] 开始录音失败:', error);
      message.error(error.message || '开始录音失败');
    });
  }
}

// 自动连接
async function autoConnect() {
  if (!appStore.otaUrl) {
    console.error('[Index] OTA地址未配置');
    message.error('OTA服务器地址未配置');
    return;
  }

  try {
    console.log('[Index] 开始连接，OTA地址:', appStore.otaUrl);
    connecting.value = true;

    // 初始化应用
    await appStore.initialize();

    // 连接服务器
    await appStore.connect();

    console.log('[Index] 连接成功！');
    message.success('连接成功！');
  } catch (error: any) {
    console.error('[Index] 连接失败:', error);
    message.error(`连接失败: ${error.message || '未知错误'}`);
  } finally {
    connecting.value = false;
  }
}



// 页面加载时自动连接
onMounted(async () => {
  console.log('[Index] 页面加载，准备自动连接...');
  console.log('[Index] 当前连接状态:', {
    isConnected: appStore.isConnected,
    otaUrl: appStore.otaUrl,
  });

  // 等待500ms后自动连接
  setTimeout(async () => {
    if (!appStore.isConnected) {
      console.log('[Index] 500ms后检查，未连接，开始自动连接...');
      await autoConnect();
      console.log('[Index] 自动连接完成，最终状态:', {
        isConnected: appStore.isConnected,
      });
    } else {
      console.log('[Index] 500ms后检查，已连接，跳过自动连接');
    }
  }, 500);
});


</script>

<style lang="scss" scoped>
.xiaozhi-container {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: row;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
  position: relative;
  overflow: hidden;

  // 动态背景粒子效果
  &::before {
    content: '';
    position: absolute;
    width: 100%;
    height: 100%;
    background-image: radial-gradient(circle at 20% 50%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
      radial-gradient(circle at 80% 80%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
      radial-gradient(circle at 40% 20%, rgba(255, 255, 255, 0.05) 0%, transparent 50%);
    animation: backgroundMove 30s ease-in-out infinite;
    pointer-events: none;
  }

  // 波纹效果
  &::after {
    content: '';
    position: absolute;
    inset: -50%;
    background: radial-gradient(circle, transparent 30%, rgba(255, 255, 255, 0.02) 50%, transparent 70%);
    animation: wave 15s linear infinite;
    pointer-events: none;
  }
}

// 左侧区域
.left-section {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
}

// 右侧对话区域
.right-section {
  position: fixed;
  right: 0;
  top: 0;
  width: 420px;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  box-shadow: -4px 0 24px rgba(0, 0, 0, 0.1);
  z-index: 2;
  transform: translateX(0);
  transition: transform 0.35s cubic-bezier(0.4, 0.0, 0.2, 1);
  will-change: transform;

  &.collapsed {
    transform: translateX(100%);
  }
}

.chat-header {
  padding: 20px 24px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  background: white;
  display: flex;
  align-items: center;
  justify-content: space-between;

  .header-info {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .header-title {
    font-size: 18px;
    font-weight: 600;
    color: #333;
    flex: 1;
  }

  .collapse-btn {
    color: #999;
    transition: all 0.3s ease;

    &:hover {
      color: #667eea;
      transform: scale(1.1);
    }
  }
}

.chat-body {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;

  // 精美滚动条
  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.02);
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 4px;
    transition: background 0.3s;

    &:hover {
      background: linear-gradient(135deg, #5568d3 0%, #65408b 100%);
    }
  }
}

// 展开按钮
.expand-btn {
  position: fixed;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 48px;
  height: 80px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px 0 0 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: -4px 0 16px rgba(0, 0, 0, 0.15);
  transition: all 0.25s ease;
  z-index: 10;

  &:hover {
    width: 56px;
    box-shadow: -8px 0 24px rgba(102, 126, 234, 0.4);
  }

  &:active {
    transform: translateY(-50%) scale(0.95);
  }
}

// 淡入淡出动画
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.fade-enter-to,
.fade-leave-from {
  opacity: 1;
}

// 主表情区域
.emoji-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  user-select: none;
  transition: transform 0.3s ease;
  z-index: 1;

  &:hover {
    transform: scale(1.05);
  }

  &:active {
    transform: scale(0.95);
  }
}

.emoji-circle {
  width: 280px;
  height: 280px;
  border-radius: 50%;
  background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.25), 0 0 0 8px rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
  animation: float 3s ease-in-out infinite;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    inset: -12px;
    border-radius: 50%;
    background: linear-gradient(135deg, rgba(102, 126, 234, 0.3), rgba(118, 75, 162, 0.3));
    filter: blur(20px);
    opacity: 0;
    transition: opacity 0.3s;
  }

  &:hover::before {
    opacity: 1;
  }

  &.active {
    animation: pulse 1s ease-in-out infinite;
    box-shadow: 0 20px 60px rgba(102, 126, 234, 0.6), 0 0 0 8px rgba(102, 126, 234, 0.2);
  }

  &.speaking {
    animation: speaking 0.5s ease-in-out infinite;
    background: linear-gradient(135deg, #ffeaa7 0%, #fdcb6e 100%);
    box-shadow: 0 20px 60px rgba(253, 203, 110, 0.5), 0 0 0 8px rgba(255, 234, 167, 0.3);
  }

  &.playing {
    animation: playing 1s ease-in-out infinite;
    background: linear-gradient(135deg, #a8e6cf 0%, #56ccf2 100%);
    box-shadow: 0 20px 60px rgba(86, 204, 242, 0.5), 0 0 0 8px rgba(168, 230, 207, 0.3);
  }
}

.emoji-icon {
  font-size: 160px;
  line-height: 1;
}

.status-text {
  margin-top: 30px;
  font-size: 28px;
  font-weight: 600;
  color: white;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
}

// 音量指示器
.volume-indicator {
  margin-top: 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 240px;
}

.volume-bar {
  flex: 1;
  height: 12px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  overflow: hidden;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.volume-fill {
  height: 100%;
  transition: width 0.15s ease, background 0.3s ease;
  border-radius: 6px;
  box-shadow: 0 0 10px rgba(255, 255, 255, 0.3);
}

.volume-text {
  min-width: 45px;
  text-align: right;
  color: white;
  font-weight: 600;
  font-size: 15px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

// 消息列表
.message-item {
  display: flex;
  margin-bottom: 16px;
  animation: messageSlideIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);

  &.user {
    justify-content: flex-end;
  }

  &.assistant {
    justify-content: flex-start;
  }

  &.system {
    justify-content: center;
  }
}

.message-bubble {
  position: relative;
  padding: 12px 16px;
  border-radius: 18px;
  max-width: 70%;
  word-wrap: break-word;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;

  &:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  }

  // 用户消息气泡
  &.user {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border-bottom-right-radius: 4px;

    // 右侧小尾巴
    &::after {
      content: '';
      position: absolute;
      right: -6px;
      bottom: 8px;
      width: 0;
      height: 0;
      border-left: 8px solid #764ba2;
      border-top: 6px solid transparent;
      border-bottom: 6px solid transparent;
    }

    .bubble-time {
      color: rgba(255, 255, 255, 0.75);
    }
  }

  // AI 助手消息气泡
  &.assistant {
    background: white;
    color: #333;
    border-bottom-left-radius: 4px;
    border: 1px solid #e5e5e5;

    // 左侧小尾巴
    &::before {
      content: '';
      position: absolute;
      left: -6px;
      bottom: 8px;
      width: 0;
      height: 0;
      border-right: 8px solid white;
      border-top: 6px solid transparent;
      border-bottom: 6px solid transparent;
    }

    &::after {
      content: '';
      position: absolute;
      left: -7px;
      bottom: 8px;
      width: 0;
      height: 0;
      border-right: 8px solid #e5e5e5;
      border-top: 6px solid transparent;
      border-bottom: 6px solid transparent;
      z-index: -1;
    }

    .bubble-time {
      color: rgba(0, 0, 0, 0.45);
    }
  }

  // 系统消息
  &.system {
    background: rgba(0, 0, 0, 0.05);
    color: #666;
    font-size: 12px;
    padding: 8px 14px;
    border-radius: 12px;
    max-width: 85%;
    text-align: center;
    border: none;
    box-shadow: none;

    &::before,
    &::after {
      display: none;
    }

    .bubble-time {
      display: none;
    }
  }

  // 音频消息样式
  &.audio-message {
    cursor: pointer;
    user-select: none;
    min-width: 120px;

    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    }

    &:active {
      transform: translateY(0);
    }

    &.playing {
      animation: audioPulse 1s ease-in-out infinite;
    }
  }
}

.bubble-content {
  line-height: 1.5;
  font-size: 15px;
  word-break: break-word;
  white-space: pre-wrap;
}

.audio-content {
  display: flex;
  align-items: center;
  gap: 8px;

  .audio-text {
    font-size: 14px;
    flex: 1;
  }
}

.bubble-time {
  font-size: 11px;
  margin-top: 6px;
  text-align: right;
  font-weight: 400;
  letter-spacing: 0.3px;
}

// 动画
@keyframes messageSlideIn {
  0% {
    opacity: 0;
    transform: translateY(10px);
  }

  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes float {

  0%,
  100% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(-10px);
  }
}

@keyframes pulse {

  0%,
  100% {
    transform: scale(1);
  }

  50% {
    transform: scale(1.05);
  }
}

@keyframes speaking {

  0%,
  100% {
    transform: scale(1);
  }

  50% {
    transform: scale(1.08);
  }
}

@keyframes playing {

  0%,
  100% {
    transform: scale(1) rotate(0deg);
  }

  25% {
    transform: scale(1.03) rotate(1deg);
  }

  50% {
    transform: scale(1.06) rotate(0deg);
  }

  75% {
    transform: scale(1.03) rotate(-1deg);
  }
}

@keyframes blink {

  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.5;
  }
}

@keyframes backgroundMove {

  0%,
  100% {
    transform: translate(0, 0) scale(1);
  }

  50% {
    transform: translate(-10%, -10%) scale(1.1);
  }
}

@keyframes wave {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

@keyframes bubbleSlideIn {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.9);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes audioPulse {

  0%,
  100% {
    opacity: 1;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  }

  50% {
    opacity: 0.9;
    box-shadow: 0 4px 16px rgba(102, 126, 234, 0.4);
  }
}
</style>
