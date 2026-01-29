<div align="center">

# 🤖 Elysia AI Server

**现代化、高性能的 AI 服务平台**

基于 Bun 和 Elysia 构建 · 支持多模态 AI 能力 · WebSocket 实时通信

[![Bun](https://img.shields.io/badge/Bun-%23000000.svg?style=flat&logo=bun&logoColor=white)](https://bun.sh)
[![TypeScript](https://img.shields.io/badge/TypeScript-%23007ACC.svg?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Elysia](https://img.shields.io/badge/Elysia-Framework-blueviolet)](https://elysiajs.com)

[快速开始](#-快速开始) · [API 文档](#-api-端点) · [配置指南](#-配置说明) · [提供商](#-提供商支持)

</div>

---

## 📖 简介

Elysia AI Server 是一个企业级的 AI 服务平台，提供统一的接口来访问多种 AI 能力。无论是对话、语音识别、语音合成还是图像理解，都可以通过简单的 REST API 或 WebSocket 接口来使用。

### ✨ 核心特性

#### 🚀 性能卓越
- **极速启动**: 基于 Bun 运行时，毫秒级启动
- **高并发**: 支持数千并发连接
- **流式处理**: 实时流式响应，降低延迟

#### 🔌 实时通信
- **WebSocket 支持**: 双向实时通信
- **流式响应**: 支持 Server-Sent Events (SSE)
- **连接管理**: 自动处理连接池和重连

#### 🎯 多提供商集成
- **灵活切换**: 运行时动态切换 AI 提供商
- **统一接口**: 一致的 API，支持 10+ 提供商
- **智能路由**: 自动选择最佳提供商

#### 📦 模块化架构
- **可插拔设计**: 独立的提供商模块
- **易于扩展**: 简单添加新的 AI 服务
- **配置驱动**: 通过配置文件控制行为

#### 🔐 企业级安全
- **多种认证**: JWT、Bearer Token、设备白名单
- **访问控制**: 细粒度的权限管理
- **请求限流**: 防止滥用和攻击

#### 📊 可观测性
- **性能监控**: 实时监控关键指标
- **健康检查**: 服务健康状态检查
- **日志系统**: 结构化日志记录

---

## 🎯 AI 能力矩阵

| 能力         | 描述           | 支持的提供商                                              |
| ------------ | -------------- | --------------------------------------------------------- |
| 💬 **LLM**    | 大语言模型对话 | OpenAI, Anthropic, Gemini, Groq, Moonshot, Doubao, Ollama |
| 🎤 **ASR**    | 自动语音识别   | Doubao Stream, OpenAI Whisper                             |
| 🗣️ **TTS**    | 文本转语音     | Edge TTS, Doubao TTS                                      |
| 👁️ **vLLM**   | 视觉语言模型   | OpenAI, Anthropic                                         |
| 🧠 **Memory** | 对话记忆管理   | Redis, Local File                                         |
| 🎯 **Intent** | 意图识别       | LLM-based, Rule-based                                     |
| 🔊 **VAD**    | 语音活动检测   | Silero VAD, Simple VAD                                    |
| 🛠️ **Tools**  | 工具调用       | Function Calling, MCP                                     |

---

## 📁 项目结构

```
server/
├── 📄 config.yaml              # 主配置文件
├── 📄 package.json             # 项目依赖
├── 📂 src/                     # 源代码
│   ├── 📄 index.ts            # 应用入口
│   ├── 📄 config.ts           # 配置管理
│   ├── 📄 router.ts           # 路由定义
│   ├── 📄 websocket.ts        # WebSocket 处理
│   ├── 📄 middleware.ts       # 中间件
│   ├── 📄 providers.ts        # 提供商注册
│   │
│   ├── 📂 chat/               # 💬 对话模块
│   │   ├── context-provider.ts   # 上下文管理
│   │   ├── dialogue.ts            # 对话逻辑
│   │   ├── handler.ts             # 请求处理
│   │   ├── message.ts             # 消息处理
│   │   └── prompt-manager.ts     # 提示词管理
│   │
│   ├── 📂 mcp/                # 🔧 MCP 工具系统
│   │   ├── mcp-base.ts            # MCP 基础类
│   │   ├── mcp-executor.ts        # 工具执行器
│   │   ├── mcp-registry.ts        # 工具注册表
│   │   └── tools/                 # 内置工具
│   │
│   ├── 📂 models/             # 🤖 模型适配器
│   │   ├── model-base.ts          # 模型基类
│   │   ├── model-factory.ts       # 模型工厂
│   │   └── adapters/              # 各平台适配器
│   │       ├── openai.ts
│   │       ├── anthropic.ts
│   │       └── gemini.ts
│   │
│   ├── 📂 providers/          # 🎯 AI 服务提供商
│   │   ├── asr/               # 🎤 语音识别
│   │   │   ├── base.ts
│   │   │   ├── index.ts
│   │   │   └── doubao_stream.ts
│   │   ├── intent/            # 🎯 意图识别
│   │   │   ├── base.ts
│   │   │   ├── index.ts
│   │   │   ├── function_call/
│   │   │   ├── intent_llm/
│   │   │   └── nointent/
│   │   ├── llm/               # 💬 大语言模型
│   │   │   ├── base.ts
│   │   │   ├── index.ts
│   │   │   └── openai.ts
│   │   ├── memory/            # 🧠 记忆管理
│   │   │   ├── base.ts
│   │   │   ├── index.ts
│   │   │   ├── mem_local_short/
│   │   │   ├── mem0ai/
│   │   │   └── nomem/
│   │   ├── tts/               # 🗣️ 语音合成
│   │   │   ├── base.ts
│   │   │   ├── index.ts
│   │   │   └── huoshan_stream.ts
│   │   ├── vad/               # 🔊 语音活动检测
│   │   │   ├── base.ts
│   │   │   ├── index.ts
│   │   │   └── silero.ts
│   │   └── vllm/              # 👁️ 视觉语言模型
│   │       ├── base.ts
│   │       ├── index.ts
│   │       └── openai.ts
│   │
│   ├── 📂 types/              # 📝 TypeScript 类型
│   │   ├── api.ts
│   │   ├── config.ts
│   │   ├── mcp.ts
│   │   ├── models.ts
│   │   ├── providers.ts
│   │   └── vad.ts
│   │
│   └── 📂 utils/              # 🔧 工具函数
│       ├── cache.ts               # 缓存管理
│       ├── factory.ts             # 工厂模式
│       ├── helpers.ts             # 辅助函数
│       ├── logger.ts              # 日志系统
│       └── optimize.ts            # 性能优化
│
├── 📂 data/                   # 数据存储目录
├── 📂 models/                 # AI 模型文件
│   ├── SenseVoiceSmall/
│   └── snakers4_silero-vad/
├── 📂 music/                  # 音频资源
├── 📂 prompts/                # 提示词模板
│   ├── agent-base.txt
│   └── roles.json
└── 📂 tmp/                    # 临时文件
```

---

## 🚀 快速开始

### 📋 系统要求

- **Bun** >= 1.0.0 - [安装指南](https://bun.sh)
- **Node.js** >= 18 (可选) - 用于某些依赖
- **Redis** (可选) - 用于高级记忆存储

### 📦 安装依赖

```bash
# 克隆项目
git clone <repository-url>
cd server

# 安装依赖
bun install
```

### ⚙️ 配置服务

#### 方式一：使用环境变量

1. 复制示例配置：
```bash
cp .env.example .env.production
```

2. 编辑配置文件：
```bash
nano .env.production
```

3. 配置必要的选项：

```env
# 🌐 服务器配置
SERVER_IP=0.0.0.0
SERVER_PORT=8300
SERVER_HTTP_PORT=8000

# 🎯 选择使用的 AI 模块
SELECTED_VAD=SileroVAD           # 语音活动检测
SELECTED_ASR=DoubaoStreamASR     # 语音识别
SELECTED_LLM=OpenAI              # 大语言模型
SELECTED_TTS=EdgeTTS             # 语音合成
SELECTED_MEMORY=Redis            # 记忆存储
SELECTED_INTENT=LLM              # 意图识别

# 🤖 LLM 配置 (OpenAI)
LLM_OPENAI_API_KEY=sk-xxx...
LLM_OPENAI_MODEL=gpt-4o-mini
LLM_OPENAI_BASE_URL=https://api.openai.com/v1

# 🎤 ASR 配置 (Doubao Stream)
ASR_DOUBAOSTREAM_APPID=your_app_id
ASR_DOUBAOSTREAM_ACCESS_TOKEN=your_token
ASR_DOUBAOSTREAM_CLUSTER=your_cluster

# 🧠 Memory 配置 (Redis)
MEMORY_REDIS_HOST=localhost
MEMORY_REDIS_PORT=6379
MEMORY_REDIS_PASSWORD=          # 留空表示无密码
```

#### 方式二：使用 YAML 配置

编辑 `config.yaml` 文件来配置服务器。

### 🎬 启动服务

```bash
# 开发模式（支持热重载）
bun run dev

# 生产模式
bun run start

# 构建项目
bun run build
```

### ✅ 验证安装

服务启动后，访问以下地址验证：

| 服务        | 地址                          | 说明               |
| ----------- | ----------------------------- | ------------------ |
| 🏥 健康检查  | http://localhost:8300/health  | 查看服务状态       |
| 📚 API 文档  | http://localhost:8300/swagger | Swagger 交互式文档 |
| 📊 监控指标  | http://localhost:8300/metrics | 性能监控数据       |
| 🔌 WebSocket | ws://localhost:8300/ws/v1     | WebSocket 连接端点 |

### 🧪 测试 API

```bash
# 测试 LLM 对话
curl -X POST http://localhost:8300/api/v1/llm/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "你好"}
    ]
  }'

# 测试健康检查
curl http://localhost:8300/health
```

---

## 📚 API 端点

### 🔐 认证

大多数 API 端点需要认证。支持以下方式：

```bash
# Bearer Token
Authorization: Bearer your-token-here

# JWT Token
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

### 💬 LLM - 大语言模型

#### 对话聊天

<details>
<summary><code>POST /api/v1/llm/chat</code></summary>

**请求体:**
```json
{
  "messages": [
    {"role": "system", "content": "你是一个有帮助的助手"},
    {"role": "user", "content": "介绍一下自己"}
  ],
  "model": "gpt-4o-mini",
  "temperature": 0.7,
  "max_tokens": 2000
}
```

**响应:**
```json
{
  "id": "chatcmpl-xxx",
  "model": "gpt-4o-mini",
  "choices": [{
    "message": {
      "role": "assistant",
      "content": "我是 AI 助手..."
    },
    "finish_reason": "stop"
  }]
}
```
</details>

#### 流式对话

<details>
<summary><code>POST /api/v1/llm/chat-stream</code></summary>

**请求体:** 与 `/chat` 相同

**响应:** Server-Sent Events (SSE)
```
data: {"choices":[{"delta":{"content":"我"}}]}

data: {"choices":[{"delta":{"content":"是"}}]}

data: {"choices":[{"delta":{"content":"AI"}}]}

data: [DONE]
```
</details>

#### 获取模型列表

<details>
<summary><code>GET /api/v1/llm/models</code></summary>

**响应:**
```json
{
  "models": [
    {
      "id": "gpt-4o-mini",
      "name": "GPT-4O Mini",
      "provider": "openai"
    },
    {
      "id": "claude-3-5-sonnet",
      "name": "Claude 3.5 Sonnet",
      "provider": "anthropic"
    }
  ]
}
```
</details>

---

### 🎤 ASR - 语音识别

#### 文件上传识别

<details>
<summary><code>POST /api/v1/asr/recognize</code></summary>

**请求:** multipart/form-data
```bash
curl -X POST http://localhost:8300/api/v1/asr/recognize \
  -F "audio=@audio.wav" \
  -F "language=zh-CN"
```

**响应:**
```json
{
  "text": "这是识别出的文本内容",
  "duration": 3.5,
  "language": "zh-CN"
}
```
</details>

#### 流式识别

<details>
<summary><code>POST /api/v1/asr/recognize-stream</code></summary>

支持实时音频流识别。使用 WebSocket 连接以获得最佳性能。
</details>

---

### 🗣️ TTS - 语音合成

#### 文本转语音

<details>
<summary><code>POST /api/v1/tts/synthesize</code></summary>

**请求体:**
```json
{
  "text": "你好，世界",
  "voice": "zh-CN-XiaoxiaoNeural",
  "rate": 1.0,
  "format": "mp3"
}
```

**响应:** 音频文件（二进制流）
</details>

#### 获取可用语音

<details>
<summary><code>GET /api/v1/tts/voices</code></summary>

**响应:**
```json
{
  "voices": [
    {
      "id": "zh-CN-XiaoxiaoNeural",
      "name": "晓晓",
      "gender": "Female",
      "locale": "zh-CN"
    }
  ]
}
```
</details>

---

### 👁️ vLLM - 视觉语言模型

#### 图像理解

<details>
<summary><code>POST /api/v1/vllm/vision</code></summary>

**请求体:**
```json
{
  "model": "gpt-4o",
  "messages": [
    {
      "role": "user",
      "content": [
        {"type": "text", "text": "这张图片里有什么？"},
        {
          "type": "image_url",
          "image_url": {
            "url": "https://example.com/image.jpg"
          }
        }
      ]
    }
  ]
}
```

**响应:**
```json
{
  "description": "图片中显示...",
  "objects": ["人", "建筑", "天空"]
}
```
</details>

---

### 🎯 Intent - 意图识别

<details>
<summary><code>POST /api/v1/intent/recognize</code></summary>

**请求体:**
```json
{
  "text": "明天天气怎么样",
  "userId": "user123"
}
```

**响应:**
```json
{
  "intent": "weather_query",
  "confidence": 0.95,
  "entities": {
    "time": "明天"
  }
}
```
</details>

---

### 🧠 Memory - 记忆管理

#### 获取记忆

<details>
<summary><code>GET /api/v1/memory/:userId</code></summary>

**响应:**
```json
{
  "userId": "user123",
  "conversations": [
    {
      "timestamp": "2026-01-29T10:00:00Z",
      "messages": [...]
    }
  ],
  "summary": "用户最近讨论了..."
}
```
</details>

#### 保存记忆

<details>
<summary><code>POST /api/v1/memory/:userId</code></summary>

**请求体:**
```json
{
  "messages": [
    {"role": "user", "content": "记住我喜欢咖啡"},
    {"role": "assistant", "content": "好的，我会记住的"}
  ]
}
```
</details>

#### 清除记忆

<details>
<summary><code>DELETE /api/v1/memory/:userId</code></summary>

**响应:**
```json
{
  "success": true,
  "message": "记忆已清除"
}
```
</details>

---

### 🛠️ Tools - 工具调用

<details>
<summary><code>POST /api/v1/tools/execute</code></summary>

**请求体:**
```json
{
  "tool": "web_search",
  "arguments": {
    "query": "最新的 AI 新闻",
    "limit": 5
  }
}
```

**响应:**
```json
{
  "result": {
    "results": [
      {
        "title": "...",
        "url": "...",
        "snippet": "..."
      }
    ]
  }
}
```
</details>

---

### 🔌 WebSocket API

连接到 `ws://localhost:8300/ws/v1` 进行实时通信。

#### 消息格式

**发送消息:**
```json
{
  "type": "chat",
  "userId": "user123",
  "content": "你好，世界",
  "stream": true
}
```

**接收消息:**
```json
{
  "type": "response",
  "content": "你好！",
  "done": false
}
```

#### 支持的消息类型

| 类型     | 说明                        |
| -------- | --------------------------- |
| `chat`   | 文本对话                    |
| `audio`  | 音频数据                    |
| `voice`  | 语音对话（ASR + LLM + TTS） |
| `vision` | 图像理解                    |
| `ping`   | 保持连接                    |

#### WebSocket 示例

```javascript
const ws = new WebSocket('ws://localhost:8300/ws/v1');

ws.onopen = () => {
  ws.send(JSON.stringify({
    type: 'chat',
    userId: 'user123',
    content: '你好',
    stream: true
  }));
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('收到:', data.content);
};
```

---

## 🎯 提供商支持

### 💬 LLM - 大语言模型

<table>
<tr>
<th>提供商</th>
<th>支持的模型</th>
<th>特性</th>
<th>配置前缀</th>
</tr>

<tr>
<td><strong>OpenAI</strong></td>
<td>
• GPT-4o / GPT-4o-mini<br>
• GPT-4 Turbo<br>
• GPT-3.5 Turbo
</td>
<td>
✅ 流式输出<br>
✅ 函数调用<br>
✅ 视觉理解
</td>
<td><code>LLM_OPENAI_</code></td>
</tr>

<tr>
<td><strong>Anthropic</strong></td>
<td>
• Claude 3.5 Sonnet<br>
• Claude 3 Opus/Sonnet/Haiku
</td>
<td>
✅ 流式输出<br>
✅ 长上下文 (200K)<br>
✅ 视觉理解
</td>
<td><code>LLM_ANTHROPIC_</code></td>
</tr>

<tr>
<td><strong>Google</strong></td>
<td>
• Gemini 1.5 Pro/Flash<br>
• Gemini 1.0 Pro
</td>
<td>
✅ 流式输出<br>
✅ 多模态<br>
✅ 长上下文
</td>
<td><code>LLM_GEMINI_</code></td>
</tr>

<tr>
<td><strong>Groq</strong></td>
<td>
• Llama 3.1 (70B/8B)<br>
• Mixtral 8x7B<br>
• Gemma 7B
</td>
<td>
✅ 超高速推理<br>
✅ 流式输出<br>
✅ 开源模型
</td>
<td><code>LLM_GROQ_</code></td>
</tr>

<tr>
<td><strong>Moonshot</strong></td>
<td>
• Moonshot-v1 (8K/32K/128K)
</td>
<td>
✅ 中文优化<br>
✅ 长上下文<br>
✅ 流式输出
</td>
<td><code>LLM_MOONSHOT_</code></td>
</tr>

<tr>
<td><strong>Doubao (豆包)</strong></td>
<td>
• 豆包系列模型
</td>
<td>
✅ 中文优化<br>
✅ 低延迟<br>
✅ 价格优惠
</td>
<td><code>LLM_DOUBAO_</code></td>
</tr>

<tr>
<td><strong>Ollama</strong></td>
<td>
• 本地模型 (Llama, Mistral, 等)
</td>
<td>
✅ 完全本地运行<br>
✅ 隐私保护<br>
✅ 无 API 费用
</td>
<td><code>LLM_OLLAMA_</code></td>
</tr>
</table>

---

### 🎤 ASR - 语音识别

| 提供商             | 特性                       | 支持语言   | 配置前缀            |
| ------------------ | -------------------------- | ---------- | ------------------- |
| **Doubao Stream**  | 流式识别、低延迟、高准确率 | 中文、英文 | `ASR_DOUBAOSTREAM_` |
| **OpenAI Whisper** | 高精度、多语言、标点恢复   | 99+ 语言   | `ASR_WHISPER_`      |

---

### 🗣️ TTS - 语音合成

| 提供商         | 特性                 | 支持语音   | 配置前缀      |
| -------------- | -------------------- | ---------- | ------------- |
| **Edge TTS**   | 免费、高质量、多音色 | 400+ 语音  | `TTS_EDGE_`   |
| **Doubao TTS** | 低延迟、流式合成     | 中英文语音 | `TTS_DOUBAO_` |

---

### 👁️ vLLM - 视觉语言模型

| 提供商        | 支持的模型                        | 配置前缀          |
| ------------- | --------------------------------- | ----------------- |
| **OpenAI**    | GPT-4o, GPT-4o-mini, GPT-4-vision | `VLLM_OPENAI_`    |
| **Anthropic** | Claude 3.5 Sonnet, Claude 3 Opus  | `VLLM_ANTHROPIC_` |

---

### 🧠 Memory - 记忆管理

| 提供商         | 存储方式    | 特性                   | 配置前缀        |
| -------------- | ----------- | ---------------------- | --------------- |
| **Redis**      | 内存数据库  | 高性能、持久化、分布式 | `MEMORY_REDIS_` |
| **Local File** | 本地文件    | 简单、无依赖           | `MEMORY_LOCAL_` |
| **Mem0**       | AI 增强记忆 | 智能摘要、长期记忆     | `MEMORY_MEM0_`  |

---

### 🎯 Intent - 意图识别

| 提供商            | 实现方式      | 特性                     | 配置前缀       |
| ----------------- | ------------- | ------------------------ | -------------- |
| **LLM-based**     | 使用 LLM 识别 | 灵活、准确、支持复杂意图 | `INTENT_LLM_`  |
| **Rule-based**    | 规则匹配      | 快速、精确、可控         | `INTENT_RULE_` |
| **Function Call** | 函数调用      | 结构化输出、工具集成     | `INTENT_FUNC_` |

---

### 🔊 VAD - 语音活动检测

| 提供商         | 实现方式 | 特性             | 配置前缀      |
| -------------- | -------- | ---------------- | ------------- |
| **Silero VAD** | 深度学习 | 高准确率、低延迟 | `VAD_SILERO_` |
| **Simple VAD** | 能量检测 | 轻量级、快速     | `VAD_SIMPLE_` |

---

## ⚙️ 配置说明

### 📝 配置文件

项目支持多种配置方式：

1. **环境变量文件** (`.env.production`)
2. **YAML 配置文件** (`config.yaml`)
3. **环境变量** (直接设置)

优先级：环境变量 > `.env` 文件 > `config.yaml`

### 🔧 核心配置项

#### 服务器配置

```env
# 服务器监听地址
SERVER_IP=0.0.0.0              # 监听所有网卡
SERVER_PORT=8300               # 主服务端口
SERVER_HTTP_PORT=8000          # HTTP 服务端口（可选）

# 跨域配置
CORS_ORIGIN=*                  # 允许的源，* 表示所有

# 日志配置
LOG_LEVEL=info                 # 日志级别: debug, info, warn, error
LOG_DIR=./logs                 # 日志目录
```

#### 认证配置

```env
# JWT 配置
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=7d              # Token 有效期

# Bearer Token（简单认证）
BEARER_TOKEN=your-bearer-token

# 设备白名单
DEVICE_WHITELIST=device1,device2,device3
```

#### 性能优化

```env
# 连接池配置
MAX_CONNECTIONS=1000           # 最大连接数
CONNECTION_TIMEOUT=300000      # 连接超时（毫秒）

# 内存优化
ENABLE_CACHE=true              # 启用缓存
CACHE_SIZE=100                 # 缓存大小（MB）

# 请求限流
RATE_LIMIT_MAX=100             # 每分钟最大请求数
RATE_LIMIT_WINDOW=60000        # 限流窗口（毫秒）
```

### 🤖 提供商配置示例

<details>
<summary><strong>OpenAI 配置</strong></summary>

```env
SELECTED_LLM=OpenAI

LLM_OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxx
LLM_OPENAI_MODEL=gpt-4o-mini
LLM_OPENAI_BASE_URL=https://api.openai.com/v1
LLM_OPENAI_TEMPERATURE=0.7
LLM_OPENAI_MAX_TOKENS=4096
```
</details>

<details>
<summary><strong>Anthropic 配置</strong></summary>

```env
SELECTED_LLM=Anthropic

LLM_ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxx
LLM_ANTHROPIC_MODEL=claude-3-5-sonnet-20241022
LLM_ANTHROPIC_MAX_TOKENS=4096
```
</details>

<details>
<summary><strong>Redis 记忆配置</strong></summary>

```env
SELECTED_MEMORY=Redis

MEMORY_REDIS_HOST=localhost
MEMORY_REDIS_PORT=6379
MEMORY_REDIS_PASSWORD=your_password
MEMORY_REDIS_DB=0
MEMORY_REDIS_TTL=604800        # 7天过期
```
</details>

<details>
<summary><strong>Doubao ASR 配置</strong></summary>

```env
SELECTED_ASR=DoubaoStreamASR

ASR_DOUBAOSTREAM_APPID=your_app_id
ASR_DOUBAOSTREAM_ACCESS_TOKEN=your_access_token
ASR_DOUBAOSTREAM_CLUSTER=volcengine_streaming_common
ASR_DOUBAOSTREAM_FORMAT=pcm    # 音频格式
ASR_DOUBAOSTREAM_SAMPLE_RATE=16000
```
</details>

<details>
<summary><strong>Edge TTS 配置</strong></summary>

```env
SELECTED_TTS=EdgeTTS

TTS_EDGE_VOICE=zh-CN-XiaoxiaoNeural
TTS_EDGE_RATE=+0%              # 语速：-50% 到 +100%
TTS_EDGE_VOLUME=+0%            # 音量：-50% 到 +100%
TTS_EDGE_PITCH=+0Hz            # 音调
```
</details>

### 📂 提示词配置

提示词模板位于 `prompts/` 目录：

**agent-base.txt** - 基础 Agent 提示词
```
你是一个有帮助的 AI 助手。
你需要：
1. 理解用户意图
2. 提供准确的信息
3. 保持友好的态度
...
```

**roles.json** - 角色定义
```json
{
  "assistant": {
    "name": "AI助手",
    "description": "通用助手",
    "prompt": "你是一个..."
  },
  "translator": {
    "name": "翻译助手",
    "description": "专业翻译",
    "prompt": "你是一个专业的翻译..."
  }
}
```

### 🔍 配置验证

启动服务后，可以通过健康检查端点验证配置：

```bash
curl http://localhost:8300/health
```

响应示例：
```json
{
  "status": "healthy",
  "timestamp": "2026-01-29T10:00:00Z",
  "version": "1.0.0",
  "services": {
    "llm": "OpenAI (gpt-4o-mini)",
    "asr": "DoubaoStreamASR",
    "tts": "EdgeTTS",
    "memory": "Redis",
    "vad": "SileroVAD"
  }
}
```

---

## 🧪 测试与调试

### 运行测试

```bash
# 运行所有测试
bun test

# 运行特定测试文件
bun test src/features.test.ts

# 运行测试并生成覆盖率报告
bun test --coverage

# 监听模式（自动重新运行）
bun test --watch
```

### 调试模式

```bash
# 启用详细日志
LOG_LEVEL=debug bun run dev

# 启用性能分析
ENABLE_PROFILING=true bun run dev
```

### 使用 API 测试工具

推荐使用以下工具测试 API：

- **cURL**: 命令行测试
- **Postman**: 图形界面测试
- **Thunder Client**: VS Code 插件
- **HTTPie**: 更友好的命令行工具

---

## 📊 性能优化

服务器内置了多项性能优化机制：

### 🔄 连接池管理

- **自动清理**: 定期清理长时间未活动的连接
- **连接复用**: 复用 HTTP 连接，减少握手开销
- **限流保护**: 防止连接耗尽

### 💾 内存优化

- **自动清理**: 定期清理临时文件和过期缓存
- **流式处理**: 大文件使用流式传输，避免内存溢出
- **智能缓存**: LRU 缓存策略，自动淘汰旧数据

### ⚡ 请求优化

- **并发限制**: 控制同时处理的请求数
- **请求队列**: 排队处理高负载请求
- **超时控制**: 防止长时间阻塞

### 📈 监控指标

访问 `/metrics` 端点查看实时性能数据：

```json
{
  "uptime": 3600,
  "memory": {
    "used": 234.5,
    "total": 512.0,
    "percentage": 45.8
  },
  "requests": {
    "total": 1234,
    "success": 1200,
    "error": 34,
    "rate": 20.5
  },
  "connections": {
    "active": 45,
    "idle": 5,
    "total": 50
  }
}
```

---

## 🔐 安全最佳实践

### 认证与授权

#### JWT 认证（推荐）

```typescript
// 生成 Token
const token = jwt.sign(
  { userId: 'user123', role: 'user' },
  process.env.JWT_SECRET,
  { expiresIn: '7d' }
);

// 使用 Token
fetch('http://localhost:8300/api/v1/llm/chat', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

#### Bearer Token 认证（简单场景）

```env
BEARER_TOKEN=your-secret-token-here
```

```bash
curl -H "Authorization: Bearer your-secret-token-here" \
  http://localhost:8300/api/v1/llm/chat
```

#### 设备白名单

```env
ENABLE_DEVICE_WHITELIST=true
DEVICE_WHITELIST=device-id-1,device-id-2,device-id-3
```

### API 密钥管理

⚠️ **重要安全提示：**

1. ✅ 永远不要在代码中硬编码 API 密钥
2. ✅ 使用环境变量存储敏感信息
3. ✅ 定期轮换 API 密钥
4. ✅ 限制 API 密钥的权限范围
5. ✅ 监控 API 密钥的使用情况

### 网络安全

```env
# 启用 HTTPS（生产环境必须）
ENABLE_HTTPS=true
SSL_CERT_PATH=/path/to/cert.pem
SSL_KEY_PATH=/path/to/key.pem

# 配置 CORS
CORS_ORIGIN=https://your-domain.com
CORS_METHODS=GET,POST,PUT,DELETE
CORS_CREDENTIALS=true

# 请求大小限制
MAX_REQUEST_SIZE=10mb
MAX_UPLOAD_SIZE=50mb
```

### 请求限流

```env
# 限流配置
ENABLE_RATE_LIMIT=true
RATE_LIMIT_MAX=100              # 每窗口最大请求数
RATE_LIMIT_WINDOW=60000         # 窗口大小（毫秒）
RATE_LIMIT_SKIP_SUCCESS=false   # 是否跳过成功请求
```

---

## 💻 开发指南

### 🎨 代码规范

```bash
# 代码检查
bun run lint

# 代码格式化
bun run format

# 类型检查
bun run type-check
```

### 📁 项目约定

**目录结构约定：**
- `src/providers/`: AI 服务提供商实现
- `src/chat/`: 对话相关逻辑
- `src/mcp/`: MCP 工具系统
- `src/models/`: 模型适配器
- `src/types/`: TypeScript 类型定义
- `src/utils/`: 通用工具函数

**命名约定：**
- 文件名使用 kebab-case: `my-file.ts`
- 类名使用 PascalCase: `MyClass`
- 函数/变量使用 camelCase: `myFunction`
- 常量使用 UPPER_SNAKE_CASE: `MAX_SIZE`

### 🔌 添加新提供商

以添加新的 LLM 提供商为例：

#### 1. 创建提供商文件

创建 `src/providers/llm/my-provider.ts`:

```typescript
import { LLMProvider } from './base';
import type { ChatMessage, ChatResponse } from '../../types/api';

export class MyLLMProvider extends LLMProvider {
  name = 'MyProvider';

  async chat(messages: ChatMessage[]): Promise<ChatResponse> {
    // 实现对话逻辑
    const response = await fetch(this.config.baseUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ messages })
    });

    return response.json();
  }

  async *chatStream(messages: ChatMessage[]): AsyncGenerator<string> {
    // 实现流式对话
    // ...
  }
}
```

#### 2. 注册提供商

在 `src/providers/llm/index.ts` 中注册：

```typescript
import { MyLLMProvider } from './my-provider';

export const llmProviders = {
  OpenAI: OpenAIProvider,
  Anthropic: AnthropicProvider,
  MyProvider: MyLLMProvider,  // 添加这行
};
```

#### 3. 添加配置类型

在 `src/types/config.ts` 中添加：

```typescript
export interface MyProviderConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
  // 其他配置项...
}
```

#### 4. 添加环境变量

在 `.env.example` 中添加：

```env
# My Provider Configuration
LLM_MYPROVIDER_API_KEY=your_api_key
LLM_MYPROVIDER_BASE_URL=https://api.myprovider.com
LLM_MYPROVIDER_MODEL=my-model-v1
```

#### 5. 测试提供商

创建测试文件 `src/providers/llm/my-provider.test.ts`:

```typescript
import { describe, test, expect } from 'bun:test';
import { MyLLMProvider } from './my-provider';

describe('MyLLMProvider', () => {
  test('should complete chat', async () => {
    const provider = new MyLLMProvider({
      apiKey: 'test-key',
      baseUrl: 'https://api.myprovider.com',
      model: 'my-model-v1'
    });

    const response = await provider.chat([
      { role: 'user', content: 'Hello' }
    ]);

    expect(response).toBeDefined();
    expect(response.content).toBeTruthy();
  });
});
```

### 🐛 调试技巧

```typescript
// 使用内置日志系统
import { logger } from './utils/logger';

logger.debug('调试信息', { data });
logger.info('普通信息');
logger.warn('警告信息');
logger.error('错误信息', error);

// 性能分析
import { performance } from 'perf_hooks';

const start = performance.now();
await someOperation();
const duration = performance.now() - start;
logger.info(`操作耗时: ${duration}ms`);
```

---

## 🔄 与 Python 服务器的关系

本项目是原 Python AI 服务器的 TypeScript/Bun 重写版本。

### 主要改进

| 方面          | Python 版本  | TypeScript/Bun 版本 |
| ------------- | ------------ | ------------------- |
| **启动速度**  | ~3-5秒       | ~100-200毫秒        |
| **内存占用**  | ~200-300MB   | ~100-150MB          |
| **类型安全**  | 运行时检查   | 编译时检查          |
| **开发体验**  | 需要虚拟环境 | 一键启动            |
| **WebSocket** | 需要额外配置 | 原生支持            |
| **包管理**    | pip/poetry   | bun (更快)          |

### 兼容性

✅ **配置文件格式完全兼容**
- 可以共享 `config.yaml`
- 环境变量命名一致

✅ **模型文件可共享**
- 共用 `models/` 目录
- 共用 `prompts/` 目录

✅ **API 接口兼容**
- 相同的 REST API 端点
- 相同的请求/响应格式

### 迁移指南

从 Python 版本迁移到 Bun 版本：

```bash
# 1. 安装 Bun
curl -fsSL https://bun.sh/install | bash

# 2. 进入 server 目录
cd server

# 3. 安装依赖
bun install

# 4. 复制现有配置
cp ../python-server/.env .env.production

# 5. 启动服务
bun run start
```

---

## 🤝 贡献指南

欢迎贡献代码！请遵循以下步骤：

1. **Fork 项目**
2. **创建特性分支**: `git checkout -b feature/amazing-feature`
3. **提交更改**: `git commit -m 'Add some amazing feature'`
4. **推送分支**: `git push origin feature/amazing-feature`
5. **提交 Pull Request**

### 代码审查标准

- ✅ 代码符合项目规范
- ✅ 包含必要的测试
- ✅ 通过所有 CI 检查
- ✅ 更新相关文档
- ✅ 无 TypeScript 类型错误

---

## 📄 许可证

本项目采用 [MIT License](../LICENSE) 开源协议。

---

## 🙏 致谢

感谢以下开源项目和服务：

- [Bun](https://bun.sh) - 极速的 JavaScript 运行时
- [Elysia](https://elysiajs.com) - 人体工程学的 Web 框架
- [OpenAI](https://openai.com) - GPT 系列模型
- [Anthropic](https://anthropic.com) - Claude 系列模型
- [Google](https://ai.google.dev) - Gemini 系列模型
- 以及所有贡献者和用户！

---

## 📮 支持与反馈

### 获取帮助

- 📖 [查看文档](./docs)
- 💬 [提交 Issue](../../issues)
- 🔧 [查看示例](./examples)

### 问题反馈

如遇到问题，请提供：

1. 错误信息和堆栈跟踪
2. 配置文件（隐藏敏感信息）
3. 复现步骤
4. 环境信息（OS、Bun 版本等）

### 功能建议

欢迎通过 Issue 提交功能建议，请说明：

1. 期望的功能描述
2. 使用场景
3. 为什么需要这个功能

---

<div align="center">

**⭐ 如果这个项目对你有帮助，请给个 Star！**

Made with ❤️ by the Elysia AI Server Team

</div>
