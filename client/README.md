# 小智客户端

基于 Vue 3 + TypeScript + Vite 的 WebSocket 客户端，用于连接小智服务器进行文本和语音对话。

## 快速开始

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

### 构建生产版本

```bash
npm run build
```

## 项目结构

```
client/
├── src/
│   ├── components/
│   │   └── Index.vue          # 主界面组件
│   ├── services/
│   │   ├── websocket.ts       # WebSocket 服务
│   │   ├── audio.ts           # 音频处理服务
│   │   └── api.ts             # HTTP API 服务
│   ├── stores/
│   │   └── app.ts             # 全局状态管理
│   ├── router/
│   │   └── index.ts           # 路由配置
│   └── types/
│       └── global.d.ts        # 类型定义
```

## 功能特性

### 1. WebSocket 通信
- 自动连接和重连
- 心跳保活
- 消息类型路由
- 二进制数据支持

### 2. 音频处理
- 实时录音
- Opus 编码
- 音频可视化
- 音频播放

### 3. 状态管理
- Pinia 状态管理
- 配置持久化
- 连接状态管理
- 消息历史

## 使用说明

### 1. 启动服务器

```bash
cd ../server
python app.py
```

### 2. 配置连接

1. 设备ID：自动生成
2. OTA地址：默认 `http://127.0.0.1:30003/xiaozhi/ota/`
3. Token：可选

### 3. 连接并使用

- 点击"连接服务器"
- 发送文本消息
- 或使用语音对话

## 技术栈

- Vue 3
- TypeScript
- Vite
- Naive UI
- Pinia
- Vue Router

## 注意事项

1. 需要浏览器支持 WebSocket 和 MediaRecorder API
2. 麦克风权限需要在 HTTPS 或 localhost 环境
3. 推荐使用最新版 Chrome/Edge/Firefox
