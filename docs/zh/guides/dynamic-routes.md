# 动态路由

## 单参数

```ts
// src/routes/users/[id].ts
import { Context } from 'hono'

export function GET(c: Context) {
  const id = c.req.param('id')
  return c.text(`User ${id}`)
}
```

## 通配符

通配符路由会将剩余路径段作为第二个参数传入：

```ts
// src/routes/articles/[...slug].ts
import { Context } from 'hono'

export function GET(c: Context, slug: string[]) {
  return c.json({ slug })
}
```

这个数组是在生成的处理器中通过 `c.req.path` 拆分得到的。
