# Elysia AI Server

基于 Bun 和 Elysia 构建的现代化 AI 服务器，提供 LLM、ASR、TTS、vLLM、Intent、Memory 等多种 AI 能力。

## ✨ 特性

- 🚀 **高性能**: 基于 Bun 运行时，提供极速的启动和运行性能
- 🔌 **WebSocket 支持**: 实时双向通信，支持流式响应
- 🎯 **多提供商**: 支持多种 AI 服务提供商（OpenAI、Anthropic、Google、Groq 等）
- 📦 **模块化设计**: 可插拔的提供商架构，易于扩展
- 🔐 **安全认证**: 内置 JWT 和 Bearer 令牌认证
- 📊 **监控指标**: 内置性能监控和健康检查
- 📚 **API 文档**: 自动生成的 Swagger 文档
- 🎤 **语音识别**: 支持多种 ASR 服务（Doubao Stream 等）
- 🗣️ **语音合成**: 支持多种 TTS 服务
- 🧠 **多模态**: 支持 vLLM 图像理解能力
- 💾 **记忆管理**: 支持对话上下文记忆（Redis/文件存储）
- 🎯 **意图识别**: 智能识别用户意图

## 📋 目录结构

```
elysia-server/
├── src/
│   ├── index.ts              # 主入口
│   ├── chat/                 # 对话模块
│   │   ├── context-provider.ts
│   │   ├── dialogue.ts
│   │   ├── handler.ts
│   │   ├── message.ts
│   │   └── prompt-manager.ts
│   ├── config/               # 配置管理
│   │   ├── config.ts
│   │   ├── env.ts
│   │   └── loader.ts
│   ├── core/                 # 核心功能
│   │   ├── connection.ts
│   │   ├── server.ts
│   │   └── websocket.ts
│   ├── middleware/           # 中间件
│   │   ├── auth.ts
│   │   ├── error.ts
│   │   ├── metrics.ts
│   │   └── rate-limit.ts
│   ├── providers/            # AI 服务提供商
│   │   ├── asr/             # 自动语音识别
│   │   ├── intent/          # 意图识别
│   │   ├── llm/             # 大语言模型
│   │   ├── memory/          # 记忆管理
│   │   ├── tools/           # 工具调用
│   │   ├── tts/             # 语音合成
│   │   ├── vad/             # 语音活动检测
│   │   └── vllm/            # 视觉语言模型
│   ├── routes/              # API 路由
│   └── utils/               # 工具函数
├── data/                    # 数据目录
├── models/                  # 模型文件
├── prompts/                 # 提示词模板
└── tmp/                     # 临时文件
```

## 🚀 快速开始

### 前置要求

- [Bun](https://bun.sh) >= 1.0
- Node.js >= 18 (可选，用于某些依赖)
- Redis (可选，用于 Memory 存储)

### 安装

```bash
# 安装依赖
bun install
```

### 配置

1. 复制示例配置文件：
```bash
cp .env.example .env.production
```

2. 编辑 `.env.production` 文件，配置你的 API 密钥和服务设置：

```env
# 服务器配置
SERVER_IP=0.0.0.0
SERVER_PORT=8300
SERVER_HTTP_PORT=8000

# 选择使用的模块
SELECTED_VAD=SileroVAD
SELECTED_ASR=DoubaoStreamASR
SELECTED_LLM=OpenAI
SELECTED_TTS=EdgeTTS
SELECTED_MEMORY=Redis
SELECTED_INTENT=LLM

# LLM 配置 (OpenAI)
LLM_OPENAI_API_KEY=your_openai_api_key
LLM_OPENAI_MODEL=gpt-4o-mini
LLM_OPENAI_BASE_URL=https://api.openai.com/v1

# ASR 配置 (Doubao Stream)
ASR_DOUBAOSTREAM_APPID=your_app_id
ASR_DOUBAOSTREAM_ACCESS_TOKEN=your_token
ASR_DOUBAOSTREAM_CLUSTER=your_cluster

# Memory 配置 (Redis)
MEMORY_REDIS_HOST=localhost
MEMORY_REDIS_PORT=6379
```

### 运行

```bash
# 开发模式（热重载）
bun run dev

# 生产模式
bun run start

# 构建
bun run build
```

服务启动后，你可以访问：

- 🌐 HTTP API: `http://localhost:8300`
- 🔌 WebSocket: `ws://localhost:8300/ws/v1`
- 📚 API 文档: `http://localhost:8300/swagger`
- 📊 监控指标: `http://localhost:8300/metrics`
- 🏥 健康检查: `http://localhost:8300/health`

## 📚 API 端点

### HTTP API

#### LLM 相关
- `POST /api/v1/llm/chat` - 聊天对话
- `POST /api/v1/llm/chat-stream` - 流式聊天对话
- `GET /api/v1/llm/models` - 获取可用模型列表

#### ASR 相关
- `POST /api/v1/asr/recognize` - 语音识别（文件上传）
- `POST /api/v1/asr/recognize-stream` - 流式语音识别

#### TTS 相关
- `POST /api/v1/tts/synthesize` - 文本转语音
- `GET /api/v1/tts/voices` - 获取可用语音列表

#### vLLM 相关
- `POST /api/v1/vllm/vision` - 图像理解

#### Intent 相关
- `POST /api/v1/intent/recognize` - 识别用户意图

#### Memory 相关
- `GET /api/v1/memory/:userId` - 获取用户记忆
- `POST /api/v1/memory/:userId` - 保存对话记忆
- `DELETE /api/v1/memory/:userId` - 清除用户记忆

#### 工具相关
- `POST /api/v1/tools/execute` - 执行工具调用

### WebSocket API

连接到 `ws://localhost:8300/ws/v1`

支持的消息类型：

```typescript
// 发送消息
{
  "type": "chat",
  "userId": "user123",
  "content": "你好",
  "stream": true
}

// 接收消息
{
  "type": "response",
  "content": "你好！有什么我可以帮助你的吗？",
  "done": false
}
```

## 🎯 支持的提供商

### LLM 提供商
- **OpenAI**: GPT-4, GPT-3.5
- **Anthropic**: Claude-3 系列
- **Google**: Gemini 系列
- **Groq**: Llama、Mixtral 等
- **Moonshot**: Moonshot 模型
- **Doubao**: 豆包模型
- **Ollama**: 本地模型

### ASR 提供商
- **Doubao Stream**: 火山引擎豆包流式语音识别
- **OpenAI Whisper**: OpenAI 语音识别

### TTS 提供商
- **Edge TTS**: Microsoft Edge 语音合成
- **Doubao TTS**: 火山引擎豆包语音合成

### VAD 提供商
- **Silero VAD**: 基于 ONNX 的语音活动检测
- **Simple VAD**: 简单的基于能量的 VAD

### Memory 提供商
- **Redis**: 基于 Redis 的记忆存储
- **File**: 基于文件的记忆存储

### Intent 提供商
- **LLM**: 基于大语言模型的意图识别
- **Rule**: 基于规则的意图识别

## 🔧 配置说明

### 环境变量

完整的环境变量列表请参考 `.env.example` 文件。主要配置项包括：

- **服务器配置**: IP、端口、认证等
- **日志配置**: 日志级别、日志目录等
- **模块选择**: 选择使用哪些 AI 服务提供商
- **提供商配置**: 各个提供商的 API 密钥和参数

### 提示词模板

提示词模板位于 `prompts/` 目录：

- `agent-base.txt`: 基础 Agent 提示词
- `roles.json`: 角色定义和系统提示词

你可以根据需要修改这些模板来定制 AI 的行为。

## 🧪 测试

```bash
# 运行测试
bun test

# 运行特定测试文件
bun test src/features.test.ts
```

## 📊 性能优化

服务器内置了多项性能优化：

- **连接池管理**: 自动管理和清理长时间未活动的连接
- **内存优化**: 定期清理临时文件和缓存
- **请求限流**: 防止 API 滥用
- **指标监控**: 实时监控服务性能

## 🔐 安全

- **JWT 认证**: 支持基于 JWT 的认证
- **Bearer Token**: 支持 Bearer 令牌认证
- **设备白名单**: 支持基于设备 ID 的访问控制
- **CORS 配置**: 可配置的跨域资源共享
- **请求限流**: 防止 DDoS 攻击

## 📝 开发

### 代码规范

```bash
# 代码检查
bun run lint
```

### 目录约定

- `src/providers/`: 所有 AI 服务提供商的实现
- `src/routes/`: API 路由定义
- `src/middleware/`: 中间件
- `src/utils/`: 工具函数
- `src/types/`: TypeScript 类型定义

### 添加新的提供商

1. 在对应的 `providers/` 子目录创建新文件
2. 实现提供商接口
3. 在 `providers/index.ts` 中注册
4. 在 `config/env.ts` 中添加配置
5. 更新类型定义

## 🤝 与 Python 服务器的关系

本项目是 Python AI 服务器的 TypeScript/Bun 重写版本，主要改进：

- ✅ 更快的启动速度和运行性能
- ✅ 更好的类型安全（TypeScript）
- ✅ 更简洁的代码结构
- ✅ 更现代的开发体验
- ✅ 更好的 WebSocket 支持

配置文件格式与 Python 版本兼容，可以共享模型文件和提示词模板。

## 📄 许可

[MIT License](../LICENSE)

## 🙏 致谢

- [Bun](https://bun.sh) - 极速的 JavaScript 运行时
- [Elysia](https://elysiajs.com) - 人体工程学的 Web 框架
- 各大 AI 服务提供商

## 📮 联系方式

如有问题或建议，请提交 Issue 或 Pull Request。
