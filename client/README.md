# 🎙️ AI 语音助手 - 客户端

一个现代化的 AI 语音助手 Web 客户端，采用 Vue 3 + TypeScript + Vite 构建，支持实时语音交互和文本对话。

> **版本**: v1.0.0
> **最后更新**: 2025年12月26日

## ✨ 特性

### 🎨 现代化 UI 设计
- **Glassmorphism 玻璃态设计**：半透明卡片 + 背景模糊效果
- **紫色渐变主题**：统一的视觉风格（#667eea → #764ba2）
- **动态背景装饰**：浮动的圆形光晕增加视觉层次
- **聊天气泡样式**：类似即时通讯应用的消息展示

### 🎭 丰富的动画效果
- 页面加载淡入动画
- 消息滑入效果（用户消息从右，AI 消息从左）
- 按钮和卡片悬停微交互
- 录音状态脉冲动画
- 平滑的状态切换过渡

### 💬 核心功能
- **实时语音识别（ASR）**：边说边显示识别结果
- **文本对话**：支持键盘输入交互
- **语音输入**：录音并转换为文字
- **音频播放**：播放 AI 回复的语音
- **对话历史**：保存和管理对话记录
- **WebSocket 连接**：实时双向通信

### 📱 响应式设计
- 完美适配桌面端（>768px）
- 优化移动端体验（<768px）
- 自适应布局和控件大小

## 🛠️ 技术栈

- **框架**：Vue 3（Composition API）
- **语言**：TypeScript
- **构建工具**：Vite
- **UI 组件库**：Naive UI
- **状态管理**：Pinia + 持久化插件
- **路由**：Vue Router
- **样式**：SCSS（支持变量和 Mixins）

## 📦 安装

```bash
# 安装依赖
pnpm install

# 或使用 npm
npm install

# 或使用 yarn
yarn install
```

## 🚀 开发

```bash
# 启动开发服务器
pnpm dev

# 或
npm run dev
```

访问 http://localhost:5173

## 🏗️ 构建

```bash
# 生产构建
pnpm build

# 预览构建结果
pnpm preview
```

## 📂 项目结构

```
client/
├── src/
│   ├── assets/
│   │   └── styles/
│   │       └── global.scss          # 全局样式（颜色、动画、Mixins）
│   ├── components/
│   │   └── index.vue                # 主界面组件
│   ├── router/
│   │   └── index.ts                 # 路由配置
│   ├── stores/
│   │   └── voice.ts                 # 语音交互状态管理
│   ├── types/
│   │   └── index.ts                 # TypeScript 类型定义
│   ├── utils/
│   │   ├── audio.ts                 # 音频处理工具
│   │   └── websocket.ts             # WebSocket 通信
│   ├── App.vue                      # 根组件
│   └── main.ts                      # 应用入口
├── public/                          # 静态资源
├── index.html                       # HTML 模板
├── vite.config.ts                   # Vite 配置
├── tsconfig.json                    # TypeScript 配置
└── package.json                     # 项目依赖
```

## 🎨 样式系统

### 颜色变量
```scss
$primary-color: #667eea;      // 主色
$secondary-color: #764ba2;    // 辅助色
$accent-color: #f093fb;       // 强调色
$success-color: #4ade80;      // 成功色
$warning-color: #fbbf24;      // 警告色
$error-color: #f87171;        // 错误色
$info-color: #60a5fa;         // 信息色
```

### 动画效果
- `fadeIn`：淡入效果
- `slideInRight` / `slideInLeft`：滑入效果
- `pulse`：脉冲闪烁
- `float`：浮动效果
- `blink`：闪烁效果

## 🔌 WebSocket 连接

默认连接地址：`ws://localhost:8000/ws`

可以在界面中修改 WebSocket 服务器地址并连接。

## 📱 界面说明

### 顶部区域
- 大标题显示「AI 语音助手」
- 右侧显示当前连接状态（未连接、连接中、已连接等）

### 连接卡片
- WebSocket 地址输入框
- 连接/断开按钮
- 实时语音识别结果显示（带闪烁光标）

### 消息列表
- 聊天气泡样式展示对话
- 用户消息：紫色渐变背景，右对齐
- AI 消息：浅灰背景，左对齐
- 每条消息显示角色图标和时间戳
- 支持清空对话记录

### 输入控制区
- 多行文本输入框（3-6行自适应）
- 发送消息按钮
- 语音输入按钮（带录音状态动画）
- 停止播放按钮（音频播放时显示）
- 快捷键：Ctrl/Cmd + Enter 发送消息

### 系统信息
- 网格布局显示4个状态
- 连接状态、录音状态、消息总数、音频播放状态

## ⌨️ 快捷键

- `Ctrl + Enter` 或 `Cmd + Enter`：发送消息

## 🔧 配置

### 修改主题色

编辑 `src/assets/styles/global.scss` 文件中的颜色变量：

```scss
$primary-color: #your-color;
$secondary-color: #your-color;
```

### 自定义样式

所有组件样式都在 `src/components/index.vue` 的 `<style>` 标签中，使用 SCSS 编写。

## 🐛 常见问题

### 连接失败
- 确保后端 WebSocket 服务器已启动
- 检查 WebSocket 地址是否正确
- 查看浏览器控制台是否有错误信息

### 录音不工作
- 确保浏览器已授予麦克风权限
- 使用 HTTPS 或 localhost（浏览器安全策略）
- 检查设备麦克风是否正常

### 样式显示异常
- 清除浏览器缓存
- 确保依赖已正确安装
- 检查浏览器是否支持 CSS backdrop-filter

## 📚 相关文档

- [详细对比文档](./COMPARISON.md) - 界面优化前后对比
- [Vue 3 文档](https://vuejs.org/)
- [Naive UI 文档](https://www.naiveui.com/)
- [Pinia 文档](https://pinia.vuejs.org/)

## 📄 开源协议

MIT License

---

**享受现代化的 AI 语音助手体验！** 🎉✨
