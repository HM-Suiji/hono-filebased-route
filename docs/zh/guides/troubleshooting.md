# 故障排除

## 路由文件未注册

- core 会跳过未导出 `GET` 或 `POST` 的文件。
- 确保使用命名导出（`export function GET()` 或 `export const GET = ...`）。
- 检查 `generateRoutesFile` 或 `registerRoutes` 的目录参数。

## 通配符没有收到分段

通配符路由会将段列表作为第二个参数传入：

```ts
export function GET(c, slug: string[]) {
  return c.json({ slug })
}
```

## 构建时缺少虚拟路由

Vite 插件只在 dev server 中生成路由。
生产构建请使用 `virtualRoute: false` 并确保 `generated-routes.ts` 存在。

## TypeScript 找不到虚拟模块

使用 `virtual:generated-routes` 时加上类型声明：

```ts
declare module 'virtual:generated-routes' {
  export function registerGeneratedRoutes(app: import('hono').Hono): void
}
```

## 生成文件被手动编辑

`src/generated-routes.ts` 是自动生成的，请修改 `src/routes` 下的文件。
