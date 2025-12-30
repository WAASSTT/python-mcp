# Python MCP Server - 技术文档

> 基于 Python 的智能语音助手 AI 引擎服务器

[![Python](https://img.shields.io/badge/Python-3.10+-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-green.svg)](https://fastapi.tiangolo.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](../LICENSE)

---

## 📚 目录

- [简介](#简介)
- [整体架构](#整体架构)
- [核心组件](#核心组件)
- [快速开始](#快速开始)
- [配置说明](#配置说明)
- [AI服务集成](#ai服务集成)
- [插件系统](#插件系统)
- [部署指南](#部署指南)
- [API文档](#api文档)
- [常见问题](#常见问题)

---

## 🎯 简介

Python MCP Server 是一个专为智能语音交互场景设计的综合性后端系统。其核心目标是提供一个强大的服务器基础设施，能够：

- 🎤 **理解自然语言指令** - 支持实时语音识别与意图识别
- 🤖 **智能对话交互** - 集成大型语言模型（LLM）进行智能应答
- 🔊 **自然语音合成** - 支持多种TTS引擎和音色定制
- 🏠 **IoT设备控制** - 通过插件系统管理智能家居设备
- 🌐 **跨平台支持** - WebSocket实时通信，支持多设备接入

---

## 🏗️ 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Devices (ESP32/Web)              │
│                  WebSocket 双向实时通信                       │
└───────────────────┬─────────────────────────────────────────┘
                    │
┌───────────────────▼─────────────────────────────────────────┐
│                Python MCP Server (Core AI Engine)           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   VAD 模块   │→ │   ASR 模块   │→ │   LLM 模块   │     │
│  │ 语音活动检测  │  │  语音识别     │  │  智能理解     │     │
│  └──────────────┘  └──────────────┘  └──────┬───────┘     │
│                                              │              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────▼───────┐     │
│  │   TTS 模块   │← │  Intent 模块 │  │ Memory 模块  │     │
│  │  语音合成     │  │  意图识别     │  │  对话记忆     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │            Plugin System (插件系统)                   │   │
│  │  • 天气查询  • 新闻获取  • 音乐播放  • 智能家居控制   │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 核心特性

- **异步架构** - 基于 asyncio 的高并发处理能力
- **模块化设计** - Provider 模式实现 AI 服务灵活切换
- **插件扩展** - 强大的插件系统支持功能定制
- **配置驱动** - YAML 配置文件管理所有服务参数
- **实时通信** - WebSocket 协议保证低延迟交互

---

## 🔧 核心组件

### 1. AI 服务提供者 (Provider Pattern)

`core/providers/` 目录下实现了各类 AI 服务的抽象接口和具体实现：

#### VAD (语音活动检测)
- **SileroVAD** - 本地高性能语音端点检测

#### ASR (自动语音识别)
- **FunASR** - 本地 SenseVoice 模型 (支持中/英/日/韩/粤)
- **XunfeiStreamASR** - 讯飞实时流式语音识别 (202种方言)
- **AliyunStreamASR** - 阿里云流式识别
- **DoubaoStreamASR** - 火山引擎大模型ASR
- **OpenaiASR** - OpenAI Whisper 模型
- **GroqASR** - Groq Whisper Turbo

#### LLM (大型语言模型)
- **OpenAI 兼容接口** - 支持所有 OpenAI API 兼容服务
  - 阿里通义千问 (qwen-plus, qwen-turbo, qwen-max)
  - DeepSeek (deepseek-chat)
  - Doubao (doubao-pro-32k)
  - ChatGLM (glm-4-flash)
- **Ollama** - 本地大模型部署
- **Dify** - Dify 平台集成

#### TTS (文本转语音)
- **HuoshanStreamTTS** - 火山引擎流式TTS (325+音色)
- **EdgeTTS** - 微软 Edge 免费TTS
- **XunfeiTTS** - 讯飞语音合成
- **AliTTS** - 阿里云TTS

#### Memory (对话记忆)
- **mem_local_short** - 本地短期记忆 (基于LLM总结)
- **mem0ai** - 云端长期记忆服务
- **nomem** - 无记忆模式

#### Intent (意图识别)
- **function_call** - 基于 Function Call 的意图识别
- **intent_llm** - 独立LLM进行意图分析

---

### 2. WebSocket 服务器

`core/websocket_server.py` - 实时双向通信核心

- **连接管理** - 每个设备独立 ConnectionHandler
- **音频流处理** - 实时接收和发送音频数据
- **动态配置** - 支持运行时配置热更新
- **健康检查** - HTTP GET 端点用于监控

### 3. HTTP 服务器

`core/http_server.py` - 辅助 HTTP 接口

- **OTA 升级** - `/xiaozhi/ota/` 固件更新服务
- **视觉分析** - `/mcp/vision/explain` 图像理解接口
- **API 认证** - JWT Token 保护机制

### 4. 消息处理器

`core/handle/` 目录下的专用处理模块：

| 处理器 | 功能 | 说明 |
|--------|------|------|
| `helloHandle.py` | 握手协议 | 设备连接初始化 |
| `receiveAudioHandle.py` | 音频接收 | VAD + ASR 处理链 |
| `textHandle.py` | 文本处理 | 意图识别 + LLM 交互 |
| `functionHandler.py` | 函数调用 | 执行插件函数 |
| `sendAudioHandle.py` | 音频发送 | TTS + 流式传输 |
| `abortHandle.py` | 中断控制 | 停止当前操作 |

### 5. 插件系统

`plugins_func/` - 可扩展的功能模块

**内置插件：**

```
plugins_func/functions/
├── get_weather.py          # 和风天气API
├── get_news_from_*.py      # 新闻聚合
├── play_music.py           # 本地音乐播放
├── change_role.py          # 角色切换
├── home_assistant/         # Home Assistant集成
│   ├── hass_get_state.py
│   ├── hass_set_state.py
│   └── hass_play_music.py
└── search_from_ragflow.py  # RAG知识库检索
```

**插件开发示例：**

```python
from plugins_func.register import register_plugin

@register_plugin(
    name="get_weather",
    description="获取指定城市的天气信息",
    parameters={
        "type": "object",
        "properties": {
            "location": {
                "type": "string",
                "description": "城市名称，例如：北京、上海"
            }
        },
        "required": ["location"]
    }
)
async def get_weather(location: str) -> dict:
    """实现天气查询逻辑"""
    # 你的代码...
    return {"temperature": 25, "weather": "晴"}
```

---

## 🚀 快速开始

### 前置要求

- Python 3.10+
- pip 或 pnpm
- FFmpeg (音频处理)

### 安装步骤

#### 方式一：使用启动脚本 (推荐)

```bash
# 在项目根目录执行
./start-server.sh  # Linux/Mac
# 或
start-server.bat   # Windows

# 脚本会自动：
# 1. 检查 Python 版本
# 2. 创建虚拟环境
# 3. 安装依赖
# 4. 创建必要目录
# 5. 启动服务器
```

#### 方式二：手动安装

```bash
# 1. 创建虚拟环境
cd server
python -m venv venv

# 2. 激活虚拟环境
source venv/bin/activate  # Linux/Mac
# 或
venv\Scripts\activate     # Windows

# 3. 安装依赖
pip install -r requirements.txt

# 4. 创建必要目录
mkdir -p tmp/asr tmp/tts data

# 5. 启动服务器
python app.py
```

### 验证安装

服务器启动成功后会显示：

```
251230 10:27:15[0.8.10_00000000000000][__main__]-INFO-OTA接口是         http://192.168.x.x:8003/xiaozhi/ota/
251230 10:27:15[0.8.10_00000000000000][__main__]-INFO-视觉分析接口是    http://192.168.x.x:8003/mcp/vision/explain
251230 10:27:15[0.8.10_00000000000000][__main__]-INFO-Websocket地址是   ws://192.168.x.x:8000/xiaozhi/v1/
```

使用测试页面验证：

```bash
# 在浏览器中打开
open test/test_page.html
```

---

## ⚙️ 配置说明

### 配置文件优先级

```
1. server/data/.config.yaml     (最高优先级 - 个人开发配置)
2. data/config.yaml             (项目配置)
3. server/config.yaml           (默认模板)
```

### 基础配置结构

```yaml
# server/data/.config.yaml

# 服务器配置
server:
  ip: 0.0.0.0
  port: 8000          # WebSocket端口
  http_port: 8003     # HTTP服务端口

# 模块选择
selected_module:
  VAD: SileroVAD                 # 语音活动检测
  ASR: XunfeiStreamASR           # 语音识别
  LLM: AliLLM                    # 大语言模型
  VLLM: AliVLLM                  # 视觉语言模型
  TTS: HuoshanStreamTTS          # 语音合成
  Memory: mem_local_short        # 对话记忆
  Intent: function_call          # 意图识别

# VAD 配置
VAD:
  SileroVAD:
    type: silero
    model_dir: models/snakers4_silero-vad
    threshold: 0.5               # VAD阈值
    min_silence_duration_ms: 200 # 停顿判定时长

# ASR 配置
ASR:
  XunfeiStreamASR:
    type: xunfei_stream
    app_id: 你的APPID
    api_key: 你的APIKey
    api_secret: 你的APISecret
    domain: slm                  # 识别领域
    language: zh_cn              # 语言
    accent: mandarin             # 方言

# LLM 配置
LLM:
  AliLLM:
    type: openai
    base_url: https://dashscope.aliyuncs.com/compatible-mode/v1
    model_name: qwen-plus
    api_key: sk-xxxxx
    temperature: 0.7
    max_tokens: 8192
    stream: true

# TTS 配置
TTS:
  HuoshanStreamTTS:
    type: huoshan_stream
    appid: 你的APPID
    access_token: 你的Token
    voice_type: zh_male_yushu_moon_bigtts
    speed_ratio: 1.0
    volume_ratio: 1.0

# Memory 配置
Memory:
  mem_local_short:
    type: mem_local_short
    llm: AliLLM  # 使用哪个LLM进行总结

# Intent 配置
Intent:
  function_call:
    type: function_call
    functions:
      - change_role
      - get_weather
      - get_news_from_newsnow
      - play_music
```

### 环境变量

```bash
# .env 文件
LOG_LEVEL=INFO
DELETE_AUDIO=true
CLOSE_CONNECTION_NO_VOICE_TIME=120
TTS_TIMEOUT=10
```

---

## 🌐 AI 服务集成

### 推荐配置方案

#### 方案一：入门全免费 (开发/测试)

| 模块 | 服务商 | 成本 | 特点 |
|------|--------|------|------|
| ASR | FunASR 本地 | 免费 | 支持5种语言，离线运行 |
| LLM | ChatGLM (glm-4-flash) | 免费额度 | 智谱AI，每日免费100万tokens |
| TTS | EdgeTTS | 免费 | 微软Edge浏览器TTS |
| VAD | SileroVAD | 免费 | 本地运行，低延迟 |

#### 方案二：全流式配置 (生产推荐)

| 模块 | 服务商 | 成本 | 特点 |
|------|--------|------|------|
| ASR | 讯飞流式ASR | ¥0.025/次 | 202种方言，实时识别 |
| LLM | 通义千问 (qwen-plus) | ¥0.004/1K tokens | 流式输出，低延迟 |
| TTS | 火山引擎流式TTS | ¥4/千次 | 325+音色，自然流畅 |
| VAD | SileroVAD | 免费 | 本地运行，毫秒级响应 |

### 服务申请指南

#### 1. 讯飞开放平台 (ASR)

```bash
# 申请地址
https://www.xfyun.cn/

# 获取认证信息
1. 注册账号并创建应用
2. 在"我的应用"中获取：
   - APPID
   - APIKey
   - APISecret
```

#### 2. 阿里云百炼 (LLM)

```bash
# 申请地址
https://bailian.console.aliyun.com/

# 获取 API Key
1. 创建 API-KEY
2. 选择模型：qwen-plus / qwen-turbo / qwen-max
3. 复制 API Key 到配置文件
```

#### 3. 火山引擎 (TTS)

```bash
# 申请地址
https://console.volcengine.com/speech/app

# 获取认证信息
1. 创建语音合成服务
2. 获取：
   - APPID
   - Access Token
   - Cluster ID
```

---

## 🔌 插件系统

### 插件开发指南

#### 1. 创建插件文件

```bash
# 在 plugins_func/functions/ 目录下创建
touch plugins_func/functions/my_plugin.py
```

#### 2. 实现插件逻辑

```python
from plugins_func.register import register_plugin
from typing import Dict, Any
import aiohttp

@register_plugin(
    name="search_wikipedia",
    description="搜索维基百科获取知识信息",
    parameters={
        "type": "object",
        "properties": {
            "keyword": {
                "type": "string",
                "description": "搜索关键词"
            },
            "language": {
                "type": "string",
                "enum": ["zh", "en"],
                "description": "语言选项",
                "default": "zh"
            }
        },
        "required": ["keyword"]
    }
)
async def search_wikipedia(keyword: str, language: str = "zh") -> Dict[str, Any]:
    """
    搜索维基百科

    Args:
        keyword: 搜索关键词
        language: 语言（zh/en）

    Returns:
        包含搜索结果的字典
    """
    base_url = f"https://{language}.wikipedia.org/api/rest_v1"

    async with aiohttp.ClientSession() as session:
        async with session.get(
            f"{base_url}/page/summary/{keyword}"
        ) as response:
            if response.status == 200:
                data = await response.json()
                return {
                    "title": data.get("title"),
                    "summary": data.get("extract"),
                    "url": data.get("content_urls", {}).get("desktop", {}).get("page")
                }
            else:
                return {"error": "搜索失败"}

# 支持同步函数
@register_plugin(
    name="calculate",
    description="执行简单的数学计算",
    parameters={
        "type": "object",
        "properties": {
            "expression": {
                "type": "string",
                "description": "数学表达式，例如：'2+2'、'10*5'"
            }
        },
        "required": ["expression"]
    }
)
def calculate(expression: str) -> float:
    """执行数学计算"""
    try:
        # 安全的eval，仅支持数学运算
        result = eval(expression, {"__builtins__": {}}, {})
        return float(result)
    except Exception as e:
        return {"error": str(e)}
```

#### 3. 配置插件加载

```yaml
# data/.config.yaml
Intent:
  function_call:
    type: function_call
    functions:
      - get_weather
      - play_music
      - search_wikipedia  # 添加新插件
      - calculate
```

#### 4. 测试插件

```python
# test/test_plugin.py
import asyncio
from plugins_func.functions.my_plugin import search_wikipedia

async def test():
    result = await search_wikipedia("Python编程语言", "zh")
    print(result)

asyncio.run(test())
```

### 插件最佳实践

1. **异步优先** - 涉及I/O操作的插件使用 `async def`
2. **错误处理** - 使用 try-except 捕获异常
3. **超时控制** - 设置合理的请求超时
4. **参数验证** - 使用 JSON Schema 严格定义参数
5. **日志记录** - 使用 `logger.bind(tag="plugin_name")` 记录日志

---

## 🐳 部署指南

### Docker 部署 (推荐)

#### 单服务模式

```bash
# 仅部署 Python MCP Server
docker-compose -f docker-compose.yml up -d
```

#### 全栈模式

```bash
# 部署所有组件（包括管理后台）
docker-compose -f docker-compose_all.yml up -d
```

### 生产环境部署

#### 1. 使用 Supervisor 管理

```ini
# /etc/supervisor/conf.d/mcp-server.conf
[program:mcp-server]
command=/path/to/venv/bin/python /path/to/server/app.py
directory=/path/to/server
user=www-data
autostart=true
autorestart=true
stderr_logfile=/var/log/mcp-server.err.log
stdout_logfile=/var/log/mcp-server.out.log
environment=PYTHONPATH="/path/to/server"
```

```bash
supervisorctl reread
supervisorctl update
supervisorctl start mcp-server
```

#### 2. 使用 systemd 服务

```ini
# /etc/systemd/system/mcp-server.service
[Unit]
Description=Python MCP Server
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/path/to/server
ExecStart=/path/to/venv/bin/python /path/to/server/app.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
systemctl daemon-reload
systemctl enable mcp-server
systemctl start mcp-server
systemctl status mcp-server
```

#### 3. Nginx 反向代理

```nginx
# /etc/nginx/sites-available/mcp-server

# WebSocket 代理
upstream websocket_backend {
    server 127.0.0.1:8000;
}

# HTTP API 代理
upstream http_backend {
    server 127.0.0.1:8003;
}

server {
    listen 80;
    server_name your-domain.com;

    # WebSocket 路由
    location /xiaozhi/v1/ {
        proxy_pass http://websocket_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_read_timeout 300s;
        proxy_send_timeout 300s;
    }

    # HTTP API 路由
    location /xiaozhi/ota/ {
        proxy_pass http://http_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /mcp/vision/explain {
        proxy_pass http://http_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        client_max_body_size 10M;
    }
}
```

---

## 📖 API 文档

### WebSocket 协议

#### 连接建立

```javascript
// JavaScript 客户端示例
const ws = new WebSocket('ws://localhost:8000/xiaozhi/v1/');

ws.onopen = () => {
    console.log('已连接到服务器');

    // 发送握手消息
    ws.send(JSON.stringify({
        type: 'hello',
        device_id: 'esp32_001',
        version: '1.0.0'
    }));
};
```

#### 消息格式

**1. 音频上传 (Binary)**

```javascript
// 发送音频数据
ws.send(audioChunk);  // ArrayBuffer 或 Blob
```

**2. 控制命令 (JSON)**

```javascript
// 停止当前TTS播报
ws.send(JSON.stringify({
    type: 'abort'
}));

// 状态报告
ws.send(JSON.stringify({
    type: 'status',
    battery: 85,
    wifi_signal: -45
}));
```

**3. 接收响应**

```javascript
ws.onmessage = (event) => {
    if (event.data instanceof Blob) {
        // 接收音频数据
        playAudio(event.data);
    } else {
        // 接收JSON消息
        const msg = JSON.parse(event.data);
        console.log('服务器消息:', msg);
    }
};
```

### HTTP API

#### OTA 升级接口

```bash
GET /xiaozhi/ota/
Content-Type: application/json

Response:
{
    "version": "1.2.0",
    "download_url": "http://server/firmware.bin",
    "md5": "abc123...",
    "size": 1024000
}
```

#### 视觉分析接口

```bash
POST /mcp/vision/explain
Authorization: Bearer <jwt_token>
Content-Type: multipart/form-data

Form Data:
- image: <image_file>
- prompt: "描述这张图片"

Response:
{
    "success": true,
    "result": "这是一张包含猫咪的照片...",
    "model": "qwen-vl-max"
}
```

---

## 🔍 常见问题

### 1. 服务器启动失败

**问题：** `ModuleNotFoundError: No module named 'xxx'`

```bash
# 解决方案
source venv/bin/activate  # 激活虚拟环境
pip install -r requirements.txt
```

**问题：** `KeyError: 'model_dir'`

```bash
# 检查配置文件
cat server/data/.config.yaml

# 确保VAD配置包含 model_dir
VAD:
  SileroVAD:
    type: silero
    model_dir: models/snakers4_silero-vad
```

### 2. 音频处理问题

**问题：** FFmpeg not found

```bash
# Ubuntu/Debian
sudo apt-get install ffmpeg

# macOS
brew install ffmpeg

# Windows
# 从 https://ffmpeg.org/download.html 下载
```

### 3. AI 服务调用失败

**问题：** API Key 无效

```yaml
# 检查配置文件中的 API Key
# 确保没有多余的空格或引号
api_key: sk-xxxxxxxxxx  # 正确
api_key: "sk-xxxxxxxxxx"  # 也可以
api_key:  sk-xxxxxxxxxx  # 错误（多了空格）
```

**问题：** 网络连接超时

```bash
# 测试网络连接
curl https://dashscope.aliyuncs.com/compatible-mode/v1/models

# 配置代理（如需要）
export HTTP_PROXY=http://proxy:port
export HTTPS_PROXY=http://proxy:port
```

### 4. 性能优化

**问题：** 响应延迟高

```yaml
# 优化配置
# 1. 使用流式服务
LLM:
  AliLLM:
    stream: true  # 启用流式输出

# 2. 调整VAD参数
VAD:
  SileroVAD:
    min_silence_duration_ms: 150  # 减少停顿判定时长

# 3. 使用更快的模型
LLM:
  model_name: qwen-turbo  # 而不是 qwen-max
```

### 5. 日志调试

```yaml
# 开启调试日志
log:
  log_level: DEBUG  # 改为 DEBUG 模式
```

```bash
# 查看日志
tail -f tmp/server.log

# 按模块过滤
grep "core.providers.llm" tmp/server.log
```

---

## 📝 开发指南

### 项目结构

```
server/
├── app.py                      # 入口文件
├── config.yaml                 # 默认配置模板
├── requirements.txt            # Python依赖
├── data/
│   └── .config.yaml           # 开发配置（优先级最高）
├── config/                     # 配置管理
│   ├── config_loader.py
│   ├── settings.py
│   ├── logger.py
│   └── assets/                # 静态资源
├── core/                       # 核心模块
│   ├── websocket_server.py    # WebSocket服务器
│   ├── http_server.py         # HTTP服务器
│   ├── connection.py          # 连接处理
│   ├── auth.py                # 认证模块
│   ├── providers/             # AI服务提供者
│   │   ├── vad/              # 语音活动检测
│   │   ├── asr/              # 语音识别
│   │   ├── llm/              # 大语言模型
│   │   ├── tts/              # 语音合成
│   │   ├── memory/           # 对话记忆
│   │   └── intent/           # 意图识别
│   ├── handle/                # 消息处理器
│   │   ├── helloHandle.py
│   │   ├── receiveAudioHandle.py
│   │   ├── textHandle.py
│   │   ├── functionHandler.py
│   │   └── sendAudioHandle.py
│   └── utils/                 # 工具函数
├── plugins_func/              # 插件系统
│   ├── loadplugins.py
│   ├── register.py
│   └── functions/             # 插件函数
├── models/                    # 本地模型
│   ├── SenseVoiceSmall/
│   └── snakers4_silero-vad/
├── tmp/                       # 临时文件
│   ├── asr/
│   └── tts/
└── test/                      # 测试文件
    └── test_page.html
```

### 代码规范

```python
# 使用类型提示
from typing import Optional, Dict, Any

async def process_audio(
    audio_chunk: bytes,
    sample_rate: int = 16000
) -> Optional[str]:
    """
    处理音频数据

    Args:
        audio_chunk: 音频字节流
        sample_rate: 采样率

    Returns:
        识别的文本，失败返回 None
    """
    pass

# 使用日志
from config.logger import logger

logger.bind(tag="my_module").info("处理开始")
logger.bind(tag="my_module").error(f"错误: {error}")
```

---

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

---

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](../LICENSE) 文件了解详情

---

## 🔗 相关链接

- [项目主页](https://github.com/xinnan-tech/xiaozhi-esp32-server)
- [通讯协议文档](https://ccnphfhqs21z.feishu.cn/wiki/M0XiwldO9iJwHikpXD5cEx71nKh)
- [问题反馈](https://github.com/xinnan-tech/xiaozhi-esp32-server/issues)

---

## 💬 技术支持

如有问题，欢迎通过以下方式联系：

- 提交 [GitHub Issue](https://github.com/xinnan-tech/xiaozhi-esp32-server/issues)
- 查看 [常见问题](#常见问题)
- 参考 [配置说明](#配置说明)

---

<div align="center">

**⭐ 如果这个项目对您有帮助，请给我们一个 Star！**

Made with ❤️ by Python MCP Team

</div>
