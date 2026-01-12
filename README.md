<div align="center">

# 🎙️ AI Voice Assistant

**企业级实时语音交互系统**

基于 Python + Vue 3 + Electron 构建的全栈 AI 对话平台
集成讯飞 ASR、通义千问 LLM、火山引擎 TTS

[![Python](https://img.shields.io/badge/Python-3.12+-3776AB?style=flat-square&logo=python&logoColor=white)](https://www.python.org/)
[![Vue](https://img.shields.io/badge/Vue-3.5-4FC08D?style=flat-square&logo=vue.js&logoColor=white)](https://vuejs.org/)
[![Electron](https://img.shields.io/badge/Electron-39-47848F?style=flat-square&logo=electron&logoColor=white)](https://www.electronjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-Latest-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)

[快速开始](#-快速开始) · [核心特性](#-核心特性) · [技术架构](#️-技术架构) · [配置指南](#️-配置指南)

</div>

---

## 📋 目录

- [项目简介](#-项目简介)
- [快速开始](#-快速开始)
- [核心特性](#-核心特性)
- [技术架构](#️-技术架构)
- [项目结构](#-项目结构)
- [服务管理](#-服务管理)
- [配置指南](#️-配置指南)
- [API 文档](#-api-文档)
- [常见问题](#-常见问题)
- [开发指南](#️-开发指南)
- [贡献指南](#-贡献指南)

---

## 💡 项目简介

这是一个功能完整的企业级 AI 语音助手系统，提供实时语音识别、自然语言对话和语音合成能力。

### ✨ 核心亮点

<table>
<tr>
<td width="50%">

**🚀 开箱即用**
- 一键启动脚本，3 分钟部署
- 自动依赖管理与环境配置
- 支持 Electron 桌面应用和 Web 模式

</td>
<td width="50%">

**⚡ 生产级性能**
- < 100ms 音频响应延迟
- 全流式处理架构
- 智能 VAD 语音检测
- 完善的监控与日志系统

</td>
</tr>
<tr>
<td width="50%">

**🎯 企业级架构**
- 模块化设计，易于扩展
- 多 AI 服务提供商支持
- WebSocket 实时通信
- 健壮的错误处理机制

</td>
<td width="50%">

**🔧 开发友好**
- TypeScript 类型安全
- 完整的开发工具链
- 详细的 API 文档
- 丰富的代码示例

</td>
</tr>
</table>

### 🎯 应用场景

- 🏠 智能家居语音控制
- 💼 客服机器人系统
- 🎓 智能教育助手
- 🚗 车载语音交互
- 🏥 医疗语音录入

---

## 🚀 快速开始

### 📦 环境要求

| 组件 | 版本要求 | 用途 |
|------|---------|------|
| Python | 3.12+ | 后端服务 |
| uv | 最新版 | Python 包管理 |
| Node.js | 18+ | 前端开发 |
| npm | 8+ | 依赖管理 |

### ⚡ 3 分钟快速部署

```bash
# 1️⃣ 克隆项目
git clone https://github.com/WAASSTT/python-mcp.git
cd python-mcp

# 2️⃣ 配置 API 密钥
cp server/config.yaml server/.config.yaml
vim server/.config.yaml  # 填入您的 API 密钥（参考下方获取方式）

# 3️⃣ 启动服务器
cd server
chmod +x run_server.sh
./run_server.sh start

# 4️⃣ 启动客户端（新终端窗口）
cd client
npm install        # 首次运行需要安装依赖
npm run dev        # 启动 Electron 桌面应用

# ✅ 完成！Electron 应用窗口将自动打开
```

### 🔑 API 密钥获取

配置文件需要以下三个服务的 API 密钥：

<table>
<tr>
<td width="33%">

**🎤 讯飞语音识别**
- 平台：[讯飞开放平台](https://www.xfyun.cn/)
- 用途：实时语音识别 (ASR)
- 需要：`app_id`, `access_key_id`, `access_key_secret`

</td>
<td width="33%">

**🤖 通义千问**
- 平台：[阿里云百炼](https://bailian.console.aliyun.com/)
- 用途：大语言模型对话 (LLM)
- 需要：`api_key`

</td>
<td width="33%">

**🔊 火山引擎**
- 平台：[火山引擎](https://www.volcengine.com/product/tts)
- 用途：语音合成 (TTS)
- 需要：`appid`, `access_token`

</td>
</tr>
</table>

### 🎮 启动模式

**桌面应用模式（推荐）**
```bash
cd client
npm run dev
```
自动打开 Electron 桌面应用，提供原生体验。

**Web 浏览器模式**
```bash
cd client
npm run web
```
在浏览器中运行，适合快速调试。

---

## 🌟 核心特性

### 🎙️ 实时语音处理链路

```
麦克风输入 → 音频采集 → Opus 编码 → WebSocket 传输
    ↓
语音检测(VAD) → 语音识别(ASR) → 语言理解(LLM) → 语音合成(TTS)
    ↓
WebSocket 返回 → 音频解码 → 扬声器播放
```

### 🤖 AI 能力矩阵

<table>
<tr>
<th width="15%">模块</th>
<th width="20%">服务提供商</th>
<th width="40%">核心特性</th>
<th width="25%">性能指标</th>
</tr>
<tr>
<td><strong>🎤 ASR</strong></td>
<td>讯飞语音</td>
<td>
• 流式实时识别<br>
• 202 种方言支持<br>
• 自动标点断句
</td>
<td>
响应延迟: < 300ms<br>
准确率: 95%+
</td>
</tr>
<tr>
<td><strong>🧠 LLM</strong></td>
<td>通义千问</td>
<td>
• 流式对话生成<br>
• 上下文记忆<br>
• 函数调用支持
</td>
<td>
首 Token: < 500ms<br>
吞吐: 实时流式
</td>
</tr>
<tr>
<td><strong>👁️ Vision</strong></td>
<td>通义千问-VL</td>
<td>
• 图像理解<br>
• 视觉问答<br>
• OCR 识别
</td>
<td>
多模态融合<br>
响应: < 2s
</td>
</tr>
<tr>
<td><strong>🔊 TTS</strong></td>
<td>火山引擎</td>
<td>
• 流式语音合成<br>
• 325+ 音色<br>
• 情感表达控制
</td>
<td>
首包延迟: < 200ms<br>
音质: 24kHz
</td>
</tr>
<tr>
<td><strong>🎚️ VAD</strong></td>
<td>Silero VAD</td>
<td>
• 本地语音检测<br>
• 低资源占用<br>
• 高准确率
</td>
<td>
检测延迟: < 30ms<br>
CPU 占用: < 5%
</td>
</tr>
</table>

### 🎵 音频处理能力

<table>
<tr>
<td width="50%">

**输入处理**
- Web Audio API 实时采集
- AudioWorklet 低延迟处理
- Opus 高效编码 (48kbps)
- 自适应音量增益
- 静音自动过滤

</td>
<td width="50%">

**输出处理**
- 流式音频播放
- 自动队列管理
- 音频缓冲优化
- 播放状态同步
- 错误自动恢复

</td>
</tr>
</table>

### 💻 开发体验

**服务器管理（一键操作）**
```bash
./run_server.sh start    # 🚀 启动服务
./run_server.sh stop     # 🛑 停止服务
./run_server.sh restart  # 🔄 重启服务
./run_server.sh status   # 📊 查看状态
./run_server.sh logs     # 📝 查看日志
```

**客户端开发（多模式）**
```bash
npm run dev          # 🖥️  Electron 桌面应用
npm run web          # 🌐 Web 浏览器模式
npm run build:win    # 📦 Windows 应用打包
npm run build:mac    # 🍎 macOS 应用打包
npm run build:linux  # 🐧 Linux 应用打包
```

### ✨ 特色功能

- ✅ **智能会话管理**：上下文记忆、多轮对话
- ✅ **实时状态反馈**：VAD 检测、识别进度、合成状态
- ✅ **音频可视化**：实时波形、音量指示
- ✅ **错误恢复机制**：自动重连、断点续传
- ✅ **性能监控**：延迟统计、资源使用追踪
- ✅ **日志审计**：完整的操作日志和错误追踪

---

## 🏗️ 技术架构

### 系统架构图

```
┌──────────────────────────────────────────┐
│          Electron 客户端                 │
│   (Vue 3 + TypeScript + Naive UI)       │
│                                          │
│  ┌─────────┐  ┌──────────┐  ┌────────┐ │
│  │ 音频采集 │  │ 状态管理 │  │ UI渲染 │ │
│  └─────────┘  └──────────┘  └────────┘ │
└─────────────────┬────────────────────────┘
                  │ WebSocket
                  │ (ws://localhost:30000)
                  ▼
┌──────────────────────────────────────────┐
│         Python Backend Server            │
│          (FastAPI + asyncio)             │
│                                          │
│  ┌──────────────┐    ┌───────────────┐  │
│  │ WebSocket    │    │ HTTP API      │  │
│  │ 实时通信层   │    │ RESTful 接口  │  │
│  └──────┬───────┘    └───────────────┘  │
│         │                                │
│  ┌──────┴─────────────────────────────┐ │
│  │      核心处理层                     │ │
│  │  ┌────────┐  ┌────────┐  ┌──────┐ │ │
│  │  │消息处理│  │会话管理│  │工具集│ │ │
│  │  └────────┘  └────────┘  └──────┘ │ │
│  └────────────────────────────────────┘ │
│         │                                │
│  ┌──────┴─────────────────────────────┐ │
│  │      AI Provider 抽象层             │ │
│  │  ┌────┐ ┌────┐ ┌────┐ ┌────┐      │ │
│  │  │VAD │ │ASR │ │LLM │ │TTS │      │ │
│  │  └──┬─┘ └──┬─┘ └──┬─┘ └──┬─┘      │ │
│  └─────┼──────┼──────┼──────┼─────────┘ │
└────────┼──────┼──────┼──────┼───────────┘
         │      │      │      │
    ┌────▼──┐ ┌─▼─────┐ ┌───▼───┐ ┌──▼───┐
    │Silero│ │讯飞   │ │通义   │ │火山  │
    │ VAD  │ │语音   │ │千问   │ │引擎  │
    │(本地)│ │(ASR)  │ │(LLM)  │ │(TTS) │
    └──────┘ └───────┘ └───────┘ └──────┘
```

### 技术栈详解

<table>
<tr>
<td width="50%" valign="top">

**🖥️ 前端技术栈**

| 技术 | 版本 | 用途 |
|------|------|------|
| **Electron** | 39 | 跨平台桌面应用框架 |
| **Vue 3** | 3.5 | 渐进式前端框架 |
| **TypeScript** | 5.9 | 类型安全的 JavaScript |
| **Naive UI** | Latest | 现代化组件库 |
| **Pinia** | Latest | Vue 状态管理 |
| **VueUse** | Latest | Vue 组合式工具集 |
| **Vite** | Latest | 快速构建工具 |

**音频处理**
- Web Audio API（音频采集与播放）
- AudioWorklet（实时音频处理）
- Opus 编码器（高效压缩）
- WebSocket（实时双向通信）

</td>
<td width="50%" valign="top">

**🔧 后端技术栈**

| 技术 | 版本 | 用途 |
|------|------|------|
| **Python** | 3.12+ | 服务端语言 |
| **FastAPI** | Latest | 高性能 Web 框架 |
| **asyncio** | 内置 | 异步 I/O 处理 |
| **aiohttp** | Latest | 异步 HTTP 客户端 |
| **websockets** | Latest | WebSocket 协议实现 |
| **uv** | Latest | 快速包管理器 |

**AI 服务集成**
- 讯飞语音识别 SDK
- 阿里云百炼 SDK
- 火山引擎 TTS SDK
- Silero VAD（本地模型）

</td>
</tr>
</table>

### 数据流架构

**上行流程（语音输入）**
```
用户说话 → 麦克风采集 → Web Audio API
    ↓
PCM 音频数据 → Opus 编码 → Base64 编码
    ↓
WebSocket 发送 → Python Server 接收
    ↓
Silero VAD 检测 → 讯飞 ASR 识别 → 文本结果
    ↓
通义千问 LLM → 生成回复文本
```

**下行流程（语音输出）**
```
LLM 生成文本 → 火山引擎 TTS 合成
    ↓
音频数据流 → Base64 编码 → WebSocket 发送
    ↓
客户端接收 → Base64 解码 → PCM 音频
    ↓
Web Audio API 播放 → 扬声器输出
```

### 模块化设计

**Provider 抽象层**
- 统一接口定义
- 支持多服务商切换
- 插件式扩展架构
- 配置驱动选择

**消息处理链**
```python
WebSocket 接收 → 消息路由 → 处理器分发
    ↓
业务处理 → 结果封装 → WebSocket 返回
```

---

## 📁 项目结构

```
python-mcp/
│
├── 📖 README.md                   # 项目文档
├── 📄 LICENSE                     # 开源协议
│
├── 📂 server/                     # Python 后端服务
│   ├── 🚀 run_server.sh          # 服务器管理脚本
│   ├── 🐍 app.py                 # 应用入口
│   ├── 📋 requirements.txt       # Python 依赖
│   ├── ⚙️ config.yaml            # 配置模板
│   ├── 🐳 docker-compose.yml     # Docker 配置
│   │
│   ├── 📂 core/                  # 核心模块
│   │   ├── websocket_server.py  # WebSocket 服务
│   │   ├── http_server.py       # HTTP API 服务
│   │   ├── connection.py        # 连接管理
│   │   ├── auth.py              # 认证模块
│   │   │
│   │   ├── 📂 providers/        # AI 服务提供者
│   │   │   ├── 📂 asr/          # 语音识别
│   │   │   │   ├── base.py     # ASR 基类
│   │   │   │   ├── xunfei_stream.py  # 讯飞 ASR
│   │   │   │   └── ...
│   │   │   ├── 📂 llm/          # 大语言模型
│   │   │   │   ├── base.py     # LLM 基类
│   │   │   │   ├── qwen_flash.py     # 通义千问
│   │   │   │   └── ...
│   │   │   ├── 📂 tts/          # 语音合成
│   │   │   │   ├── base.py     # TTS 基类
│   │   │   │   ├── huoshan_stream.py # 火山 TTS
│   │   │   │   └── ...
│   │   │   ├── 📂 vad/          # 语音活动检测
│   │   │   │   ├── silero.py   # Silero VAD
│   │   │   │   └── ...
│   │   │   └── 📂 vllm/         # 视觉语言模型
│   │   │       ├── qwen_vl.py  # 通义千问-VL
│   │   │       └── ...
│   │   │
│   │   ├── 📂 handle/           # 消息处理器
│   │   │   ├── helloHandle.py           # 欢迎消息
│   │   │   ├── receiveAudioHandle.py    # 音频接收
│   │   │   ├── sendAudioHandle.py       # 音频发送
│   │   │   ├── textHandle.py            # 文本处理
│   │   │   ├── intentHandler.py         # 意图识别
│   │   │   ├── textMessageHandler.py    # 文本消息
│   │   │   ├── textMessageProcessor.py  # 消息处理
│   │   │   └── ...
│   │   │
│   │   ├── 📂 api/              # HTTP API 处理器
│   │   │   ├── base_handler.py         # 基础处理器
│   │   │   ├── vision_handler.py       # 视觉接口
│   │   │   ├── ota_handler.py          # OTA 更新
│   │   │   └── ...
│   │   │
│   │   └── 📂 utils/            # 工具函数
│   │       ├── asr.py                  # ASR 工具
│   │       ├── llm.py                  # LLM 工具
│   │       ├── memory.py               # 记忆管理
│   │       ├── dialogue.py             # 对话管理
│   │       ├── context_provider.py     # 上下文
│   │       ├── prompt_manager.py       # 提示词
│   │       └── ...
│   │
│   ├── 📂 config/               # 配置模块
│   │   ├── config_loader.py    # 配置加载器
│   │   ├── settings.py         # 设置管理
│   │   ├── logger.py           # 日志配置
│   │   └── 📂 assets/          # 静态资源
│   │
│   ├── 📂 plugins_func/         # 插件系统
│   │   ├── loadplugins.py      # 插件加载
│   │   ├── register.py         # 注册中心
│   │   └── 📂 functions/       # 功能插件
│   │
│   ├── 📂 models/               # AI 模型文件
│   │   ├── SenseVoiceSmall/    # 语音模型
│   │   └── snakers4_silero-vad/# VAD 模型
│   │
│   └── 📂 data/                 # 数据目录
│       └── 📂 bin/              # 二进制文件
│
├── 📂 client/                   # Electron 前端客户端
│   ├── 📦 package.json          # NPM 配置
│   ├── ⚙️ electron.vite.config.ts   # Electron 构建配置
│   ├── 📋 tsconfig.json         # TypeScript 配置
│   ├── 🎨 vite.config.ts        # Vite 配置
│   ├── 🔧 electron-builder.yml  # 打包配置
│   │
│   ├── 📂 src/                  # 源代码
│   │   ├── 📂 main/            # Electron 主进程
│   │   │   ├── index.ts        # 主进程入口
│   │   │   ├── 📂 lang/        # 国际化
│   │   │   └── 📂 tool/        # 工具函数
│   │   │
│   │   ├── 📂 preload/         # 预加载脚本
│   │   │   ├── index.ts        # 预加载入口
│   │   │   └── index.d.ts      # 类型定义
│   │   │
│   │   └── 📂 renderer/        # 渲染进程 (Vue 3)
│   │       ├── index.html      # HTML 模板
│   │       ├── 📂 src/         # Vue 源码
│   │       │   ├── main.ts     # Vue 入口
│   │       │   ├── App.vue     # 根组件
│   │       │   ├── 📂 views/   # 页面视图
│   │       │   ├── 📂 components/  # 组件
│   │       │   ├── 📂 composables/ # 组合式函数
│   │       │   ├── 📂 stores/  # Pinia 状态
│   │       │   ├── 📂 utils/   # 工具函数
│   │       │   └── 📂 types/   # 类型定义
│   │       │
│   │       ├── auto-imports.d.ts   # 自动导入类型
│   │       └── components.d.ts     # 组件类型
│   │
│   ├── 📂 build/                # 构建资源
│   │   └── entitlements.mac.plist  # macOS 权限
│   │
│   ├── 📂 resources/            # 应用资源
│   │   ├── icon.png             # 应用图标
│   │   └── libopus.js           # Opus 编码库
│   │
│   └── 📂 certs/                # 开发证书
│       └── mkcert               # 本地 HTTPS 证书
│
├── 📂 logs/                     # 日志目录 (自动生成)
│   ├── python-server.log        # 服务器日志
│   ├── error.log                # 错误日志
│   └── access.log               # 访问日志
│
├── 📂 pids/                     # 进程 ID (自动生成)
│   └── python-server.pid        # 服务器进程 ID
│
└── 📂 tmp/                      # 临时文件 (自动生成)
    ├── 📂 asr/                  # ASR 临时音频
    └── 📂 tts/                  # TTS 临时音频
```

### 关键文件说明

| 文件/目录 | 说明 |
|----------|------|
| [server/app.py](server/app.py) | Python 服务器主入口，初始化所有服务 |
| [server/run_server.sh](server/run_server.sh) | 服务器管理脚本，支持 start/stop/restart 等操作 |
| [server/config.yaml](server/config.yaml) | 服务配置模板，包含所有可配置项 |
| [server/core/websocket_server.py](server/core/websocket_server.py) | WebSocket 服务实现，处理实时通信 |
| [server/core/providers/](server/core/providers/) | AI 服务提供者抽象层，支持多服务商切换 |
| [client/src/main/index.ts](client/src/main/index.ts) | Electron 主进程入口 |
| [client/src/renderer/](client/src/renderer/) | Vue 3 前端应用代码 |
| [client/package.json](client/package.json) | 前端依赖和脚本配置 |

---

## 🔧 服务管理

### 服务器管理

项目提供了便捷的脚本来管理后端服务器：

```bash
cd server

# 启动服务器
./run_server.sh start

# 停止服务器
./run_server.sh stop

# 重启服务器
./run_server.sh restart

# 查看运行状态
./run_server.sh status

# 查看实时日志
./run_server.sh logs
```

**脚本特性**
- ✅ 自动检测并安装 Python 依赖
- ✅ 智能端口冲突检测与处理
- ✅ 进程健康检查
- ✅ 优雅停止与强制终止
- ✅ PID 文件管理
- ✅ 日志自动归档

### 客户端管理

**开发模式**
```bash
cd client

# 首次运行需要安装依赖
npm install

# Electron 桌面应用开发模式
npm run dev

# Web 浏览器开发模式
npm run web
```

**生产打包**
```bash
# 打包 Windows 应用
npm run build:win

# 打包 macOS 应用
npm run build:mac

# 打包 Linux 应用
npm run build:linux

# 打包 Web 应用
npm run build:web
```

### 服务端口

| 服务 | 端口 | 协议 | 说明 |
|------|------|------|------|
| **WebSocket 服务** | 30000 | ws:// | 实时双向通信 |
| **HTTP API** | 30003 | http:// | RESTful 接口 |
| **Electron 客户端** | - | - | 本地桌面应用 |
| **Web 开发服务器** | 动态分配 | http:// | Vite 开发服务器 |

### 常用操作场景

**场景 1：日常开发**
```bash
# 终端 1：启动服务器
cd server && ./run_server.sh start

# 终端 2：启动客户端
cd client && npm run dev

# 修改代码后自动热重载
```

**场景 2：查看日志排查问题**
```bash
# 查看服务器日志
cd server && ./run_server.sh logs

# 实时监控日志
tail -f ../logs/python-server.log

# 查看错误日志
tail -f ../logs/error.log
```

**场景 3：完全重启服务**
```bash
# 重启服务器
cd server
./run_server.sh restart

# 重启客户端（关闭 Electron 窗口后重新运行）
cd client
npm run dev
```

**场景 4：清理环境**
```bash
# 停止所有服务
cd server && ./run_server.sh stop

# 清理临时文件
rm -rf logs/* pids/* tmp/*

# 删除虚拟环境（可选）
rm -rf server/.venv

# 重新启动
cd server && ./run_server.sh start
```

### 健康检查

**服务器健康检查**
```bash
# 方式 1：使用管理脚本
cd server && ./run_server.sh status

# 方式 2：HTTP 健康检查端点
curl http://localhost:30003/health

# 方式 3：检查端口监听
lsof -i :30000  # WebSocket 端口
lsof -i :30003  # HTTP 端口
```

**客户端健康检查**
- Electron 应用：检查窗口是否正常打开
- Web 模式：访问开发服务器 URL
- 开发者工具：F12 查看控制台无错误

---

## ⚙️ 配置指南

### 配置文件说明

配置文件位于 `server/config.yaml`（模板）和 `server/.config.yaml`（自定义配置）。

**优先级：** `.config.yaml` > `config.yaml`

推荐做法：
1. 保留 `config.yaml` 作为模板
2. 创建 `.config.yaml` 存放实际配置（不提交到版本控制）

### 完整配置示例

```yaml
# ============================================
# 服务器配置
# ============================================
server:
  ip: '0.0.0.0'              # 监听地址，0.0.0.0 表示所有网络接口
  port: 30000                # WebSocket 端口
  http_port: 30003           # HTTP API 端口
  max_connections: 100       # 最大连接数
  timeout: 30                # 超时时间（秒）

# ============================================
# 模块选择
# ============================================
selected_module:
  ASR: 'xunfei_stream'       # 语音识别：xunfei_stream
  LLM: 'qwen_flash'          # 大语言模型：qwen_flash, qwen_plus
  VLLM: 'qwen_vl'           # 视觉模型：qwen_vl
  TTS: 'huoshan_stream'      # 语音合成：huoshan_stream
  VAD: 'silero'              # 语音检测：silero（本地）

# ============================================
# ASR - 讯飞语音识别配置
# ============================================
ASR:
  xunfei_stream:
    app_id: 'your-app-id'                    # 必填：讯飞应用 ID
    access_key_id: 'your-access-key-id'      # 必填：访问密钥 ID
    access_key_secret: 'your-key-secret'     # 必填：访问密钥

    # 可选配置
    language: 'zh_cn'                         # 语言：zh_cn, en_us
    accent: 'mandarin'                        # 口音：mandarin, cantonese
    domain: 'iat'                             # 领域：iat（通用）
    enable_punctuation: true                  # 启用标点
    enable_intermediate_result: true          # 启用中间结果

# ============================================
# LLM - 通义千问大语言模型配置
# ============================================
LLM:
  qwen_flash:
    api_key: 'sk-your-api-key'               # 必填：阿里云百炼 API Key
    model: 'qwen-plus'                       # 模型：qwen-turbo, qwen-plus, qwen-max

    # 可选配置
    max_tokens: 2000                          # 最大生成长度
    temperature: 0.7                          # 温度（0-2）
    top_p: 0.9                               # 采样阈值
    stream: true                             # 流式输出
    enable_search: false                     # 启用联网搜索

    # 系统提示词
    system_prompt: |
      你是一个友好、专业的AI语音助手。
      请用简洁、口语化的方式回答问题。

# ============================================
# VLLM - 通义千问视觉语言模型配置
# ============================================
VLLM:
  qwen_vl:
    api_key: 'sk-your-api-key'               # 必填：阿里云百炼 API Key
    model: 'qwen-vl-plus'                    # 模型：qwen-vl-plus, qwen-vl-max

    # 可选配置
    max_tokens: 1500                          # 最大生成长度
    temperature: 0.5                          # 温度
    top_p: 0.9                               # 采样阈值

# ============================================
# TTS - 火山引擎语音合成配置
# ============================================
TTS:
  huoshan_stream:
    appid: 'your-appid'                      # 必填：火山引擎 AppID
    access_token: 'your-access-token'        # 必填：访问令牌

    # 音色配置（重要）
    speaker: 'zh_female_qingxin'             # 音色 ID（见下方音色列表）

    # 可选配置
    format: 'mp3'                            # 格式：mp3, wav, pcm
    sample_rate: 24000                       # 采样率：16000, 24000
    volume: 1.0                              # 音量（0.5-2.0）
    speed: 1.0                               # 语速（0.5-2.0）
    pitch: 0                                 # 音调（-12 到 12）
    emotion: 'neutral'                       # 情感：neutral, happy, sad, angry

# ============================================
# VAD - Silero 语音活动检测配置
# ============================================
VAD:
  silero:
    model_path: 'models/snakers4_silero-vad' # 模型路径
    threshold: 0.5                           # 检测阈值（0-1）
    min_speech_duration_ms: 250              # 最小语音时长（毫秒）
    min_silence_duration_ms: 500             # 最小静音时长（毫秒）
    speech_pad_ms: 30                        # 语音填充（毫秒）

# ============================================
# 对话管理配置
# ============================================
dialogue:
  max_history: 10                            # 最大历史记录条数
  context_window: 4096                       # 上下文窗口大小
  session_timeout: 3600                      # 会话超时（秒）

# ============================================
# 日志配置
# ============================================
logging:
  level: 'INFO'                              # 日志级别：DEBUG, INFO, WARNING, ERROR
  file: '../logs/python-server.log'         # 日志文件路径
  max_size: 10485760                         # 最大文件大小（字节，10MB）
  backup_count: 5                            # 保留备份数量
  format: '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
```

### 常用音色列表

**火山引擎 TTS 推荐音色**

| 音色 ID | 描述 | 适用场景 |
|---------|------|----------|
| `zh_female_qingxin` | 女声-清新 | 通用、客服 |
| `zh_female_wanxiaoyu` | 女声-晚小雨 | 甜美、亲切 |
| `zh_male_qingxin` | 男声-清新 | 商务、播报 |
| `zh_male_chunhou` | 男声-醇厚 | 磁性、成熟 |
| `zh_female_zhifuyuan` | 女声-知识渊博 | 教育、讲解 |
| `zh_male_zhinan` | 男声-指南针 | 导航、指引 |

更多音色请参考：[火山引擎 TTS 文档](https://www.volcengine.com/docs/6561/97465)

### 快速配置向导

**步骤 1：创建配置文件**
```bash
cd server
cp config.yaml .config.yaml
```

**步骤 2：填入 API 密钥**
```bash
vim .config.yaml
# 或使用其他编辑器
nano .config.yaml
```

**步骤 3：最小配置**

只需配置以下必填项即可启动：
```yaml
ASR:
  xunfei_stream:
    app_id: 'your-app-id'
    access_key_id: 'your-key-id'
    access_key_secret: 'your-secret'

LLM:
  qwen_flash:
    api_key: 'sk-your-api-key'

TTS:
  huoshan_stream:
    appid: 'your-appid'
    access_token: 'your-token'
```

**步骤 4：验证配置**
```bash
./run_server.sh start
# 查看日志确认配置正确
./run_server.sh logs
```

### 环境变量支持

也可以通过环境变量覆盖配置：

```bash
# 设置环境变量
export XUNFEI_APP_ID="your-app-id"
export QWEN_API_KEY="sk-your-api-key"
export HUOSHAN_APPID="your-appid"

# 启动服务器
./run_server.sh start
```

### 配置验证

启动服务器时会自动验证配置，检查项包括：
- ✅ 必填字段是否存在
- ✅ API 密钥格式是否正确
- ✅ 端口是否可用
- ✅ 模型文件是否存在
- ✅ 网络连接是否正常

---

## 📡 API 文档

### WebSocket API

**连接信息**
- 地址：`ws://localhost:30000/xiaozhi/v1/`
- 协议：WebSocket
- 数据格式：JSON + Binary

### 消息类型

#### 客户端 → 服务端

**1. 音频数据（Binary）**
```javascript
// 直接发送二进制音频数据
// 格式：PCM 或 Opus 编码
// 采样率：16kHz
// 声道：单声道（Mono）
// 位深：16-bit

const audioData = new Uint8Array([...]); // 音频数据
websocket.send(audioData);
```

**2. 控制消息（JSON）**
```javascript
// 开始监听
{
  "type": "control",
  "action": "start_listening",
  "params": {
    "language": "zh_cn",      // 可选：语言
    "accent": "mandarin"       // 可选：口音
  }
}

// 停止监听
{
  "type": "control",
  "action": "stop_listening"
}

// 发送文本消息
{
  "type": "text_message",
  "text": "你好，请帮我查询天气",
  "user_id": "user_123"       // 可选：用户ID
}

// 清空对话历史
{
  "type": "control",
  "action": "clear_history"
}
```

#### 服务端 → 客户端

**1. ASR 识别结果**
```javascript
{
  "type": "asr_result",
  "text": "今天天气怎么样",
  "is_final": true,            // true: 最终结果, false: 中间结果
  "confidence": 0.95,          // 置信度 (0-1)
  "timestamp": 1704153600000   // 时间戳
}
```

**2. LLM 流式响应**
```javascript
{
  "type": "llm_stream",
  "text": "今天天气晴朗",
  "is_final": false,           // 是否是最后一个片段
  "finish_reason": null,       // 结束原因：null, "stop", "length"
  "usage": {                   // 令牌使用统计（仅最后一条）
    "prompt_tokens": 15,
    "completion_tokens": 8,
    "total_tokens": 23
  }
}

// 最后一条消息
{
  "type": "llm_stream",
  "text": "，适合外出活动。",
  "is_final": true,
  "finish_reason": "stop"
}
```

**3. TTS 音频数据**
```javascript
{
  "type": "tts_audio",
  "audio": "base64_encoded_audio_data",  // Base64 编码的音频
  "format": "pcm",                       // 格式：pcm, mp3
  "sample_rate": 24000,                  // 采样率
  "is_final": false                      // 是否是最后一段
}
```

**4. VAD 状态**
```javascript
{
  "type": "vad_state",
  "state": "speech_detected",  // speech_detected: 检测到语音
                               // silence: 静音
  "confidence": 0.85,          // 置信度
  "timestamp": 1704153600000
}
```

**5. 系统状态**
```javascript
{
  "type": "system_status",
  "status": "ready",           // ready, processing, error
  "message": "系统就绪",
  "details": {
    "asr_status": "connected",
    "llm_status": "connected",
    "tts_status": "connected"
  }
}
```

**6. 错误消息**
```javascript
{
  "type": "error",
  "code": "ASR_ERROR",         // 错误代码
  "message": "语音识别失败",    // 错误描述
  "details": {                 // 详细信息
    "reason": "network_timeout",
    "retry_after": 5000
  }
}
```

### HTTP API

**基础信息**
- 地址：`http://localhost:30003`
- Content-Type：`application/json`

#### 端点列表

**1. 健康检查**
```http
GET /health

响应：
{
  "status": "ok",
  "version": "1.0.0",
  "uptime": 3600,
  "services": {
    "websocket": "running",
    "asr": "connected",
    "llm": "connected",
    "tts": "connected"
  }
}
```

**2. 视觉理解**
```http
POST /api/vision/analyze

请求体：
{
  "image": "base64_encoded_image",  // Base64 图像
  "prompt": "描述这张图片",          // 提示词
  "user_id": "user_123"             // 可选：用户ID
}

响应：
{
  "text": "这是一张风景照，展示了...",
  "confidence": 0.92,
  "timestamp": 1704153600000
}
```

**3. 文本对话**
```http
POST /api/chat

请求体：
{
  "message": "你好",
  "user_id": "user_123",            // 可选：用户ID
  "stream": false                   // 是否流式输出
}

响应：
{
  "response": "你好！有什么我可以帮助你的吗？",
  "usage": {
    "prompt_tokens": 5,
    "completion_tokens": 12,
    "total_tokens": 17
  }
}
```

**4. API 文档（Swagger UI）**
```http
GET /docs

# 访问交互式 API 文档
http://localhost:30003/docs
```

### 完整示例

**JavaScript 客户端示例**
```javascript
// 建立 WebSocket 连接
const ws = new WebSocket('ws://localhost:30000/xiaozhi/v1/');

// 连接建立
ws.onopen = () => {
  console.log('WebSocket 连接已建立');

  // 开始监听
  ws.send(JSON.stringify({
    type: 'control',
    action: 'start_listening'
  }));
};

// 接收消息
ws.onmessage = (event) => {
  if (typeof event.data === 'string') {
    // JSON 消息
    const message = JSON.parse(event.data);

    switch(message.type) {
      case 'asr_result':
        console.log('识别结果:', message.text);
        break;
      case 'llm_stream':
        console.log('AI 回复:', message.text);
        break;
      case 'tts_audio':
        // 播放音频
        playAudio(message.audio);
        break;
      case 'vad_state':
        console.log('VAD 状态:', message.state);
        break;
    }
  } else {
    // 二进制音频数据
    console.log('收到音频数据');
  }
};

// 发送音频数据
function sendAudio(audioData) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(audioData);
  }
}

// 发送文本消息
function sendText(text) {
  ws.send(JSON.stringify({
    type: 'text_message',
    text: text
  }));
}

// 连接关闭
ws.onclose = () => {
  console.log('WebSocket 连接已关闭');
};

// 错误处理
ws.onerror = (error) => {
  console.error('WebSocket 错误:', error);
};
```

### 错误码说明

| 错误码 | 说明 | 处理建议 |
|--------|------|----------|
| `ASR_ERROR` | 语音识别失败 | 检查音频格式，重试 |
| `LLM_ERROR` | 大模型调用失败 | 检查 API 配额，重试 |
| `TTS_ERROR` | 语音合成失败 | 检查文本内容，重试 |
| `VAD_ERROR` | 语音检测失败 | 检查 VAD 模型加载 |
| `NETWORK_ERROR` | 网络连接错误 | 检查网络连接 |
| `AUTH_ERROR` | 认证失败 | 检查 API 密钥 |
| `RATE_LIMIT` | 请求频率限制 | 降低请求频率 |
| `INVALID_REQUEST` | 请求参数错误 | 检查请求格式 |

---

## ❓ 常见问题

### 安装与部署

**Q: 如何安装 uv 包管理器？**

A: 按照以下方式安装：
```bash
# macOS/Linux
curl -LsSf https://astral.sh/uv/install.sh | sh

# 或使用 pip
pip install uv

# 验证安装
uv --version
```

**Q: Python 版本不符合要求怎么办？**

A: 使用 uv 安装指定版本：
```bash
# 安装 Python 3.12
uv python install 3.12

# 使用指定版本
uv python pin 3.12
```

**Q: Node.js 版本过低如何升级？**

A: 推荐使用 nvm 管理 Node.js 版本：
```bash
# 安装 nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# 安装 Node.js 18
nvm install 18
nvm use 18
```

### 服务启动问题

**Q: 端口被占用怎么办？**

A: 使用以下命令检查并处理：
```bash
# 查看占用 30000 端口的进程
lsof -i :30000

# 或使用
netstat -anp | grep 30000

# 停止旧服务
cd server && ./run_server.sh stop

# 如果无法停止，手动终止进程
kill -9 <PID>

# 重新启动
./run_server.sh start
```

**Q: 服务器启动后立即退出？**

A: 按以下步骤排查：
```bash
# 1. 查看详细日志
cd server && ./run_server.sh logs

# 2. 手动启动查看错误
source .venv/bin/activate
python app.py

# 3. 检查配置文件
cat .config.yaml

# 4. 验证 API 密钥是否正确
```

**Q: Electron 客户端无法启动？**

A: 尝试以下解决方案：
```bash
# 1. 清除依赖重新安装
cd client
rm -rf node_modules package-lock.json
npm install

# 2. 清除缓存
npm cache clean --force

# 3. 使用淘宝镜像
npm config set registry https://registry.npmmirror.com
npm install

# 4. 检查 Electron 权限（macOS）
xattr -cr node_modules/electron/dist/Electron.app
```

### 连接与通信问题

**Q: WebSocket 连接失败？**

A: 检查以下几点：
```bash
# 1. 确认服务器已启动
cd server && ./run_server.sh status

# 2. 测试端口连通性
telnet localhost 30000

# 3. 检查防火墙设置
# Linux
sudo ufw status
sudo ufw allow 30000

# macOS
# 系统偏好设置 → 安全性与隐私 → 防火墙

# 4. 查看服务器日志
./run_server.sh logs
```

**Q: 客户端连接后无响应？**

A: 排查步骤：
```bash
# 1. 打开浏览器开发者工具（F12）
# 查看 Network 面板 → WS（WebSocket）

# 2. 查看 Console 面板的错误信息

# 3. 检查服务器日志
cd server && tail -f ../logs/python-server.log

# 4. 测试 HTTP 健康检查
curl http://localhost:30003/health
```

### 音频问题

**Q: 麦克风无法使用？**

A: 检查权限和设置：
```bash
# 1. 浏览器检查
# Chrome: 设置 → 隐私与安全 → 网站设置 → 麦克风
# 确保允许 localhost 访问麦克风

# 2. 系统权限检查
# macOS: 系统偏好设置 → 安全性与隐私 → 麦克风
# 允许 Electron 或浏览器访问麦克风

# 3. 测试麦克风
# 打开开发者工具运行：
navigator.mediaDevices.getUserMedia({ audio: true })
  .then(() => console.log('麦克风可用'))
  .catch(err => console.error('麦克风错误:', err));
```

**Q: 有声音输入但无法识别？**

A: 按以下检查：
```bash
# 1. 确认 VAD 检测到语音
# 客户端界面应显示语音活动状态

# 2. 检查音频格式
# 确保：16kHz, 单声道, 16-bit PCM

# 3. 查看 ASR 临时文件
ls -lh server/tmp/asr/
# 播放音频文件验证录音质量

# 4. 检查讯飞配置和配额
# 登录讯飞控制台查看 API 调用情况
```

**Q: TTS 无声音输出？**

A: 排查方向：
```bash
# 1. 检查音量设置
# 确保系统音量和浏览器音量未静音

# 2. 查看开发者工具 Console
# 是否有音频播放错误

# 3. 测试 TTS 服务
curl -X POST http://localhost:30003/api/tts \
  -H "Content-Type: application/json" \
  -d '{"text": "测试语音合成"}'

# 4. 检查火山引擎配置
# 验证 appid 和 access_token 是否正确
```

### AI 服务问题

**Q: ASR 识别率低？**

A: 改进方案：
- ✅ 确保环境安静，减少背景噪音
- ✅ 说话清晰，语速适中
- ✅ 调整麦克风距离（10-30cm 为佳）
- ✅ 在配置中选择合适的方言/口音
- ✅ 升级到更高级的 ASR 服务计划

**Q: LLM 响应慢或超时？**

A: 优化建议：
```yaml
# 在 .config.yaml 中调整：
LLM:
  qwen_flash:
    model: 'qwen-turbo'        # 使用更快的模型
    max_tokens: 1000           # 减少生成长度
    temperature: 0.7           # 适当调整温度
    stream: true               # 确保启用流式输出
```

**Q: TTS 音色不满意？**

A: 更换音色：
```yaml
TTS:
  huoshan_stream:
    speaker: 'zh_female_wanxiaoyu'  # 更换音色 ID
    emotion: 'happy'                  # 调整情感
    speed: 1.1                        # 调整语速
    volume: 1.2                       # 调整音量
```

参考[音色列表](#常用音色列表)选择合适的音色。

**Q: API 配额用完怎么办？**

A: 解决方案：
- 登录各服务商控制台充值
- 切换到其他服务商（需实现对应 Provider）
- 使用本地模型（需要额外开发）

### 性能问题

**Q: 延迟过高？**

A: 优化措施：
```bash
# 1. 检查网络延迟
ping api.xfyun.cn
ping dashscope.aliyuncs.com

# 2. 使用国内网络/VPN
# 确保到 API 服务器的网络畅通

# 3. 调整配置
# VAD 阈值、音频缓冲、流式参数

# 4. 升级硬件
# 确保 CPU/内存充足
```

**Q: 内存占用过高？**

A: 优化方案：
```bash
# 1. 定期重启服务
cd server && ./run_server.sh restart

# 2. 调整日志级别
# 在 .config.yaml 中设置
logging:
  level: 'WARNING'  # 减少日志输出

# 3. 限制历史记录
dialogue:
  max_history: 5    # 减少上下文长度

# 4. 清理临时文件
rm -rf server/tmp/*
```

### 开发调试

**Q: 如何查看详细日志？**

A: 多种方式：
```bash
# 方式 1：使用管理脚本
cd server && ./run_server.sh logs

# 方式 2：实时监控
tail -f logs/python-server.log

# 方式 3：查看错误日志
tail -f logs/error.log

# 方式 4：手动运行查看输出
cd server
source .venv/bin/activate
python app.py

# 方式 5：启用 DEBUG 级别
# 在 .config.yaml 中设置
logging:
  level: 'DEBUG'
```

**Q: 如何调试客户端？**

A: 使用开发者工具：
```bash
# Electron 应用
# 菜单 → View → Toggle Developer Tools

# 或在代码中添加
# main/index.ts
mainWindow.webContents.openDevTools()

# Web 模式
# 浏览器中按 F12
```

**Q: 完全重置环境？**

A: 清理所有数据：
```bash
# 停止所有服务
cd server && ./run_server.sh stop

# 删除虚拟环境
rm -rf server/.venv

# 清理日志和临时文件
rm -rf logs/* pids/* tmp/* server/tmp/*

# 清理客户端依赖（可选）
rm -rf client/node_modules client/package-lock.json

# 重新安装启动
cd server && ./run_server.sh start
cd client && npm install && npm run dev
```

### 其他问题

**Q: 如何贡献代码？**

A: 参见[贡献指南](#-贡献指南)。

**Q: 在哪里获取帮助？**

A:
- 📖 查看完整文档（本 README）
- 🐛 提交 Issue：https://github.com/WAASSTT/python-mcp/issues
- 💬 参与讨论：https://github.com/WAASSTT/python-mcp/discussions
- 📧 联系作者：通过 GitHub Profile

**Q: 如何更新项目？**

A:
```bash
# 1. 备份配置文件
cp server/.config.yaml ~/backup-config.yaml

# 2. 拉取最新代码
git pull origin main

# 3. 恢复配置
cp ~/backup-config.yaml server/.config.yaml

# 4. 更新依赖
cd server
rm -rf .venv
./run_server.sh start

cd client
npm install

# 5. 重启服务
cd server && ./run_server.sh restart
```

---

## 🛠️ 开发指南

### 环境搭建

**后端开发环境**
```bash
cd server

# 1. 创建虚拟环境
uv venv

# 2. 激活虚拟环境
source .venv/bin/activate  # Linux/macOS
# .venv\Scripts\activate   # Windows

# 3. 安装依赖
uv pip install -r requirements.txt

# 4. 手动运行（便于调试）
python app.py
```

**前端开发环境**
```bash
cd client

# 1. 安装依赖
npm install

# 2. 开发模式
npm run dev          # Electron 模式
npm run web          # Web 模式

# 3. 类型检查
npm run type-check

# 4. 代码检查
npm run lint
```

### 添加新的 AI Provider

项目采用 Provider 模式，可以轻松添加新的 AI 服务。

**步骤 1：创建 Provider 类**

以添加新的 TTS Provider 为例：

```python
# server/core/providers/tts/my_tts_provider.py

from .base import TTSProvider
from typing import AsyncIterator
import aiohttp

class MyTTSProvider(TTSProvider):
    """自定义 TTS Provider"""

    def __init__(self, config: dict):
        """初始化"""
        super().__init__(config)
        self.api_key = config.get('api_key')
        self.model = config.get('model', 'default')

    async def initialize(self):
        """初始化资源"""
        self.session = aiohttp.ClientSession()
        print(f"MyTTS Provider 初始化完成")

    async def synthesize_stream(
        self,
        text: str,
        **kwargs
    ) -> AsyncIterator[bytes]:
        """
        流式语音合成

        Args:
            text: 要合成的文本
            **kwargs: 额外参数

        Yields:
            bytes: 音频数据块
        """
        try:
            # 调用 API
            async with self.session.post(
                'https://api.example.com/tts',
                json={
                    'text': text,
                    'model': self.model,
                },
                headers={'Authorization': f'Bearer {self.api_key}'}
            ) as response:
                # 流式读取响应
                async for chunk in response.content.iter_any():
                    if chunk:
                        yield chunk

        except Exception as e:
            print(f"TTS 合成错误: {e}")
            raise

    async def synthesize(self, text: str, **kwargs) -> bytes:
        """
        一次性语音合成

        Args:
            text: 要合成的文本

        Returns:
            bytes: 完整音频数据
        """
        chunks = []
        async for chunk in self.synthesize_stream(text, **kwargs):
            chunks.append(chunk)
        return b''.join(chunks)

    async def cleanup(self):
        """清理资源"""
        if hasattr(self, 'session'):
            await self.session.close()
```

**步骤 2：注册 Provider**

在配置文件中注册：

```yaml
# server/.config.yaml

selected_module:
  TTS: 'my_tts'  # 使用新的 Provider

TTS:
  my_tts:
    api_key: 'your-api-key'
    model: 'v1'
    # 其他配置...
```

**步骤 3：更新 Provider 工厂**

```python
# server/core/providers/tts/__init__.py

from .my_tts_provider import MyTTSProvider

TTS_PROVIDERS = {
    'huoshan_stream': HuoshanStreamProvider,
    'my_tts': MyTTSProvider,  # 添加新 Provider
}

def get_tts_provider(provider_name: str, config: dict):
    """获取 TTS Provider 实例"""
    provider_class = TTS_PROVIDERS.get(provider_name)
    if not provider_class:
        raise ValueError(f"未知的 TTS Provider: {provider_name}")
    return provider_class(config)
```

### 添加新的消息处理器

**步骤 1：创建处理器类**

```python
# server/core/handle/myCustomHandle.py

from typing import Any, Dict
import asyncio

class MyCustomHandler:
    """自定义消息处理器"""

    def __init__(self, websocket, context):
        self.ws = websocket
        self.context = context

    async def handle(self, message: Dict[str, Any]):
        """
        处理消息

        Args:
            message: 接收到的消息
        """
        action = message.get('action')

        if action == 'my_custom_action':
            await self._handle_custom_action(message)

    async def _handle_custom_action(self, message: Dict[str, Any]):
        """处理自定义动作"""
        data = message.get('data')

        # 业务逻辑处理
        result = await self._process_data(data)

        # 返回结果
        await self.ws.send_json({
            'type': 'custom_result',
            'data': result
        })

    async def _process_data(self, data: Any) -> Any:
        """处理数据"""
        # 实现业务逻辑
        return {'status': 'success', 'data': data}
```

**步骤 2：注册处理器**

```python
# server/core/handle/textMessageHandlerRegistry.py

from .myCustomHandle import MyCustomHandler

class MessageHandlerRegistry:
    """消息处理器注册中心"""

    def __init__(self):
        self.handlers = {
            'hello': HelloHandler,
            'text': TextHandler,
            'audio': AudioHandler,
            'custom': MyCustomHandler,  # 注册新处理器
        }

    def get_handler(self, message_type: str):
        """获取处理器"""
        return self.handlers.get(message_type)
```

### 自定义工具函数

项目支持通过函数调用扩展 LLM 能力。

**步骤 1：定义工具函数**

```python
# server/plugins_func/functions/weather.py

async def get_weather(location: str) -> dict:
    """
    获取天气信息

    Args:
        location: 城市名称

    Returns:
        dict: 天气信息
    """
    # 调用天气 API
    weather_data = {
        'location': location,
        'temperature': '25°C',
        'condition': '晴天',
        'humidity': '60%'
    }
    return weather_data

# 工具描述（用于 LLM）
TOOL_DEFINITION = {
    'type': 'function',
    'function': {
        'name': 'get_weather',
        'description': '获取指定城市的天气信息',
        'parameters': {
            'type': 'object',
            'properties': {
                'location': {
                    'type': 'string',
                    'description': '城市名称，例如：北京、上海'
                }
            },
            'required': ['location']
        }
    }
}
```

**步骤 2：注册工具**

```python
# server/plugins_func/register.py

from .functions.weather import get_weather, TOOL_DEFINITION

AVAILABLE_TOOLS = {
    'get_weather': {
        'function': get_weather,
        'definition': TOOL_DEFINITION
    }
}

def get_tool(tool_name: str):
    """获取工具函数"""
    return AVAILABLE_TOOLS.get(tool_name)
```

### 调试技巧

**1. 启用详细日志**
```yaml
# .config.yaml
logging:
  level: 'DEBUG'  # 显示所有调试信息
```

**2. 使用 IPython 调试**
```bash
cd server
source .venv/bin/activate
pip install ipython

# 在代码中添加断点
import IPython; IPython.embed()
```

**3. 抓取 WebSocket 消息**
```javascript
// 在客户端添加日志
const originalSend = WebSocket.prototype.send;
WebSocket.prototype.send = function(data) {
    console.log('发送:', data);
    return originalSend.apply(this, arguments);
};
```

**4. 测试 API 端点**
```bash
# 使用 curl 测试
curl -X POST http://localhost:30003/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "你好"}'

# 使用 httpie（更友好）
pip install httpie
http POST :30003/api/chat message="你好"
```

### 代码规范

**Python 代码规范**
- 遵循 PEP 8
- 使用类型提示
- 编写文档字符串
- 使用 async/await 处理异步

```python
# 良好示例
async def process_audio(
    audio_data: bytes,
    sample_rate: int = 16000
) -> str:
    """
    处理音频数据

    Args:
        audio_data: 音频二进制数据
        sample_rate: 采样率，默认 16000Hz

    Returns:
        str: 识别的文本结果

    Raises:
        ValueError: 音频数据无效时
    """
    if not audio_data:
        raise ValueError("音频数据不能为空")

    # 处理逻辑...
    return result
```

**TypeScript 代码规范**
- 使用 ESLint 检查
- 遵循 Vue 3 组合式 API
- 使用类型定义
- 组件化开发

```typescript
// 良好示例
interface AudioConfig {
  sampleRate: number;
  channels: number;
}

const useAudio = (config: AudioConfig) => {
  const isRecording = ref(false);

  const startRecording = async (): Promise<void> => {
    // 实现...
  };

  return {
    isRecording,
    startRecording
  };
};
```

### 性能优化

**后端优化**
- 使用连接池
- 启用 HTTP/2
- 实现缓存机制
- 异步处理 I/O

**前端优化**
- 音频缓冲优化
- WebSocket 重连机制
- 状态管理优化
- 懒加载组件

### 测试

**单元测试**
```bash
cd server

# 安装测试依赖
pip install pytest pytest-asyncio

# 运行测试
pytest tests/

# 生成覆盖率报告
pytest --cov=core tests/
```

**集成测试**
```bash
# 使用性能测试工具
cd server
python performance_tester.py
```

---

## 🤝 贡献指南

我们欢迎所有形式的贡献！无论是报告 Bug、提出新功能、改进文档还是提交代码。

### 贡献方式

**🐛 报告问题**
- 使用 [GitHub Issues](https://github.com/WAASSTT/python-mcp/issues)
- 提供详细的问题描述、复现步骤和环境信息
- 附上相关日志和截图

**💡 提出建议**
- 在 [GitHub Discussions](https://github.com/WAASSTT/python-mcp/discussions) 中讨论
- 说明建议的价值和使用场景
- 提供实现思路（可选）

**📝 改进文档**
- 修正错别字和格式问题
- 补充使用示例
- 翻译文档到其他语言

**💻 贡献代码**
- 修复 Bug
- 实现新功能
- 优化性能
- 添加测试

### 开发流程

**1. Fork 项目**
```bash
# 在 GitHub 上 Fork 本仓库
# 然后克隆你的 Fork
git clone https://github.com/YOUR_USERNAME/python-mcp.git
cd python-mcp
```

**2. 创建分支**
```bash
# 从 main 分支创建特性分支
git checkout -b feature/your-feature-name

# 或修复分支
git checkout -b fix/your-bug-fix
```

**3. 开发和测试**
```bash
# 进行代码修改
# ...

# 运行测试
cd server
pytest tests/

# 代码检查
cd client
npm run lint
npm run type-check
```

**4. 提交更改**
```bash
# 添加修改的文件
git add .

# 提交（使用清晰的提交信息）
git commit -m "feat: 添加新的 TTS Provider 支持"

# 推送到你的 Fork
git push origin feature/your-feature-name
```

**5. 创建 Pull Request**
- 在 GitHub 上打开你的 Fork
- 点击 "New Pull Request"
- 填写 PR 标题和详细描述
- 等待代码审查

### 提交信息规范

使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```
<type>(<scope>): <subject>

<body>

<footer>
```

**类型 (type)**
- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档更新
- `style`: 代码格式调整
- `refactor`: 代码重构
- `perf`: 性能优化
- `test`: 测试相关
- `chore`: 构建/工具链相关

**示例**
```bash
# 新功能
git commit -m "feat(tts): 添加阿里云 TTS Provider 支持"

# Bug 修复
git commit -m "fix(websocket): 修复连接断开后无法重连的问题"

# 文档
git commit -m "docs(readme): 更新安装说明"

# 重构
git commit -m "refactor(asr): 优化音频流处理逻辑"
```

### 代码审查标准

**代码质量**
- ✅ 遵循项目代码规范
- ✅ 包含必要的注释和文档
- ✅ 通过所有测试
- ✅ 无明显性能问题

**功能完整性**
- ✅ 实现完整的功能
- ✅ 处理边界情况
- ✅ 包含错误处理
- ✅ 向后兼容（如适用）

**文档**
- ✅ 更新相关文档
- ✅ 添加使用示例
- ✅ 更新 CHANGELOG（如适用）

### 开发环境设置

**安装开发依赖**
```bash
# 后端
cd server
uv pip install -r requirements-dev.txt

# 前端
cd client
npm install --include=dev
```

**配置 Git Hooks**
```bash
# 安装 pre-commit
pip install pre-commit

# 设置 hooks
pre-commit install

# 手动运行检查
pre-commit run --all-files
```

### 测试指南

**编写测试**
```python
# server/tests/test_tts.py
import pytest
from core.providers.tts import MyTTSProvider

@pytest.mark.asyncio
async def test_tts_synthesis():
    """测试 TTS 合成"""
    config = {'api_key': 'test-key'}
    provider = MyTTSProvider(config)

    text = "测试文本"
    audio = await provider.synthesize(text)

    assert audio is not None
    assert len(audio) > 0
```

**运行测试**
```bash
# 所有测试
pytest

# 指定测试文件
pytest tests/test_tts.py

# 显示详细输出
pytest -v

# 生成覆盖率报告
pytest --cov=core --cov-report=html
```

### 项目维护者

- [@WAASSTT](https://github.com/WAASSTT) - 项目创建者和主要维护者

### 行为准则

**我们致力于提供一个友好、安全和欢迎所有人的环境**

请遵守以下准则：
- 🤝 尊重所有贡献者
- 💬 使用友好和包容的语言
- 🎯 专注于问题本身
- 🚫 拒绝骚扰和攻击性行为
- ❤️ 感谢每一个贡献

### 获得帮助

**遇到问题？**
- 📖 查看[常见问题](#-常见问题)
- 💬 在 [Discussions](https://github.com/WAASSTT/python-mcp/discussions) 提问
- 🐛 提交 [Issue](https://github.com/WAASSTT/python-mcp/issues)

**想要贡献但不知从何开始？**
- 查看标有 `good first issue` 的 Issue
- 查看标有 `help wanted` 的 Issue
- 改进文档总是受欢迎的

### 感谢贡献者

感谢所有为项目做出贡献的开发者！

<!-- ALL-CONTRIBUTORS-LIST:START -->
<!-- 贡献者列表会自动生成 -->
<!-- ALL-CONTRIBUTORS-LIST:END -->

---

## 📄 许可证

本项目采用 **MIT 许可证** - 详见 [LICENSE](LICENSE) 文件。

### 许可证摘要

✅ **允许**
- 商业使用
- 修改
- 分发
- 私人使用

⚠️ **要求**
- 保留许可证和版权声明

❌ **禁止**
- 责任承担
- 担保

---

## 🙏 致谢与鸣谢

### 项目基础

本项目基于以下优秀开源项目重构和扩展：
- [xiaozhi-esp32-server](https://github.com/xinnan-tech/xiaozhi-esp32-server) - 感谢原项目提供的架构思路

### AI 服务提供商

感谢以下服务商提供的优质 AI 能力：
- [讯飞开放平台](https://www.xfyun.cn/) - 语音识别技术
- [阿里云百炼](https://bailian.console.aliyun.com/) - 大语言模型
- [火山引擎](https://www.volcengine.com/) - 语音合成服务

### 开源技术

感谢这些优秀的开源项目：

**后端技术**
- [FastAPI](https://fastapi.tiangolo.com/) - 现代高性能 Web 框架
- [uvicorn](https://www.uvicorn.org/) - ASGI 服务器
- [websockets](https://websockets.readthedocs.io/) - WebSocket 实现
- [aiohttp](https://docs.aiohttp.org/) - 异步 HTTP 客户端/服务器

**前端技术**
- [Electron](https://www.electronjs.org/) - 跨平台桌面应用框架
- [Vue 3](https://vuejs.org/) - 渐进式前端框架
- [Vite](https://vitejs.dev/) - 下一代前端构建工具
- [Naive UI](https://www.naiveui.com/) - Vue 3 组件库
- [Pinia](https://pinia.vuejs.org/) - Vue 状态管理
- [VueUse](https://vueuse.org/) - Vue 组合式工具集

**AI 模型**
- [Silero VAD](https://github.com/snakers4/silero-vad) - 语音活动检测模型

**开发工具**
- [uv](https://github.com/astral-sh/uv) - 快速 Python 包管理器
- [TypeScript](https://www.typescriptlang.org/) - JavaScript 类型超集

### 社区贡献

感谢所有通过 Issues、Pull Requests、Discussions 参与项目的贡献者！

---

## 📧 联系方式

### 项目相关

- **GitHub 仓库**: https://github.com/WAASSTT/python-mcp
- **问题反馈**: https://github.com/WAASSTT/python-mcp/issues
- **功能讨论**: https://github.com/WAASSTT/python-mcp/discussions

### 作者信息

- **GitHub**: [@WAASSTT](https://github.com/WAASSTT)
- **邮箱**: 通过 GitHub Profile 联系

### 技术支持

**获取帮助**
1. 📖 查看完整文档（本 README）
2. 🔍 搜索已有的 Issues
3. 💬 在 Discussions 中提问
4. 🐛 提交新的 Issue

**响应时间**
- Issue 响应：通常 24-48 小时内
- Pull Request 审查：通常 2-3 个工作日内
- 紧急问题：通过 Issue 标注为 `urgent`

---

<div align="center">

## ⭐ Star History

如果这个项目对你有帮助，请给个 Star ⭐

[![Star History Chart](https://api.star-history.com/svg?repos=WAASSTT/python-mcp&type=Date)](https://star-history.com/#WAASSTT/python-mcp&Date)

---

### 🌟 项目统计

![GitHub stars](https://img.shields.io/github/stars/WAASSTT/python-mcp?style=social)
![GitHub forks](https://img.shields.io/github/forks/WAASSTT/python-mcp?style=social)
![GitHub issues](https://img.shields.io/github/issues/WAASSTT/python-mcp)
![GitHub pull requests](https://img.shields.io/github/issues-pr/WAASSTT/python-mcp)
![GitHub license](https://img.shields.io/github/license/WAASSTT/python-mcp)
![GitHub last commit](https://img.shields.io/github/last-commit/WAASSTT/python-mcp)

---

**Made with ❤️ by [WAASSTT](https://github.com/WAASSTT)**

**© 2024 - 2026 WAASSTT. All Rights Reserved.**

</div>
