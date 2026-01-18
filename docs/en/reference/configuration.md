# Configuration Reference

## Core: generateRoutesFile

`generateRoutesFile` accepts a partial config object:

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

### Defaults

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

- `dir`: routes directory to scan.
- `output`: output file path for generated routes.
- `write`: whether to write to disk.
- `verbose`: enables logging.
- `externals`: ignore patterns passed to fast-glob.
- `typescript`: adds a `: Hono` type annotation to `registerGeneratedRoutes`.

## Vite Plugin

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

### Defaults

```ts
{
  dir: './src/routes',
  output: './src/generated-routes.ts',
  virtualRoute: true,
  verbose: false,
}
```

- `virtualRoute`: when true, exposes `virtual:generated-routes`.
- `callback`: receives the generated content string (only when `virtualRoute` is true).
