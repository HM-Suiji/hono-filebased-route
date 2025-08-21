# Hono File-Based Routing

一个基于 Hono 框架的文件路由系统，使用 Turborepo 管理的 monorepo 项目，支持类似 Next.js 的文件路由模式。

## 特性

- 🚀 **文件路由系统**: 基于文件结构自动生成路由
- 🔥 **热重载**: 开发时自动重新加载
- 📁 **动态路由**: 支持动态参数和通配符路由
- 🎯 **类型安全**: 完整的 TypeScript 支持
- 🛠️ **自动生成**: 路由配置自动生成，无需手动维护
- 📦 **Monorepo**: 使用 Turborepo 管理多包项目
- ⚡ **构建缓存**: 智能缓存和并行构建优化

## 路由规则

### 基本路由实例

| 文件路径 | 路由路径 | 说明 |
|---------|---------|------|
| `src/routes/index.ts` | `/` | 根路由 |
| `src/routes/about.ts` | `/about` | 静态路由 |
| `src/routes/users/index.ts` | `/users` | 嵌套路由 |
| `src/routes/users/[id].ts` | `/users/:id` | 动态参数路由 |
| `src/routes/articles/[...slug].ts` | `/articles/*` | 通配符路由 |

## 安装

安装项目依赖:

```bash
npm install
# or
yarn install
# or
pnpm install
# or
bun install
```

## 使用方法

### Turborepo 命令

本项目使用 Turborepo 进行 monorepo 管理，支持以下命令：

```bash
# 构建所有包
pnpm run build

# 启动所有开发服务
pnpm run dev

# 运行所有测试
pnpm run test

# 类型检查
pnpm run type-check

# 清理构建产物
pnpm run clean
```

### 开发模式

```bash
# 使用 Turborepo 启动开发服务器
pnpm run dev

# 或者直接启动示例项目
cd examples/basic-example
pnpm run dev
```

这将启动开发服务器，支持热重载，访问 <http://localhost:3000>

### 生产模式

```bash
# 先构建所有包
pnpm run build

# 启动示例应用
cd examples/basic-example
pnpm run start
```

### 构建项目

```bash
# 构建所有包（使用 Turborepo 缓存和并行构建）
pnpm run build

# 或者构建单个包
cd packages/core
pnpm run build
```

### 手动生成路由

```bash
cd examples/basic-example
pnpm run generate-routes
```

## 项目结构

```txt
hono-filebased-route/
├── packages/                        # 核心包目录
│   ├── core/                        # 核心路由功能包
│   │   ├── src/                     # 源代码目录
│   │   ├── dist/                    # 构建输出目录
│   │   ├── scripts/
│   │   │   └── generate-routes.ts   # 路由生成脚本
│   │   ├── utils/
│   │   │   └── load-routes-utils.ts # 路由工具脚本
│   │   ├── package.json             # @hono-filebased-route/core
│   │   └── tsconfig.json
│   └── vite-plugin/                 # Vite 插件包
│       ├── src/                     # 源代码目录
│       ├── dist/                    # 构建输出目录
│       ├── package.json             # @hono-filebased-route/vite-plugin
│       └── tsconfig.json
├── examples/                        # 示例项目目录
│   └── basic-example/               # 基础使用示例
│       ├── src/
│       │   ├── routes/              # 路由文件目录
│       │   │   ├── index.ts         # 根路由 (/)
│       │   │   ├── about.ts         # 关于页面 (/about)
│       │   │   ├── users/
│       │   │   │   ├── index.ts     # 用户列表 (/users)
│       │   │   │   └── [id].ts      # 用户详情 (/users/:id)
│       │   │   └── articles/
│       │   │       └── [...slug].ts # 文章页面 (/articles/*)
│       │   ├── main.ts              # 应用入口
│       │   └── generated-routes.ts  # 自动生成的路由配置
│       ├── scripts/
│       │   └── generate-routes.ts   # 路由生成脚本
│       ├── package.json             # @hono-filebased-route/basic-example
│       └── tsconfig.json
├── .trae/                           # 项目文档目录
│   └── documents/                   # 设计和规划文档
├── turborepo.json                   # Turborepo 配置文件
├── package.json                     # 根工作区配置
├── tsconfig.json                    # TypeScript 基础配置
└── pnpm.lockb                        # pnpm 锁定文件
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

### 根目录脚本（Turborepo）

- `pnpm run build`: 构建所有包（支持缓存和并行构建）
- `pnpm run dev`: 启动所有开发服务
- `pnpm run test`: 运行所有测试
- `pnpm run lint`: 代码检查
- `pnpm run type-check`: TypeScript 类型检查
- `pnpm run clean`: 清理所有构建产物
- `pnpm run test:basic`: 快速启动基础示例

### 包级别脚本

- `pnpm run build`: 构建当前包
- `pnpm run dev`: 开发模式（包含热重载）
- `pnpm run clean`: 清理构建产物
- `pnpm run generate-routes`: 生成路由配置（仅示例项目）

## 技术栈

- **[Hono](https://hono.dev/)**: 轻量级 Web 框架
- **[pnpm](https://pnpm.sh/)**: 快速的 JavaScript 运行时
- **[Turborepo](https://turbo.build/)**: 高性能 monorepo 构建系统
- **TypeScript**: 类型安全的 JavaScript
- **Workspace**: pnpm 工作区管理

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！

---

**注意**: `src/generated-routes.ts` 文件是自动生成的，请不要手动编辑。如需修改路由，请直接修改 `src/routes` 目录下的文件。
