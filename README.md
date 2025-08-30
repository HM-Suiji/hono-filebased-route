# Hono File-Based Routing

一个基于 Hono 框架的文件路由系统，使用 Turborepo 管理的 monorepo 项目，支持类似 Next.js 的文件路由模式。

## 特性

- 🚀 **文件路由系统**: 基于文件结构自动生成路由
- ⚡ **Bun 运行时**: 快速的 JavaScript 运行时
- 🔥 **热重载**: 开发时自动重新加载
- 📁 **动态路由**: 支持动态参数和通配符路由
- 🎯 **类型安全**: 完整的 TypeScript 支持
- 🛠️ **自动生成**: 路由配置自动生成，无需手动维护
- 📦 **Monorepo**: 使用 Turborepo 管理多包项目
- ⚡ **构建缓存**: 智能缓存和并行构建优化

## 项目模块(三者选择之一即可)

| 模块              | 核心模块 (@hono-filebased-route/core)                                                                                                                              | 运行时模块 (@hono-filebased-route/runtime)                   | Vite插件模块 (@hono-filebased-route/vite-plugin)                                                             |
| :---------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------- | :----------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------- |
| **描述**          | 一个适用于 Node/Bun 环境的路由注册库，使用 `predev` 运行 `scripts/generate-routes.ts` 扫描路由目录 (默认为 `./src/routes`)，并自动根据文件路径生成对应的路由配置。 | 该模块提供了运行时的路由注册功能，用于在运行时动态注册路由。 | 该插件用于 Vite 项目，自动注册路由。                                                                         |
| **工作方式**      | 扫描指定目录（默认为 `./src/routes`）下的文件，根据其路径生成路由配置（如创建路由文件）。                                                                          | 在运行时动态注册路由，不依赖预先生成的文件。                 | 与 Vite 构建工具集成，自动注册路由，可选择生成路由文件或利用 Vite 的虚拟文件系统。                           |
| **优点**          | 核心库体积最小                                                                                                                                                     | 不会生成额外的路由文件<br />支持热更新 (需视构建工具而定)    | 可自由选择生成路由文件或者使用 Vite 的虚拟文件系统<br>支持热更新<br>开发友好，新建文件会自动生成默认模板代码 |
| **缺点**          | 不支持热更新：创建新路由文件后需要手动运行 `bun run generate-routes` 或 `bun dev` 来生成路由配置。                                                                 |                                                              | 需要依赖 Vite                                                                                                |
| **目标环境/用途** | Node/Bun 环境，用于在构建时生成路由配置。                                                                                                                          | 运行时动态注册路由。                                         | Vite 项目，用于自动化路由注册。                                                                              |
| **热更新支持**    | **不支持**                                                                                                                                                         | **支持 (需视构建工具而定)**                                  | **支持**                                                                                                     |
| **文件生成**      | **主要功能：生成路由文件/配置**                                                                                                                                    | **不生成**                                                   | **可选：生成路由文件或使用虚拟文件系统**                                                                     |
| **开发便捷性**    | 新增路由后需要额外步骤。                                                                                                                                           | 直接在运行时注册。                                           | **高度友好：** 新建文件自动生成默认模板。                                                                    |
| **集成需求**      | 需配合 `predev` 或手动执行路由生成脚本。                                                                                                                           |                                                              | **原生支持 Vite 项目**                                                                                       |

## 路由规则

### 基本路由实例

| 文件路径                           | 路由路径      | 说明         |
| ---------------------------------- | ------------- | ------------ |
| `src/routes/index.ts`              | `/`           | 根路由       |
| `src/routes/about.ts`              | `/about`      | 静态路由     |
| `src/routes/users/index.ts`        | `/users`      | 嵌套路由     |
| `src/routes/users/[id].ts`         | `/users/:id`  | 动态参数路由 |
| `src/routes/articles/[...slug].ts` | `/articles/*` | 通配符路由   |

## 快速开始

### 使用核心模块

1. 安装核心模块：

   ```bash
   bun add hono @hono-filebased-route/core
   ```

2. 添加 `scripts/generate-routes.ts`

   ```typescript
   import { generateRoutesFile } from '@hono-filebased-route/core'
   generateRoutesFile()
   ```

3. 配置package.json

   ```json
   {
     "scripts": {
       "predev": "bun generate-routes",
       "generate-routes": "bun run scripts/generate-routes.ts"
     }
   }
   ```

4. 配置 `src/index.ts`：

   ```typescript
   import { Hono } from 'hono'
   import { registerGeneratedRoutes } from './generated-routes'

   const app = new Hono()

   // 调用生成的函数来注册所有路由
   registerGeneratedRoutes(app)

   // 启动服务器
   const port = 3000
   console.log(`Server is running on http://localhost:${port}`)

   export default {
     port: port,
     fetch: app.fetch,
   }
   ```

5. 生成路由配置：

   ```bash
   bun run generate-routes
   # 或者
   bun dev
   ```

### 使用运行时模块

1. 安装运行时模块：

   ```bash
   bun add hono @hono-filebased-route/runtime
   ```

2. 配置 `src/index.ts`：

   ```typescript
   import { Hono } from 'hono'
   import { registerRoutes } from '@hono-filebased-route/runtime'
   
   const app = new Hono()
   
   // 调用生成的函数来注册所有路由
   registerRoutes(app)
   
   // 启动服务器
   const port = 3000
   console.log(`Server is running on http://localhost:${port}`)
   
   export default {
     port: port,
     fetch: app.fetch,
   }
   ```

### Vite 插件

1. 安装插件：

   ```bash
   bun add hono @hono-filebased-route/vite-plugin
   bun add -D @hono/vite-dev-server @hono/vite-build/node
   ```

2. 配置 `vite.config.ts`：

   ```typescript
   import devServer from '@hono/vite-dev-server'
   import { defineConfig } from 'vite'
   import build from '@hono/vite-build/node'
   import honoRouter from '@hono-filebased-route/vite-plugin'

   export default defineConfig({
     plugins: [
       honoRouter({
         virtualRoute: false,
         verbose: true,
       }),
       build(),
       devServer({
         entry: 'src/index.ts',
       }),
     ],
   })
   ```

3. 配置 `src/index.ts`：

   ```typescript
   import { Hono } from 'hono'
   import { registerGeneratedRoutes } from './generated-routes' // 不使用虚拟文件
   // import { registerGeneratedRoutes } from 'virtual:generated-routes' // 使用虚拟文件

   const app = new Hono()

   // 调用生成的函数来注册所有路由
   registerGeneratedRoutes(app)

   export default app
   ```

4. 创建 `index.d.ts` (若使用虚拟文件)
   ```typescript
   declare module 'virtual:generated-routes' {
     function registerGeneratedRoutes(app: Hono): void
   }
   ```

## 创建路由

在 `src/routes` 目录下创建 TypeScript 文件，导出 HTTP 方法处理函数：

```typescript
import { Context } from 'hono'

// GET 请求处理
export function GET(c: Context) {
  return c.json({ message: 'Hello from GET' })
}

// POST 请求处理
export function POST(c: Context) {
  return c.json({ message: 'Hello from POST' })
}
```

### 动态路由

使用方括号创建动态路由：

```typescript
import { Context } from 'hono'

export function GET(c: Context) {
  const id = c.req.param('id')
  return c.json({ userId: id })
}
```

### 通配符路由

使用 `[...slug]` 创建通配符路由：

该项目通过 `c.req.path` 填充 `slug` 参数，自动为 `GET/POST` 函数提供第二个参数。

```typescript
import { Context } from 'hono'

export function GET(c: Context, slug: string[]) {
  return c.json({ slug })
}
```

## 开发脚本

### 根目录脚本（Turborepo）

- `turbo run build`: 构建所有包（支持缓存和并行构建）
- `turbo run dev`: 启动所有开发服务
- `turbo run test`: 运行所有测试
- `turbo run lint`: 代码检查
- `turbo run type-check`: TypeScript 类型检查
- `turbo run clean`: 清理所有构建产物
- `turbo run test:basic`: 快速启动基础示例

### 包级别脚本

- `bun run build`: 构建当前包
- `bun run dev`: 开发模式（包含热重载）
- `bun run clean`: 清理构建产物
- `bun run generate-routes`: 生成路由配置（仅示例项目）

## 技术栈

- **[Hono](https://hono.dev/)**: 轻量级 Web 框架
- **[bun](https://bun.sh/)**: 快速的 JavaScript 运行时
- **[Turborepo](https://turbo.build/)**: 高性能 monorepo 构建系统
- **TypeScript**: 类型安全的 JavaScript
- **Workspace**: bun 工作区管理

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！

---

**注意**: `src/generated-routes.ts` 文件是自动生成的，请不要手动编辑。如需修改路由，请直接修改 `src/routes` 目录下的文件。
