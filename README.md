# Hono File-Based Routing

一个基于 Hono 框架的文件路由系统，使用 Bun 运行时，支持类似 Next.js 的文件路由模式。

## 特性

- 🚀 **文件路由系统**: 基于文件结构自动生成路由
- ⚡ **Bun 运行时**: 快速的 JavaScript 运行时
- 🔥 **热重载**: 开发时自动重新加载
- 📁 **动态路由**: 支持动态参数和通配符路由
- 🎯 **类型安全**: 完整的 TypeScript 支持
- 🛠️ **自动生成**: 路由配置自动生成，无需手动维护

## 路由规则

| 文件路径 | 路由路径 | 说明 |
|---------|---------|------|
| `src/routes/index.ts` | `/` | 根路由 |
| `src/routes/about.ts` | `/about` | 静态路由 |
| `src/routes/users/index.ts` | `/users` | 嵌套路由 |
| `src/routes/users/[id].ts` | `/users/:id` | 动态参数路由 |
| `src/routes/articles/[...slug].ts` | `/articles/*` | 通配符路由 |

## 安装

确保已安装 Bun:

```bash
curl -fsSL https://bun.sh/install | bash
```

安装项目依赖:

```bash
bun install
```

## 使用方法

### 开发模式

```bash
bun run dev
```

这将启动开发服务器，支持热重载，访问 <http://localhost:3000>

### 生产模式

```bash
bun run start
```

### 构建项目

```bash
bun run build
```

### 手动生成路由

```bash
bun run generate-routes
```

## 项目结构

```txt
hono-filebased-route/
├── src/
│   ├── routes/              # 路由文件目录
│   │   ├── index.ts         # 根路由 (/)
│   │   ├── about.ts         # 关于页面 (/about)
│   │   ├── users/
│   │   │   ├── index.ts     # 用户列表 (/users)
│   │   │   └── [id].ts      # 用户详情 (/users/:id)
│   │   └── articles/
│   │       └── [...slug].ts # 文章页面 (/articles/*)
│   ├── main.ts              # 应用入口
│   ├── generated-routes.ts  # 自动生成的路由配置
│   └── load-routes-utils.ts # 路由工具函数
├── scripts/
│   └── generate-routes.ts   # 路由生成脚本
├── package.json
└── tsconfig.json
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

1. **路由扫描**: `scripts/generate-routes.ts` 扫描 `src/routes` 目录
2. **路径转换**: 将文件路径转换为 Hono 路由路径
3. **代码生成**: 生成 `src/generated-routes.ts` 文件
4. **自动注册**: 主应用自动注册所有生成的路由

## 开发脚本

- `bun run dev`: 开发模式（包含热重载）
- `bun run start`: 生产模式启动
- `bun run build`: 构建项目
- `bun run generate-routes`: 生成路由配置

## 技术栈

- **[Hono](https://hono.dev/)**: 轻量级 Web 框架
- **[Bun](https://bun.sh/)**: 快速的 JavaScript 运行时
- **TypeScript**: 类型安全的 JavaScript

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！

---

**注意**: `src/generated-routes.ts` 文件是自动生成的，请不要手动编辑。如需修改路由，请直接修改 `src/routes` 目录下的文件。
