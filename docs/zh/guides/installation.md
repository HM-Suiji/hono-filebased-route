# 安装

选择适合的包，所有包都需要 `hono`。

## Core（生成路由文件）

```bash
bun add hono @hono-filebased-route/core
```

## Runtime（启动时注册）

```bash
bun add hono @hono-filebased-route/runtime
```

## Vite 插件（开发期自动生成）

```bash
bun add hono @hono-filebased-route/vite-plugin
bun add -D @hono/vite-dev-server @hono/vite-build/node
```

## 备注

- 本仓库示例使用 Bun，但只要能运行 TypeScript/ESM 即可。
- 默认路由目录为 `src/routes`。
