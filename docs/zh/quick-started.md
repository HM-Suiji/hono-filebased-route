# Quick Started

Pick one of the three modules below. All examples assume `src/routes` as the routes directory.

## Core (generate routes ahead of time)

Install:

```bash
bun add hono @hono-filebased-route/core
```

Add a generator script (for example `scripts/generate-routes.ts`):

```ts
import { generateRoutesFile } from '@hono-filebased-route/core'

generateRoutesFile()
```

Wire scripts in `package.json`:

```json
{
  "scripts": {
    "generate-routes": "bun run scripts/generate-routes.ts",
    "predev": "bun run generate-routes",
    "dev": "bun --hot src/main.ts"
  }
}
```

Use the generated registrar in your app:

```ts
import { Hono } from 'hono'
import { registerGeneratedRoutes } from './generated-routes'

const app = new Hono()
registerGeneratedRoutes(app)

export default app
```

## Runtime (register on startup)

Install:

```bash
bun add hono @hono-filebased-route/runtime
```

Register routes at runtime:

```ts
import { Hono } from 'hono'
import { registerRoutes } from '@hono-filebased-route/runtime'

const app = new Hono()
await registerRoutes(app)

export default app
```

## Vite Plugin (dev-time regeneration)

Install:

```bash
bun add hono @hono-filebased-route/vite-plugin
bun add -D @hono/vite-dev-server @hono/vite-build/node
```

Configure Vite (matches `examples/vite-plugin`):

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

In your app, import the generated registrar:

```ts
import { Hono } from 'hono'
import { registerGeneratedRoutes } from './generated-routes'

const app = new Hono()
registerGeneratedRoutes(app)

export default app
```

If you set `virtualRoute: true`, import from the virtual module and add a type stub:

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

## Create Your First Route

```ts
// src/routes/index.ts
import { Context } from 'hono'

export function GET(c: Context) {
  return c.text('Hello from file-based routing')
}
```

For dynamic or catch-all routes, see the Routing Patterns guide.
