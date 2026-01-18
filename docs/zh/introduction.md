# 介绍

hono-filebased-route 是一组把路由文件夹转换为 Hono 路由的工具。
它不负责启动服务器，也没有 CLI。你仍然保持对 Hono 应用的完全控制，
并可选择下面三种接入方式。

## 包

### @hono-filebased-route/core

- 扫描 routes 并生成 `generated-routes.ts`
- 输出 `registerGeneratedRoutes(app)`
- 支持在 route 文件中导出 `config` 对象来绑定方法级中间件

### @hono-filebased-route/runtime

- 运行时动态 import
- 仅支持 `GET` 和 `POST`
- 不读取 `config` 中间件

### @hono-filebased-route/vite-plugin

- 在 dev server 启动和变更时生成路由
- 可生成真实文件或 `virtual:generated-routes`
- 新增空文件时写入模板

## 路由规则

- `index.ts` -> `/`
- `users/index.ts` -> `/users`
- `[id].ts` -> `/:id`
- `[...slug].ts` -> `/*`

只识别 `export function GET()` 或 `export const POST = ...` 这类命名导出。

## 不是这些

- 不是 Web 服务器或框架
- 没有脚手架或 CLI
- 不做 OpenAPI 或类型生成（示例里可能使用第三方工具）

想快速上手请查看快速开始，并选择适合的模块。
