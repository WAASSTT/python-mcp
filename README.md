<div align="center">

# 🎙️ AI 语音助手

**企业级实时语音交互系统**

基于 Python + TypeScript + Vue.js 构建的全栈 AI 对话平台

集成讯飞 ASR、通义千问 LLM、火山引擎 TTS

[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=flat-square&logo=python&logoColor=white)](https://www.python.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vue.js](https://img.shields.io/badge/Vue.js-2.6-4FC08D?style=flat-square&logo=vue.js&logoColor=white)](https://vuejs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-Latest-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)

[快速开始](#-快速开始) • [功能特性](#-核心功能) • [文档](#-文档导航)

</div>

---

## ✨ 为什么选择这个项目？

<table>
<tr>
<td width="50%">

### 🚀 极简部署
```bash
# 方式一：交互式菜单（推荐）
./service.sh
# 然后选择 "1) 启动所有服务"

# 方式二：命令行模式
./service.sh start all

# 访问 http://localhost:30001
# 开始使用！
```

**传统项目**：手动启动 5+ 服务，配置各种端口
**本项目**：交互式菜单或一行命令，全部搞定

</td>
<td width="50%">

### 🎯 生产级架构
- ⚡ **超低延迟**：< 100ms 音频响应
- 🔄 **全流式处理**：边说边识别边回复
- 🛡️ **企业级存储**：PostgreSQL + Redis
- 🐳 **容器化部署**：Docker 一键运行
- 📊 **完善监控**：实时状态 + 日志管理

</td>
</tr>
</table>

---

## 🚀 快速开始

### 前置要求

<table>
<tr>
<td>✅ Docker</td>
<td>✅ Python 3.10+</td>
<td>✅ Bun</td>
<td>✅ Node.js 18+</td>
</tr>
</table>

### 3 分钟部署

```bash
# 1️⃣ 克隆项目
git clone https://github.com/WAASSTT/python-mcp.git
cd python-mcp

# 2️⃣ 配置密钥（获取方式见下方）
cp data/config.yaml data/.config.yaml
vim data/.config.yaml  # 填入 API 密钥

# 3️⃣ 一键启动（两种方式）

# 方式一：交互式菜单（推荐新手）
chmod +x service.sh && ./service.sh
# 进入菜单后选择 "1) 启动所有服务"

# 方式二：命令行（适合熟手）
chmod +x service.sh && ./service.sh start all
```

**🎉 完成！访问 http://localhost:30001**

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
# 交互式菜单（推荐新手）
./service.sh                        # 🎮 进入图形化菜单

# 命令行模式（适合脚本）
./service.sh start all              # 🚀 启动所有服务
./service.sh stop manager-api       # 🛑 停止单个服务
./service.sh restart python-server  # 🔄 重启服务
./service.sh status                 # 📊 查看状态
./service.sh logs client 100        # 📝 查看日志
```

**特性亮点**
- ✅ **双模式管理**：交互式菜单 + 命令行，适合不同场景
- ✅ **统一管理**：一个脚本管理所有服务
- ✅ **自动配置**：自动依赖安装和环境配置
- ✅ **智能检测**：健康检查、端口冲突自动处理
- ✅ **完善监控**：实时状态 + 日志管理系统

---

## 🏗️ 技术架构

### 系统架构图

```
┌─────────────────┐
│  浏览器客户端    │ :30001
└────────┬────────┘
         │ WebSocket + HTTP
    ┌────┴────┬──────────┐
    ▼         ▼          ▼
┌────────┐ ┌────────┐ ┌────────┐
│Manager │ │Python  │ │Database│
│  API   │ │ Server │ │        │
│ :30002 │ │ :30000 │ │ :5432  │
└────────┘ └───┬────┘ └────────┘
               │
    ┌──────────┼──────────┐
    ▼          ▼          ▼
┌────────┐ ┌────────┐ ┌────────┐
│讯飞ASR │ │通义千问│ │火山TTS │
└────────┘ └────────┘ └────────┘
```

### 技术栈

<table>
<tr>
<td width="50%" valign="top">

**🎨 前端层**
- Vue.js 2.6 + Element UI
- Pinia 状态管理
- opus-recorder 音频编码
- i18n 国际化

**🔧 后端层**
- **Python Server**: FastAPI + WebSocket
- **Manager API**: Bun + Elysia + Drizzle ORM

</td>
<td width="50%" valign="top">

**💾 数据层**
- PostgreSQL 16 (关系型数据库)
- Redis 7 (缓存)

**🤖 AI 服务层**
- 讯飞语音 (ASR)
- 通义千问 (LLM + Vision)
- 火山引擎 (TTS)
- Silero VAD (本地检测)

</td>
</tr>
</table>

### 数据流

```
麦克风 → AudioWorklet → Opus编码 → WebSocket
  ↓
Python Server → VAD检测 → ASR识别 → LLM处理
  ↓
TTS合成 → WebSocket → 前端播放
```

---

## 📁 项目结构

```
python-mcp/
│
├── 🚀 service.sh              # 统一服务管理（启动/停止/重启/状态/日志）
├── 📖 README.md               # 项目文档
│
├── 📂 server/                 # Python AI 服务
│   ├── app.py                 # 主入口
│   ├── requirements.txt       # 依赖
│   ├── config.yaml            # 配置
│   └── 📂 core/
│       ├── websocket_server.py    # WebSocket 服务
│       ├── http_server.py         # HTTP API
│       └── providers/             # AI 提供者
│           ├── asr/               # 语音识别
│           ├── llm/               # 大模型
│           ├── tts/               # 语音合成
│           └── vad/               # 语音检测
│
├── 📂 manager-api-elysia/     # TypeScript 后端 API
│   ├── server.ts              # 服务入口
│   └── 📂 src/
│       ├── index.ts           # 主路由
│       ├── 📂 modules/        # 业务模块
│       └── 📂 db/             # 数据库
│
├── 📂 client/                 # Vue.js 前端
│   └── 📂 src/
│       ├── App.vue
│       ├── 📂 views/          # 页面
│       ├── 📂 components/     # 组件
│       └── 📂 apis/           # API
│
├── 📂 data/                   # 配置数据
│   ├── config.yaml            # 默认配置
│   └── .config.yaml           # 自定义配置 (优先)
│
├── 📂 logs/                   # 日志文件 (自动生成)
├── 📂 pids/                   # 进程 ID (自动生成)
└── 📂 tmp/                    # 临时文件 (自动生成)
```

---

## 🔧 服务管理

### 🎮 两种使用方式

#### 方式一：交互式菜单（推荐）

```bash
# 直接运行，进入交互式菜单
./service.sh
```

**交互式菜单功能：**
- ✅ 图形化界面，无需记忆命令
- ✅ 数字选择，操作更简单
- ✅ 实时反馈，状态一目了然
- ✅ 智能导航，完成后自动返回

```
╔════════════════════════════════════════╗
║   AI 语音助手 - 服务管理工具           ║
╚════════════════════════════════════════╝

请选择操作:

  1) 启动所有服务        5) 启动 PostgreSQL
  2) 停止所有服务        6) 启动 Redis
  3) 重启所有服务        7) 启动 Manager API
  4) 查看服务状态        8) 启动 Python Server
                        9) 启动前端应用

  10-15) 停止/重启单个服务
  16-18) 查看各服务日志
  0) 退出

请输入选项 [0-18]:
```

#### 方式二：命令行模式

```bash
# 适合脚本化和快速操作
./service.sh [命令] [服务] [选项]
```

### 📋 命令总览

| 命令 | 说明 | 示例 |
|------|------|------|
| `start [service]` | 启动服务 | `./service.sh start all` |
| `stop [service]` | 停止服务 | `./service.sh stop client` |
| `restart [service]` | 重启服务 | `./service.sh restart manager-api` |
| `status` | 查看状态 | `./service.sh status` |
| `logs [service] [n]` | 查看日志 | `./service.sh logs python-server 100` |
| `help` | 显示帮助 | `./service.sh help` |

**支持的服务：** `all` / `postgres` / `redis` / `manager-api` / `python-server` / `client`

### 🎯 常用操作

<table>
<tr>
<td width="50%" valign="top">

**启动服务**
```bash
# 启动所有服务
./service.sh start all

# 启动单个服务
./service.sh start postgres
./service.sh start redis
./service.sh start manager-api
./service.sh start python-server
./service.sh start client
```

**停止服务**
```bash
# 停止所有应用服务
./service.sh stop all

# 停止单个服务
./service.sh stop client
./service.sh stop python-server

# 停止数据库
./service.sh stop postgres
./service.sh stop redis
```

</td>
<td width="50%" valign="top">

**重启服务**
```bash
# 重启单个服务
./service.sh restart manager-api
./service.sh restart python-server

# 重启所有应用服务
./service.sh restart all
```

**查看状态和日志**
```bash
# 查看所有服务状态
./service.sh status
./service.sh  # 简写

# 查看日志
./service.sh logs manager-api       # 最后50行
./service.sh logs python-server 100 # 最后100行

# 实时日志
tail -f logs/python-server.log
```

</td>
</tr>
</table>

### 🌐 服务端口

| 服务 | 端口 | 访问地址 |
|------|------|---------|
| 📊 **Manager API** | 30002 | http://localhost:30002 |
| 🤖 **Python Server** | 30000 | ws://localhost:30000 |
| 🔌 **Python HTTP** | 30003 | http://localhost:30003 |
| 🎨 **前端应用** | 30001 | http://localhost:30001 |
| 🐘 **PostgreSQL** | 5432 | localhost:5432 |
| 📦 **Redis** | 6379 | localhost:6379 |

### 🛡️ 智能进程管理

service.sh 内置了智能进程管理功能：

**端口冲突自动处理**
- ✅ 自动检测端口占用
- ✅ 智能识别 Snap 包进程（受 AppArmor 保护）
- ✅ 使用 systemd-run 绕过安全限制
- ✅ 优雅终止 → 强制终止 → sudo 权限提升

**进程保护机制**
```bash
# 脚本会自动处理以下情况：
- 普通进程：使用 kill/kill -9
- Snap 包进程：使用 systemd-run kill
- 权限不足：自动提升 sudo 权限
- 僵尸进程：强制清理并释放端口
```

**健康检查**
- 启动后自动验证服务是否正常运行
- 端口监听检查
- HTTP 健康接口检查
- 失败时输出详细日志供排查

---

## ⚙️ 配置

### 配置文件优先级

系统按以下顺序读取配置：

```
1. data/.config.yaml    (✅ 推荐：自定义配置)
2. data/config.yaml     (默认模板)
3. server/config.yaml   (完整参考)
```

### 核心配置项

**最小配置示例** (`data/.config.yaml`):

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

**连接地址：** `ws://localhost:30000/ws`

#### 客户端 → 服务端

```javascript
// 音频流（Binary）
// Opus 编码，16kHz，单声道

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

# Manager API 文档
GET http://localhost:30002/doc

# Manager API 健康检查
GET http://localhost:30002/health
```

---

## ❓ 常见问题

### 1. 端口被占用

```bash
# 查看占用端口的进程
lsof -i :30000

# 停止服务并重新启动
./service.sh stop all
./service.sh start all

# 或者重启特定服务
./service.sh restart manager-api
```

### 2. Docker 容器无法启动

```bash
# 检查 Docker 是否运行
docker ps

# 停止并重启数据库
./service.sh stop postgres
./service.sh stop redis
./service.sh start postgres
./service.sh start redis

# 或清理旧容器后重启
docker rm -f postgres my-redis
./service.sh start all
```

### 3. WebSocket 连接失败

```bash
# 确认 Python server 已启动
./service.sh status

# 查看日志
./service.sh logs python-server

# 重启服务
./service.sh restart python-server
```

### 4. 音频无声音

- ✅ 检查浏览器麦克风权限（必须使用 HTTPS 或 localhost）
- ✅ 确认音频设备在浏览器控制台
- ✅ 查看 Opus 编码是否正常
- ✅ 检查 VAD 是否检测到语音

### 5. ASR 识别失败

- ✅ 验证讯飞 API 配置（app_id、access_key）
- ✅ 检查音频格式：16kHz，单声道
- ✅ 查看 `tmp/asr/` 目录下的音频文件
- ✅ 确认 API 配额是否充足

### 6. LLM 响应慢或失败

- ✅ 检查通义千问 API 配额
- ✅ 切换到更快的模型（如 qwen-turbo）
- ✅ 减少 max_tokens 参数
- ✅ 确认网络连接正常

### 7. 查看实时日志

```bash
# 使用管理脚本查看（推荐）
./service.sh logs python-server    # 最后 50 行
./service.sh logs manager-api 100  # 最后 100 行

# 或使用 tail 实时查看
tail -f logs/python-server.log
tail -f logs/manager-api.log
tail -f logs/client.log
```

### 8. 完全重置环境

```bash
# 停止所有服务（包括数据库）
./service.sh stop all
./service.sh stop postgres
./service.sh stop redis

# 删除 Docker 容器和卷
docker rm -f postgres my-redis
docker volume rm postgres_data

# 删除 Python 虚拟环境
rm -rf server/venv

# 删除 Node 模块
rm -rf client/node_modules
rm -rf manager-api-elysia/node_modules

# 清理日志和 PID
rm -rf logs/* pids/*

# 重新启动
./service.sh start all
```

---

## 🛠️ 开发指南

### 添加新的 AI Provider

1. 在 `server/core/providers/` 对应目录创建新文件
2. 继承基类并实现接口方法
3. 在 `config.yaml` 中注册新 provider
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
./service.sh stop python-server

# 进入目录手动启动
cd server
source venv/bin/activate
python app.py  # 可以直接看到日志输出

# 或者查看实时日志
tail -f logs/python-server.log
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
- [Vue.js](https://vuejs.org/)
- [Elysia](https://elysiajs.com/)

---

## 📧 联系方式

- **GitHub**: https://github.com/WAASSTT/python-mcp
- **Issues**: https://github.com/WAASSTT/python-mcp/issues

---

<div align="center">

**⭐ 如果觉得项目有帮助，请给个 Star ⭐**

Made with ❤️ by WAASSTT

</div>
