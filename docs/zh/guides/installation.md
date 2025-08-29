# 安装与配置

本指南将引导你在项目中安装和配置 @hono-filebased-route/core。

## 前置要求

在安装 @hono-filebased-route/core 之前，请确保你有：

- **Bun**（推荐）或 **Node.js 18+**
- 项目中已安装 **Hono** 框架
- 对 TypeScript 的基本了解

## 安装

### 使用 Bun（推荐）

```bash
bun add @hono-filebased-route/core
```

### 使用 npm

```bash
npm install @hono-filebased-route/core
```

### 使用 yarn

```bash
yarn add @hono-filebased-route/core
```

### 使用 pnpm

```bash
pnpm add @hono-filebased-route/core
```

## 基础设置

### 1. 导入和初始化

在你项目的scripts文件夹中添加文件，例如 `generate-routes.ts`：

```typescript
import { generateRoutesFile } from '@hono-filebased-route/core'

generateRoutesFile()
```

在你的主应用文件中（例如 `index.ts` 或 `app.ts`）：

```typescript
import { Hono } from 'hono'
import { registerGeneratedRoutes } from './generated-routes'

const app = new Hono()

// 调用生成的函数来注册所有路由
registerGeneratedRoutes(app)

// 处理未匹配的路由
app.notFound(c => {
  return c.text('404 Not Found!', 404)
})

// 处理错误
app.onError((err, c) => {
  console.error(`Route error: ${err}`)
  return c.text('Internal Server Error', 500)
})

// 启动服务器
const port = 3000
console.log(`Server is running on http://localhost:${port}`)

export default {
  port: port,
  fetch: app.fetch,
}
```

### 2. 创建路由目录

在项目src目录创建 `routes` 目录：

```bash
mkdir routes
```

### 3. 创建第一个路由

创建 `src/routes/index.ts`：

```typescript
import type { Context } from 'hono'

export const GET = (c: Context) => {
  return c.json({ message: 'Hello World!' })
}
```

## 配置选项

`generateRoutesFile` 函数接受一个配置对象，包含以下选项：

### 基础配置

```typescript
generateRoutesFile({
  dir: './src/routes', // 可选：路由目录路径，默认为 './src/routes'
  output: './src/generated-routes.ts', // 可选：输出文件路径，默认为 './src/generated-routes.ts' !建议为此文件添加git ignore
})
```

## 项目结构示例

### 简单 API 结构

```txt
project/
├── index.ts                # 主应用文件
├── routes/
│   ├── index.ts            # GET /
│   ├── health.ts           # GET /health
│   └── users.ts            # GET,POST /users
├── scripts/
│   └── generate-routes.ts  # 路由生成脚本
└── package.json
```

## 环境特定配置

### 开发环境配置

```typescript
// dev.ts
import { fileBasedRouting } from 'hono-filebased-route'

fileBasedRouting(app, {
  dir: './routes',
  verbose: true, // 在开发环境启用日志
  exclude: ['test', '_dev'],
})
```

### 生产环境配置

```typescript
// prod.ts
import { fileBasedRouting } from 'hono-filebased-route'

fileBasedRouting(app, {
  dir: './dist/routes', // 使用编译后的路由
  verbose: false, // 在生产环境禁用日志
  exclude: ['test', '_dev', '_internal'],
})
```

## 与构建工具集成

### Vite 配置

如果你使用 Vite，请使用 `@hono-filebased-route/vite-plugin`：

```bash
bun add @hono-filebased-route/vite-plugin
```

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import honoFilebasedRoute from '@hono-filebased-route/vite-plugin'

export default defineConfig({
  plugins: [honoFilebasedRoute()],
})
```

### TypeScript 配置

确保你的 `tsconfig.json` 包含路由目录：

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*", "routes/**/*"]
}
```

## 故障排除

### 常见问题

#### 路由未加载

1. **检查文件扩展名**：确保路由文件具有 `.ts` 或 `.js` 扩展名
2. **验证目录路径**：确保 `dir` 选项指向正确的目录

#### TypeScript 错误

1. **安装类型定义**：`bun add -d @types/node`
2. **检查导入**：确保从 'hono' 导入 `Context`
3. **验证导出语法**：使用 `export const GET = ...` 而不是 `export default`

#### 构建问题

1. **检查构建配置**：确保构建工具包含路由目录
2. **验证输出路径**：确保构建的路由在预期位置

## 下一步

现在你已经安装和配置了 hono-filebased-route：

1. 学习[基础用法](/zh/guides/basic-usage)
2. 探索[路由模式](/zh/guides/routing-patterns)
3. 了解[动态路由](/zh/guides/dynamic-routes)
4. 查看[高级功能](/zh/guides/advanced-features)

准备开始构建了吗？让我们创建一些路由！🚀
