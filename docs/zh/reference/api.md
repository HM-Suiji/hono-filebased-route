# API Reference

This page documents public functions exported by the packages in this repo.

## @hono-filebased-route/core

### getFiles

```ts
getFiles(dir: string, externals?: string[]): Promise<string[]>
```

- Scans for `**/*.{ts,js}` under `dir` and returns absolute paths.
- `externals` is passed to fast-glob `ignore`.

### getRoutePath

```ts
getRoutePath(filePath: string, baseDir: string): string
```

Converts a file path to a Hono route path. Handles `index`, `[id]`, and `[...slug]`.

### getExportedHttpMethods

```ts
getExportedHttpMethods(filePath: string): ExportedMethods
```

Parses the file and marks which HTTP methods are exported as named exports.

### getExportedMiddlewareHandler

```ts
getExportedMiddlewareHandler(filePath: string): ExportedMethods
```

Reads `export const config = { GET: ..., POST: ... }` and marks method keys present.

### generateRoutesFile

```ts
generateRoutesFile(config?: Partial<Config>): Promise<string>
```

Generates the `registerGeneratedRoutes` function and returns the file content.
If `config.write` is true, it also writes to `config.output`.

### createLogger

```ts
createLogger(verbose?: boolean): Logger
```

Returns a no-op logger when `verbose` is false, otherwise a pretty Pino logger.

## @hono-filebased-route/runtime

### registerRoutes

```ts
registerRoutes(mainApp: Hono, dir?: string): Promise<Hono>
```

Scans route files under `dir`, dynamically imports them, and registers `GET`/`POST` handlers.
