# 基础用法

本指南涵盖了在应用程序中使用 hono-filebased-route 的基本概念和模式。

## 路由文件结构

每个路由文件应该将 HTTP 方法处理器作为命名导出。文件名和目录结构决定 URL 路径。

### 基本路由处理器

```typescript
// routes/hello.ts
import type { Context } from 'hono'

export const GET = (c: Context) => {
	return c.json({ message: 'Hello World!' })
}

export const POST = (c: Context) => {
	return c.json({ message: 'Data received!' })
}
```

这将创建：

- `GET /hello`
- `POST /hello`

## 支持的 HTTP 方法

hono-filebased-route 支持所有标准 HTTP 方法：

```typescript
// routes/api/users.ts
import type { Context } from 'hono'

// GET /api/users - 列出所有用户
export const GET = (c: Context) => {
	return c.json({ users: [] })
}

// POST /api/users - 创建新用户
export const POST = async (c: Context) => {
	const body = await c.req.json()
	return c.json({ message: 'User created', data: body })
}

// PUT /api/users - 更新用户（批量）
export const PUT = async (c: Context) => {
	const body = await c.req.json()
	return c.json({ message: 'Users updated', data: body })
}

// DELETE /api/users - 删除所有用户
export const DELETE = (c: Context) => {
	return c.json({ message: 'All users deleted' })
}

// PATCH /api/users - 部分更新
export const PATCH = async (c: Context) => {
	const body = await c.req.json()
	return c.json({ message: 'Users patched', data: body })
}

// HEAD /api/users - 仅头部
export const HEAD = (c: Context) => {
	c.header('X-Total-Count', '0')
	return c.body(null)
}

// OPTIONS /api/users - CORS 预检
export const OPTIONS = (c: Context) => {
	c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH')
	return c.body(null)
}
```

## 文件到路由的映射

理解文件如何映射到路由至关重要：

### 静态路由

```
routes/index.ts        → GET /
routes/about.ts        → GET /about
routes/contact.ts      → GET /contact
routes/api/health.ts   → GET /api/health
```

### 目录索引文件

```
routes/users/index.ts  → GET /users
routes/api/index.ts    → GET /api
```

### 嵌套目录

```
routes/api/users/profile.ts → GET /api/users/profile
routes/blog/posts/draft.ts  → GET /blog/posts/draft
```

## 处理请求数据

### 查询参数

```typescript
// routes/search.ts
import type { Context } from 'hono'

export const GET = (c: Context) => {
	const query = c.req.query('q')
	const page = c.req.query('page') || '1'
	const limit = c.req.query('limit') || '10'

	return c.json({
		query,
		page: parseInt(page),
		limit: parseInt(limit),
		results: [],
	})
}

// 用法：GET /search?q=hono&page=2&limit=20
```

### 请求体

```typescript
// routes/api/posts.ts
import type { Context } from 'hono'

export const POST = async (c: Context) => {
	try {
		const body = await c.req.json()

		// 验证必需字段
		if (!body.title || !body.content) {
			return c.json({ error: 'Title and content are required' }, 400)
		}

		// 处理数据
		const post = {
			id: Date.now(),
			title: body.title,
			content: body.content,
			createdAt: new Date().toISOString(),
		}

		return c.json({ post }, 201)
	} catch (error) {
		return c.json({ error: 'Invalid JSON' }, 400)
	}
}
```

### 表单数据

```typescript
// routes/upload.ts
import type { Context } from 'hono'

export const POST = async (c: Context) => {
	const formData = await c.req.formData()
	const file = formData.get('file') as File
	const description = formData.get('description') as string

	if (!file) {
		return c.json({ error: 'No file uploaded' }, 400)
	}

	return c.json({
		filename: file.name,
		size: file.size,
		type: file.type,
		description,
	})
}
```

### 请求头

```typescript
// routes/api/protected.ts
import type { Context } from 'hono'

export const GET = (c: Context) => {
	const authorization = c.req.header('Authorization')
	const userAgent = c.req.header('User-Agent')

	if (!authorization) {
		return c.json({ error: 'Authorization required' }, 401)
	}

	return c.json({
		message: 'Access granted',
		userAgent,
	})
}
```

## 响应处理

### JSON 响应

```typescript
// routes/api/status.ts
import type { Context } from 'hono'

export const GET = (c: Context) => {
	return c.json({
		status: 'ok',
		timestamp: new Date().toISOString(),
		version: '1.0.0',
	})
}
```

### 自定义状态码

```typescript
// routes/api/users.ts
import type { Context } from 'hono'

export const POST = async (c: Context) => {
	const body = await c.req.json()

	// 创建成功
	return c.json({ user: body }, 201)
}

export const DELETE = (c: Context) => {
	// 无内容
	return c.body(null, 204)
}
```

### 自定义头部

```typescript
// routes/api/download.ts
import type { Context } from 'hono'

export const GET = (c: Context) => {
	const data = 'Hello, World!'

	c.header('Content-Type', 'text/plain')
	c.header('Content-Disposition', 'attachment; filename="hello.txt"')

	return c.body(data)
}
```

### HTML 响应

```typescript
// routes/dashboard.ts
import type { Context } from 'hono'

export const GET = (c: Context) => {
	const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Dashboard</title>
      </head>
      <body>
        <h1>欢迎来到仪表板</h1>
        <p>当前时间：${new Date().toLocaleString()}</p>
      </body>
    </html>
  `

	return c.html(html)
}
```

## 错误处理

### 基本错误处理

```typescript
// routes/api/users/[id].ts
import type { Context } from 'hono'

export const GET = (c: Context) => {
	const id = c.req.param('id')

	if (!id || isNaN(Number(id))) {
		return c.json({ error: 'Invalid user ID' }, 400)
	}

	// 模拟用户未找到
	if (Number(id) > 1000) {
		return c.json({ error: 'User not found' }, 404)
	}

	return c.json({ id: Number(id), name: `User ${id}` })
}
```

### Try-Catch 错误处理

```typescript
// routes/api/external.ts
import type { Context } from 'hono'

export const GET = async (c: Context) => {
	try {
		// 模拟外部 API 调用
		const response = await fetch('https://api.example.com/data')

		if (!response.ok) {
			throw new Error(`External API error: ${response.status}`)
		}

		const data = await response.json()
		return c.json(data)
	} catch (error) {
		console.error('External API error:', error)
		return c.json({ error: 'Failed to fetch external data' }, 500)
	}
}
```

## 中间件集成

你可以在路由处理器中使用 Hono 中间件：

### CORS 中间件

```typescript
// routes/api/public.ts
import type { Context } from 'hono'
import { cors } from 'hono/cors'

// 对特定路由应用 CORS
export const GET = async (c: Context) => {
	// 应用 CORS 中间件
	const corsMiddleware = cors({
		origin: ['http://localhost:3000', 'https://myapp.com'],
		allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
	})

	await corsMiddleware(c, async () => {})

	return c.json({ message: 'Public API endpoint' })
}
```

### 身份验证检查

```typescript
// routes/api/private.ts
import type { Context } from 'hono'

const authenticate = (c: Context) => {
	const token = c.req.header('Authorization')?.replace('Bearer ', '')

	if (!token || token !== 'valid-token') {
		return c.json({ error: 'Unauthorized' }, 401)
	}

	return null // 继续到处理器
}

export const GET = (c: Context) => {
	// 检查身份验证
	const authError = authenticate(c)
	if (authError) return authError

	return c.json({ message: 'Private data', user: 'authenticated-user' })
}
```

## 最佳实践

### 1. 一致的响应格式

```typescript
// utils/response.ts
export const successResponse = (data: any, message = 'Success') => ({
	success: true,
	message,
	data,
})

export const errorResponse = (message: string, code?: string) => ({
	success: false,
	message,
	code,
})

// routes/api/users.ts
import { successResponse, errorResponse } from '../utils/response'

export const GET = (c: Context) => {
	const users = [{ id: 1, name: 'John' }]
	return c.json(successResponse(users, 'Users retrieved successfully'))
}
```

### 2. 输入验证

```typescript
// utils/validation.ts
export const validateEmail = (email: string): boolean => {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
	return emailRegex.test(email)
}

// routes/api/register.ts
import { validateEmail } from '../utils/validation'

export const POST = async (c: Context) => {
	const { email, password } = await c.req.json()

	if (!email || !validateEmail(email)) {
		return c.json({ error: 'Valid email is required' }, 400)
	}

	if (!password || password.length < 6) {
		return c.json({ error: 'Password must be at least 6 characters' }, 400)
	}

	return c.json({ message: 'User registered successfully' })
}
```

### 3. 环境配置

```typescript
// routes/api/config.ts
import type { Context } from 'hono'

export const GET = (c: Context) => {
	const isDevelopment = process.env.NODE_ENV === 'development'

	return c.json({
		environment: process.env.NODE_ENV || 'development',
		debug: isDevelopment,
		version: process.env.APP_VERSION || '1.0.0',
	})
}
```

## 测试路由

### 基本测试设置

```typescript
// tests/routes.test.ts
import { Hono } from 'hono'
import { fileBasedRouting } from 'hono-filebased-route'

const app = new Hono()
fileBasedRouting(app, { dir: './routes' })

// 使用你喜欢的测试框架进行测试
describe('API Routes', () => {
	test('GET / should return hello world', async () => {
		const res = await app.request('/')
		const data = await res.json()

		expect(res.status).toBe(200)
		expect(data.message).toBe('Hello World!')
	})

	test('POST /api/users should create user', async () => {
		const res = await app.request('/api/users', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ name: 'John Doe' }),
		})

		expect(res.status).toBe(201)
	})
})
```

## 下一步

现在你了解了基础知识：

1. 学习[路由模式](/zh/guides/routing-patterns)了解更复杂的 URL 结构
2. 探索[动态路由](/zh/guides/dynamic-routes)了解参数化路径
3. 发现[高级功能](/zh/guides/advanced-features)了解强大的路由功能

准备构建更复杂的路由了吗？让我们深入了解！🚀
