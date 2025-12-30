# AI 语音助手 - 实时语音对话系统

<div align="center">

基于 **Python + FastAPI + Vue.js** 构建的现代化实时语音交互系统

集成国内顶尖流式大模型 API，支持 WebSocket 双向实时通信

[![Python](https://img.shields.io/badge/Python-3.10%2B-blue)](https://www.python.org/)
[![Vue](https://img.shields.io/badge/Vue.js-2.6-green)](https://vuejs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-Latest-009688)](https://fastapi.tiangolo.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

</div>

---

## ⚡ 快速开始

```bash
# 1. 克隆项目
git clone https://github.com/WAASSTT/python-mcp.git
cd python-mcp

# 2. 配置 API 密钥
cp data/config.yaml data/.config.yaml
# 编辑 data/.config.yaml 填入你的 API 密钥

# 3. 启动服务端（Linux/Mac）
chmod +x start-server.sh
./start-server.sh

# 3. 启动服务端（Windows）
start-server.bat

# 4. 启动客户端（新终端）
chmod +x start-client.sh  # Linux/Mac
./start-client.sh
# 或
start-client.bat          # Windows
```

✅ 访问 `http://localhost:8080` 开始使用！

---

## 📑 目录

- [核心特性](#-核心特性)
- [技术栈](#-技术栈)
- [项目结构](#-项目结构)
- [详细安装](#-详细安装)
- [配置说明](#-配置说明)
- [API 接口](#-api-接口)
- [开发指南](#-开发指南)
- [常见问题](#-常见问题)
- [许可证](#-许可证)

---

## 🌟 核心特性

### 🎙️ 音频处理
- ✅ **实时 Opus 编码** - 高性能音频编码 (低延迟)
- ✅ **AudioWorklet 处理** - 音频线程实时 PCM 采集
- ✅ **智能 VAD** - Silero VAD 语音活动检测，自动触发识别
- ✅ **低延迟传输** - WebSocket 二进制流式传输

### 🤖 AI 能力
- ✅ **讯飞实时语音转写** - 支持中英文 + 202 种方言自动识别
- ✅ **通义千问大模型** - 阿里云百炼流式对话，逐句返回
- ✅ **火山引擎 TTS** - 325+ 超自然音色，接近真人表达
- ✅ **视觉理解** - 通义千问-VL 多模态图像分析
- ✅ **函数调用** - 基于 Function Call 的意图识别
- ✅ **记忆管理** - 本地短期记忆，智能上下文保持

### 💻 前端体验
- ✅ **现代化 UI** - Vue.js + Element UI 组件库
- ✅ **实时可视化** - 音频波形、实时转写显示
- ✅ **响应式设计** - 适配各种屏幕尺寸
- ✅ **会话管理** - 完整的对话历史记录
- ✅ **多语言支持** - 中文、英文、繁体中文、德语、越南语

### 🔧 开发友好
- ✅ **一键启动** - 自动化脚本处理依赖安装和环境配置
- ✅ **模块化设计** - Provider 模式，易于扩展新服务
- ✅ **配置灵活** - YAML 配置文件，支持多环境
- ✅ **Git 管理** - 完善的 .gitignore，保护敏感信息
- ✅ **日志系统** - Loguru 结构化日志，便于调试
- ✅ **API 文档** - 自动生成的 Swagger UI 文档

---

## 🛠️ 技术栈

### 后端 (Python)
| 技术 | 说明 |
|------|------|
| **Python 3.10+** | 现代 Python 特性支持 |
| **FastAPI** | 高性能异步 Web 框架 |
| **Uvicorn** | ASGI 服务器 |
| **WebSocket** | 双向实时通信 |
| **Opus 解码** | opuslib_next 音频解码 |
| **Loguru** | 优雅的日志系统 |
| **AsyncIO** | 异步 IO 处理 |
| **HTTPX** | 异步 HTTP 客户端 |

### 前端 (Vue.js)
| 技术 | 说明 |
|------|------|
| **Vue 2.6** | 渐进式前端框架 |
| **Element UI** | Vue 组件库 |
| **Pinia** | 状态管理 |
| **Vue Router** | 路由管理 |
| **Opus 编码** | opus-recorder 音频编码 |
| **WebSocket** | 实时通信 |
| **Axios/Flyio** | HTTP 请求 |
| **i18n** | 国际化支持 |

### AI 服务
| 服务 | 提供商 | 功能 |
|------|--------|------|
| **ASR** | 讯飞开放平台 | 实时语音转写（202种方言） |
| **LLM** | 阿里云百炼 | 通义千问对话生成 |
| **VLLM** | 阿里云百炼 | 通义千问-VL 视觉理解 |
| **TTS** | 火山引擎 | 豆包语音合成（325+音色） |
| **VAD** | Silero VAD | 本地语音活动检测 |

---

## 📁 项目结构

```
python-mcp/
├── 📜 start-server.sh          # Linux/Mac 服务端启动脚本
├── 📜 start-server.bat         # Windows 服务端启动脚本
├── 📜 start-client.sh          # Linux/Mac 客户端启动脚本
├── 📜 start-client.bat         # Windows 客户端启动脚本
├── 📄 .gitignore               # Git 忽略配置
├── 📖 README.md                # 项目文档
│
├── 📂 data/                    # 数据与配置
│   ├── config.yaml             # 默认配置模板
│   ├── .config.yaml            # 自定义配置（优先读取）
│   └── bin/                    # 固件文件目录
│
├── 📂 server/                  # 后端代码
│   ├── app.py                  # 主入口
│   ├── requirements.txt        # Python 依赖
│   ├── config.yaml             # 完整配置参考
│   ├── 📂 config/              # 配置模块
│   ├── 📂 core/                # 核心功能
│   │   ├── websocket_server.py # WebSocket 服务
│   │   ├── http_server.py      # HTTP API
│   │   └── providers/          # AI 服务提供者
│   ├── 📂 models/              # AI 模型文件
│   ├── 📂 plugins_func/        # 插件功能
│   └── 📂 test/                # 测试文件
│
├── 📂 client/                  # 前端代码
│   ├── package.json
│   ├── 📂 src/
│   │   ├── App.vue             # 根组件
│   │   ├── main.js             # 入口文件
│   │   ├── 📂 components/      # 组件
│   │   ├── 📂 views/           # 页面视图
│   │   ├── 📂 router/          # 路由配置
│   │   ├── 📂 store/           # 状态管理
│   │   ├── 📂 apis/            # API 接口
│   │   └── 📂 utils/           # 工具函数
│   └── 📂 public/              # 静态资源
│
└── 📂 tmp/                     # 临时文件（自动创建）
    ├── asr/                    # ASR 输出
    └── tts/                    # TTS 输出
```

---

## 🚀 详细安装

### 环境要求

- **Python** >= 3.10
- **Node.js** >= 18
- **pnpm** (推荐) 或 npm
- **Git**

### 方式一：一键启动（推荐）

#### 1. 启动服务端

**Linux/Mac:**
```bash
chmod +x start-server.sh
./start-server.sh
```

**Windows:**
```cmd
start-server.bat
```

#### 2. 启动客户端（新终端）

**Linux/Mac:**
```bash
chmod +x start-client.sh
./start-client.sh
```

**Windows:**
```cmd
start-client.bat
```

### 方式二：手动安装

#### 后端安装

```bash
# 1. 创建虚拟环境
python3 -m venv venv

# 2. 激活虚拟环境
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows

# 3. 安装依赖
pip install --upgrade pip
pip install -r server/requirements.txt

# 4. 配置 API 密钥
cp data/config.yaml data/.config.yaml
# 编辑 data/.config.yaml

# 5. 启动服务
cd server
python3 app.py
```

#### 前端安装

```bash
cd client
pnpm install  # 或 npm install
pnpm serve    # 或 npm run serve
```

---

## ⚙️ 配置说明

### 配置文件优先级

1. **`data/.config.yaml`** - 自定义配置（优先读取）
2. **`data/config.yaml`** - 默认配置模板  
3. **`server/config.yaml`** - 完整配置参考

### 配置示例

```yaml
# 服务器配置
server:
  ip: '0.0.0.0'
  port: 8000
  http_port: 8003

# 选择的模块
selected_module:
  ASR: 'xunfei_stream'
  LLM: 'qwen_flash'
  VLLM: 'qwen_vl'
  TTS: 'huoshan_stream'
  VAD: 'silero'
  Intent: 'function_call'
  Memory: 'mem_local_short'

# ASR 配置
ASR:
  xunfei_stream:
    app_id: 'your-app-id'
    access_key_id: 'your-key-id'
    access_key_secret: 'your-key-secret'

# LLM 配置
LLM:
  qwen_flash:
    api_key: 'sk-your-api-key'
    model: 'qwen-plus'

# TTS 配置
TTS:
  huoshan_stream:
    appid: 'your-appid'
    access_token: 'your-token'
    speaker: 'zh_female_qingxin'
```

### 获取 API 密钥

- **讯飞开放平台**: https://www.xfyun.cn/
- **阿里云百炼**: https://bailian.console.aliyun.com/
- **火山引擎**: https://www.volcengine.com/product/tts

---

## 📡 API 接口

### WebSocket 接口

**连接：** `ws://localhost:8000/ws`

#### 客户端 → 服务端

```json
// 音频流（Binary）
// Opus 编码，16kHz，单声道

// 控制消息
{
  "type": "control",
  "action": "start_listening"
}
```

#### 服务端 → 客户端

```json
// ASR 结果
{
  "type": "asr_result",
  "text": "你好",
  "is_final": true
}

// LLM 响应
{
  "type": "llm_stream",
  "text": "你好！",
  "is_final": false
}

// VAD 状态
{
  "type": "vad_state",
  "state": "speech_detected"
}
```

### HTTP 接口

```bash
# 健康检查
GET http://localhost:8000/health

# API 文档
GET http://localhost:8000/docs
```

---

## 🔧 开发指南

### 架构设计

```
前端 (Vue.js)
    ↓ WebSocket
后端 (FastAPI)
    ├─ Opus 解码
    ├─ VAD 检测
    ├─ ASR 识别
    ├─ LLM 对话
    └─ TTS 合成
```

### 添加新服务

1. 创建 Provider 类
2. 注册到工厂函数
3. 添加配置

详见代码注释和示例。

---

## ❓ 常见问题

### 1. WebSocket 连接失败

- 检查服务是否启动
- 检查端口是否开放
- 查看日志输出

### 2. 音频无声音

- 检查麦克风权限
- 确认音频设备
- 查看浏览器控制台

### 3. ASR 识别失败

- 验证 API 配置
- 检查音频格式
- 查看临时文件

### 4. LLM 响应慢

- 切换更快的模型
- 减少 max_tokens
- 启用流式输出

更多问题请查看 [Issues](https://github.com/WAASSTT/python-mcp/issues)

---

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

---

## 🙏 致谢

基于 [xiaozhi-esp32-server](https://github.com/xinnan-tech/xiaozhi-esp32-server) 重构

感谢：
- [讯飞开放平台](https://www.xfyun.cn/)
- [阿里云百炼](https://bailian.console.aliyun.com/)
- [火山引擎](https://www.volcengine.com/)
- [Silero VAD](https://github.com/snakers4/silero-vad)
- [FastAPI](https://fastapi.tiangolo.com/)
- [Vue.js](https://vuejs.org/)

---

## 📧 联系方式

- **GitHub**: https://github.com/WAASSTT/python-mcp
- **Issues**: https://github.com/WAASSTT/python-mcp/issues

---

<div align="center">

**⭐ 如果觉得项目有帮助，请给个 Star ⭐**

Made with ❤️ by WAASSTT

</div>
