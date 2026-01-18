# Installation

Choose the package that matches your workflow. All packages require `hono`.

## Core (generate routes file)

```bash
bun add hono @hono-filebased-route/core
```

## Runtime (register at startup)

```bash
bun add hono @hono-filebased-route/runtime
```

## Vite Plugin (dev-time regeneration)

```bash
bun add hono @hono-filebased-route/vite-plugin
bun add -D @hono/vite-dev-server @hono/vite-build/node
```

## Notes

- Examples in this repo use Bun, but any runtime that can run TypeScript and ESM should work.
- Route files live under `src/routes` by default.
