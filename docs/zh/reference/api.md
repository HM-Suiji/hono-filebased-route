# API 参考

本文档提供 hono-filebased-route 中所有公共 API 的全面参考。

## 核心包 (@hono-filebased-route/core)

核心包为 Hono 应用程序中的基于文件的路由提供基本工具。

### 函数

#### `getFiles(dir: string): Promise<string[]>`

遍历指定目录并获取所有文件路径。

**参数：**
- `dir` (string): 要遍历的目录

**返回值：**
- `Promise<string[]>`: 目录内所有文件绝对路径的数组

**示例：**
```typescript
import { getFiles } from '@hono-filebased-route/core'

const files = await getFiles('./src/routes')
console.log(files)
// 输出: ['/absolute/path/to/src/routes/index.ts', '/absolute/path/to/src/routes/users/[id].ts']
```

**使用说明：**
- 仅包含 TypeScript (`.ts`) 和 JavaScript (`.js`) 文件
- 返回绝对路径
- 使用 fast-glob 进行高效的文件系统遍历

---

#### `getRoutePath(filePath: string, baseDir: string): string`

将文件路径转换为遵循基于文件路由约定的 Hono 路由路径。

**参数：**
- `filePath` (string): 文件的绝对路径
- `baseDir` (string): 路由目录根的绝对路径

**返回值：**
- `string`: 转换后的 Hono 路由路径

**示例：**
```typescript
import { getRoutePath } from '@hono-filebased-route/core'

// 基础路由
const route1 = getRoutePath('/project/src/routes/about.ts', '/project/src/routes')
console.log(route1) // '/about'

// 动态参数
const route2 = getRoutePath('/project/src/routes/users/[id].ts', '/project/src/routes')
console.log(route2) // '/users/:id'

// 捕获所有路由
const route3 = getRoutePath('/project/src/routes/api/[...path].ts', '/project/src/routes')
console.log(route3) // '/api/*'

// 索引路由
const route4 = getRoutePath('/project/src/routes/index.ts', '/project/src/routes')
console.log(route4) // '/'

const route5 = getRoutePath('/project/src/routes/blog/index.ts', '/project/src/routes')
console.log(route5) // '/blog'
```

**路由转换规则：**
- `[param]` → `:param` (动态参数)
- `[...param]` → `*` (捕获所有路由)
- `index.ts` → `/` (根路由)
- `folder/index.ts` → `/folder` (文件夹索引)
- 文件扩展名被移除

---

#### `generateRoutesFile(): Promise<void>`

生成一个 TypeScript 文件，该文件将所有基于文件的路由注册到 Hono 应用程序中。

**参数：**
- 无（使用预定义常量进行配置）

**返回值：**
- `Promise<void>`: 在路由文件生成完成时解析

**示例：**
```typescript
import { generateRoutesFile } from '@hono-filebased-route/core'

// 生成路由文件
await generateRoutesFile()

// 这会创建 src/generated-routes.ts，内容如下：
// export function registerGeneratedRoutes(mainApp: Hono) {
//   // 路由注册代码
// }
```

**配置：**
- **路由目录**: `./src/routes` (硬编码)
- **输出文件**: `./src/generated-routes.ts` (硬编码)
- **支持的方法**: `GET`, `POST` (硬编码)

**生成的文件结构：**
```typescript
// 此文件由脚本自动生成，请勿编辑。

import { Hono } from 'hono';
import * as routeModule0 from './routes/index';
import * as routeModule1 from './routes/users/[id]';

export function registerGeneratedRoutes(mainApp: Hono) {
  const honoApprouteModule0 = new Hono();
  honoApprouteModule0.get('/', routeModule0.GET);
  mainApp.route('/', honoApprouteModule0);
  
  const honoApprouteModule1 = new Hono();
  honoApprouteModule1.get('/', routeModule1.GET);
  mainApp.route('/users/:id', honoApprouteModule1);
}
```

---

### `registerGeneratedRoutes(mainApp: Hono): void`

*注意：此函数由 `generateRoutesFile()` 生成并从生成的路由文件中导出。*

将所有生成的基于文件的路由注册到主 Hono 应用程序中。

**参数：**
- `mainApp` (Hono): 主 Hono 应用程序实例

**返回值：**
- `void`

**示例：**
```typescript
import { Hono } from 'hono'
import { registerGeneratedRoutes } from './generated-routes'

const app = new Hono()

// 注册所有基于文件的路由
registerGeneratedRoutes(app)

// 添加全局中间件或错误处理器
app.notFound((c) => c.text('404 Not Found', 404))
app.onError((err, c) => c.text('Internal Server Error', 500))

export default app
```

## 路由文件约定

### 文件结构

路由文件应放置在 `src/routes` 目录中，并遵循以下命名约定：

```
src/routes/
├── index.ts          # GET /
├── about.ts          # GET /about
├── users/
│   ├── index.ts      # GET /users
│   ├── [id].ts       # GET /users/:id
│   └── [id]/
│       └── edit.ts   # GET /users/:id/edit
├── api/
│   ├── posts.ts      # GET /api/posts
│   └── [...path].ts  # GET /api/* (捕获所有)
└── admin/
    └── dashboard.ts  # GET /admin/dashboard
```

### 路由文件格式

每个路由文件应导出 HTTP 方法处理器：

```typescript
// routes/users/[id].ts
import type { Context } from 'hono'

// GET 处理器
export const GET = async (c: Context) => {
  const id = c.req.param('id')
  return c.json({ user: { id, name: `User ${id}` } })
}

// POST 处理器
export const POST = async (c: Context) => {
  const id = c.req.param('id')
  const body = await c.req.json()
  return c.json({ message: 'User updated', id, data: body })
}
```

### 支持的 HTTP 方法

当前支持的 HTTP 方法：
- `GET`
- `POST`

*注意：未来版本可能会添加对其他方法（PUT、DELETE、PATCH 等）的支持。*

### 动态路由

#### 单个参数
```typescript
// routes/users/[id].ts
export const GET = async (c: Context) => {
  const id = c.req.param('id') // 访问动态参数
  return c.json({ userId: id })
}
```

#### 捕获所有路由
```typescript
// routes/api/[...path].ts
export const GET = async (c: Context, pathSegments: string[]) => {
  // pathSegments 包含剩余的路径部分
  return c.json({ path: pathSegments })
}
```

## 类型定义

### 路由处理器类型

```typescript
import type { Context } from 'hono'

// 标准路由处理器
type RouteHandler = (c: Context) => Response | Promise<Response>

// 捕获所有路由处理器
type CatchAllHandler = (c: Context, pathSegments: string[]) => Response | Promise<Response>
```

### 配置类型

```typescript
interface RouteConfig {
  /** 包含路由文件的目录 */
  routesDir: string
  /** 生成路由的输出文件 */
  outputFile: string
  /** 支持的 HTTP 方法 */
  methods: string[]
}
```

## 错误处理

### 常见错误

#### 文件系统错误
```typescript
try {
  await generateRoutesFile()
} catch (error) {
  if (error.code === 'ENOENT') {
    console.error('未找到路由目录')
  } else if (error.code === 'EACCES') {
    console.error('访问路由目录权限被拒绝')
  }
}
```

#### 路由注册错误
```typescript
// 无效的路由文件（缺少导出）
// routes/invalid.ts - 这将被跳过
export default function() {
  return '这不会被注册'
}

// 有效的路由文件
// routes/valid.ts
export const GET = (c) => c.text('这将被注册')
```

## 最佳实践

### 1. 文件组织

```typescript
// ✅ 良好 - 清晰的结构
routes/
├── api/
│   ├── auth/
│   │   ├── login.ts
│   │   └── logout.ts
│   └── users/
│       ├── index.ts
│       └── [id].ts
└── pages/
    ├── index.ts
    └── about.ts

// ❌ 避免 - 复杂应用的扁平结构
routes/
├── api-auth-login.ts
├── api-auth-logout.ts
├── api-users-index.ts
├── api-users-id.ts
├── pages-index.ts
└── pages-about.ts
```

### 2. 路由处理器实现

```typescript
// ✅ 良好 - 类型安全且一致
import type { Context } from 'hono'

export const GET = async (c: Context) => {
  try {
    const data = await fetchData()
    return c.json(data)
  } catch (error) {
    return c.json({ error: 'Internal server error' }, 500)
  }
}

// ❌ 避免 - 没有错误处理
export const GET = async (c: Context) => {
  const data = await fetchData() // 可能抛出异常
  return c.json(data)
}
```

### 3. 构建过程集成

```json
// package.json
{
  "scripts": {
    "generate-routes": "bun run scripts/generate-routes.ts",
    "predev": "bun run generate-routes",
    "dev": "bun --hot --watch src/main.ts",
    "prestart": "bun run generate-routes",
    "start": "bun src/main.ts",
    "prebuild": "bun run generate-routes",
    "build": "tsc"
  }
}
```

## 迁移指南

### 从手动路由注册迁移

**之前：**
```typescript
// manual-routes.ts
import { Hono } from 'hono'
import { getUserById, createUser } from './handlers/users'
import { getPosts } from './handlers/posts'

const app = new Hono()

app.get('/users/:id', getUserById)
app.post('/users', createUser)
app.get('/posts', getPosts)

export default app
```

**之后：**
```typescript
// src/routes/users/[id].ts
export const GET = async (c) => {
  // getUserById 逻辑在这里
}

// src/routes/users/index.ts
export const POST = async (c) => {
  // createUser 逻辑在这里
}

// src/routes/posts/index.ts
export const GET = async (c) => {
  // getPosts 逻辑在这里
}

// src/main.ts
import { Hono } from 'hono'
import { registerGeneratedRoutes } from './generated-routes'

const app = new Hono()
registerGeneratedRoutes(app)

export default app
```

## 限制

### 当前限制

1. **HTTP 方法**：目前仅支持 `GET` 和 `POST`
2. **配置**：路由目录和输出文件路径是硬编码的
3. **中间件**：没有内置的路由特定中间件支持（使用数组语法）
4. **嵌套捕获所有**：复杂的嵌套捕获所有模式可能无法按预期工作

### 计划功能

- 支持所有 HTTP 方法（PUT、DELETE、PATCH 等）
- 可配置的路由目录和输出路径
- 内置中间件支持
- 路由级配置选项
- 路由参数的 TypeScript 类型生成

## 故障排除

### 常见问题

#### 路由未生成
```bash
# 检查路由目录是否存在
ls -la src/routes

# 验证文件扩展名
find src/routes -name "*.ts" -o -name "*.js"

# 检查路由文件中的语法错误
npx tsc --noEmit
```

#### 路由处理器不工作
```typescript
// ✅ 正确的导出
export const GET = (c) => c.text('Hello')

// ❌ 错误 - 将被忽略
export default (c) => c.text('Hello')
export function GET(c) { return c.text('Hello') }
const GET = (c) => c.text('Hello')
```

#### 构建错误
```bash
# 重新生成路由文件
npm run generate-routes

# 清除 TypeScript 缓存
rm -rf node_modules/.cache
npx tsc --build --clean
```

## 下一步

- [配置参考](./configuration.md) - 详细的配置选项
- [类型定义](./types.md) - 完整的类型定义
- [示例](../examples/basic.md) - 实际使用示例
- [最佳实践](../guide/best-practices.md) - 推荐的模式和实践