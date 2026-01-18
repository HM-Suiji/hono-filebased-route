# 快速开始

请选择一个模块。下面示例默认 routes 目录为 `src/routes`。

## Core（预生成路由文件）

安装：

```bash
bun add hono @hono-filebased-route/core
```

添加生成脚本（例如 `scripts/generate-routes.ts`）：

```ts
import { generateRoutesFile } from '@hono-filebased-route/core'

generateRoutesFile()
```

配置脚本：

```json
{
  "scripts": {
    "generate-routes": "bun run scripts/generate-routes.ts",
    "predev": "bun run generate-routes",
    "dev": "bun --hot src/main.ts"
  }
}
```

在应用中注册：

```ts
import { Hono } from 'hono'
import { registerGeneratedRoutes } from './generated-routes'

const app = new Hono()
registerGeneratedRoutes(app)

export default app
```

## Runtime（启动时注册）

安装：

```bash
bun add hono @hono-filebased-route/runtime
```

注册路由：

```ts
import { Hono } from 'hono'
import { registerRoutes } from '@hono-filebased-route/runtime'

const app = new Hono()
await registerRoutes(app)

export default app
```

## Vite 插件（开发期自动生成）

安装：

```bash
bun add hono @hono-filebased-route/vite-plugin
bun add -D @hono/vite-dev-server @hono/vite-build/node
```

Vite 配置（与 `examples/vite-plugin` 一致）：

```ts
import devServer from '@hono/vite-dev-server'
import { defineConfig } from 'vite'
import build from '@hono/vite-build/node'
import honoRouter from '@hono-filebased-route/vite-plugin'

export default defineConfig({
  plugins: [
    honoRouter({
      virtualRoute: false,
      verbose: true,
    }),
    build(),
    devServer({
      entry: 'src/index.ts',
    }),
  ],
})
```

在应用中导入：

```ts
import { Hono } from 'hono'
import { registerGeneratedRoutes } from './generated-routes'

const app = new Hono()
registerGeneratedRoutes(app)

export default app
```

如果设置 `virtualRoute: true`，请使用虚拟模块并添加声明：

```ts
// src/index.ts
import { registerGeneratedRoutes } from 'virtual:generated-routes'
```

```ts
// index.d.ts
declare module 'virtual:generated-routes' {
  export function registerGeneratedRoutes(app: import('hono').Hono): void
}
```

## 创建第一个路由

```ts
// src/routes/index.ts
import { Context } from 'hono'

export function GET(c: Context) {
  return c.text('Hello from file-based routing')
}
```
