# Advanced Features

This page focuses on behavior that is specific to each package.

## Core: generateRoutesFile options

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

## Runtime: GET and POST only

`@hono-filebased-route/runtime` dynamically imports route modules and only
registers `GET` and `POST` handlers.

## Vite Plugin options

```ts
import honoRouter from '@hono-filebased-route/vite-plugin'

honoRouter({
  dir: './src/routes',
  output: './src/generated-routes.ts',
  virtualRoute: false,
  verbose: false,
  callback: (router) => {
    // string content of generated routes when virtualRoute is true
  },
})
```

### Notes

- `virtualRoute: true` exposes `virtual:generated-routes` and does not write a file.
- The plugin generates routes in dev server mode via `configureServer`.
  For production builds, prefer `virtualRoute: false` and generate the file ahead of time.
