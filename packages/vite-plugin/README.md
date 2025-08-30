# Hono File-Based Routing Vite Plugin

一个基于 Hono 框架的文件路由插件，用于 Vite 项目，支持类似 Next.js 的文件路由模式。

## 插件特性

- 🚀 **文件路由系统**: 基于文件结构自动生成路由
- 🔥 **热重载**: 开发时自动重新加载
- 📁 **动态路由**: 支持动态参数和通配符路由
- 🎯 **类型安全**: 完整的 TypeScript 支持
- 🛠️ **自动生成**: 路由配置自动生成，无需手动维护

## 路由规则

### 基本路由实例

| 文件路径                           | 路由路径      | 说明         |
| ---------------------------------- | ------------- | ------------ |
| `src/routes/index.ts`              | `/`           | 根路由       |
| `src/routes/about.ts`              | `/about`      | 静态路由     |
| `src/routes/users/index.ts`        | `/users`      | 嵌套路由     |
| `src/routes/users/[id].ts`         | `/users/:id`  | 动态参数路由 |
| `src/routes/articles/[...slug].ts` | `/articles/*` | 通配符路由   |

## 安装

安装项目依赖:

```bash
npm install
# or
yarn add
# or
pnpm add
# or
bun add
```

## 使用方法

### Turborepo 命令

本项目使用 Turborepo 进行 monorepo 管理，支持以下命令：

```bash
# 构建所有包
bun run build

# 启动所有开发服务
bun run dev

# 运行所有测试
bun run test

# 类型检查
bun run type-check

# 清理构建产物
bun run clean
```

### 开发模式

```bash
# 使用 Turborepo 启动开发服务器
bun run dev

# 或者直接启动示例项目
cd examples/bun
bun run dev
```

这将启动开发服务器，支持热重载，访问 <http://localhost:3000>

### 生产模式

```bash
# 先构建所有包
bun run build

# 启动示例应用
cd examples/bun
bun run start
```

### 手动生成路由

```bash
bun run generate-routes
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

## 工作原理

1. **路由扫描**: 插件扫描 `src/routes` 目录
2. **路径转换**: 将文件路径转换为 Hono 路由路径
3. **代码生成**: 生成 `src/generated-routes.ts` 或 `virtual:generated-routes` 文件
4. **自动注册**: 主应用自动注册所有生成的路由

## 开发脚本

### 包级别脚本

- `bun run build`: 构建当前包
- `bun run dev`: 开发模式（包含热重载）
- `bun run clean`: 清理构建产物
- `bun run generate-routes`: 生成路由配置（仅示例项目）

## 技术栈

- **[Hono](https://hono.dev/)**: 轻量级 Web 框架
- **[Vite](https://vitejs.dev/)**: 卓越的 Web 开发构建工具
- **TypeScript**: 类型安全的 JavaScript

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！

---

**注意**: `src/generated-routes.ts` 文件是自动生成的，请不要手动编辑。如需修改路由，请直接修改 `src/routes` 目录下的文件。
