<div align="center">

# 🎙️ Python MCP - AI 语音助手

**专业级实时语音交互系统 | Model Context Protocol**

[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=flat-square&logo=python)](https://www.python.org/)
[![Vue](https://img.shields.io/badge/Vue-3.5-4FC08D?style=flat-square&logo=vue.js)](https://vuejs.org/)
[![Electron](https://img.shields.io/badge/Electron-39-47848F?style=flat-square&logo=electron)](https://www.electronjs.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)

</div>

---

## 💡 简介

基于 Python + Vue 3 + Electron 的全栈 AI 对话平台，集成 ASR、LLM、TTS、Vision、VAD 等多模态能力。

**核心特点**
- ⚡ 端到端延迟 < 500ms，全链路流式处理
- 🔌 模块化设计，支持多种 AI 服务商
- 🌐 跨平台支持（桌面/Web/嵌入式）
- 🔐 专业级安全（JWT 认证 + 加密传输）

**应用场景**：智能家居、智能客服、教育助手、车载交互、医疗录入

---

## 🚀 快速开始

### 环境要求
- Python 3.10+
- Node.js 18+

### 快速部署

```bash
# 克隆项目
git clone https://github.com/WAASSTT/python-mcp.git
cd python-mcp

# 配置服务端
cd server
mkdir -p data
cp config.yaml data/.config.yaml
vim data/.config.yaml  # 填入 API 密钥

# 启动服务
pip install -r requirements.txt
python app.py

# 启动客户端（新终端）
cd ../client
npm install
npm run dev
```

### API 密钥配置

在 `server/data/.config.yaml` 配置：

```yaml
# ASR - 讯飞
asr:
  selected_module: xfyun_asr
  xfyun_asr:
    appid: "your_appid"
    api_key: "your_api_key"
    api_secret: "your_api_secret"

# LLM - 通义千问
llm:
  selected_module: qwen_llm
  qwen_llm:
    api_key: "sk-your-api-key"
    model: "qwen-max"

# TTS - 火山引擎
tts:
  selected_module: volcengine_tts
  volcengine_tts:
    appid: "your_appid"
    access_token: "your_access_token"
    speaker: "zh_female_qingxin"
```

**获取密钥：**
- 🎤 [讯飞开放平台](https://www.xfyun.cn/) - ASR
- 🧠 [阿里云百炼](https://bailian.console.aliyun.com/) - LLM
- 🔊 [火山引擎](https://www.volcengine.com/product/tts) - TTS

---

## ✨ 核心特性

| 模块         | 服务商                   | 特性               | 性能     |
| ------------ | ------------------------ | ------------------ | -------- |
| 🎤 **ASR**    | 讯飞、FunASR、Vosk       | 流式识别、热词定制 | < 300ms  |
| 🧠 **LLM**    | 通义千问、OpenAI、Gemini | 流式对话、函数调用 | 实时流式 |
| 👁️ **Vision** | 通义千问-VL、百度        | 图像理解、OCR      | < 2s     |
| 🔊 **TTS**    | 火山引擎、Edge TTS       | 325+音色、情感控制 | < 200ms  |
| 🎚️ **VAD**    | Silero VAD               | 实时检测、低资源   | < 30ms   |
| 💾 **Memory** | Mem0、Redis              | 对话记忆、用户画像 | < 100ms  |

---

## 🏗️ 技术架构

```
Client (Electron/Web/ESP32)
     ↓ WebSocket (30000)
Server (FastAPI + asyncio)
     ↓
┌────┬────┬────┬────┐
VAD  ASR  LLM  TTS
```

**技术栈**
- **后端**: Python 3.10 + FastAPI + WebSockets
- **前端**: Vue 3 + Electron + TypeScript
- **AI**: 讯飞 ASR / 通义千问 LLM / 火山引擎 TTS

---

## 📦 项目结构

```
python-mcp/
├── server/              # Python 后端
│   ├── app.py          # 主入口
│   ├── config.yaml     # 配置模板
│   ├── core/           # 核心模块
│   │   ├── providers/  # AI 服务
│   │   ├── handle/     # 消息处理
│   │   └── utils/      # 工具函数
│   └── plugins_func/   # 插件系统
│
├── client/             # Electron 客户端
│   ├── src/
│   │   ├── main/      # 主进程
│   │   ├── renderer/  # Vue 3 应用
│   │   └── preload/   # 预加载
│   └── package.json
│
└── logs/               # 日志目录
```

---

## 🔧 配置指南

### 配置文件优先级
1. `server/config.yaml` - 默认模板
2. `server/data/.config.yaml` - 用户配置（推荐）

### 常用配置

#### 服务器
```yaml
server:
  ip: 0.0.0.0
  port: 30000
  http_port: 30003
```

#### ASR 引擎切换
```yaml
asr:
  selected_module: xfyun_asr  # 或 funasr_asr, vosk_asr
```

#### LLM 模型选择
```yaml
llm:
  selected_module: qwen_llm   # 或 openai_llm, gemini_llm
  qwen_llm:
    model: "qwen-max"         # qwen-max, qwen-plus, qwen-turbo
```

#### TTS 音色
```yaml
tts:
  volcengine_tts:
    speaker: "zh_female_qingxin"  # 女声-清新
    # zh_male_qingxin             # 男声-清新
    # zh_female_wanxiaoyu         # 女声-甜美
```

---

## 🚢 部署指南

### 开发环境
```bash
# 服务端
cd server
python app.py

# 客户端
cd client
npm run dev
```

### Docker 部署
```bash
cd server
docker-compose up -d
```

### 生产环境
```bash
# 使用 PM2
cd server
pm2 start app.py --name python-mcp --interpreter python3

# 客户端打包
cd client
npm run build:win  # Windows
npm run build:mac  # macOS
npm run build:linux # Linux
```

---

## 📚 API 文档

### WebSocket API

**连接**: `ws://localhost:30000/xiaozhi/v1/`

**消息格式**:
```json
// 音频消息
{
  "type": "audio",
  "data": "base64-encoded-opus-audio"
}

// 文本消息
{
  "type": "text",
  "text": "你好"
}

// ASR 结果
{
  "type": "asr_result",
  "text": "你好",
  "is_final": true
}
```

### HTTP API
```bash
# 健康检查
GET /health

# 视觉分析
POST /mcp/vision/explain
```

---

## 🔌 插件系统

在 `server/plugins_func/functions/` 创建插件：

```python
from plugins_func.register import register_plugin

@register_plugin(
    name="get_weather",
    description="获取天气",
    parameters={
        "type": "object",
        "properties": {
            "city": {"type": "string"}
        }
    }
)
async def get_weather(city: str) -> str:
    return f"{city}今天晴"
```

---

## 🔍 故障排查

```bash
# 查看日志
tail -f logs/server.log

# 检查端口
lsof -i :30000

# 测试连接
curl http://localhost:30000/health

# 重启服务
cd server && python app.py
```

---

## 📊 性能指标

| 指标         | 数值      |
| ------------ | --------- |
| ASR 延迟     | 200-300ms |
| LLM 首字延迟 | 300-500ms |
| TTS 延迟     | 150-200ms |
| 端到端延迟   | < 1s      |
| 并发连接     | 100+      |

---

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

```bash
git checkout -b feature/xxx
git commit -m 'Add xxx'
git push origin feature/xxx
```

---

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE)

---

## 🙏 致谢

- [FastAPI](https://fastapi.tiangolo.com/) - Web 框架
- [Vue.js](https://vuejs.org/) - 前端框架
- [Electron](https://www.electronjs.org/) - 桌面应用
- [xiaozhi](https://github.com/xinnan-tech/xiaozhi-esp32-server) - ESP32 服务端
- [讯飞](https://www.xfyun.cn/) / [阿里云](https://bailian.console.aliyun.com/) / [火山引擎](https://www.volcengine.com/) - AI 服务

---

<div align="center">

**⭐ 如果有帮助，请给个 Star！**

Made with ❤️ by [WAASSTT](https://github.com/WAASSTT)

[GitHub](https://github.com/WAASSTT/python-mcp) • [Issues](https://github.com/WAASSTT/python-mcp/issues)

</div>
