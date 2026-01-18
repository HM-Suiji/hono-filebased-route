# 性能

本项目将成本放在启动或构建阶段，尽量降低运行时开销。

## Core

- 扫描一次文件系统，生成静态 `generated-routes.ts`。
- 生成文件使用静态 import。

## Runtime

- 启动时动态 import 每个路由文件。
- 只注册 `GET` 和 `POST`。

## Vite 插件

- dev server 模式下监听变更并重新生成。
- 构建流程建议使用生成文件（关闭 `virtualRoute`）。
