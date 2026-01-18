# Dynamic Routes

## Single Parameter

```ts
// src/routes/users/[id].ts
import { Context } from 'hono'

export function GET(c: Context) {
  const id = c.req.param('id')
  return c.text(`User ${id}`)
}
```

## Catch-All

Catch-all routes receive the remaining path segments as the second argument:

```ts
// src/routes/articles/[...slug].ts
import { Context } from 'hono'

export function GET(c: Context, slug: string[]) {
  return c.json({ slug })
}
```

The array is derived from `c.req.path` inside the generated handler.
