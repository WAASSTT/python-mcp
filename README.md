<div align="center">

# 🎙️ Python MCP - AI 语音助手

<p align="center">
  <strong>企业级实时语音交互系统 | Model Context Protocol 实现</strong>
</p>

<p align="center">
  基于 Python + Vue 3 + Electron 打造的全栈 AI 对话平台<br/>
  集成多模态 AI 能力：ASR、LLM、TTS、Vision、VAD
</p>

<p align="center">
  <a href="https://www.python.org/"><img src="https://img.shields.io/badge/Python-3.10+-3776AB?style=flat-square&logo=python&logoColor=white" alt="Python"></a>
  <a href="https://vuejs.org/"><img src="https://img.shields.io/badge/Vue-3.5-4FC08D?style=flat-square&logo=vue.js&logoColor=white" alt="Vue"></a>
  <a href="https://www.electronjs.org/"><img src="https://img.shields.io/badge/Electron-39-47848F?style=flat-square&logo=electron&logoColor=white" alt="Electron"></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript"></a>
  <a href="https://fastapi.tiangolo.com/"><img src="https://img.shields.io/badge/FastAPI-Latest-009688?style=flat-square&logo=fastapi&logoColor=white" alt="FastAPI"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow?style=flat-square" alt="License"></a>
</p>

<p align="center">
  <a href="#-项目简介">简介</a> •
  <a href="#-快速开始">快速开始</a> •
  <a href="#-核心特性">特性</a> •
  <a href="#️-技术架构">架构</a> •
  <a href="#-部署指南">部署</a> •
  <a href="#-开发指南">开发</a>
</p>

</div>

---

## 📖 目录

- [💡 项目简介](#-项目简介)
- [🚀 快速开始](#-快速开始)
- [✨ 核心特性](#-核心特性)
- [🏗️ 技术架构](#️-技术架构)
- [📦 项目结构](#-项目结构)
- [🔧 配置指南](#-配置指南)
- [🚢 部署指南](#-部署指南)
- [👨‍💻 开发指南](#-开发指南)
- [📚 API 文档](#-api-文档)
- [🔌 插件系统](#-插件系统)
- [🤝 贡献指南](#-贡献指南)
- [📄 许可证](#-许可证)

---

## 💡 项目简介

**Python MCP** 是一个功能完整的企业级 AI 语音助手系统，基于 Model Context Protocol (MCP) 协议实现。项目采用前后端分离架构，提供实时语音识别、自然语言对话、语音合成、视觉理解等多模态 AI 能力。

### 🎯 核心优势

- **🚀 极致性能**
  - 端到端延迟 < 500ms
  - 全链路流式处理
  - 支持并发 100+ 连接

- **🔌 模块化设计**
  - 插件式架构，易扩展
  - 支持多种 AI 服务商
  - 可替换的组件系统

- **🌐 跨平台支持**
  - Electron 桌面应用（Windows/macOS/Linux）
  - 渐进式 Web 应用（PWA）
  - ESP32 嵌入式设备支持

- **🔐 企业级安全**
  - JWT 身份认证
  - WebSocket 加密传输
  - 设备白名单机制

### 🎪 应用场景

| 场景       | 说明                       | 适用行业         |
| ---------- | -------------------------- | ---------------- |
| 🏠 智能家居 | 语音控制家居设备、场景联动 | 物联网、智能硬件 |
| 📞 智能客服 | 实时语音客服、意图识别     | 零售、金融、电信 |
| 🎓 教育助手 | 语音答疑、互动学习         | 在线教育、培训   |
| 🚗 车载交互 | 车载语音助手、导航控制     | 汽车、出行       |
| 🏥 医疗录入 | 语音病历、智能问诊         | 医疗健康         |

---

## 🚀 快速开始

### 📋 环境要求

| 组件    | 版本要求 | 说明              |
| ------- | -------- | ----------------- |
| Python  | 3.10+    | 推荐 3.10 或 3.12 |
| Node.js | 18+      | 包含 npm          |
| Git     | 最新版   | 版本控制          |

### ⚡ 快速部署（5分钟）

```bash
# 1️⃣ 克隆项目
git clone https://github.com/WAASSTT/python-mcp.git
cd python-mcp

# 2️⃣ 服务端配置与启动
cd server

# 创建配置文件
cp config.yaml data/.config.yaml

# 编辑配置文件，填入 API 密钥
vim data/.config.yaml

# 安装依赖（使用 uv 或 pip）
pip install -r requirements.txt

# 启动服务
chmod +x run.sh
./run.sh

# 3️⃣ 客户端启动（新终端）
cd ../client

# 安装依赖
npm install

# 开发模式
npm run dev

# 或构建桌面应用
npm run build
```

### 🔑 API 密钥获取

在 `server/data/.config.yaml` 中配置以下服务的 API 密钥：

| 服务       | 平台             | 用途             | 获取地址                                           |
| ---------- | ---------------- | ---------------- | -------------------------------------------------- |
| 🎤 讯飞语音 | 讯飞开放平台     | 语音识别 (ASR)   | [申请链接](https://www.xfyun.cn/)                  |
| 🧠 通义千问 | 阿里云百炼       | 大语言模型 (LLM) | [申请链接](https://bailian.console.aliyun.com/)    |
| 🔊 火山引擎 | 火山引擎         | 语音合成 (TTS)   | [申请链接](https://www.volcengine.com/product/tts) |
| 👁️ 百度 AI  | 百度 AI 开放平台 | 图像识别 (可选)  | [申请链接](https://ai.baidu.com/)                  |

配置示例：

```yaml
# ASR 配置
asr:
  selected_module: xfyun_asr
  xfyun_asr:
    appid: "your_appid"
    api_key: "your_api_key"
    api_secret: "your_api_secret"

# LLM 配置
llm:
  selected_module: qwen_llm
  qwen_llm:
    api_key: "your_api_key"
    model: "qwen-max"

# TTS 配置
tts:
  selected_module: volcengine_tts
  volcengine_tts:
    appid: "your_appid"
    access_token: "your_access_token"
```

### ✅ 验证安装

```bash
# 检查服务端是否启动
curl http://localhost:30000/health

# 访问 Web 界面
# 浏览器打开: http://localhost:5173
```

---

## ✨ 核心特性

### 🤖 AI 能力矩阵

| 模块         | 服务商                   | 核心特性                                 | 性能指标 | 支持状态 |
| ------------ | ------------------------ | ---------------------------------------- | -------- | -------- |
| 🎤 **ASR**    | 讯飞、FunASR、Vosk       | • 流式识别<br>• 202种方言<br>• 热词定制  | < 300ms  | ✅        |
| 🧠 **LLM**    | 通义千问、OpenAI、Gemini | • 流式对话<br>• 函数调用<br>• 上下文记忆 | 实时流式 | ✅        |
| 👁️ **Vision** | 通义千问-VL、百度        | • 图像理解<br>• OCR识别<br>• 物体检测    | < 2s     | ✅        |
| 🔊 **TTS**    | 火山引擎、Edge TTS       | • 325+音色<br>• 情感控制<br>• 语速调节   | < 200ms  | ✅        |
| 🎚️ **VAD**    | Silero VAD               | • 实时检测<br>• 低资源占用<br>• 高准确率 | < 30ms   | ✅        |
| 🔮 **Intent** | 自定义规则               | • 意图识别<br>• 实体抽取<br>• 多轮对话   | < 50ms   | ✅        |
| 💾 **Memory** | Mem0、Redis              | • 对话记忆<br>• 用户画像<br>• 知识图谱   | < 100ms  | ✅        |

### 🎯 核心功能

#### 1. 实时语音对话
- **全双工通信**：支持同时说话和听话
- **流式处理**：ASR、LLM、TTS 全链路流式传输
- **低延迟**：端到端延迟 < 500ms
- **自动断句**：智能识别语音停顿，自然分段

#### 2. 多模态交互
- **语音输入**：支持多种 ASR 引擎切换
- **文本输入**：支持纯文本对话模式
- **图像理解**：上传图片进行视觉问答
- **语音输出**：多种音色和语速可调

#### 3. 智能记忆
- **对话历史**：自动保存对话上下文
- **用户画像**：学习用户偏好和习惯
- **知识管理**：支持 RAG 检索增强生成

#### 4. 插件系统
- **工具调用**：支持 LLM Function Calling
- **自定义插件**：Python 插件开发框架
- **IoT 集成**：MQTT、HTTP、UDP 设备控制

---

## 🏗️ 技术架构

### 系统架构图

```
┌─────────────────────────────────────────────────────────────┐
│                     🖥️  Client Layer                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Electron   │  │   Web App    │  │   ESP32      │      │
│  │   Desktop    │  │     PWA      │  │   Device     │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                 │                 │               │
│         └─────────────────┼─────────────────┘               │
│                           │ WebSocket                       │
└───────────────────────────┼─────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                     🚀  Server Layer                         │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              WebSocket Server (30000)                │   │
│  │              HTTP API Server (30003)                 │   │
│  └──────────────────────┬───────────────────────────────┘   │
│                         │                                    │
│  ┌──────────────────────┼───────────────────────────────┐   │
│  │           Connection Manager & Router              │   │
│  └──────────┬───────────┴───────────┬──────────────────┘   │
│             │                       │                       │
│  ┌──────────▼──────────┐  ┌────────▼────────┐             │
│  │  Audio Handlers     │  │  Text Handlers  │             │
│  │  - receiveAudio     │  │  - textMessage  │             │
│  │  - sendAudio        │  │  - vision       │             │
│  └──────────┬──────────┘  └────────┬────────┘             │
│             │                       │                       │
└─────────────┼───────────────────────┼───────────────────────┘
              │                       │
              ▼                       ▼
┌─────────────────────────────────────────────────────────────┐
│                     🤖  AI Layer                             │
│  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐  ┌──────┐ │
│  │  VAD   │→ │  ASR   │→ │ Intent │→ │  LLM   │→ │ TTS  │ │
│  │ Silero │  │ 讯飞   │  │ 规则   │  │ 千问   │  │ 火山 │ │
│  └────────┘  └────────┘  └────────┘  └────────┘  └──────┘ │
│                                                              │
│  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐           │
│  │ Vision │  │ Memory │  │ Tools  │  │ Plugin │           │
│  │ 百度   │  │ Mem0   │  │ Custom │  │ System │           │
│  └────────┘  └────────┘  └────────┘  └────────┘           │
└─────────────────────────────────────────────────────────────┘
```

### 数据流程

```
用户语音输入 → Opus 编码 → WebSocket 传输
    ↓
VAD 检测（语音活动）
    ↓
ASR 流式识别（讯飞/FunASR）
    ↓
Intent 意图分析（可选）
    ↓
LLM 生成回复（通义千问/OpenAI）
    ↓
TTS 语音合成（火山引擎）
    ↓
Opus 编码 → WebSocket 传输 → 客户端播放
```

### 技术栈详解

#### 🖥️ 客户端技术栈

| 类别         | 技术                        | 版本   | 说明                       |
| ------------ | --------------------------- | ------ | -------------------------- |
| **框架**     | Electron                    | 39     | 跨平台桌面应用框架         |
|              | Vue 3                       | 3.5    | 渐进式前端框架             |
|              | TypeScript                  | 5.9    | 类型安全的 JavaScript 超集 |
| **UI 组件**  | Naive UI                    | 2.43   | Vue 3 组件库               |
|              | Vue Data UI                 | 3.9    | 数据可视化组件             |
| **状态管理** | Pinia                       | Latest | Vue 状态管理               |
|              | Pinia Plugin Persistedstate | -      | 状态持久化                 |
| **工具库**   | VueUse                      | 14.1   | Vue 组合式 API 工具集      |
|              | GSAP                        | 3.14   | 动画库                     |
| **音频**     | OpusLib                     | -      | Opus 音频编解码            |
|              | Web Audio API               | -      | 浏览器音频 API             |
| **构建**     | Vite                        | 6.0    | 前端构建工具               |
|              | Electron Vite               | 3.0    | Electron 专用 Vite         |

#### 🔧 服务端技术栈

| 类别         | 技术       | 版本   | 说明                   |
| ------------ | ---------- | ------ | ---------------------- |
| **框架**     | Python     | 3.10+  | 编程语言               |
|              | FastAPI    | Latest | 高性能 Web 框架        |
|              | asyncio    | -      | 异步 IO 库             |
| **通信**     | WebSockets | 14.2   | WebSocket 协议         |
|              | AIOHTTP    | 3.13   | 异步 HTTP 客户端       |
| **AI 集成**  | OpenAI SDK | 2.8    | OpenAI API             |
|              | DashScope  | 1.25   | 阿里云大模型           |
|              | FunASR     | 1.2    | 语音识别               |
|              | Silero VAD | 6.1    | 语音活动检测           |
| **音频处理** | PyDub      | 0.25   | 音频处理               |
|              | OpusLib    | 1.1    | Opus 编解码            |
|              | Torch      | 2.2    | 深度学习框架           |
| **MCP**      | MCP        | 1.22   | Model Context Protocol |
|              | MCP Proxy  | 0.10   | MCP 代理服务           |
| **数据**     | Mem0ai     | 1.0    | AI 记忆系统            |
|              | YAML       | -      | 配置文件格式           |
| **工具**     | Loguru     | 0.7    | 日志系统               |
|              | PyJWT      | 2.10   | JWT 认证               |
|              | psutil     | 7.1    | 系统监控               |

---

## 📦 项目结构

```
python-mcp/
├── README.md                    # 项目说明文档
│
├── server/                      # 🔧 Python 后端服务
│   ├── app.py                  # FastAPI 主应用入口
│   ├── run.sh                  # 服务管理脚本
│   ├── requirements.txt        # Python 依赖
│   ├── config.yaml             # 配置模板（不要直接修改）
│   ├── mcp_server_settings.json # MCP 服务器配置
│   ├── docker-compose.yml      # Docker 部署配置
│   │
│   ├── config/                 # 配置管理
│   │   ├── config_loader.py   # 配置加载器
│   │   ├── logger.py           # 日志配置
│   │   ├── settings.py         # 设置管理
│   │   └── assets/             # 静态资源
│   │       ├── bind_code/      # 设备绑定码
│   │       └── wakeup_words/   # 唤醒词音频
│   │
│   ├── core/                   # 核心业务逻辑
│   │   ├── connection.py       # 连接管理
│   │   ├── websocket_server.py # WebSocket 服务
│   │   ├── http_server.py      # HTTP API 服务
│   │   ├── auth.py             # 认证系统
│   │   │
│   │   ├── handle/             # 消息处理器
│   │   │   ├── receiveAudioHandle.py  # 接收音频
│   │   │   ├── sendAudioHandle.py     # 发送音频
│   │   │   ├── textHandle.py          # 文本处理
│   │   │   ├── textMessageHandler.py  # 消息处理
│   │   │   ├── intentHandler.py       # 意图识别
│   │   │   └── reportHandle.py        # 设备上报
│   │   │
│   │   ├── providers/          # AI 服务提供商
│   │   │   ├── asr/           # 语音识别
│   │   │   │   ├── xfyun_asr.py      # 讯飞 ASR
│   │   │   │   ├── funasr_asr.py     # FunASR
│   │   │   │   └── vosk_asr.py       # Vosk
│   │   │   ├── llm/           # 大语言模型
│   │   │   │   ├── qwen_llm.py       # 通义千问
│   │   │   │   ├── openai_llm.py     # OpenAI
│   │   │   │   └── gemini_llm.py     # Google Gemini
│   │   │   ├── tts/           # 语音合成
│   │   │   │   ├── volcengine_tts.py # 火山引擎
│   │   │   │   └── edge_tts.py       # Edge TTS
│   │   │   ├── vad/           # 语音活动检测
│   │   │   │   └── silero_vad.py
│   │   │   ├── vllm/          # 视觉语言模型
│   │   │   │   └── qwen_vl.py
│   │   │   ├── intent/        # 意图识别
│   │   │   ├── memory/        # 记忆系统
│   │   │   └── tools/         # 工具插件
│   │   │
│   │   ├── utils/              # 工具函数
│   │   │   ├── asr.py         # ASR 工具
│   │   │   ├── llm.py         # LLM 工具
│   │   │   ├── memory.py      # 记忆工具
│   │   │   ├── dialogue.py    # 对话管理
│   │   │   ├── opus_encoder_utils.py # Opus 编码
│   │   │   └── prompt_manager.py     # 提示词管理
│   │   │
│   │   └── api/                # HTTP API 接口
│   │       ├── vision_handler.py # 视觉分析
│   │       └── ota_handler.py    # OTA 更新
│   │
│   ├── plugins_func/           # 插件系统
│   │   ├── loadplugins.py     # 插件加载器
│   │   ├── register.py        # 插件注册
│   │   └── functions/         # 自定义函数
│   │
│   ├── models/                 # AI 模型文件
│   │   ├── SenseVoiceSmall/   # 语音识别模型
│   │   └── snakers4_silero-vad/ # VAD 模型
│   │
│   ├── data/                   # 数据目录
│   │   └── .config.yaml       # 用户配置（需创建）
│   │
│   └── test/                   # 测试文件
│       └── test_page.html     # 测试页面
│
├── client/                      # 💻 Electron 客户端
│   ├── package.json            # Node.js 配置
│   ├── electron-builder.yml    # 打包配置
│   ├── electron.vite.config.ts # Vite 配置
│   ├── tsconfig.json           # TypeScript 配置
│   │
│   ├── src/
│   │   ├── main/              # Electron 主进程
│   │   │   ├── index.ts       # 主进程入口
│   │   │   ├── lang/          # 多语言
│   │   │   └── tool/          # 工具函数
│   │   │
│   │   ├── preload/           # 预加载脚本
│   │   │   ├── index.ts       # 预加载入口
│   │   │   └── index.d.ts     # 类型定义
│   │   │
│   │   └── renderer/          # 渲染进程（Vue 应用）
│   │       ├── index.html     # HTML 入口
│   │       └── src/           # Vue 源码
│   │           ├── App.vue
│   │           ├── main.ts
│   │           ├── components/ # 组件
│   │           ├── views/      # 页面
│   │           ├── store/      # 状态管理
│   │           ├── router/     # 路由
│   │           └── assets/     # 静态资源
│   │
│   ├── build/                  # 构建资源
│   │   └── entitlements.mac.plist
│   │
│   └── resources/              # 应用资源
│       └── libopus.js         # Opus 库
│
├── logs/                        # 📝 日志文件
├── pids/                        # 🔢 进程 ID 文件
└── tmp/                         # 📂 临时文件
    └── asr/                    # ASR 临时文件
```

### 核心模块说明

| 模块               | 路径                                       | 说明              |
| ------------------ | ------------------------------------------ | ----------------- |
| **WebSocket 服务** | `server/core/websocket_server.py`          | 实时通信服务      |
| **音频处理**       | `server/core/handle/receiveAudioHandle.py` | 接收和处理音频流  |
| **ASR 集成**       | `server/core/providers/asr/`               | 多种 ASR 引擎支持 |
| **LLM 集成**       | `server/core/providers/llm/`               | 多种 LLM 模型支持 |
| **TTS 集成**       | `server/core/providers/tts/`               | 多种 TTS 引擎支持 |
| **对话管理**       | `server/core/utils/dialogue.py`            | 对话上下文管理    |
| **插件系统**       | `server/plugins_func/`                     | 自定义插件开发    |
| **前端应用**       | `client/src/renderer/`                     | Vue 3 渲染进程    |

---

## 🔧 配置指南

### 配置文件优先级

系统按以下顺序读取配置（后者覆盖前者）：

1. `server/config.yaml` - 默认配置模板（不要修改）
2. `server/data/.config.yaml` - 用户自定义配置（推荐）
3. 智控台 API - 远程配置（最高优先级）

### 创建配置文件

```bash
cd server

# 创建 data 目录
mkdir -p data

# 复制配置模板
cp config.yaml data/.config.yaml

# 编辑配置
vim data/.config.yaml
```

### 核心配置项

#### 1. 服务器配置

```yaml
server:
  ip: 0.0.0.0              # 监听地址
  port: 30000              # WebSocket 端口
  http_port: 30003         # HTTP API 端口
  websocket: ws://localhost:30000/xiaozhi/v1/
  auth:
    enabled: false         # 是否启用认证
    allowed_devices:       # 白名单设备
      - '11:22:33:44:55:66'
```

#### 2. ASR 配置（语音识别）

```yaml
asr:
  selected_module: xfyun_asr  # 选择的 ASR 模块

  # 讯飞语音识别
  xfyun_asr:
    appid: "your_appid"
    api_key: "your_api_key"
    api_secret: "your_api_secret"
    # language: "zh_cn"      # 语言
    # accent: "mandarin"     # 口音
    # vad_eos: 2000          # 静音检测（毫秒）

  # FunASR 本地识别
  funasr_asr:
    model_dir: "models/SenseVoiceSmall"
    device: "cpu"           # 或 "cuda"

  # Vosk 本地识别
  vosk_asr:
    model_path: "models/vosk-model-cn"
```

#### 3. LLM 配置（大语言模型）

```yaml
llm:
  selected_module: qwen_llm  # 选择的 LLM 模块

  # 通义千问
  qwen_llm:
    api_key: "sk-your-api-key"
    model: "qwen-max"       # qwen-max, qwen-plus, qwen-turbo
    base_url: null          # 自定义 API 地址
    temperature: 0.8        # 温度参数
    max_tokens: 2000        # 最大输出长度
    top_p: 0.9             # 采样参数

  # OpenAI
  openai_llm:
    api_key: "sk-your-api-key"
    model: "gpt-4"          # gpt-4, gpt-3.5-turbo
    base_url: null

  # Google Gemini
  gemini_llm:
    api_key: "your-api-key"
    model: "gemini-pro"
```

#### 4. TTS 配置（语音合成）

```yaml
tts:
  selected_module: volcengine_tts  # 选择的 TTS 模块

  # 火山引擎 TTS
  volcengine_tts:
    appid: "your_appid"
    access_token: "your_access_token"
    speaker: "zh_female_qingxin"  # 音色
    speed_ratio: 1.0       # 语速（0.5-2.0）
    volume_ratio: 1.0      # 音量（0.5-2.0）
    pitch_ratio: 1.0       # 音调（0.5-2.0）

  # Edge TTS（免费）
  edge_tts:
    speaker: "zh-CN-XiaoxiaoNeural"
    rate: "+0%"            # 语速
    volume: "+0%"          # 音量
```

#### 5. VAD 配置（语音活动检测）

```yaml
vad:
  selected_module: silero_vad

  silero_vad:
    threshold: 0.5         # 检测阈值（0-1）
    sampling_rate: 16000   # 采样率
    min_speech_duration_ms: 250  # 最小语音时长
    min_silence_duration_ms: 500 # 最小静音时长
```

#### 6. Vision 配置（视觉理解）

```yaml
vllm:
  selected_module: qwen_vl

  qwen_vl:
    api_key: "your-api-key"
    model: "qwen-vl-max"   # qwen-vl-max, qwen-vl-plus
```

#### 7. Memory 配置（记忆系统）

```yaml
memory:
  selected_module: mem0_memory

  mem0_memory:
    api_key: "your-api-key"
    user_id: "default"     # 用户 ID
    enabled: true          # 是否启用记忆
```

### 常用音色列表

#### 火山引擎 TTS 音色

| 音色 ID               | 类型 | 特点     | 适用场景   |
| --------------------- | ---- | -------- | ---------- |
| `zh_female_qingxin`   | 女声 | 清新自然 | 通用、客服 |
| `zh_female_wanxiaoyu` | 女声 | 甜美可爱 | 陪伴、教育 |
| `zh_female_tianmei`   | 女声 | 甜美温柔 | 故事、助手 |
| `zh_male_qingxin`     | 男声 | 清晰稳重 | 商务、播报 |
| `zh_male_chunhou`     | 男声 | 醇厚磁性 | 成熟、专业 |
| `zh_male_zhouyuan`    | 男声 | 浑厚有力 | 严肃、正式 |

#### Edge TTS 音色

| 音色 ID                | 类型 | 特点     |
| ---------------------- | ---- | -------- |
| `zh-CN-XiaoxiaoNeural` | 女声 | 温柔亲切 |
| `zh-CN-YunxiNeural`    | 男声 | 沉稳自然 |
| `zh-CN-YunyangNeural`  | 男声 | 专业播报 |
| `zh-CN-XiaoyiNeural`   | 女声 | 活泼可爱 |

### 日志配置

```yaml
log:
  log_level: INFO          # INFO, DEBUG, WARNING, ERROR
  log_dir: logs            # 日志目录
  log_file: server.log     # 日志文件名
  data_dir: data           # 数据目录
```

### 其他配置

```yaml
# 音频处理
delete_audio: true                    # 使用后删除音频文件
close_connection_no_voice_time: 120  # 无语音断开时间（秒）
tts_timeout: 10                       # TTS 超时（秒）
tts_audio_send_delay: 0               # TTS 音频发送延迟（毫秒，0=自动）

# 功能开关
enable_wakeup_words_response_cache: true  # 唤醒词加速
enable_greeting: true                      # 开场问候
enable_stop_tts_notify: false              # 结束提示音
enable_websocket_ping: false               # WebSocket 心跳
```

---

## 🚢 部署指南

### 开发环境

```bash
# 服务端
cd server
pip install -r requirements.txt
python app.py

# 客户端
cd client
npm install
npm run dev
```

### Docker 部署

```bash
cd server

# 使用 docker-compose
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

### 生产环境部署

#### 1. 使用 Systemd（推荐）

创建 `/etc/systemd/system/python-mcp.service`：

```ini
[Unit]
Description=Python MCP AI Voice Assistant
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/python-mcp/server
ExecStart=/usr/bin/python3 app.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

启动服务：

```bash
sudo systemctl daemon-reload
sudo systemctl enable python-mcp
sudo systemctl start python-mcp
sudo systemctl status python-mcp
```

#### 2. 使用 PM2

```bash
# 安装 PM2
npm install -g pm2

# 启动服务
cd server
pm2 start app.py --name python-mcp --interpreter python3

# 查看状态
pm2 status

# 查看日志
pm2 logs python-mcp

# 开机自启
pm2 startup
pm2 save
```

#### 3. 客户端打包

```bash
cd client

# Windows
npm run build:win

# macOS
npm run build:mac

# Linux
npm run build:linux

# 全平台
npm run build
```

打包产物在 `client/dist` 目录。

### Nginx 反向代理（可选）

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # WebSocket
    location /xiaozhi/v1/ {
        proxy_pass http://localhost:30000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # HTTP API
    location /mcp/ {
        proxy_pass http://localhost:30003;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## 👨‍💻 开发指南

### 服务端开发

#### 添加新的 ASR 提供商

1. 在 `server/core/providers/asr/` 创建新文件，如 `custom_asr.py`
2. 继承 `BaseASR` 类并实现接口：

```python
from typing import AsyncIterator
from .base_asr import BaseASR

class CustomASR(BaseASR):
    def __init__(self, config: dict):
        super().__init__(config)
        # 初始化您的 ASR 客户端

    async def recognize_stream(
        self,
        audio_stream: AsyncIterator[bytes]
    ) -> AsyncIterator[dict]:
        """
        流式识别接口

        Args:
            audio_stream: 音频流（16kHz, 16bit, PCM）

        Yields:
            {"text": "识别文本", "is_final": True}
        """
        async for audio_chunk in audio_stream:
            # 发送音频到 ASR 服务
            result = await self.client.send(audio_chunk)

            # 返回识别结果
            yield {
                "text": result.text,
                "is_final": result.is_final
            }
```

3. 在配置文件注册：

```yaml
asr:
  selected_module: custom_asr
  custom_asr:
    api_key: "your-key"
```

#### 添加插件（Function Calling）

在 `server/plugins_func/functions/` 创建插件文件：

```python
from plugins_func.register import register_plugin

@register_plugin(
    name="get_weather",
    description="获取指定城市的天气信息",
    parameters={
        "type": "object",
        "properties": {
            "city": {
                "type": "string",
                "description": "城市名称"
            }
        },
        "required": ["city"]
    }
)
async def get_weather(city: str) -> str:
    """
    获取天气

    Args:
        city: 城市名称

    Returns:
        天气信息字符串
    """
    # 调用天气 API
    result = await weather_api.get(city)
    return f"{city}今天{result.weather}，温度{result.temp}度"
```

### 客户端开发

#### 添加新页面

1. 在 `client/src/renderer/src/views/` 创建页面：

```vue
<template>
  <div class="my-page">
    <h1>{{ title }}</h1>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const title = ref('My New Page')
</script>

<style scoped lang="scss">
.my-page {
  padding: 20px;
}
</style>
```

2. 在路由配置添加路由：

```typescript
// client/src/renderer/src/router/index.ts
{
  path: '/my-page',
  name: 'MyPage',
  component: () => import('@/views/MyPage.vue')
}
```

#### 使用 WebSocket

```typescript
import { useWebSocket } from '@/hooks/useWebSocket'

const { connect, send, on, disconnect } = useWebSocket()

// 连接服务器
await connect('ws://localhost:30000/xiaozhi/v1/')

// 监听消息
on('message', (data) => {
  console.log('Received:', data)
})

// 发送音频
send({
  type: 'audio',
  data: audioBuffer
})

// 断开连接
disconnect()
```

### 开发命令

#### 服务端

```bash
cd server

# 启动开发服务器
python app.py

# 运行测试
python -m pytest test/

# 性能测试
python performance_tester.py
```

#### 客户端

```bash
cd client

# 开发模式（Electron）
npm run dev

# Web 模式（浏览器）
npm run web

# 代码检查
npm run lint

# 格式化代码
npm run format

# 类型检查
npm run typecheck

# 构建应用
npm run build

# 构建特定平台
npm run build:win    # Windows
npm run build:mac    # macOS
npm run build:linux  # Linux
```

---

## 📚 API 文档

### WebSocket API

#### 连接

```
ws://localhost:30000/xiaozhi/v1/
```

#### 消息格式

所有消息使用 JSON 格式，通过 `type` 字段区分消息类型。

#### 1. Hello（握手）

**客户端 → 服务器**

```json
{
  "type": "hello",
  "device_id": "11:22:33:44:55:66",
  "token": "optional-jwt-token",
  "client_version": "1.0.0"
}
```

**服务器 → 客户端**

```json
{
  "type": "hello",
  "status": "success",
  "server_version": "1.0.0",
  "session_id": "uuid-string"
}
```

#### 2. Audio（音频流）

**客户端 → 服务器**

```json
{
  "type": "audio",
  "data": "base64-encoded-opus-audio",
  "format": "opus",
  "sample_rate": 16000,
  "channels": 1
}
```

**服务器 → 客户端**

```json
{
  "type": "audio",
  "data": "base64-encoded-opus-audio",
  "format": "opus",
  "sample_rate": 24000
}
```

#### 3. Text（文本消息）

**客户端 → 服务器**

```json
{
  "type": "text",
  "text": "你好，请介绍一下自己",
  "mode": "chat"
}
```

**服务器 → 客户端（流式）**

```json
{
  "type": "text_stream",
  "text": "你好！",
  "is_final": false,
  "sequence": 1
}
```

#### 4. Control（控制命令）

```json
{
  "type": "control",
  "action": "stop_tts"  // stop_tts, pause, resume
}
```

### HTTP API

```bash
# 健康检查
GET /health

# 视觉分析
POST /mcp/vision/explain
Content-Type: multipart/form-data

# OTA 设备管理
GET /mcp/ota/device_info?device_id=xxx
```

---

## 🔌 插件系统

### 创建插件

在 `server/plugins_func/functions/` 创建 Python 文件：

```python
from plugins_func.register import register_plugin

@register_plugin(
    name="get_weather",
    description="获取指定城市的实时天气信息",
    parameters={
        "type": "object",
        "properties": {
            "city": {
                "type": "string",
                "description": "城市名称"
            }
        },
        "required": ["city"]
    }
)
async def get_weather(city: str) -> str:
    """获取天气信息"""
    # 调用天气 API
    return f"{city}今天晴，温度25°C"
```

插件会自动被 LLM 调用。

---

## 🔍 故障排查

### 常见问题

**Q: 端口被占用？**
```bash
lsof -i :30000
kill -9 <PID>
```

**Q: WebSocket 连接失败？**
```bash
./run.sh status
./run.sh logs
```

**Q: 查看详细日志？**
```bash
tail -f logs/server.log
```

### 性能测试

```bash
cd server
python performance_tester/performance_tester_asr.py
python performance_tester/performance_tester_llm.py
python performance_tester/performance_tester_tts.py
```

---

## 📊 性能指标

### 硬件要求

| 组件     | 最低配置 | 推荐配置  |
| -------- | -------- | --------- |
| **CPU**  | 2核      | 4核+      |
| **内存** | 4GB      | 8GB+      |
| **硬盘** | 10GB     | 20GB+ SSD |
| **网络** | 1Mbps    | 10Mbps+   |

### 性能基准

| 指标             | 数值      | 说明             |
| ---------------- | --------- | ---------------- |
| **ASR 延迟**     | 200-300ms | 从音频到识别结果 |
| **LLM 首字延迟** | 300-500ms | 流式响应第一个字 |
| **TTS 延迟**     | 150-200ms | 从文本到音频播放 |
| **端到端延迟**   | < 1s      | 完整对话轮次     |
| **并发连接**     | 100+      | 单服务器支持数   |

---

## 🛡️ 安全建议

### 生产环境配置

1. **启用认证**
   ```yaml
   server:
     auth:
       enabled: true
   ```

2. **使用 HTTPS/WSS**
   - 配置 SSL 证书
   - 使用 Nginx 反向代理

3. **密钥管理**
   - 不要将 API 密钥提交到 Git
   - 使用环境变量
   - 定期轮换密钥

---

## 🤝 贡献指南

欢迎贡献代码、报告问题或提出新功能建议！

### 贡献流程

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

### 代码规范

**Python**
- 遵循 PEP 8 规范
- 使用类型提示
- 添加文档字符串

**TypeScript**
- 使用 ESLint + Prettier
- 遵循 Vue 3 组合式 API 风格

---

## 📜 更新日志

### v1.0.0 (2026-01-21)

#### ✨ 新功能
- 🎤 集成讯飞、FunASR、Vosk 多种 ASR 引擎
- 🧠 支持通义千问、OpenAI、Gemini 等 LLM
- 🔊 集成火山引擎、Edge TTS 语音合成
- 👁️ 添加图像理解和 OCR 功能
- 💾 实现基于 Mem0 的记忆系统
- 🔌 完整的插件系统
- 🖥️ Electron 跨平台桌面应用
- 🌐 PWA 渐进式 Web 应用支持

---

## 🙏 致谢

感谢以下开源项目和服务：

**技术框架**
- [FastAPI](https://fastapi.tiangolo.com/) - 高性能 Web 框架
- [Vue.js](https://vuejs.org/) - 渐进式前端框架
- [Electron](https://www.electronjs.org/) - 跨平台桌面应用

**AI 能力**
- [Silero VAD](https://github.com/snakers4/silero-vad) - 语音活动检测
- [讯飞开放平台](https://www.xfyun.cn/) - 语音识别服务
- [阿里云百炼](https://bailian.console.aliyun.com/) - 大语言模型
- [火山引擎](https://www.volcengine.com/) - 语音合成服务

---

## 📄 许可证

本项目采用 [MIT License](LICENSE) 开源协议。

```
MIT License

Copyright (c) 2026 WAASSTT

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software...
```

---

## 📞 联系方式

- **GitHub**: [@WAASSTT](https://github.com/WAASSTT)
- **Issues**: [提交问题](https://github.com/WAASSTT/python-mcp/issues)
- **Discussions**: [参与讨论](https://github.com/WAASSTT/python-mcp/discussions)


---

<div align="center">

**⭐ 如果这个项目对您有帮助，请给个 Star！⭐**

Made with ❤️ by [WAASSTT](https://github.com/WAASSTT)

[🏠 首页](https://github.com/WAASSTT/python-mcp) ·
[📖 文档](#) ·
[🐛 报告问题](https://github.com/WAASSTT/python-mcp/issues) ·
[💡 功能建议](https://github.com/WAASSTT/python-mcp/issues/new?labels=enhancement)

</div>

