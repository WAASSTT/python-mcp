# Manager API - Elysia 版本

基于 Elysia 框架重构的小智后台管理系统 API。

## 技术栈

- **Bun** - JavaScript 运行时
- **Elysia** - 高性能 Web 框架
- **Drizzle ORM** - TypeScript ORM
- **PostgreSQL** - 数据库
- **JWT** - 身份认证

## 快速开始

### 安装依赖

```bash
bun install
```

### 配置环境变量

复制 `.env.example` 为 `.env` 并配置相应的环境变量。

### 运行开发服务器

```bash
bun dev
```

服务将运行在 `http://localhost:8002`

### 访问 API 文档

启动服务后访问：`http://localhost:8002/doc`

## 项目结构

```
src/
├── index.ts              # 应用入口
├── config/               # 配置文件
├── db/                   # 数据库配置和 schema
├── modules/              # 业务模块
│   ├── agent/           # 智能体模块
│   ├── security/        # 认证授权模块
│   ├── sys/             # 系统管理模块
│   ├── device/          # 设备管理模块
│   ├── knowledge/       # 知识库模块
│   └── ...
├── common/               # 公共模块
│   ├── middleware/      # 中间件
│   ├── utils/           # 工具函数
│   └── types/           # 类型定义
└── plugins/              # Elysia 插件
```

## 开发指南

### 添加新的路由

在对应的模块目录下创建路由文件，使用 Elysia 的链式 API：

```typescript
import { Elysia, t } from 'elysia'

export const userRoutes = new Elysia({ prefix: '/user' })
  .get('/', () => 'User list')
  .post('/', ({ body }) => body, {
    body: t.Object({
      name: t.String(),
      email: t.String()
    })
  })
```

### 数据库迁移

```bash
# 生成迁移文件
bun run drizzle-kit generate

# 运行迁移
bun run drizzle-kit migrate
```

## 构建

```bash
bun run build
```

## 生产环境运行

```bash
bun start
```
