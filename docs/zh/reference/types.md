# 类型定义

以下类型从 `@hono-filebased-route/core` 导出。

```ts
export const METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'] as const
export type Method = (typeof METHODS)[number]

export type ExportedMethods = {
  [key in Method]: boolean
}

export type Config = {
  dir: string
  output: string
  write: boolean
  verbose: boolean
  externals: string[]
  typescript: boolean
}
```

Vite 插件的 options 没有导出为类型，可以参考配置文档的字段说明。
