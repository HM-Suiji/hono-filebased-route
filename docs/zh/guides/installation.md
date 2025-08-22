# 安装与配置

本指南将引导你在项目中安装和配置 hono-filebased-route。

## 前置要求

在安装 hono-filebased-route 之前，请确保你有：

- **Bun**（推荐）或 **Node.js 18+**
- 项目中已安装 **Hono** 框架
- 对 TypeScript 的基本了解

## 安装

### 使用 Bun（推荐）

```bash
bun add hono-filebased-route
```

### 使用 npm

```bash
npm install hono-filebased-route
```

### 使用 yarn

```bash
yarn add hono-filebased-route
```

### 使用 pnpm

```bash
pnpm add hono-filebased-route
```

## 基础设置

### 1. 导入和初始化

在你的主应用文件中（例如 `index.ts` 或 `app.ts`）：

```typescript
import { Hono } from 'hono'
import { fileBasedRouting } from 'hono-filebased-route'

const app = new Hono()

// 应用文件路由
fileBasedRouting(app, {
  dir: './routes' // 路由目录路径
})

export default app
```

### 2. 创建路由目录

在项目根目录创建 `routes` 目录：

```bash
mkdir routes
```

### 3. 创建第一个路由

创建 `routes/index.ts`：

```typescript
import type { Context } from 'hono'

export const GET = (c: Context) => {
  return c.json({ message: 'Hello World!' })
}
```

## 配置选项

`fileBasedRouting` 函数接受一个配置对象，包含以下选项：

### 基础配置

```typescript
fileBasedRouting(app, {
  dir: './routes',           // 必需：路由目录路径
  verbose: false,           // 可选：启用详细日志
  prefix: '/api',           // 可选：为所有路由添加前缀
  exclude: ['_helpers'],    // 可选：排除某些目录/文件
})
```

### 高级配置

```typescript
interface FileBasedRoutingOptions {
  /** 路由目录路径 */
  dir: string
  
  /** 在路由注册期间启用详细日志 */
  verbose?: boolean
  
  /** 为所有路由添加的前缀 */
  prefix?: string
  
  /** 要排除的文件/目录名称数组 */
  exclude?: string[]
  
  /** 要处理的自定义文件扩展名（默认：['.ts', '.js']） */
  extensions?: string[]
  
  /** 自定义路由转换函数 */
  transform?: (path: string) => string
}
```

## 配置示例

### 带 API 前缀

```typescript
fileBasedRouting(app, {
  dir: './routes',
  prefix: '/api/v1'
})

// routes/users.ts 变成 /api/v1/users
```

### 排除文件

```typescript
fileBasedRouting(app, {
  dir: './routes',
  exclude: ['_helpers', '_utils', 'test']
})

// _helpers/、_utils/ 和 test/ 目录中的文件将被忽略
```

### 自定义扩展名

```typescript
fileBasedRouting(app, {
  dir: './routes',
  extensions: ['.ts', '.js', '.mjs']
})
```

### 自定义路径转换

```typescript
fileBasedRouting(app, {
  dir: './routes',
  transform: (path: string) => {
    // 将 URL 中的 kebab-case 转换为 camelCase
    return path.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())
  }
})
```

### 详细日志

```typescript
fileBasedRouting(app, {
  dir: './routes',
  verbose: true
})

// 输出：
// [hono-filebased-route] Registered: GET /
// [hono-filebased-route] Registered: GET /users
// [hono-filebased-route] Registered: GET /users/:id
```

## 项目结构示例

### 简单 API 结构

```
project/
├── index.ts              # 主应用文件
├── routes/
│   ├── index.ts          # GET /
│   ├── health.ts         # GET /health
│   └── users.ts          # GET,POST /users
└── package.json
```

### 复杂 API 结构

```
project/
├── src/
│   ├── index.ts          # 主应用文件
│   ├── routes/
│   │   ├── index.ts      # GET /
│   │   ├── auth/
│   │   │   ├── login.ts  # POST /auth/login
│   │   │   └── logout.ts # POST /auth/logout
│   │   ├── api/
│   │   │   ├── users/
│   │   │   │   ├── index.ts    # GET,POST /api/users
│   │   │   │   └── [id].ts     # GET,PUT,DELETE /api/users/:id
│   │   │   └── posts/
│   │   │       ├── index.ts    # GET,POST /api/posts
│   │   │       └── [...slug].ts # GET /api/posts/*
│   │   └── _helpers/     # 排除的目录
│   │       └── utils.ts
│   └── middleware/
└── package.json
```

## 环境特定配置

### 开发环境配置

```typescript
// dev.ts
import { fileBasedRouting } from 'hono-filebased-route'

fileBasedRouting(app, {
  dir: './routes',
  verbose: true,           // 在开发环境启用日志
  exclude: ['test', '_dev']
})
```

### 生产环境配置

```typescript
// prod.ts
import { fileBasedRouting } from 'hono-filebased-route'

fileBasedRouting(app, {
  dir: './dist/routes',     // 使用编译后的路由
  verbose: false,          // 在生产环境禁用日志
  exclude: ['test', '_dev', '_internal']
})
```

## 与构建工具集成

### Vite 配置

如果你使用 Vite，可能需要配置它来处理动态导入：

```typescript
// vite.config.ts
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    rollupOptions: {
      external: ['hono-filebased-route']
    }
  }
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
  "include": [
    "src/**/*",
    "routes/**/*"
  ]
}
```

## 故障排除

### 常见问题

#### 路由未加载

1. **检查文件扩展名**：确保路由文件具有 `.ts` 或 `.js` 扩展名
2. **验证目录路径**：确保 `dir` 选项指向正确的目录
3. **启用详细日志**：设置 `verbose: true` 查看正在注册的路由

#### TypeScript 错误

1. **安装类型定义**：`bun add -d @types/node`
2. **检查导入**：确保从 'hono' 导入 `Context`
3. **验证导出语法**：使用 `export const GET = ...` 而不是 `export default`

#### 构建问题

1. **检查构建配置**：确保构建工具包含路由目录
2. **验证输出路径**：确保构建的路由在预期位置

### 调试模式

启用调试模式来排查路由问题：

```typescript
fileBasedRouting(app, {
  dir: './routes',
  verbose: true
})
```

## 下一步

现在你已经安装和配置了 hono-filebased-route：

1. 学习[基础用法](/zh/guide/basic-usage)
2. 探索[路由模式](/zh/guide/routing-patterns)
3. 了解[动态路由](/zh/guide/dynamic-routes)
4. 查看[高级功能](/zh/guide/advanced-features)

准备开始构建了吗？让我们创建一些路由！🚀