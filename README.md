# MCP AI

一个基于 Electron + Bun 的多模态 AI 应用，集成语音识别、大语言模型、语音合成等功能。

## 项目结构

```
├── client/     # Electron 客户端 (Vue + TypeScript)
└── server/     # AI 服务端 (Elysia + Bun)
```

## 功能特性

- 🎙️ **ASR** - 语音识别（豆包流式识别）
- 🤖 **LLM** - 大语言模型对话（OpenAI、Anthropic、Google 等）
- 🔊 **TTS** - 语音合成（火山引擎流式合成）
- 🎯 **Intent** - 意图识别（函数调用、LLM 意图分析）
- 💾 **Memory** - 对话记忆（本地短期、Mem0AI）
- 🛠️ **Tools** - 工具调用与插件系统
- 🎨 **vLLM** - 视觉语言模型

## 快速开始

### 服务端

```bash
cd server
bun install
bun run dev
```

### 客户端

```bash
cd client
npm install
npm run dev
```

## 配置

在 `server/` 目录下创建 `.env` 文件配置 API 密钥等环境变量。

## 技术栈

**客户端**: Electron, Vue 3, TypeScript
**服务端**: Bun, Elysia, WebSocket, Redis

## 许可

MIT
