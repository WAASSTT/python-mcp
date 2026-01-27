# Electron Web Template

一个基于 Electron + Vue 3 + TypeScript 的现代化跨平台应用模板，支持同时构建为桌面应用和 Web 应用。

## ✨ 特性

- ⚡️ [Vue 3](https://vuejs.org/) + [TypeScript](https://www.typescriptlang.org/) - 现代化的前端技术栈
- 🎨 [Naive UI](https://www.naiveui.com/) - 优秀的 Vue 3 组件库
- � [Vue Data UI](https://vue-data-ui.graphieros.com/) - 数据可视化组件库
- 🎬 [GSAP](https://gsap.com/) - 高性能动画库
- 🔥 [Vite](https://vitejs.dev/) + [Electron Vite](https://electron-vite.org/) - 极速的开发体验
- 📦 [Pinia](https://pinia.vuejs.org/) - 状态管理，支持持久化
- 🌍 [Vue I18n](https://vue-i18n.intlify.dev/) - 国际化支持
- 🎯 [Vue Router](https://router.vuejs.org/) - 路由管理
- 🔌 [VueUse](https://vueuse.org/) - 强大的 Vue 组合式工具集
- 📱 [PWA](https://vite-plugin-pwa.netlify.app/) - 渐进式 Web 应用支持
- 🔒 自动启动功能 - 支持开机自启动
- 🔄 自动更新 - Electron 应用自动更新支持
- 🎭 按需自动导入 - 组件和 API 自动导入
- 🔧 开发工具 - Vue DevTools
- 📝 代码规范 - Oxlint + Oxfmt
- 🚀 跨平台支持 - Windows、macOS、Linux

## 🛠️ 技术栈

### 核心框架

- **Vue 3.5.25** - 渐进式 JavaScript 框架
- **Electron 39** - 跨平台桌面应用框架
- **TypeScript 5.9** - JavaScript 的超集

### UI 与样式

- **Naive UI 2.43** - Vue 3 组件库
- **Vue Data UI 3.9** - Vue 3 数据可视化组件库
- **Sass Embedded 1.97** - CSS 预处理器（嵌入式版本）
- **Unplugin Icons** - 图标自动导入

### 工具库

- **VueUse 14.1** - Vue 组合式 API 工具集
- **GSAP 3.14** - 高性能动画库
- **File Saver** - 文件保存
- **JSZip** - ZIP 文件处理
- **Pino 10.1** - 高性能日志记录
- **Encoding Japanese** - 日语编码转换
- **Auto Launch 5.0** - 开机自启动支持

### 开发工具

- **Vite 7.3** - 构建工具
- **Electron Vite 5** - Electron 专用构庺工具
- **Electron Builder 26** - 应用打包
- **Oxlint 1.33** - 快速代码检查
- **Oxfmt 0.18** - 高性能代码格式化（Prettier 兼容）
- **Vue TSC 3.1** - Vue 类型检查

## 📋 前置要求

- **Node.js** >= 18.x
- **npm** >= 9.x (或 pnpm >= 8.x)

## 🚀 快速开始

### 安装依赖

```bash
npm install
# 或
pnpm install
```

### Electron 桌面应用开发

#### 开发模式

```bash
npm run dev
```

#### 构建应用

```bash
# Windows 平台
npm run build:win

# macOS 平台
npm run build:mac

# Linux 平台
npm run build:linux

# 仅构建不打包
npm run build:unpack
```

### Web 应用开发

#### 开发模式

```bash
npm run web
```

#### 构建生产版本

```bash
npm run build:web
```

#### 预览生产构建

```bash
npm run preview:web
```

## 📝 开发规范

### 代码检查

```bash
# 运行 Oxlint
npm run lint

# 自动修复
npm run lint:fix
```

### 代码格式化

```bash
# 格式化所有文件
npm run format

# 检查格式
npm run format:check
```

### 类型检查

```bash
# 检查所有类型
npm run typecheck

# 仅检查 Node 端
npm run typecheck:node

# 仅检查 Web 端
npm run typecheck:web
```

## 📁 项目结构

```
electron-web-template/
├── src/
│   ├── main/              # Electron 主进程
│   │   ├── index.ts       # 主进程入口
│   │   └── tool/          # 工具模块（自动启动等）
│   ├── preload/           # 预加载脚本
│   │   └── index.ts       # Preload 入口
│   ├── renderer/          # 渲染进程（Vue 应用）
│   │   ├── index.html     # 入口 HTML
│   │   └── src/
│   │       ├── App.vue    # 根组件
│   │       ├── main.ts    # Vue 入口
│   │       ├── components/ # 组件目录
│   │       ├── plugins/   # 插件（PWA 等）
│   │       ├── router/    # 路由配置
│   │       └── utils/     # 工具函数
│   └── shared/            # 共享代码
│       └── lang/          # 国际化语言包
├── build/                 # 构建资源
├── resources/             # 应用资源
├── electron.vite.config.ts # Electron Vite 配置
├── vite.config.ts         # Web Vite 配置
├── electron-builder.yml   # Electron Builder 配置
└── package.json           # 项目配置
```

## 🔧 推荐的 IDE 配置

- [VSCode](https://code.visualstudio.com/)
- [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) - 代码检查
- [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode) - 代码格式化
- [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) - Vue 3 语言支持
- [TypeScript Vue Plugin](https://marketplace.visualstudio.com/items?itemName=Vue.vscode-typescript-vue-plugin) - Vue TS 支持

## 📦 构建配置

### 自定义构建配置

编辑 `electron-builder.yml` 文件来自定义应用打包配置，包括：

- 应用名称和图标
- 打包平台和架构
- 安装程序配置
- 代码签名设置

### 自动更新配置

编辑 `dev-app-update.yml` 文件来配置自动更新源。

## 🌍 国际化

项目支持中英文切换，语言包位于 `src/shared/lang/` 目录：

- `zh.ts` - 中文语言包
- `en.ts` - 英文语言包

## 📄 许可证

[MIT](LICENSE)

## 👤 作者

Wang Yu

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！
