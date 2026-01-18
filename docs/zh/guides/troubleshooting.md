# Troubleshooting

## Route file not registered

- The core generator skips files that do not export `GET` or `POST`.
- Ensure your file exports named handlers (`export function GET()` or `export const GET = ...`).
- Verify the routes directory passed to `generateRoutesFile` or `registerRoutes`.

## Catch-all handler not receiving segments

Catch-all routes receive the segments as the second argument of the handler:

```ts
export function GET(c, slug: string[]) {
  return c.json({ slug })
}
```

## Virtual routes missing in build

The Vite plugin generates routes in dev server mode. For production builds,
use `virtualRoute: false` and ensure `generated-routes.ts` exists.

## TypeScript cannot find virtual module

Add a module declaration when using `virtual:generated-routes`:

```ts
declare module 'virtual:generated-routes' {
  export function registerGeneratedRoutes(app: import('hono').Hono): void
}
```

## Generated file edited manually

`src/generated-routes.ts` is auto-generated. Edit files under `src/routes` instead.
