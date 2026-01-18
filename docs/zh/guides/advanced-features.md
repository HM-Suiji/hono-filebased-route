# 高级特性

本页聚焦不同包的特有行为。

## Core：generateRoutesFile 配置

```ts
import { generateRoutesFile } from '@hono-filebased-route/core'

generateRoutesFile({
  dir: './src/routes',
  output: './src/generated-routes.ts',
  write: true,
  verbose: false,
  externals: ['**/*.test.ts'],
  typescript: true,
})
```

## Runtime：仅 GET 与 POST

`@hono-filebased-route/runtime` 会动态 import 路由模块，只注册 `GET` 和 `POST`。

## Vite 插件配置

```ts
import honoRouter from '@hono-filebased-route/vite-plugin'

honoRouter({
  dir: './src/routes',
  output: './src/generated-routes.ts',
  virtualRoute: false,
  verbose: false,
  callback: (router) => {
    // virtualRoute = true æ¶è¿åçæåå®¹
  },
})
```

### 备注

- `virtualRoute: true` 会暴露 `virtual:generated-routes`，不写入文件。
- 插件只在 dev server 模式下生成路由。
  生产构建推荐 `virtualRoute: false` 并提前生成。
