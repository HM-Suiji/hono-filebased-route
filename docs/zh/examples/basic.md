# 基础示例

此示例对应 `examples/bun`。

## 路由文件

```
src/routes/
├── index.ts
├── about.ts
└── users/
    ├── index.ts
    └── [id].ts
```

`src/routes/index.ts`：

```ts
import { Context } from 'hono'

export function GET(c: Context) {
  return c.html('<h1>Welcome</h1>')
}
```

`src/routes/users/[id].ts`：

```ts
import { Context } from 'hono'

export function GET(c: Context) {
  const id = c.req.param('id')
  return c.text(`Viewing user ${id}`)
}
```
