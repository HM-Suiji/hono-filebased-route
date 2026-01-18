# API 参考

这个页面记录仓库公开函数。

## @hono-filebased-route/core

### getFiles

```ts
getFiles(dir: string, externals?: string[]): Promise<string[]>
```

- 扫描 `**/*.{ts,js}`，返回绝对路径。
- `externals` 传给 fast-glob 的 `ignore`。

### getRoutePath

```ts
getRoutePath(filePath: string, baseDir: string): string
```

将文件路径转换为 Hono 路由，支持 `index`、`[id]`、`[...slug]`。

### getExportedHttpMethods

```ts
getExportedHttpMethods(filePath: string): ExportedMethods
```

解析文件并返回导出的方法。

### getExportedMiddlewareHandler

```ts
getExportedMiddlewareHandler(filePath: string): ExportedMethods
```

读取 `export const config = { GET: ..., POST: ... }` 中的方法键。

### generateRoutesFile

```ts
generateRoutesFile(config?: Partial<Config>): Promise<string>
```

生成 `registerGeneratedRoutes` 函数并返回文件内容。
`config.write` 为 true 时会写入到 `config.output`。

### createLogger

```ts
createLogger(verbose?: boolean): Logger
```

`verbose` 为 false 时返回空调用日志，true 时使用 pino-pretty。

## @hono-filebased-route/runtime

### registerRoutes

```ts
registerRoutes(mainApp: Hono, dir?: string): Promise<Hono>
```

扫描 `dir` 下的文件并动态 import，注册 `GET`/`POST`。
