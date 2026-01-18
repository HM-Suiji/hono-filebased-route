# Advanced Example

This example mirrors patterns in `examples/bun`.

## Per-method middleware

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

## Catch-all route

```ts
// src/routes/articles/[...slug].ts
import { Context } from 'hono'

export function GET(c: Context, slug: string[]) {
  return c.text(`Accessing article slug: ${slug}`)
}
```
