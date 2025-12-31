<template>
  <div class="xiaozhi-client">
    <!-- 顶部配置区 -->
    <n-card title="设备配置" class="config-card">
      <n-space vertical>
        <n-space>
          <n-input
            v-model:value="appStore.deviceConfig.deviceId"
            placeholder="设备 MAC"
            :disabled="appStore.isConnected"
            style="width: 200px"
          >
            <template #prefix>设备ID</template>
          </n-input>
          <n-input
            v-model:value="appStore.deviceConfig.deviceName"
            placeholder="设备名称"
            :disabled="appStore.isConnected"
            style="width: 200px"
          >
            <template #prefix>设备名称</template>
          </n-input>
          <n-input
            v-model:value="appStore.deviceConfig.token"
            placeholder="认证令牌（可选）"
            :disabled="appStore.isConnected"
            type="password"
            show-password-on="click"
            style="width: 200px"
          >
            <template #prefix>Token</template>
          </n-input>
        </n-space>
      </n-space>
    </n-card>

    <!-- 连接控制区 -->
    <n-card title="连接信息" class="connection-card">
      <template #header-extra>
        <n-space>
          <n-tag :type="appStore.isOTAConnected ? 'success' : 'default'">
            {{ appStore.isOTAConnected ? '● OTA已连接' : '○ OTA未连接' }}
          </n-tag>
          <n-tag :type="appStore.isWSConnected ? 'success' : 'default'">
            {{ appStore.isWSConnected ? '● WS已连接' : '○ WS未连接' }}
          </n-tag>
        </n-space>
      </template>

      <n-space vertical>
        <n-input
          v-model:value="appStore.otaUrl"
          placeholder="OTA服务器地址"
          :disabled="appStore.isConnected"
        >
          <template #prefix>OTA</template>
        </n-input>

        <n-input v-model:value="appStore.wsUrl" placeholder="点击连接后自动获取" disabled>
          <template #prefix>WS</template>
        </n-input>

        <n-space>
          <n-button
            v-if="!appStore.isConnected"
            type="primary"
            :loading="connecting"
            @click="handleConnect"
          >
            连接服务器
          </n-button>
          <n-button v-else type="error" @click="handleDisconnect"> 断开连接 </n-button>
        </n-space>
      </n-space>
    </n-card>

    <!-- 会话状态 -->
    <n-card v-if="appStore.isConnected" class="session-card">
      <n-space align="center">
        <span style="font-size: 32px">{{ appStore.sessionEmoji }}</span>
        <n-text strong>{{ appStore.sessionStatus }}</n-text>
        <n-progress
          v-if="appStore.isSessionActive"
          type="line"
          :percentage="100"
          :show-indicator="false"
          status="info"
          processing
          style="width: 200px"
        />
      </n-space>
    </n-card>

    <!-- 主交互区 -->
    <n-card title="对话窗口" class="chat-card">
      <n-tabs type="segment" animated>
        <!-- 文本消息标签页 -->
        <n-tab-pane name="text" tab="文本消息">
          <n-space vertical>
            <!-- 消息列表 -->
            <div ref="messageListRef" class="message-list">
              <div
                v-for="msg in appStore.messages"
                :key="msg.id"
                :class="['message-item', `message-${msg.type}`]"
              >
                <div class="message-header">
                  <n-tag :type="msg.type === 'user' ? 'info' : 'success'" size="small">
                    {{ msg.type === 'user' ? '我' : '小智' }}
                  </n-tag>
                  <n-text depth="3" style="font-size: 12px">
                    {{ new Date(msg.timestamp).toLocaleTimeString() }}
                  </n-text>
                </div>
                <div class="message-content">
                  {{ msg.content }}
                </div>
              </div>
            </div>

            <!-- 输入框 -->
            <n-input-group>
              <n-input
                v-model:value="textMessage"
                placeholder="输入消息..."
                :disabled="!appStore.isConnected"
                @keyup.enter="handleSendText"
              />
              <n-button
                type="primary"
                :disabled="!appStore.isConnected || !textMessage"
                @click="handleSendText"
              >
                发送
              </n-button>
            </n-input-group>
          </n-space>
        </n-tab-pane>

        <!-- 语音消息标签页 -->
        <n-tab-pane name="voice" tab="语音消息">
          <n-space vertical align="center">
            <canvas ref="canvasRef" class="audio-visualizer" width="600" height="150"></canvas>

            <n-button
              :type="isRecording ? 'error' : 'primary'"
              size="large"
              :disabled="!appStore.isConnected"
              @click="handleToggleRecording"
            >
              {{ isRecording ? '停止录音' : '开始录音' }}
            </n-button>

            <n-text v-if="isRecording" type="warning"> 正在录音中... </n-text>
          </n-space>
        </n-tab-pane>
      </n-tabs>
    </n-card>

    <!-- 日志区 -->
    <n-card title="系统日志" class="log-card">
      <template #header-extra>
        <n-button text @click="appStore.clearLogs"> 清空 </n-button>
      </template>

      <div ref="logListRef" class="log-list">
        <div v-for="(log, index) in appStore.logs" :key="index" class="log-item">
          {{ log }}
        </div>
      </div>
    </n-card>
  </div>
</template>

<script lang="ts" setup>
import { audioService } from '@/services/audio';
import { useAppStore } from '@/stores/app';
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue';

const appStore = useAppStore();
const message = useMessage();

const connecting = ref(false);
const textMessage = ref('');
const isRecording = ref(false);
const canvasRef = ref<HTMLCanvasElement>();
const messageListRef = ref<HTMLDivElement>();
const logListRef = ref<HTMLDivElement>();

/**
 * 滚动到消息列表底部
 */
function scrollToBottom() {
  nextTick(() => {
    if (messageListRef.value) {
      messageListRef.value.scrollTop = messageListRef.value.scrollHeight;
    }
  });
}

/**
 * 滚动到日志列表底部
 */
function scrollLogToBottom() {
  nextTick(() => {
    if (logListRef.value) {
      logListRef.value.scrollTop = logListRef.value.scrollHeight;
    }
  });
}

/**
 * 连接服务器
 */
async function handleConnect() {
  if (!appStore.otaUrl) {
    message.error('请输入 OTA 服务器地址');
    return;
  }

  try {
    connecting.value = true;
    await appStore.connect();
    message.success('连接成功！');
  } catch (error: any) {
    const errorMsg = error?.message || error?.toString() || '未知错误';
    message.error(`连接失败: ${errorMsg}`, { duration: 5000 });
    console.error('连接错误详情:', error);
  } finally {
    connecting.value = false;
  }
}

/**
 * 断开连接
 */
function handleDisconnect() {
  appStore.disconnect();
  message.info('已断开连接');
}

/**
 * 发送文本消息
 */
function handleSendText() {
  const text = textMessage.value.trim();
  if (!text) {
    message.warning('请输入消息内容');
    return;
  }

  appStore.sendTextMessage(text);
  textMessage.value = '';
  scrollToBottom();
}

/**
 * 切换录音状态
 */
async function handleToggleRecording() {
  if (isRecording.value) {
    // 停止录音
    try {
      await appStore.stopRecording();
      isRecording.value = false;
      audioService.stopWaveform();
      scrollToBottom();
    } catch (error: any) {
      message.error(`停止录音失败: ${error?.message || error}`);
    }
  } else {
    // 开始录音
    try {
      await appStore.startRecording();
      isRecording.value = true;

      // 开始绘制波形
      if (canvasRef.value) {
        audioService.drawWaveform(canvasRef.value);
      }
      message.info('开始录音，请对着麦克风说话');
    } catch (error: any) {
      const errorMsg = error?.message || error?.toString() || '未知错误';
      if (errorMsg.includes('Permission denied') || errorMsg.includes('NotAllowedError')) {
        message.error('麦克风权限被拒绝，请允许浏览器访问麦克风', { duration: 5000 });
      } else if (errorMsg.includes('NotFoundError')) {
        message.error('未找到麦克风设备，请检查设备连接', { duration: 5000 });
      } else {
        message.error(`录音失败: ${errorMsg}`, { duration: 5000 });
      }
      console.error('录音错误详情:', error);
    }
  }
}

// 监听消息列表变化，自动滚动到底部
watch(
  () => appStore.messages.length,
  () => {
    scrollToBottom();
  }
);

// 监听日志列表变化，自动滚动到底部
watch(
  () => appStore.logs.length,
  () => {
    scrollLogToBottom();
  }
);

onMounted(() => {
  console.log('小智客户端已加载');
});

onUnmounted(() => {
  // 清理资源
  try {
    if (isRecording.value) {
      appStore.stopRecording();
      audioService.stopWaveform();
    }
    // 注意：不自动断开连接，让用户手动控制
    // if (appStore.isConnected) {
    //   appStore.disconnect()
    // }
  } catch (error) {
    console.error('清理资源失败:', error);
  }
});
</script>

<style lang="scss" scoped>
.xiaozhi-client {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;

  .config-card,
  .connection-card,
  .session-card,
  .chat-card,
  .log-card {
    margin-bottom: 20px;
  }

  .message-list {
    max-height: 400px;
    min-height: 200px;
    overflow-y: auto;
    padding: 10px;
    background-color: #f5f5f5;
    border-radius: 8px;
    scroll-behavior: smooth;

    &:empty::before {
      content: '暂无消息，开始对话吧！';
      display: block;
      text-align: center;
      color: #999;
      padding: 60px 0;
    }

    .message-item {
      margin-bottom: 15px;
      padding: 10px 15px;
      border-radius: 8px;
      background-color: white;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
      transition: box-shadow 0.2s;

      &:hover {
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
      }

      &.message-user {
        margin-left: auto;
        margin-right: 0;
        max-width: 80%;
        background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
      }

      &.message-assistant {
        margin-right: auto;
        margin-left: 0;
        max-width: 80%;
        background: linear-gradient(135deg, #f1f8e9 0%, #dcedc8 100%);
      }

      .message-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
      }

      .message-content {
        line-height: 1.6;
        white-space: pre-wrap;
        word-break: break-word;
      }
    }
  }

  .audio-visualizer {
    border: 1px solid #ddd;
    border-radius: 8px;
    background-color: #f0f0f0;
  }

  .log-list {
    max-height: 200px;
    overflow-y: auto;
    font-family: 'Courier New', 'Consolas', monospace;
    font-size: 12px;
    padding: 10px;
    background-color: #1e1e1e;
    color: #d4d4d4;
    border-radius: 4px;
    scroll-behavior: smooth;

    .log-item {
      margin-bottom: 5px;
      line-height: 1.6;
      padding: 2px 0;

      &:last-child {
        margin-bottom: 0;
      }
    }

    /* 自定义滚动条 */
    &::-webkit-scrollbar {
      width: 8px;
    }

    &::-webkit-scrollbar-track {
      background: #2d2d2d;
      border-radius: 4px;
    }

    &::-webkit-scrollbar-thumb {
      background: #555;
      border-radius: 4px;

      &:hover {
        background: #666;
      }
    }
  }
}
</style>
