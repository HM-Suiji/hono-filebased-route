# 快速开始

几分钟内快速上手 hono-filebased-route。

## 前置要求

开始之前，请确保已安装以下工具：

- [Bun](https://bun.sh/)（推荐）或 Node.js 18+
- 文本编辑器或 IDE

## 安装

### 1. 创建新项目

```bash
mkdir my-hono-app
cd my-hono-app
bun init -y
```

### 2. 安装 hono-filebased-route

```bash
bun add hono-filebased-route
bun add -d @types/bun
```

### 3. 创建第一个路由

创建 `routes` 目录并添加第一个路由文件：

```bash
mkdir routes
```

创建 `routes/index.ts`：

```typescript
import type { Context } from 'hono'

export const GET = (c: Context) => {
  return c.json({ message: '来自 hono-filebased-route 的问候！' })
}

export const POST = (c: Context) => {
  return c.json({ message: '收到 POST 请求！' })
}
```

### 4. 设置主应用程序

在项目根目录创建 `index.ts`：

```typescript
import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import { fileBasedRouting } from 'hono-filebased-route'

const app = new Hono()

// 应用文件路由
fileBasedRouting(app, {
  dir: './routes'
})

const port = 3000
console.log(`服务器运行在端口 ${port}`)

serve({
  fetch: app.fetch,
  port
})
```

### 5. 添加脚本到 package.json

更新 `package.json` 添加以下脚本：

```json
{
  "scripts": {
    "dev": "bun run --watch index.ts",
    "start": "bun run index.ts",
    "build": "bun build index.ts --outdir ./dist"
  }
}
```

### 6. 启动开发服务器

```bash
bun run dev
```

现在你的服务器应该运行在 `http://localhost:3000`！

## 测试路由

打开浏览器或使用 curl 测试路由：

```bash
# 测试 GET 请求
curl http://localhost:3000
# 响应: {"message":"来自 hono-filebased-route 的问候！"}

# 测试 POST 请求
curl -X POST http://localhost:3000
# 响应: {"message":"收到 POST 请求！"}
```

## 添加更多路由

让我们添加更多路由来体验文件路由的强大功能：

### 静态路由

创建 `routes/about.ts`：

```typescript
import type { Context } from 'hono'

export const GET = (c: Context) => {
  return c.json({ 
    page: '关于',
    description: '这是关于页面'
  })
}
```

访问地址：`http://localhost:3000/about`

### 动态路由

创建 `routes/users/[id].ts`：

```typescript
import type { Context } from 'hono'

export const GET = (c: Context) => {
  const id = c.req.param('id')
  return c.json({ 
    userId: id,
    message: `用户资料，ID: ${id}`
  })
}
```

访问地址：`http://localhost:3000/users/123`

### 通配符路由

创建 `routes/blog/[...slug].ts`：

```typescript
import type { Context } from 'hono'

export const GET = (c: Context) => {
  const slug = c.req.param('slug')
  return c.json({ 
    slug: slug,
    message: `博客文章: ${slug}`
  })
}
```

访问地址：`http://localhost:3000/blog/2024/my-first-post`

## 项目结构

现在你的项目结构应该是这样的：

```
my-hono-app/
├── routes/
│   ├── index.ts          # GET/POST /
│   ├── about.ts          # GET /about
│   ├── users/
│   │   └── [id].ts       # GET /users/:id
│   └── blog/
│       └── [...slug].ts  # GET /blog/*
├── index.ts              # 主应用程序
└── package.json
```

## 下一步

恭喜！你已经成功设置了 hono-filebased-route。接下来可以探索：

- [基础用法指南](/zh/guide/basic-usage) - 了解更多路由创建方法
- [路由模式](/zh/guide/routing-patterns) - 理解不同的路由模式
- [动态路由](/zh/guide/dynamic-routes) - 掌握动态和通配符路由
- [API 参考](/zh/reference/api) - 探索所有可用的 API

## 需要帮助？

如果遇到任何问题：

1. 查看[故障排除指南](/zh/guide/advanced-features#故障排除)
2. 查阅[示例](/zh/reference/examples)
3. 在 [GitHub](https://github.com/your-repo/hono-filebased-route) 上提交问题

开始编码吧！🚀