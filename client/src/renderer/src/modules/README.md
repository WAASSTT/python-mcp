# TypeScript 库 - 基于 server/test 的重构

这是一个完全重构的 TypeScript 库，参考了 `server/test` 中的 JavaScript 架构。

## 目录结构

```
lib/
├── app.ts                      # 应用主入口
├── index.ts                    # 库导出入口
├── config/                     # 配置管理
│   └── manager.ts
├── core/                       # 核心功能
│   ├── audio/                  # 音频处理
│   │   ├── opus-codec.ts       # Opus 编解码
│   │   ├── player.ts           # 音频播放器
│   │   ├── recorder.ts         # 音频录制器
│   │   └── stream-context.ts  # 流播放上下文
│   ├── mcp/                    # MCP 工具管理
│   │   └── tools.ts
│   └── network/                # 网络通信
│       ├── ota-connector.ts    # OTA 连接器
│       └── websocket.ts        # WebSocket 处理
├── ui/                         # UI 控制
│   └── controller.ts
└── utils/                      # 工具模块
    ├── blocking-queue.ts       # 阻塞队列
    └── logger.ts               # 日志记录
```

## 主要特性

### 1. 完整的类型支持
- 所有模块都使用 TypeScript 编写
- 提供完整的类型定义和接口
- 更好的 IDE 支持和类型检查

### 2. 模块化设计
- 清晰的模块分离
- 单一职责原则
- 易于测试和维护

### 3. 单例模式
大多数核心模块使用单例模式，确保全局只有一个实例：
- `getApp()` - 应用实例
- `getAudioPlayer()` - 音频播放器
- `getWebSocketHandler()` - WebSocket 处理器
- `getMCPToolsManager()` - MCP 工具管理器
- `getUIController()` - UI 控制器

### 4. 事件驱动
通过回调函数实现事件驱动架构：
- 连接状态变化
- 会话状态变化
- 消息接收
- 音频数据处理

## 快速开始

### 1. 初始化应用

\`\`\`typescript
import { initializeApp } from '@/lib';

// 初始化应用
const app = await initializeApp();
\`\`\`

### 2. 连接到服务器

\`\`\`typescript
// 连接
await app.connect();

// 断开
app.disconnect();
\`\`\`

### 3. 发送文本消息

\`\`\`typescript
app.sendText('你好，小智！');
\`\`\`

### 4. 录音

\`\`\`typescript
// 开始录音
await app.startRecording();

// 停止录音
app.stopRecording();
\`\`\`

### 5. 配置管理

\`\`\`typescript
// 获取配置
const config = app.getDeviceConfig();

// 更新配置
app.updateDeviceConfig({
  deviceName: '我的设备',
  clientId: 'my_client'
});

// 更新 OTA URL
app.updateOTAUrl('http://localhost:8002/xiaozhi/ota/');
\`\`\`

### 6. UI 回调

\`\`\`typescript
const uiController = app.getUIController();

// 连接状态变化
uiController.onConnectionStatusChange = (status) => {
  console.log('连接状态:', status);
};

// 会话状态变化
uiController.onSessionStatusChange = (isSpeaking, emotion) => {
  console.log('说话中:', isSpeaking, '表情:', emotion);
};

// 消息接收
uiController.onMessageReceived = (message, isUser) => {
  console.log(isUser ? '用户' : '小智', ':', message);
};

// 音频可视化
uiController.onAudioVisualizerUpdate = (dataArray, volume) => {
  console.log('音量:', volume);
};

// 日志接收
uiController.onLogReceived = (entry) => {
  console.log(\`[\${entry.type}]\`, entry.message);
};
\`\`\`

### 7. MCP 工具管理

\`\`\`typescript
const mcpManager = app.getMCPToolsManager();

// 添加工具
mcpManager.addTool({
  name: 'my_tool',
  description: '我的工具',
  inputSchema: {
    type: 'object',
    properties: {
      param1: {
        type: 'string',
        description: '参数1'
      }
    },
    required: ['param1']
  },
  mockResponse: {
    success: true,
    data: '执行成功'
  }
});

// 获取所有工具
const tools = mcpManager.getTools();

// 执行工具
const result = mcpManager.executeTool('my_tool', { param1: 'value1' });
\`\`\`

## 与原 server/test 的对应关系

| server/test | 重构后的 TypeScript |
|------------|-------------------|
| `js/app.js` | `lib/app.ts` |
| `js/utils/logger.js` | `lib/utils/logger.ts` |
| `js/utils/blocking-queue.js` | `lib/utils/blocking-queue.ts` |
| `js/config/manager.js` | `lib/config/manager.ts` |
| `js/core/audio/player.js` | `lib/core/audio/player.ts` |
| `js/core/audio/recorder.js` | `lib/core/audio/recorder.ts` |
| `js/core/audio/opus-codec.js` | `lib/core/audio/opus-codec.ts` |
| `js/core/audio/stream-context.js` | `lib/core/audio/stream-context.ts` |
| `js/core/network/websocket.js` | `lib/core/network/websocket.ts` |
| `js/core/network/ota-connector.js` | `lib/core/network/ota-connector.ts` |
| `js/core/mcp/tools.js` | `lib/core/mcp/tools.ts` |
| `js/ui/controller.js` | `lib/ui/controller.ts` |

## 改进点

### 相比原 JavaScript 版本的改进：

1. **类型安全**：完整的 TypeScript 类型系统
2. **更好的错误处理**：使用 try-catch 和 Promise
3. **模块化**：清晰的模块分离和依赖关系
4. **单例模式**：确保全局只有一个实例
5. **回调系统**：统一的事件驱动架构
6. **代码组织**：更清晰的文件结构和命名
7. **文档**：完整的 JSDoc 注释和类型定义

## 在 Vue 中使用

\`\`\`vue
<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import { initializeApp, type App } from '@/lib';

const app = ref<App | null>(null);
const isConnected = ref(false);
const messages = ref<Array<{ text: string; isUser: boolean }>>([]);

onMounted(async () => {
  // 初始化应用
  app.value = await initializeApp();

  // 设置回调
  const uiController = app.value.getUIController();

  uiController.onConnectionStatusChange = (status) => {
    isConnected.value = status === 'connected';
  };

  uiController.onMessageReceived = (message, isUser) => {
    messages.value.push({ text: message, isUser });
  };
});

onUnmounted(() => {
  // 清理资源
  app.value?.destroy();
});

async function connect() {
  await app.value?.connect();
}

function sendText(text: string) {
  app.value?.sendText(text);
}
</script>
\`\`\`

## 注意事项

1. **Opus 库依赖**：需要先加载 `libopus.js` 才能使用音频功能
2. **浏览器兼容性**：需要支持 WebSocket 和 Web Audio API
3. **麦克风权限**：录音功能需要用户授权麦克风权限
4. **配置持久化**：配置保存在 localStorage 中

## 开发建议

1. 使用 TypeScript 的类型系统来避免运行时错误
2. 通过 UI 控制器的回调来更新 UI 状态
3. 合理使用日志系统来调试问题
4. 在生产环境中禁用 debug 日志
