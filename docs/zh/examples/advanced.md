# 高级示例

此示例对应 `examples/bun` 中的模式。

## 方法级中间件

```ts
import { Context } from 'hono'
import { describeRoute } from 'hono-openapi'

export function GET(c: Context) {
  return c.text('Hello')
}

export const config = {
  GET: describeRoute({
    summary: 'Hello World',
  }),
}
```

## 通配符路由

```ts
// src/routes/articles/[...slug].ts
import { Context } from 'hono'

export function GET(c: Context, slug: string[]) {
  return c.text(`Accessing article slug: ${slug}`)
}
```
