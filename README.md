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

---

## 💡 项目简介

企业级 AI 语音助手系统，提供实时语音识别、自然语言对话和语音合成能力。

**核心特点**
- ⚡ < 100ms 低延迟响应
- 🔄 全流式处理架构
- 🎯 模块化设计，易扩展
- 🖥️ 支持桌面应用和 Web 模式

**应用场景**
智能家居、客服机器人、教育助手、车载交互、医疗录入

---

## 🚀 快速开始

### 环境要求

- Python 3.12+
- Node.js 18+
- uv (Python 包管理器)

### 快速部署

\`\`\`bash
# 1. 克隆项目
git clone https://github.com/WAASSTT/python-mcp.git
cd python-mcp

# 2. 配置 API 密钥
cp server/config.yaml server/.config.yaml
vim server/.config.yaml  # 填入 API 密钥

# 3. 启动服务器
cd server
chmod +x run_server.sh
./run_server.sh start

# 4. 启动客户端（新终端）
cd client
npm install
npm run dev
\`\`\`

### API 密钥获取

| 服务 | 平台 | 用途 |
|------|------|------|
| 讯飞语音 | [讯飞开放平台](https://www.xfyun.cn/) | 语音识别 (ASR) |
| 通义千问 | [阿里云百炼](https://bailian.console.aliyun.com/) | 大语言模型 (LLM) |
| 火山引擎 | [火山引擎](https://www.volcengine.com/product/tts) | 语音合成 (TTS) |

---

## 🌟 核心特性

### AI 能力

| 模块 | 服务商 | 特性 | 性能 |
|------|--------|------|------|
| 🎤 ASR | 讯飞语音 | 流式识别、202种方言 | < 300ms |
| 🧠 LLM | 通义千问 | 流式对话、函数调用 | 实时流式 |
| 👁️ Vision | 通义千问-VL | 图像理解、OCR | < 2s |
| 🔊 TTS | 火山引擎 | 325+音色、情感控制 | < 200ms |
| 🎚️ VAD | Silero VAD | 本地检测、低资源 | < 30ms |

### 开发命令

\`\`\`bash
# 服务器管理
./run_server.sh start     # 启动
./run_server.sh stop      # 停止
./run_server.sh restart   # 重启
./run_server.sh status    # 状态
./run_server.sh logs      # 日志

# 客户端开发
npm run dev          # Electron 桌面应用
npm run web          # Web 浏览器模式
npm run build:win    # 打包 Windows
npm run build:mac    # 打包 macOS
npm run build:linux  # 打包 Linux
\`\`\`

---

## 🏗️ 技术架构

### 系统架构

\`\`\`
┌──────────────────────┐
│   Electron 客户端    │
│  (Vue 3 + TypeScript)│
└──────────┬───────────┘
           │ WebSocket (ws://localhost:30000)
           ▼
┌──────────────────────┐
│   Python Server      │
│  (FastAPI + asyncio) │
└──────────┬───────────┘
           │
    ┌──────┼──────┐
    ▼      ▼      ▼
  ┌────┐┌────┐┌────┐
  │VAD ││ASR ││LLM │
  │本地││讯飞││千问│
  └────┘└────┘└────┘
\`\`\`

### 技术栈

**前端**
- Electron 39 + Vue 3.5 + TypeScript 5.9
- Naive UI + Pinia + VueUse
- Web Audio API + Opus 编码

**后端**
- Python 3.12 + FastAPI + asyncio
- WebSocket + aiohttp
- 讯飞/通义/火山 SDK

---

## 📁 项目结构

\`\`\`
python-mcp/
├── server/              # Python 后端
│   ├── app.py          # 主入口
│   ├── run_server.sh   # 管理脚本
│   ├── config.yaml     # 配置模板
│   ├── core/           # 核心模块
│   │   ├── providers/  # AI 服务
│   │   ├── handle/     # 消息处理
│   │   └── utils/      # 工具函数
│   └── config/         # 配置管理
│
├── client/             # Electron 客户端
│   ├── src/
│   │   ├── main/      # 主进程
│   │   ├── renderer/  # Vue 3 应用
│   │   └── preload/   # 预加载
│   └── package.json
│
├── logs/               # 日志目录
├── pids/               # 进程 ID
└── tmp/                # 临时文件
\`\`\`

---

## 🔧 服务管理

### 服务器

\`\`\`bash
cd server
./run_server.sh start    # 启动
./run_server.sh stop     # 停止
./run_server.sh restart  # 重启
./run_server.sh status   # 状态
./run_server.sh logs     # 日志
\`\`\`

### 客户端

\`\`\`bash
cd client
npm install    # 安装依赖
npm run dev    # 开发模式
npm run web    # Web 模式
\`\`\`

### 服务端口

| 服务 | 端口 | 说明 |
|------|------|------|
| WebSocket | 30000 | 实时通信 |
| HTTP API | 30003 | RESTful 接口 |

---

## ⚙️ 配置指南

### 配置文件

位置：\`server/.config.yaml\`（优先级高于 \`config.yaml\`）

### 最小配置

\`\`\`yaml
# ASR - 讯飞
ASR:
  xunfei_stream:
    app_id: 'your-app-id'
    access_key_id: 'your-key-id'
    access_key_secret: 'your-secret'

# LLM - 通义千问
LLM:
  qwen_flash:
    api_key: 'sk-your-api-key'
    model: 'qwen-plus'

# TTS - 火山引擎
TTS:
  huoshan_stream:
    appid: 'your-appid'
    access_token: 'your-token'
    speaker: 'zh_female_qingxin'
\`\`\`

### 常用音色

| 音色 ID | 描述 | 场景 |
|---------|------|------|
| \`zh_female_qingxin\` | 女声-清新 | 通用、客服 |
| \`zh_female_wanxiaoyu\` | 女声-晚小雨 | 甜美、亲切 |
| \`zh_male_qingxin\` | 男声-清新 | 商务、播报 |
| \`zh_male_chunhou\` | 男声-醇厚 | 磁性、成熟 |

---

## 📡 API 文档

### WebSocket API

**连接地址**
\`\`\`
ws://localhost:30000/xiaozhi/v1/
\`\`\`

**客户端 → 服务端**

\`\`\`javascript
// 音频数据（Binary）
const audioData = new Uint8Array([...]);
websocket.send(audioData);

// 控制消息（JSON）
{
  "type": "control",
  "action": "start_listening"
}

// 文本消息
{
  "type": "text_message",
  "text": "你好"
}
\`\`\`

**服务端 → 客户端**

\`\`\`javascript
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

// TTS 音频
{
  "type": "tts_audio",
  "audio": "base64_encoded_data"
}

// VAD 状态
{
  "type": "vad_state",
  "state": "speech_detected"
}
\`\`\`

### HTTP API

\`\`\`bash
# 健康检查
GET http://localhost:30003/health

# API 文档
GET http://localhost:30003/docs

# 文本对话
POST http://localhost:30003/api/chat
{
  "message": "你好"
}
\`\`\`

### 完整示例

\`\`\`javascript
// 建立连接
const ws = new WebSocket('ws://localhost:30000/xiaozhi/v1/');

ws.onopen = () => {
  // 开始监听
  ws.send(JSON.stringify({
    type: 'control',
    action: 'start_listening'
  }));
};

ws.onmessage = (event) => {
  if (typeof event.data === 'string') {
    const msg = JSON.parse(event.data);
    switch(msg.type) {
      case 'asr_result':
        console.log('识别:', msg.text);
        break;
      case 'llm_stream':
        console.log('回复:', msg.text);
        break;
      case 'tts_audio':
        playAudio(msg.audio);
        break;
    }
  }
};
\`\`\`

---

## ❓ 常见问题

**Q: 端口被占用？**
\`\`\`bash
lsof -i :30000
./run_server.sh stop
./run_server.sh start
\`\`\`

**Q: WebSocket 连接失败？**
\`\`\`bash
./run_server.sh status
./run_server.sh logs
\`\`\`

**Q: 查看详细日志？**
\`\`\`bash
./run_server.sh logs
tail -f logs/python-server.log
\`\`\`

**Q: 完全重置环境？**
\`\`\`bash
cd server && ./run_server.sh stop
rm -rf server/.venv logs/* pids/* tmp/*
./run_server.sh start
\`\`\`

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建特性分支 (\`git checkout -b feature/xxx\`)
3. 提交更改 (\`git commit -m 'Add xxx'\`)
4. 推送到分支 (\`git push origin feature/xxx\`)
5. 提交 Pull Request

---

## 📄 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件

---

## 🙏 致谢

**项目基础**
- [xiaozhi-esp32-server](https://github.com/xinnan-tech/xiaozhi-esp32-server)

**AI 服务**
- [讯飞开放平台](https://www.xfyun.cn/)
- [阿里云百炼](https://bailian.console.aliyun.com/)
- [火山引擎](https://www.volcengine.com/)

**开源技术**
- FastAPI、Electron、Vue 3、Silero VAD

---

## 📧 联系方式

- **GitHub**: https://github.com/WAASSTT/python-mcp
- **Issues**: https://github.com/WAASSTT/python-mcp/issues

---

<div align="center">

**⭐ 如果觉得项目有帮助，请给个 Star ⭐**

Made with ❤️ by [WAASSTT](https://github.com/WAASSTT)

</div>
