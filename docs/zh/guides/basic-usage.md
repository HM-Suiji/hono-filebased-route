# 基础用法

本项目会把 `src/routes` 下的文件映射为 Hono 路由。

## 路由文件

创建文件并用命名导出定义 HTTP 方法：

```ts
// src/routes/about.ts
import { Context } from 'hono'

export function GET(c: Context) {
  return c.text('About')
}
```

## 路由注册

### Core（生成文件）

```ts
import { Hono } from 'hono'
import { registerGeneratedRoutes } from './generated-routes'

const app = new Hono()
registerGeneratedRoutes(app)
```

### Runtime（动态 import）

```ts
import { Hono } from 'hono'
import { registerRoutes } from '@hono-filebased-route/runtime'

const app = new Hono()
await registerRoutes(app)
```

## 方法级中间件（仅 core）

导出 `config` 对象，生成器会将中间件绑定到对应方法：

```ts
// src/routes/index.ts
import { Context } from 'hono'
import { someMiddleware } from './middleware'

export function GET(c: Context) {
  return c.text('Hello')
}

export const config = {
  GET: someMiddleware,
}
```

## 重要规则

- core 只在文件导出 `GET` 或 `POST` 时才会纳入生成。
- 被纳入的文件中，`GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS` 都会注册。
- `registerRoutes`（runtime）仅支持 `GET` 和 `POST`。
