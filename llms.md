# LLMs Guide

本文件为在此仓库中工作的 LLM 提供快速上下文与操作规范。

## 项目概览

- 项目名称: Hono File-Based Routing
- 简介: 基于 Hono 的文件路由系统，monorepo 使用 Turborepo 管理
- 关键能力: 自动生成路由、TypeScript 支持、Bun 运行时

## 目录结构

- packages/: 发布的模块 (core, runtime, vite-plugin)
- examples/: 可运行示例 (Bun/runtime/Vite)
- docs/: VitePress 文档站点
- scripts/: 仓库脚本
- src/routes/: 路由源文件 (示例中)
- src/generated-routes.ts: 自动生成文件，勿手改

## 路由约定

- index.ts -> /
- [id].ts -> /:id
- [...slug].ts -> /*

## 常用命令

- bun run build: 构建所有 packages (Turborepo)
- bun run dev: 运行所有 dev 任务 (常驻)
- bun run lint: ESLint + Prettier
- bun run type-check: TypeScript 类型检查
- bun run test: 测试入口 (当前无专门测试)
- bun run docs:dev: 本地运行文档站
- bun run test:bun: 启动 Bun 示例

## 编辑规范

- 2 空格缩进
- 单引号
- 不使用分号
- 行宽 120
- 变更路由时编辑 src/routes/，必要时运行 generate-routes

## 生成与示例

- Bun 示例中运行: bun run generate-routes
- 生成文件通常为 examples/*/src/generated-routes.ts

## 贡献说明

- 用户可见变更需要添加 .changeset/ 记录
- 避免改动自动生成文件
