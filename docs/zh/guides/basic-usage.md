# Basic Usage

This project maps files under `src/routes` to Hono routes.

## Route Files

Create files and export HTTP method handlers as named exports:

```ts
// src/routes/about.ts
import { Context } from 'hono'

export function GET(c: Context) {
  return c.text('About')
}
```

## Route Registration

### Core (generated file)

Generate once, then register:

```ts
import { Hono } from 'hono'
import { registerGeneratedRoutes } from './generated-routes'

const app = new Hono()
registerGeneratedRoutes(app)
```

### Runtime (dynamic import)

```ts
import { Hono } from 'hono'
import { registerRoutes } from '@hono-filebased-route/runtime'

const app = new Hono()
await registerRoutes(app)
```

## Per-Method Middleware (core only)

If you export a `config` object, the generator attaches middleware before the handler:

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

## Important Rules

- A file is included by the generator only if it exports `GET` or `POST`.
- When included, any exported method in `GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS` is registered.
- `registerRoutes` (runtime package) only supports `GET` and `POST`.
