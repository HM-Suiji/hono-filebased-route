# 部署

## Core

在构建或部署前生成路由：

```bash
bun run generate-routes
```

然后按正常流程构建和部署。

## Runtime

不需要预生成，启动时注册路由。

## Vite 插件

- 生产构建请使用 `virtualRoute: false`，并提前生成 `generated-routes.ts`。
- 插件只在 dev server 模式下自动生成。
