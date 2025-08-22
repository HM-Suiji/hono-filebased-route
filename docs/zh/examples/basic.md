# 基础示例

本文档提供在各种场景中使用 hono-filebased-route 的实际示例。

## 快速开始示例

### 项目设置

```bash
# 创建新项目
mkdir my-hono-app
cd my-hono-app

# 初始化 package.json
npm init -y

# 安装依赖
npm install hono @hono-filebased-route/core
npm install -D typescript @types/node tsx

# 创建目录结构
mkdir -p src/routes scripts
touch src/main.ts scripts/generate-routes.ts
```

### 基础配置

**package.json**
```json
{
  "name": "my-hono-app",
  "scripts": {
    "generate-routes": "tsx scripts/generate-routes.ts",
    "predev": "npm run generate-routes",
    "dev": "tsx watch src/main.ts",
    "prebuild": "npm run generate-routes",
    "build": "tsc",
    "start": "node dist/main.js"
  },
  "dependencies": {
    "hono": "^4.0.0",
    "@hono-filebased-route/core": "^1.0.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "@types/node": "^20.0.0",
    "tsx": "^4.0.0"
  }
}
```

**tsconfig.json**
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "noEmit": true,
    "strict": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*", "scripts/**/*"]
}
```

### 路由生成脚本

**scripts/generate-routes.ts**
```typescript
import { generateRoutesFile } from '@hono-filebased-route/core'

async function main() {
  try {
    console.log('🔄 正在生成路由...')
    await generateRoutesFile()
    console.log('✅ 路由生成成功！')
  } catch (error) {
    console.error('❌ 路由生成失败:', error)
    process.exit(1)
  }
}

main()
```

### 主应用程序

**src/main.ts**
```typescript
import { Hono } from 'hono'
import { registerGeneratedRoutes } from './generated-routes'

const app = new Hono()

// 注册所有基于文件的路由
registerGeneratedRoutes(app)

// 全局错误处理
app.notFound((c) => {
  return c.json({ error: '未找到' }, 404)
})

app.onError((err, c) => {
  console.error('错误:', err)
  return c.json({ error: '内部服务器错误' }, 500)
})

// 启动服务器
const port = process.env.PORT || 3000
console.log(`🚀 服务器运行在 http://localhost:${port}`)

export default {
  port,
  fetch: app.fetch,
}
```

## 路由示例

### 1. 静态路由

**src/routes/index.ts**
```typescript
import type { Context } from 'hono'

export const GET = async (c: Context) => {
  return c.json({
    message: '欢迎使用 Hono 基于文件的路由！',
    timestamp: new Date().toISOString(),
    routes: [
      'GET /',
      'GET /about',
      'GET /users',
      'GET /users/:id'
    ]
  })
}
```

**src/routes/about.ts**
```typescript
import type { Context } from 'hono'

export const GET = async (c: Context) => {
  return c.json({
    title: '关于我们',
    description: '这是一个使用 Hono 基于文件路由的演示应用程序。',
    version: '1.0.0',
    features: [
      '基于文件的路由',
      'TypeScript 支持',
      '热重载',
      '自动路由生成'
    ]
  })
}
```

### 2. 动态路由

**src/routes/users/[id].ts**
```typescript
import type { Context } from 'hono'

// 模拟用户数据库
const users = [
  { id: '1', name: 'Alice', email: 'alice@example.com' },
  { id: '2', name: 'Bob', email: 'bob@example.com' },
  { id: '3', name: 'Charlie', email: 'charlie@example.com' }
]

export const GET = async (c: Context) => {
  const id = c.req.param('id')
  
  const user = users.find(u => u.id === id)
  
  if (!user) {
    return c.json({ error: '用户未找到' }, 404)
  }
  
  return c.json({
    user,
    requestedId: id
  })
}

export const POST = async (c: Context) => {
  const id = c.req.param('id')
  
  try {
    const body = await c.req.json()
    
    // 验证必需字段
    if (!body.name || !body.email) {
      return c.json({ 
        error: '缺少必需字段: name, email' 
      }, 400)
    }
    
    // 更新用户（模拟）
    const userIndex = users.findIndex(u => u.id === id)
    if (userIndex === -1) {
      return c.json({ error: '用户未找到' }, 404)
    }
    
    users[userIndex] = { ...users[userIndex], ...body }
    
    return c.json({
      message: '用户更新成功',
      user: users[userIndex]
    })
  } catch (error) {
    return c.json({ error: '无效的 JSON 主体' }, 400)
  }
}
```

### 3. 嵌套路由

**src/routes/users/index.ts**
```typescript
import type { Context } from 'hono'

// 模拟用户数据库（与上面相同）
const users = [
  { id: '1', name: 'Alice', email: 'alice@example.com' },
  { id: '2', name: 'Bob', email: 'bob@example.com' },
  { id: '3', name: 'Charlie', email: 'charlie@example.com' }
]

export const GET = async (c: Context) => {
  // 获取查询参数
  const limit = parseInt(c.req.query('limit') || '10')
  const offset = parseInt(c.req.query('offset') || '0')
  
  const paginatedUsers = users.slice(offset, offset + limit)
  
  return c.json({
    users: paginatedUsers,
    pagination: {
      total: users.length,
      limit,
      offset,
      hasMore: offset + limit < users.length
    }
  })
}

export const POST = async (c: Context) => {
  try {
    const body = await c.req.json()
    
    // 验证必需字段
    if (!body.name || !body.email) {
      return c.json({ 
        error: '缺少必需字段: name, email' 
      }, 400)
    }
    
    // 创建新用户（模拟）
    const newUser = {
      id: String(users.length + 1),
      name: body.name,
      email: body.email
    }
    
    users.push(newUser)
    
    return c.json({
      message: '用户创建成功',
      user: newUser
    }, 201)
  } catch (error) {
    return c.json({ error: '无效的 JSON 主体' }, 400)
  }
}
```

### 4. 捕获所有路由

**src/routes/api/[...path].ts**
```typescript
import type { Context } from 'hono'

export const GET = async (c: Context, pathSegments: string[]) => {
  return c.json({
    message: 'API 捕获所有路由',
    path: pathSegments,
    fullPath: '/' + pathSegments.join('/'),
    method: 'GET',
    availableEndpoints: [
      '/api/health',
      '/api/version',
      '/api/status'
    ]
  })
}

export const POST = async (c: Context, pathSegments: string[]) => {
  try {
    const body = await c.req.json()
    
    return c.json({
      message: 'API 捕获所有 POST',
      path: pathSegments,
      receivedData: body,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return c.json({ error: '无效的 JSON 主体' }, 400)
  }
}
```

### 5. 不同响应类型的 API 路由

**src/routes/api/health.ts**
```typescript
import type { Context } from 'hono'

export const GET = async (c: Context) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.version
  }
  
  return c.json(health)
}
```

**src/routes/api/version.ts**
```typescript
import type { Context } from 'hono'

export const GET = async (c: Context) => {
  // 返回纯文本
  return c.text('v1.0.0')
}
```

**src/routes/download/[filename].ts**
```typescript
import type { Context } from 'hono'

export const GET = async (c: Context) => {
  const filename = c.req.param('filename')
  
  // 模拟文件内容
  const content = `这是一个模拟文件: ${filename}`
  
  // 设置文件下载的头部
  c.header('Content-Type', 'application/octet-stream')
  c.header('Content-Disposition', `attachment; filename="${filename}"`)
  
  return c.body(content)
}
```

## 测试您的路由

### 使用 curl 手动测试

```bash
# 启动开发服务器
npm run dev

# 测试路由
curl http://localhost:3000/
curl http://localhost:3000/about
curl http://localhost:3000/users
curl http://localhost:3000/users/1
curl http://localhost:3000/api/health

# 测试 POST 请求
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{"name":"David","email":"david@example.com"}'

curl -X POST http://localhost:3000/users/1 \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice Updated"}'

# 测试捕获所有路由
curl http://localhost:3000/api/some/nested/path
```

### 简单测试脚本

**test-routes.js**
```javascript
const BASE_URL = 'http://localhost:3000'

async function testRoute(path, method = 'GET', body = null) {
  try {
    const options = { method }
    if (body) {
      options.headers = { 'Content-Type': 'application/json' }
      options.body = JSON.stringify(body)
    }
    
    const response = await fetch(`${BASE_URL}${path}`, options)
    const data = await response.json()
    
    console.log(`${method} ${path}: ${response.status}`)
    console.log(JSON.stringify(data, null, 2))
    console.log('---')
  } catch (error) {
    console.error(`测试 ${method} ${path} 时出错:`, error.message)
  }
}

async function runTests() {
  console.log('🧪 测试路由...\n')
  
  await testRoute('/')
  await testRoute('/about')
  await testRoute('/users')
  await testRoute('/users/1')
  await testRoute('/api/health')
  await testRoute('/users', 'POST', { name: '测试用户', email: 'test@example.com' })
  await testRoute('/api/some/path')
  
  console.log('✅ 测试完成！')
}

runTests()
```

## 常见模式

### 1. 错误处理

```typescript
// src/routes/api/users/[id].ts
import type { Context } from 'hono'

interface User {
  id: string
  name: string
  email: string
}

const users: User[] = []

export const GET = async (c: Context) => {
  try {
    const id = c.req.param('id')
    
    if (!id) {
      return c.json({ error: '用户 ID 是必需的' }, 400)
    }
    
    const user = users.find(u => u.id === id)
    
    if (!user) {
      return c.json({ error: '用户未找到' }, 404)
    }
    
    return c.json({ user })
  } catch (error) {
    console.error('GET /api/users/:id 中的错误:', error)
    return c.json({ error: '内部服务器错误' }, 500)
  }
}
```

### 2. 输入验证

```typescript
// src/routes/api/users/index.ts
import type { Context } from 'hono'

interface CreateUserRequest {
  name: string
  email: string
  age?: number
}

function validateCreateUser(data: any): data is CreateUserRequest {
  return (
    typeof data === 'object' &&
    typeof data.name === 'string' &&
    data.name.length > 0 &&
    typeof data.email === 'string' &&
    data.email.includes('@') &&
    (data.age === undefined || typeof data.age === 'number')
  )
}

export const POST = async (c: Context) => {
  try {
    const body = await c.req.json()
    
    if (!validateCreateUser(body)) {
      return c.json({
        error: '无效输入',
        required: ['name (string)', 'email (string)'],
        optional: ['age (number)']
      }, 400)
    }
    
    // 处理有效数据
    const newUser = {
      id: crypto.randomUUID(),
      ...body
    }
    
    return c.json({ user: newUser }, 201)
  } catch (error) {
    return c.json({ error: '无效的 JSON 主体' }, 400)
  }
}
```

### 3. 响应头

```typescript
// src/routes/api/data.ts
import type { Context } from 'hono'

export const GET = async (c: Context) => {
  const data = { message: 'Hello World' }
  
  // 设置自定义头部
  c.header('X-API-Version', '1.0')
  c.header('Cache-Control', 'public, max-age=3600')
  c.header('X-Response-Time', Date.now().toString())
  
  return c.json(data)
}

export const POST = async (c: Context) => {
  const body = await c.req.json()
  
  // 设置 CORS 头部
  c.header('Access-Control-Allow-Origin', '*')
  c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE')
  c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
  return c.json({ received: body })
}
```

## 开发工作流

### 1. 添加新路由

```bash
# 1. 创建路由文件
touch src/routes/products/[id].ts

# 2. 实现路由处理器
echo 'export const GET = (c) => c.json({ product: c.req.param("id") })' > src/routes/products/[id].ts

# 3. 路由在下次开发服务器启动时自动重新生成
npm run dev
```

### 2. 热重载

使用 `tsx watch` 时，服务器会在以下情况下自动重启：
- 修改路由处理器
- 添加新路由文件
- 更改主应用程序文件

路由生成通过 `predev` 脚本自动进行。

### 3. 生产构建

```bash
# 生成路由并构建
npm run build

# 启动生产服务器
npm start
```

## 下一步

- [高级示例](./advanced.md) - 复杂路由模式
- [项目示例](./projects.md) - 完整项目设置
- [最佳实践](./best-practices.md) - 推荐模式
- [API 参考](../reference/api.md) - 完整 API 文档