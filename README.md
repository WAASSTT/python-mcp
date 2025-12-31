<div align="center">

# 🎙️ AI 语音助手

**企业级实时语音交互系统**

基于 Python + Vue + Electron 构建的跨平台 AI 对话平台

集成讯飞 ASR、通义千问 LLM、火山引擎 TTS

[![Python](https://img.shields.io/badge/Python-3.12+-3776AB?style=flat-square&logo=python&logoColor=white)](https://www.python.org/)
[![Vue](https://img.shields.io/badge/Vue-3.5-4FC08D?style=flat-square&logo=vue.js&logoColor=white)](https://vuejs.org/)
[![Electron](https://img.shields.io/badge/Electron-39-47848F?style=flat-square&logo=electron&logoColor=white)](https://www.electronjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-Latest-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)

[快速开始](#-快速开始) • [功能特性](#-核心功能) • [文档导航](#-文档导航)

</div>

---

## ✨ 为什么选择这个项目？

<table>
<tr>
<td width="50%">

### 🚀 极简部署
```bash
# 启动服务器
cd server
./run_server.sh start

# 启动客户端（新终端）
cd client
npm install  # 首次运行需要安装依赖
npm run dev  # 开发模式
# 或
npm run web  # Web 模式

# 开始使用!
```

**传统项目**:手动启动多个服务,配置各种端口
**本项目**:独立脚本管理,支持桌面和 Web 双模式

</td>
<td width="50%">

### 🎯 生产级架构
- ⚡ **超低延迟**：< 100ms 音频响应
- 🔄 **全流式处理**：边说边识别边回复
- 🖥️ **Electron 客户端**：Vue 3 + TypeScript 桌面应用
- 🌐 **Web 模式**：支持浏览器访问
- 🎯 **简单部署**：独立脚本管理
- 📊 **完善监控**：实时状态 + 日志管理

</td>
</tr>
</table>

---

## 🚀 快速开始

### 前置要求

<table>
<tr>
<td>✅ Python 3.12+</td>
<td>✅ uv (Python 包管理器)</td>
<td>✅ Node.js 18+ (客户端开发)</td>
</tr>
</table>

### 3 分钟部署

```bash
# 1️⃣ 克隆项目
git clone https://github.com/WAASSTT/python-mcp.git
cd python-mcp

# 2️⃣ 配置密钥（获取方式见下方）
cp server/config.yaml server/.config.yaml
vim server/.config.yaml  # 填入 API 密钥

# 3️⃣ 启动服务

# 启动服务器
cd server && chmod +x run_server.sh && ./run_server.sh start

# 启动客户端（新终端）
cd client && npm install && npm run dev

# 4️⃣ 开始使用
# Electron 窗口将自动打开，开始对话！
```

**🎉 完成！Electron 桌面应用已启动，即可开始语音对话**

### API 密钥获取

| 服务 | 获取地址 | 用途 |
|------|---------|------|
| 🎤 **讯飞语音** | [讯飞开放平台](https://www.xfyun.cn/) | 语音识别 (ASR) |
| 🤖 **通义千问** | [阿里云百炼](https://bailian.console.aliyun.com/) | 大模型对话 (LLM) |
| 🔊 **火山引擎** | [火山引擎控制台](https://www.volcengine.com/product/tts) | 语音合成 (TTS) |

---

## 📑 文档导航

<table>
<tr>
<td width="33%">

**🎯 快速上手**
- [快速开始](#-快速开始)
- [服务管理](#-服务管理)
- [配置说明](#️-配置)

</td>
<td width="33%">

**⚙️ 技术文档**
- [核心功能](#-核心功能)
- [技术架构](#️-技术架构)
- [API 文档](#-api-文档)

</td>
<td width="33%">

**🔧 开发运维**
- [项目结构](#-项目结构)
- [常见问题](#-常见问题)
- [贡献指南](#-贡献)

</td>
</tr>
</table>

---

## 🌟 核心功能

### 🎙️ 实时语音处理

<table>
<tr>
<td width="50%">

**音频采集与编码**
- 🎵 AudioWorklet 实时 PCM 采集
- 📦 Opus 高效编码（48kbps）
- ⚡ WebSocket 低延迟传输
- 🎚️ 自适应音量调节

</td>
<td width="50%">

**智能语音检测**
- 🧠 Silero VAD 本地检测
- 🎯 自动静音过滤
- ⏱️ 实时状态反馈
- 📊 语音活动可视化

</td>
</tr>
</table>

### 🤖 AI 能力矩阵

| 模块 | 服务商 | 特性 | 性能 |
|------|--------|------|------|
| 🎤 **ASR** | 讯飞 | 202种方言识别 | < 300ms |
| 🧠 **LLM** | 通义千问 | 流式对话生成 | 实时流式 |
| 👁️ **Vision** | 通义千问-VL | 图像理解 | 多模态 |
| 🔊 **TTS** | 火山引擎 | 325+音色 | < 200ms |

### 💻 开发体验

```bash
# 服务器管理
cd server
./run_server.sh start    # 🚀 启动服务器
./run_server.sh stop     # 🛑 停止服务器
./run_server.sh restart  # 🔄 重启服务器
./run_server.sh status   # 📊 查看状态
./run_server.sh logs     # 📝 查看日志

# 客户端开发
cd client
npm run dev       # 🖥️ Electron 开发模式
npm run web       # 🌐 Web 浏览器模式
npm run build:win # 📦 打包 Windows 应用
npm run build:mac # 🍎 打包 macOS 应用
npm run build:linux # 🐧 打包 Linux 应用
```

**特性亮点**
- ✅ **双模式运行**:支持 Electron 桌面和 Web 浏览器
- ✅ **独立管理**:服务器和客户端独立脚本,互不干扰
- ✅ **简单直接**:命令清晰,操作便捷
- ✅ **自动配置**：自动依赖安装和环境配置
- ✅ **智能检测**：健康检查、端口冲突自动处理
- ✅ **完善监控**：实时状态 + 日志管理系统

---

## 🏗️ 技术架构

### 系统架构图

```
┌─────────────────────┐
│  Electron 客户端    │
│ (Vue 3 桌面应用)    │
└──────────┬──────────┘
           │ WebSocket
           ▼
      ┌────────┐
      │Python  │
      │ Server │
      │ :30000 │
      └───┬────┘
          │
  ┌───────┼───────┐
  ▼       ▼       ▼
┌────┐ ┌────┐ ┌────┐
│ASR │ │LLM │ │TTS │
│讯飞│ │千问│ │火山│
└────┘ └────┘ └────┘
```

### 技术栈

<table>
<tr>
<td width="50%" valign="top">

**🖥️ 客户端层**
- **Electron 39**: 跨平台桌面框架
- **Vue 3.5**: 响应式前端框架
- **TypeScript 5.9**: 类型安全开发
- **Naive UI**: 现代组件库
- **Pinia**: 状态管理 + 持久化
- **VueUse**: 组合式工具集
- **Web Audio API**: 音频处理
- **Opus 编码**: 高效音频压缩

**🔧 后端层**
- **Python Server**: FastAPI + WebSocket
- **异步处理**: asyncio + aiohttp

</td>
<td width="50%" valign="top">

**🤖 AI 服务层**
- 讯飞语音 (ASR)
- 通义千问 (LLM + Vision)
- 火山引擎 (TTS)
- Silero VAD (本地检测)

**🛠️ 开发工具**
- uv (依赖管理)
- 虚拟环境隔离

</td>
</tr>
</table>

### 数据流

```
麦克风 → Web Audio API → Opus编码 → WebSocket
  ↓
Python Server → VAD检测 → ASR识别 → LLM处理
  ↓
TTS合成 → WebSocket → Web Audio 播放
```

---

## 📁 项目结构

```
python-mcp/
│
├── 📖 README.md               # 项目文档
│
├── 📂 server/                 # Python AI 服务
│   ├── 🚀 run_server.sh       # 服务器启动脚本
│   ├── app.py                 # 主入口
│   ├── requirements.txt       # 依赖
│   ├── config.yaml            # 配置模板
│   └── 📂 core/
│       ├── websocket_server.py    # WebSocket 服务
│       ├── http_server.py         # HTTP API
│       ├── 📂 providers/          # AI 提供者
│       │   ├── asr/               # 语音识别
│       │   ├── llm/               # 大模型
│       │   ├── tts/               # 语音合成
│       │   ├── vad/               # 语音检测
│       │   └── vllm/              # 视觉理解
│       ├── 📂 handle/             # 消息处理
│       └── 📂 utils/              # 工具函数
│
├── 📂 client/                 # Electron + Vue 3 客户端
│   ├── package.json           # 项目配置
│   ├── electron.vite.config.ts # 构建配置
│   ├── 📂 src/
│   │   ├── main/              # Electron 主进程
│   │   ├── renderer/          # Vue 3 渲染进程
│   │   ├── preload/           # 预加载脚本
│   │   └── shared/            # 共享模块
│   └── 📂 resources/          # 应用资源
│
├── 📂 logs/                   # 日志文件 (自动生成)
├── 📂 pids/                   # 进程 ID (自动生成)
└── 📂 tmp/                    # 临时文件 (自动生成)
```

---

## 🔧 服务管理

### 📋 独立脚本管理

项目现在使用独立的脚本来管理服务器和客户端：

#### 🖥️ 服务器管理

```bash
cd server

./run_server.sh start    # 启动服务器
./run_server.sh stop     # 停止服务器
./run_server.sh restart  # 重启服务器
./run_server.sh status   # 查看状态
./run_server.sh logs     # 查看日志
```

#### 💻 Electron 客户端管理

```bash
cd client

# 开发模式
npm install              # 首次需安装依赖
npm run dev             # 启动 Electron 开发模式

# Web 模式
npm run web             # 浏览器模式（用于调试）

# 生产打包
npm run build:win       # 打包 Windows 应用
npm run build:mac       # 打包 macOS 应用
npm run build:linux     # 打包 Linux 应用
npm run build:web       # 打包 Web 应用
```

### 🎯 常用操作

<table>
<tr>
<td width="50%" valign="top">

**启动服务**
```bash
# 启动服务器
cd server
./run_server.sh start

# 启动客户端（新终端）
cd client
npm run dev
```

**停止服务**
```bash
# 停止服务器
cd server
./run_server.sh stop

# 停止客户端
# 关闭 Electron 窗口或按 Ctrl+C
```

</td>
<td width="50%" valign="top">

**重启服务**
```bash
# 重启服务器
cd server
./run_server.sh restart

# 重启客户端
# Electron: 关闭窗口后重新运行 npm run dev
# Web 模式: 刷新浏览器页面
```

**查看状态和日志**
```bash
# 查看服务器状态
cd server
./run_server.sh status

# 查看服务器日志
./run_server.sh logs

# 实时查看日志
tail -f ../logs/python-server.log

# 客户端日志
# Electron: 菜单 → View → Toggle Developer Tools
# Web: F12 打开浏览器开发者工具
```

</td>
</tr>
</table>

### 🌐 服务端口

| 服务 | 端口 | 访问地址 |
|------|------|---------|
| 🤖 **Python Server WebSocket** | 30000 | ws://localhost:30000/xiaozhi/v1/ |
| 🔌 **Python HTTP API** | 30003 | http://localhost:30003 |
| 🖥️ **Electron Client** | - | 桌面应用（无端口）|
| 🌐 **Web Client (调试)** | 动态 | Vite 开发服务器 |

### 🛡️ 智能进程管理

独立脚本内置了智能进程管理功能：

**端口冲突自动处理**
- ✅ 自动检测端口占用
- ✅ 停止旧进程避免冲突
- ✅ 优雅终止 → 强制终止机制

**进程保护机制**
```bash
# 脚本会自动处理以下情况：
- 普通进程：使用 kill/kill -9
- PID 文件管理：自动记录和清理
- 失败重试：启动失败时提供详细日志
```

**健康检查**
- 启动后自动验证服务是否正常运行
- 端口监听检查（服务器）
- 进程状态检查（客户端）
- 失败时输出详细日志供排查

---

## ⚙️ 配置

### 配置文件位置

服务器配置文件位于 `server/config.yaml`，可以创建 `server/.config.yaml` 自定义配置（优先级更高）。

### 核心配置项

**基础配置示例** (`server/config.yaml` 或 `server/.config.yaml`):

```yaml
# 服务器配置
server:
  ip: '0.0.0.0'
  port: 30000
  http_port: 30003

# 选择的模块
selected_module:
  ASR: 'xunfei_stream'      # 语音识别
  LLM: 'qwen_flash'         # 大语言模型
  VLLM: 'qwen_vl'          # 视觉理解
  TTS: 'huoshan_stream'    # 语音合成
  VAD: 'silero'            # 语音检测

# ASR 配置 (讯飞)
ASR:
  xunfei_stream:
    app_id: 'your-app-id'
    access_key_id: 'your-key-id'
    access_key_secret: 'your-key-secret'

# LLM 配置 (通义千问)
LLM:
  qwen_flash:
    api_key: 'sk-your-api-key'
    model: 'qwen-plus'

# VLLM 配置 (通义千问-VL)
VLLM:
  qwen_vl:
    api_key: 'sk-your-api-key'
    model: 'qwen-vl-plus'

# TTS 配置 (火山引擎)
TTS:
  huoshan_stream:
    appid: 'your-appid'
    access_token: 'your-token'
    speaker: 'zh_female_qingxin'  # 音色ID
```

---

## 📡 API 文档

### WebSocket 接口

**连接地址：** `ws://localhost:30000/xiaozhi/v1/`

#### 客户端 → 服务端

```javascript
// 音频流（Binary）
// PCM 或 Opus 编码，16kHz，单声道

// 控制消息（JSON）
{
  "type": "control",
  "action": "start_listening"
}
```

#### 服务端 → 客户端

```javascript
// ASR 识别结果
{
  "type": "asr_result",
  "text": "你好",
  "is_final": true
}

// LLM 流式响应
{
  "type": "llm_stream",
  "text": "你好！",
  "is_final": false
}

// VAD 状态
{
  "type": "vad_state",
  "state": "speech_detected"  // speech_detected / silence
}

// TTS 音频
{
  "type": "tts_audio",
  "audio": "base64_encoded_audio_data"
}
```

### HTTP 接口

```bash
# 健康检查
GET http://localhost:30003/health

# Python Server API 文档
GET http://localhost:30003/docs
```

---

## ❓ 常见问题

### 1. 端口被占用

```bash
# 查看占用端口的进程
lsof -i :30000

# 停止服务并重新启动
cd server
./run_server.sh stop
./run_server.sh start
```

### 2. WebSocket 连接失败

```bash
# 确认 Python server 已启动
cd server
./run_server.sh status

# 查看日志
./run_server.sh logs

# 重启服务
./run_server.sh restart
```

### 3. 音频无声音

- ✅ 检查浏览器麦克风权限（必须使用 HTTPS 或 localhost）
- ✅ 确认音频设备在浏览器控制台
- ✅ 查看 Opus 编码是否正常
- ✅ 检查 VAD 是否检测到语音
- ✅ 确认浏览器支持 Web Audio API

### 4. ASR 识别失败

- ✅ 验证讯飞 API 配置（app_id、access_key）
- ✅ 检查音频格式：16kHz，单声道
- ✅ 查看 `server/tmp/asr/` 目录下的音频文件
- ✅ 确认 API 配额是否充足

### 5. LLM 响应慢或失败

- ✅ 检查通义千问 API 配额
- ✅ 切换到更快的模型（如 qwen-turbo）
- ✅ 减少 max_tokens 参数
- ✅ 确认网络连接正常

### 6. 查看实时日志

```bash
# 服务器日志
cd server
./run_server.sh logs

# 使用 tail 实时查看
tail -f logs/python-server.log

# 客户端日志
# 浏览器中按 F12 打开开发者工具查看控制台
```

### 7. 完全重置环境

```bash
# 停止服务器
cd server && ./run_server.sh stop

# 删除 Python 虚拟环境
rm -rf server/.venv

# 清理日志和 PID
rm -rf logs/* pids/* tmp/*

# 重新启动
cd server && ./run_server.sh start

# 在浏览器中访问: http://localhost:30001
```

---

## 🛠️ 开发指南

### 添加新的 AI Provider

1. 在 `server/core/providers/` 对应目录创建新文件
2. 继承基类并实现接口方法
3. 在 `server/config.yaml` 中注册新 provider
4. 重启 Python Server 生效

```python
# 示例：添加新的 TTS Provider
from core.providers.tts.base import TTSProvider

class MyTTSProvider(TTSProvider):
    async def synthesize(self, text: str) -> bytes:
        # 实现语音合成逻辑
        pass
```

### 本地开发调试

```bash
# 停止服务进行手动调试
cd server
./run_server.sh stop

# 手动启动查看日志
source .venv/bin/activate
python app.py  # 可以直接看到日志输出

# 或者查看实时日志
./run_server.sh logs
```

### 客户端开发

Web 客户端代码位于 `client/` 目录：

```bash
cd client

# 修改代码后刷新浏览器即可
# 无需编译和构建步骤

# 主要文件:
# - index.html: 页面结构
# - js/main.js: 主逻辑
# - js/audio.js: 音频处理
# - js/websocket.js: WebSocket 通信
# - css/: 样式文件

# 开发时建议:
# 1. 打开浏览器开发者工具 (F12)
# 2. 启用网络面板查看 WebSocket 通信
# 3. 查看控制台输出调试信息
```

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

### 贡献指南

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

---

## 📄 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件

---

## 🙏 致谢

本项目基于 [xiaozhi-esp32-server](https://github.com/xinnan-tech/xiaozhi-esp32-server) 重构

感谢以下服务和项目：
- [讯飞开放平台](https://www.xfyun.cn/)
- [阿里云百炼](https://bailian.console.aliyun.com/)
- [火山引擎](https://www.volcengine.com/)
- [Silero VAD](https://github.com/snakers4/silero-vad)
- [FastAPI](https://fastapi.tiangolo.com/)
- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)

---

## 📧 联系方式

- **GitHub**: https://github.com/WAASSTT/python-mcp
- **Issues**: https://github.com/WAASSTT/python-mcp/issues

---

<div align="center">

**⭐ 如果觉得项目有帮助，请给个 Star ⭐**

Made with ❤️ by WAASSTT

</div>
