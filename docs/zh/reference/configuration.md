# 配置参考

## Core：generateRoutesFile

`generateRoutesFile` 接受部分配置：

```ts
import { generateRoutesFile } from '@hono-filebased-route/core'

generateRoutesFile({
  dir: './src/routes',
  output: './src/generated-routes.ts',
  write: true,
  verbose: false,
  externals: [],
  typescript: true,
})
```

### 默认值

```ts
{
  dir: './src/routes',
  output: './src/generated-routes.ts',
  write: true,
  verbose: false,
  externals: [],
  typescript: true,
}
```

- `dir`：路由目录。
- `output`：生成文件输出路径。
- `write`：是否写入磁盘。
- `verbose`：打开日志。
- `externals`：忽略规则（fast-glob ignore）。
- `typescript`：给 `registerGeneratedRoutes` 添加 `: Hono` 类型注解。

## Vite 插件

```ts
import honoRouter from '@hono-filebased-route/vite-plugin'

honoRouter({
  dir: './src/routes',
  output: './src/generated-routes.ts',
  virtualRoute: true,
  verbose: false,
  callback: (router) => {},
})
```

### 默认值

```ts
{
  dir: './src/routes',
  output: './src/generated-routes.ts',
  virtualRoute: true,
  verbose: false,
}
```

- `virtualRoute`：true 时暴露 `virtual:generated-routes`。
- `callback`：返回生成内容（仅 virtualRoute=true）。
