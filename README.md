# AI 语音助手 - 实时语音对话系统

基于 Python + FastAPI + Vue3 构建的现代化实时语音交互系统，**集成国内顶尖流式大模型API**，支持 WebSocket 双向实时通信，提供完整的前后端解决方案。

## 技术栈

### 后端 (Python)
- **语言**: Python 3.10+
- **框架**: FastAPI + Uvicorn
- **AI 能力**: 集成国内主流大模型服务
  - **ASR**: 讯飞实时语音转写大模型（支持202种方言）
  - **LLM**: 阿里云百炼通义千问（Qwen Plus/Max/Flash）
  - **VLLM**: 阿里云百炼通义千问-VL（视觉理解）
  - **TTS**: 火山引擎豆包大模型语音合成（325+音色）
  - **VAD**: Silero VAD 语音活动检测
- **音频处理**: opuslib_next (Opus 解码)
- **日志**: Loguru
- **异步**: AsyncIO + HTTPX

### 前端 (Vue3)
- **框架**: Vue 3.5 + TypeScript
- **构建工具**: Vite (Rolldown)
- **UI组件**: Naive UI
- **状态管理**: Pinia + persistedstate
- **路由**: Vue Router
- **音频编码**: @evan/wasm (高性能 Opus WASM 编码器)
- **实时通信**: WebSocket + AudioWorklet

## 核心特性

### 🎙️ 音频处理
- ✅ **实时 Opus 编码**: 基于 @evan/wasm 的高性能 WASM 编码器 (810µs/frame)
- ✅ **AudioWorklet 处理**: 音频线程实时 PCM 捕获，4096 样本缓冲
- ✅ **智能 VAD**: Silero VAD 语音活动检测，自动触发识别
- ✅ **低延迟传输**: WebSocket 二进制流式传输

### 🤖 AI 能力
- ✅ **国内流式大模型**: 集成讯飞、阿里云、火山引擎等顶尖服务
- ✅ **202种方言识别**: 讯飞 ASR 支持中英文及全国各地方言自动识别
- ✅ **流式对话**: 通义千问流式生成，逐句返回
- ✅ **325+超自然音色**: 火山引擎大模型 TTS，接近真人表达
- ✅ **多模态支持**: 文本、语音、图像理解
- ✅ **函数调用意图识别**: 基于通义千问的智能意图理解

### 💻 前端体验
- ✅ **现代化 UI**: Vue3 + Naive UI 组件库
- ✅ **实时状态**: 音频波形可视化、实时转写显示
- ✅ **响应式设计**: 自适应各种屏幕尺寸
- ✅ **会话管理**: 完整的对话历史记录

### 🔧 开发友好
- ✅ **类型安全**: 前后端完整的 TypeScript 类型支持
- ✅ **模块化设计**: Provider 模式，易于扩展
- ✅ **配置灵活**: YAML 配置文件，支持多环境
- ✅ **API文档**: 自动生成的 Swagger UI 文档

## 架构优势

### 国内大模型流式方案

**本项目集成的服务**：
- ✅ **讯飞星火实时语音转写大模型**（ASR）
  - WebSocket 实时流式识别
  - 支持中英+202种方言混合识别
  - HmacSHA1 签名认证
  - 音频流式输入，文本流式输出

- ✅ **阿里云百炼通义千问**（LLM/VLLM）
  - 兼容 OpenAI API 格式
  - 支持流式和非流式调用
  - qwen-plus/qwen-max/qwen-flash 多模型
  - qwen-vl 视觉理解能力
  - 函数调用（Function Call）能力

- ✅ **火山引擎豆包大模型语音合成**（TTS）
  - 输入输出双向流式
  - 325+超自然音色
  - 自动情感理解和演绎
  - 支持48K/24K/16K/8K采样率
  - 首包延迟低（约600ms）

**优势**：
- 🇨🇳 国内服务：低延迟，稳定可靠
- 🚀 流式处理：实时响应，用户体验好
- 💰 成本优化：按需付费，无需维护服务器
- 🎯 效果优秀：国内顶尖大模型能力
- 🔄 持续优化：模型不断迭代升级
- 📱 方言支持：覆盖全国各地方言

## 项目结构

```
.
├── main.py                    # 后端主入口
├── requirements.txt           # Python 依赖
├── start-python.sh            # 后端启动脚本
├── config.yaml                # 默认配置文件
├── server/                    # 后端核心代码
│   ├── __init__.py
│   ├── types.py              # 类型定义
│   ├── websocket_server.py   # WebSocket 服务器
│   ├── http_server.py        # HTTP API 服务器
│   ├── config/               # 配置模块
│   │   ├── loader.py         # 配置加载器
│   │   └── logger.py         # 日志配置
│   └── providers/            # AI 服务提供者
│       ├── asr/              # 语音识别
│       │   ├── __init__.py   # ASR 基类
│       │   └── xunfei.py     # 讯飞实时语音转写
│       ├── llm/              # 大语言模型
│       │   ├── __init__.py   # LLM 基类
│       │   └── qwen.py       # 通义千问
│       ├── tts/              # 语音合成
│       │   ├── __init__.py   # TTS 基类
│       │   └── huoshan.py    # 火山引擎豆包 TTS
│       ├── vad/              # 语音活动检测
│       │   ├── __init__.py   # VAD 基类
│       │   └── silero.py     # Silero VAD
│       └── vllm/             # 视觉语言模型
│           ├── __init__.py   # VLLM 基类
│           └── qwen_vl.py    # 通义千问-VL
├── client/                    # 前端代码
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── public/               # 静态资源
│   │   ├── opus.wasm         # Opus WASM 模块
│   │   ├── audio-processor.worklet.js  # AudioWorklet 处理器
│   │   └── vite.svg
│   └── src/
│       ├── main.ts           # 前端入口
│       ├── App.vue
│       ├── components/       # 组件
│       │   └── index.vue     # 主界面组件
│       ├── router/           # 路由
│       │   └── index.ts
│       ├── stores/           # 状态管理
│       │   └── voice.ts      # 语音状态
│       ├── types/            # 类型定义
│       │   └── index.ts
│       ├── utils/            # 工具函数
│       │   ├── audio.ts      # 音频录制管理
│       │   ├── websocket.ts  # WebSocket 管理
│       │   ├── opus-browser.ts        # Opus WASM 加载器
│       │   └── fast-opus-encoder.ts   # 高性能 Opus 编码器
│       └── assets/
│           └── styles/
│               └── global.scss
├── data/                      # 数据目录
│   ├── .config.yaml          # 自定义配置（需创建）
│   └── bin/                  # 固件文件
└── tmp/                       # 临时文件
    ├── asr/
    └── tts/
```

## 🚀 快速开始

### 环境要求

- **Python** >= 3.10
- **Node.js** >= 18
- **pnpm** (推荐) 或 npm
- **Git**

### 后端安装与启动

```bash
# 1. 创建虚拟环境
python3 -m venv venv

# 2. 激活虚拟环境
source venv/bin/activate  # Linux/Mac
# 或
venv\Scripts\activate     # Windows

# 3. 安装 Python 依赖
pip install -r requirements.txt

# 4. 配置 AI 服务（见下方配置部分）
mkdir -p data
cp config.yaml data/.config.yaml
# 编辑 data/.config.yaml 填入你的 API 密钥

# 5. 启动后端服务器
python3 main.py
# 或使用启动脚本
chmod +x start-python.sh && ./start-python.sh
```

后端服务将启动在：
- WebSocket: `ws://localhost:8000/ws`
- HTTP API: `http://localhost:8000`
- API 文档: `http://localhost:8000/docs`

### 前端安装与启动

```bash
# 1. 进入前端目录
cd client

# 2. 安装依赖
pnpm install
# 或
npm install

# 3. 启动开发服务器
pnpm dev
# 或
npm run dev
```

前端开发服务器将启动在: `http://localhost:5173`

### 生产构建

```bash
# 后端：已使用 Python，无需额外构建

# 前端构建
cd client
pnpm build
# 构建产物在 client/dist/
```

### 配置

1. 创建自定义配置文件：
```bash
mkdir -p data
cp config.yaml data/.config.yaml
```

2. 编辑 `data/.config.yaml`，配置你的AI服务：

```yaml
# 选择的模块
selected_module:
  ASR: 'xunfei_stream'      # 讯飞实时语音转写大模型
  LLM: 'qwen_flash'          # 阿里云百炼通义千问
  VLLM: 'qwen_vl'            # 阿里云百炼视觉大模型
  TTS: 'huoshan_stream'      # 火山引擎大模型语音合成
  VAD: 'silero'              # Silero VAD
  Intent: 'function_call'    # 函数调用意图识别
  Memory: 'mem_local_short'  # 本地短期记忆

# ASR配置 - 讯飞实时语音转写大模型
ASR:
  xunfei_stream:
    app_id: '你的讯飞应用ID'
    access_key_id: '你的AccessKeyId'
    access_key_secret: '你的AccessKeySecret'
    api_url: 'wss://office-api-ast-dx.iflyaisol.com/ast/communicate/v1'
    lang: 'autodialect'        # autodialect(中英+202种方言), autominor(37种语种)
    audio_encode: 'pcm_s16le'  # pcm_s16le, opus-wb
    samplerate: 16000          # 16000, 8000

# LLM配置 - 阿里云百炼
LLM:
  qwen_flash:
    api_key: '你的阿里云百炼API密钥'
    base_url: 'https://dashscope.aliyuncs.com/compatible-mode/v1'
    model: 'qwen-plus'         # qwen-plus, qwen-max, qwen-turbo
    temperature: 0.7
    max_tokens: 2000

# VLLM配置 - 阿里云百炼视觉大模型
VLLM:
  qwen_vl:
    api_key: '你的阿里云百炼API密钥'
    model: 'qwen-vl-max'       # qwen-vl-max, qwen-vl-plus, qwen-vl-ocr

# TTS配置 - 火山引擎大模型语音合成
TTS:
  huoshan_stream:
    appid: '你的火山引擎应用ID'
    access_token: '你的AccessToken'
    resource_id: '你的资源ID'
    ws_url: 'wss://openspeech.bytedance.com/api/v1/tts/ws_binary'
    speaker: 'zh_female_qingxin'  # 325+音色可选
    sample_rate: 24000             # 48000, 24000, 16000, 8000
    audio_format: 'pcm'            # pcm, ogg_opus, mp3
```

### 获取API密钥

1. **讯飞开放平台**：https://www.xfyun.cn/
   - 注册账号，创建应用
   - 获取 AppID、AccessKeyId、AccessKeySecret
   - 文档：https://www.xfyun.cn/doc/spark/asr_llm/rtasr_llm.html

2. **阿里云百炼**：https://bailian.console.aliyun.com/
   - 开通百炼服务（新用户有免费额度）
   - 创建 API Key
   - 文档：https://help.aliyun.com/zh/model-studio/

3. **火山引擎**：https://www.volcengine.com/product/tts
   - 开通豆包语音服务
   - 获取 AppID、AccessToken、ResourceID
   - 文档：https://www.volcengine.com/docs/6561/1257543

### 启动服务

#### 开发模式

```bash
# 启动服务（WebSocket + HTTP）
python3 main.py

# 或使用启动脚本
./start-python.sh
```

#### 生产模式

```bash
# 使用 gunicorn
pip install gunicorn
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000

# 或使用 uvicorn
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

## 🎯 使用说明

### 服务端口

- **WebSocket服务**: `ws://localhost:8000` - ESP32设备连接
- **HTTP API**: `http://localhost:8000` - 健康检查、OTA、视觉分析等
- **API文档**: `http://localhost:8000/docs` - Swagger UI 自动生成的API文档

### ESP32接入

ESP32设备通过WebSocket连接到服务器：

```
ws://服务器IP:8000
```

设备发送音频数据，服务器返回处理结果。

### OTA固件更新

1. 将固件文件(.bin)放入 `data/bin/` 目录
2. ESP32设备访问 `http://服务器IP:8003/xiaozhi/ota/`
3. 设备自动下载并更新固件

### 管理控制台

访问 `http://localhost:8001`，使用以下账号登录：

- 用户名: `admin`
- 密码: `admin123`

控制台功能：
- 📊 仪表盘 - 系统状态总览
- 📱 设备管理 - ESP32设备管理
- 🤖 智能体 - AI助手配置
- ⚙️ 模型配置 - ASR/LLM/TTS设置
- 🔧 系统配置 - 服务器参数

## 📡 API接口

### WebSocket消息格式

#### 音频流
发送原始音频数据（Buffer）

#### 文本消息
```json
{
  "type": "text",
  "content": {
    "text": "你好"
  }
}
```

#### 控制消息
```json
{
  "type": "control",
  "action": "start_listening"
}
```

### HTTP接口

#### OTA接口
- `GET /xiaozhi/ota/` - 获取服务信息
- `POST /xiaozhi/ota/` - OTA配置

#### 视觉分析
- `GET /mcp/vision/explain` - 检查状态
- `POST /mcp/vision/explain` - 提交分析（需JWT认证）

#### 管理API
详见 `http://localhost:8002/api/swagger`

## ⚙️ 配置说明

### 主配置文件

配置文件位于 `data/.config.yaml`（首次运行时需创建，可从 `config.yaml` 复制）

#### 服务器配置

```yaml
server:
  ip: '0.0.0.0'
  port: 8000
```

#### AI 服务配置

1. **ASR - 讯飞实时语音转写**

```yaml
selected_module:
  ASR: 'xunfei_stream'

ASR:
  xunfei_stream:
    app_id: '你的讯飞应用ID'
    access_key_id: '你的AccessKeyId'
    access_key_secret: '你的AccessKeySecret'
    api_url: 'wss://office-api-ast-dx.iflyaisol.com/ast/communicate/v1'
    lang: 'autodialect'        # 支持202种方言自动识别
    audio_encode: 'opus'       # 服务端接收 Opus 格式
    samplerate: 16000          # 16kHz 采样率
```

**获取 API 密钥**: [讯飞开放平台](https://www.xfyun.cn/)

2. **LLM - 通义千问**

```yaml
selected_module:
  LLM: 'qwen_flash'

LLM:
  qwen_flash:
    api_key: '你的阿里云百炼API密钥'
    base_url: 'https://dashscope.aliyuncs.com/compatible-mode/v1'
    model: 'qwen-plus'         # qwen-plus, qwen-max, qwen-turbo
    temperature: 0.7
    max_tokens: 2000
```

**获取 API 密钥**: [阿里云百炼](https://bailian.console.aliyun.com/)

3. **TTS - 火山引擎豆包**

```yaml
selected_module:
  TTS: 'huoshan_stream'

TTS:
  huoshan_stream:
    appid: '你的火山引擎应用ID'
    access_token: '你的AccessToken'
    resource_id: '你的资源ID'
    ws_url: 'wss://openspeech.bytedance.com/api/v1/tts/ws_binary'
    speaker: 'zh_female_qingxin'  # 325+音色可选
    sample_rate: 24000
    audio_format: 'pcm'
```

**获取 API 密钥**: [火山引擎语音服务](https://www.volcengine.com/product/tts)

4. **VAD - Silero 语音活动检测**

```yaml
selected_module:
  VAD: 'silero'

VAD:
  silero:
    sample_rate: 16000
    threshold: 0.5
    min_speech_duration_ms: 250
    max_speech_duration_s: 15
```

**无需配置**: Silero VAD 是本地模型，自动下载

5. **VLLM - 通义千问-VL (可选)**

```yaml
selected_module:
  VLLM: 'qwen_vl'

VLLM:
  qwen_vl:
    api_key: '你的阿里云百炼API密钥'
    model: 'qwen-vl-max'
```
    role_type: 0               # 说话人分离：0-关闭, 2-开启
    pd: ''                     # 领域个性化：court, finance, medical等

# LLM配置 - 阿里云百炼
LLM:
  qwen_flash:
    api_key: 'sk-xxx'
    base_url: 'https://dashscope.aliyuncs.com/compatible-mode/v1'
    model: 'qwen-plus'
    temperature: 0.7
    max_tokens: 2000
    top_p: 0.8
    enable_search: false  # 互联网搜索

# VLLM配置 - 阿里云百炼视觉大模型
VLLM:
  qwen_vl:
    api_key: 'sk-xxx'
    model: 'qwen-vl-max'
    temperature: 0.7
    max_tokens: 1500

# TTS配置 - 火山引擎大模型语音合成
TTS:
  huoshan_stream:
    appid: 'your-appid'
    access_token: 'your-token'
    resource_id: 'your-resource-id'
    cluster: 'volcano_tts'
    ws_url: 'wss://openspeech.bytedance.com/api/v1/tts/ws_binary'
    speaker: 'zh_female_qingxin'
    speech_rate: 1.0      # 语速比例：0.5~2.0
    loudness_rate: 1.0    # 音量比例：0.5~2.0
    pitch: 1.0            # 音调比例：0.5~2.0
    sample_rate: 24000    # 采样率：48000, 24000, 16000, 8000
    audio_format: 'pcm'   # 格式：pcm, ogg_opus, mp3

# VAD配置
VAD:
  silero:
    threshold: 0.3                 # 检测阈值
    sample_rate: 16000
    min_speech_duration: 250       # 最小语音持续时间(ms)
    max_silence_duration: 500      # 最大静默持续时间(ms)

# 意图识别配置
Intent:
  function_call:
    enabled: true
    provider: 'qwen_flash'
    functions:
      - name: 'get_weather'
        description: '获取指定城市的天气信息'
        parameters:
          type: 'object'
          properties:
            city:
              type: 'string'
              description: '城市名称'
          required: ['city']

# 记忆模块配置
Memory:
  mem_local_short:
    enabled: true
    max_history: 10       # 最大保留对话轮数
    max_tokens: 4000      # 最大token数
    summary_threshold: 8  # 超过此轮数后进行摘要
```

### 环境变量 (.env)

```bash
SERVER_IP=0.0.0.0
SERVER_PORT=8000
HTTP_PORT=8003
ADMIN_PORT=8002
AUTH_KEY=your-secret-key
LOG_LEVEL=info
```


### 前端音频配置

前端使用 **@evan/wasm** 进行高性能 Opus 编码：

```typescript
// client/src/utils/opus-browser.ts
// 自定义 WASM 加载器，从本地加载 /opus.wasm

// 音频参数
const SAMPLE_RATE = 16000;        // 16kHz 采样率
const FRAME_SIZE = 960;           // 960 samples/frame (60ms @ 16kHz)
const BITRATE = 24000;            // 24kbps
const CHANNELS = 1;               // 单声道
const COMPLEXITY = 10;            // 最高编码质量
```

音频处理流程：

```
麦克风 → AudioWorklet (Float32) → Int16 转换 → Opus 编码 → WebSocket 传输
                                                                    ↓
                                                              服务端解码
                                                                    ↓
                                                              Silero VAD
                                                                    ↓
                                                            讯飞 ASR 识别
                                                                    ↓
                                                            通义千问 LLM
                                                                    ↓
                                                            火山引擎 TTS
                                                                    ↓
                                                              音频播放
```

## 📡 API 接口

### WebSocket 消息格式

**连接地址**: `ws://localhost:8000/ws`

#### 1. 音频流 (Binary)
客户端发送原始 Opus 数据包：
- 格式：`application/octet-stream`
- 大小：960 samples/frame（60ms @ 16kHz）
- 编码：Opus 24kbps

#### 2. 服务端响应

##### ASR 结果
```json
{
  "type": "asr_result",
  "text": "你好，今天天气怎么样？",
  "is_final": true
}
```

##### LLM 流式响应
```json
{
  "type": "llm_stream",
  "text": "今天天气不错",
  "is_final": false
}
```

##### TTS 音频流（Binary）
```json
{
  "type": "tts_audio",
  "audio": "<PCM 二进制数据>",
  "sample_rate": 24000,
  "format": "pcm"
}
```

##### VAD 状态
```json
{
  "type": "vad_state",
  "state": "speech_detected"  // speech_detected | silence_detected
}
```

### HTTP 接口

#### 健康检查
```bash
GET http://localhost:8000/health
```

响应：
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

#### API 文档
```bash
GET http://localhost:8000/docs
```

Swagger UI 自动生成的交互式 API 文档

## 🎨 AI 模块支持

### ASR (语音识别)
- ✅ **讯飞实时语音转写大模型** - 支持中英+202种方言自动识别
  - WebSocket 流式识别
  - HmacSHA1 签名认证
  - 建议每40ms发送1280字节音频
  - 超时时间15秒

### LLM (大语言模型)
- ✅ **阿里云百炼通义千问** - 兼容 OpenAI API
  - qwen-plus：效果、速度、成本均衡
  - qwen-max：效果最好，适合复杂任务
  - qwen-flash：高性价比，低延迟
  - 支持流式/非流式调用
  - 支持函数调用（Function Call）
  - 可启用互联网搜索

### VLLM (视觉大模型)
- ✅ **通义千问-VL** - 多模态视觉理解
  - 图像理解和分析
  - OCR 文字识别
  - 支持流式输出

### TTS (语音合成)
- ✅ **火山引擎豆包大模型语音合成** - 超自然拟真人音色
  - 325+音色可选
  - 输入输出双向流式
  - 自动情感理解和演绎
  - 首包延迟约600ms
  - 支持48K/24K/16K/8K采样率
  - 支持pcm/ogg_opus/mp3格式

### VAD (语音活动检测)
- ✅ **Silero VAD** - 轻量级语音活动检测
  - 智能检测语音开始/结束
  - 减少不必要的API调用
  - 可配置检测阈值

### Intent (意图识别)
- ✅ **函数调用** - 基于通义千问的意图理解
  - 自动识别用户意图
  - 支持自定义函数列表
  - JSON Schema 参数验证

### Memory (记忆管理)
- ✅ **本地短期记忆** - 对话上下文管理
  - 保留最近对话历史
  - 自动摘要长对话
  - Token 数量控制

## 🛠️ 开发指南

### 项目架构

```
前端 (Vue3 + TypeScript)
    ↓ WebSocket
后端 (FastAPI + Python)
    ├─ WebSocket 服务器 (websocket_server.py)
    │   ├─ 音频接收 → Opus 解码
    │   ├─ VAD 检测 (Silero)
    │   ├─ ASR 识别 (讯飞)
    │   ├─ LLM 对话 (通义千问)
    │   └─ TTS 合成 (火山引擎)
    └─ HTTP 服务器 (http_server.py)
        └─ 健康检查、API 文档
```

### 添加新的 AI 提供者

以添加一个新的 ASR 提供者为例：

1. **创建提供者文件**

```python
# server/providers/asr/my_asr.py
from server.providers.asr import ASRProvider

class MyASRProvider(ASRProvider):
    def __init__(self, config: dict):
        self.config = config
        # 初始化你的 ASR 服务

    async def speech_to_text(
        self,
        audio_data: list[bytes],
        session_id: str,
        audio_format: str = "opus"
    ) -> tuple[str, str]:
        """
        语音转文字

        Args:
            audio_data: 音频数据列表
            session_id: 会话ID
            audio_format: 音频格式 (opus/pcm)

        Returns:
            (识别文本, 音频文件路径)
        """
        # 实现你的 ASR 逻辑
        text = await self._recognize(audio_data)
        audio_file = self._save_audio(audio_data, session_id)
        return text, audio_file
```

2. **注册提供者**

```python
# server/providers/asr/__init__.py
from .my_asr import MyASRProvider

# 在工厂函数中添加
def create_asr_provider(provider_type: str, config: dict) -> ASRProvider:
    if provider_type == 'my_asr':
        return MyASRProvider(config)
    # ... 其他提供者
```

3. **配置文件添加配置**

```yaml
# data/.config.yaml
selected_module:
  ASR: 'my_asr'

ASR:
  my_asr:
    api_key: 'your-api-key'
    # 其他配置参数
```

### 调试技巧

#### 后端日志
```bash
# 查看实时日志
tail -f logs/app.log

# 查看错误日志
grep ERROR logs/app.log
```

#### 前端调试
```typescript
// 在浏览器控制台查看 WebSocket 消息
// client/src/utils/websocket.ts 中已添加详细日志
```

#### 音频调试
```python
# 保存接收到的音频数据
# tmp/asr/ 目录下会保存每次的音频文件
```

### 测试

#### 后端测试
```bash
# 运行测试
pytest tests/

# 单个测试
pytest tests/test_asr.py -v
```

#### 前端测试
```bash
cd client
pnpm test
```

## 🔍 故障排查

### 常见问题

**1. WebSocket 连接失败**
- 检查后端是否启动：`curl http://localhost:8000/health`
- 检查防火墙设置
- 查看浏览器控制台错误信息

**2. 音频无声音**
- 检查麦克风权限
- 浏览器需要 HTTPS 或 localhost 才能访问麦克风
- 检查音频设备选择

**3. ASR 识别失败**
- 检查讯飞 API 配置
- 查看 `tmp/asr/` 目录确认音频文件是否正常
- 检查音频格式是否为 16kHz 单声道

**4. LLM 响应慢**
- 切换到 `qwen-flash` 模型
- 检查网络连接
- 减少 `max_tokens` 参数

**5. TTS 无声音**
- 检查火山引擎配置
- 确认音色名称正确
- 查看日志中的错误信息

### 性能优化

**后端优化**
- 使用 `uvloop` 加速异步 IO
- 增加 worker 进程数
- 使用 Redis 做会话缓存

**前端优化**
- 启用 Vite 的代码分割
- 使用 Web Worker 处理音频
- 减少不必要的状态更新

## 📄 许可证

MIT License

## 🙏 致谢

- [讯飞开放平台](https://www.xfyun.cn/) - ASR 服务
- [阿里云百炼](https://bailian.console.aliyun.com/) - LLM 和 VLLM 服务
- [火山引擎](https://www.volcengine.com/) - TTS 服务
- [Silero VAD](https://github.com/snakers4/silero-vad) - VAD 模型
- [@evan/wasm](https://www.npmjs.com/package/@evan/wasm) - Opus WASM 编码器

## 📞 联系方式

如有问题或建议，欢迎提交 Issue 或 Pull Request。

示例：
```typescript
// src/providers/asr/my-asr.ts
export class MyASRProvider {
  async recognize(audio: Buffer): Promise<string> {
    // 实现识别逻辑
  }
}

// src/providers/asr/index.ts
export function createASRProvider(config: Config) {
  switch (config.selected_module.ASR) {
    case 'my-asr':
      return new MyASRProvider(config);
    // ...
  }
}
```

### 扩展管理API

在 `src/admin/index.ts` 中添加新的路由：

```typescript
app.post('/api/custom/action', ({ body }) => {
  // 处理逻辑
  return { code: 0, data: {} };
});
```

## 📝 注意事项

1. **首次运行**: 请确保已创建 `data/.config.yaml` 并配置好所有API密钥
2. **端口占用**: 确保8000、8001、8002、8003端口未被占用
3. **网络连接**: 需要稳定的网络连接到国内API服务
4. **数据目录**: `data/` 和 `tmp/` 目录会自动创建
5. **音频格式**:
   - ASR 输入：PCM 16K 16bit 单声道
   - TTS 输出：可配置采样率和格式
6. **流式处理**:
   - ASR 建议每40ms发送1280字节
   - TTS 首包延迟约600ms
   - WebSocket 超时15秒
7. **API额度**:
   - 讯飞：新用户有免费额度
   - 阿里云：新用户北京地域有免费额度
   - 火山引擎：按实际调用量计费
8. **方言识别**: autodialect 支持中英文+202种方言自动识别
9. **音色选择**: 火山引擎提供325+音色，可在配置中更换

## 🔐 安全建议

1. 修改 `config.yaml` 中的 `auth_key`
2. 生产环境使用强密码
3. 配置防火墙规则（讯飞、阿里云、火山引擎）
- 确认网络连接正常（需访问国内服务）
- 查看日志输出 (tmp/日志文件)
- 检查API额度是否充足

### ASR识别不准确
- 确认音频格式正确（PCM 16K 16bit 单声道）
- 检查是否选择了正确的语言/方言
- 尝试调整 VAD 阈值
- 考虑配置领域个性化参数(pd)

### TTS音质问题
- 尝试更换音色（speaker参数）
- 调整采样率（推荐24000或48000）
- 检查音频格式配置
- 确认网络带宽充足（双向流式）

## 🐛 故障排查

### WebSocket连接失败
- 检查端口是否开放
- 查看� 相关链接

- **讯飞开放平台**: https://www.xfyun.cn/
  - 实时语音转写大模型文档: https://www.xfyun.cn/doc/spark/asr_llm/rtasr_llm.html

- **阿里云百炼**: https://bailian.console.aliyun.com/
  - 模型文档: https://help.aliyun.com/zh/model-studio/
  - API参考: https://help.aliyun.com/zh/model-studio/first-api-call-to-qwen

- **火山引擎**: https://www.volcengine.com/
  - 豆包大模型语音合成: https://www.volcengine.com/docs/6561/1257543
  - 音色列表: https://www.volcengine.com/docs/6561/97465

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交Issue和Pull Request！

## 📧 联系

如有问题，请提交Issue或访问项目主页。

---

**基于 [xiaozhi-esp32-server](https://github.com/xinnan-tech/xiaozhi-esp32-server) 重构**

**集成国内顶尖大模型服务**：
- 讯飞星火实时语音转写大模型
- 阿里云百炼通义千问系列
- 火山引擎豆包大模型语音合成
MIT License

## 🤝 贡献

欢迎提交Issue和Pull Request！

## 📧 联系

如有问题，请提交Issue或访问项目主页。

---

**基于 [xiaozhi-esp32-server](https://github.com/xinnan-tech/xiaozhi-esp32-server) 重构**
