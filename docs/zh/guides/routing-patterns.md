# 路由模式

本指南探讨了 hono-filebased-route 支持的各种路由模式，从简单的静态路由到复杂的嵌套结构。

## 静态路由

静态路由是最简单的路由形式，文件路径直接映射到 URL 路径。

### 基本静态路由

```
routes/
├── index.ts          → /
├── about.ts          → /about
├── contact.ts        → /contact
├── pricing.ts        → /pricing
└── terms.ts          → /terms
```

**示例实现：**

```typescript
// routes/about.ts
import type { Context } from 'hono'

export const GET = (c: Context) => {
	return c.json({
		page: 'about',
		title: '关于我们',
		content: '了解更多关于我们公司的信息...',
	})
}
```

### 嵌套静态路由

```
routes/
├── api/
│   ├── health.ts     → /api/health
│   ├── version.ts    → /api/version
│   └── status.ts     → /api/status
├── admin/
│   ├── dashboard.ts  → /admin/dashboard
│   ├── users.ts      → /admin/users
│   └── settings.ts   → /admin/settings
└── blog/
    ├── index.ts      → /blog
    ├── archive.ts    → /blog/archive
    └── categories.ts → /blog/categories
```

**示例实现：**

```typescript
// routes/api/health.ts
import type { Context } from 'hono'

export const GET = (c: Context) => {
	return c.json({
		status: 'healthy',
		timestamp: new Date().toISOString(),
		uptime: process.uptime(),
	})
}

// routes/admin/dashboard.ts
import type { Context } from 'hono'

export const GET = (c: Context) => {
	return c.json({
		page: 'admin-dashboard',
		stats: {
			users: 1250,
			posts: 3400,
			comments: 8900,
		},
	})
}
```

## 动态路由

动态路由使用方括号 `[]` 来捕获 URL 段作为参数。

### 单参数路由

```
routes/
├── users/
│   ├── [id].ts       → /users/:id
│   └── [username].ts → /users/:username
├── posts/
│   └── [slug].ts     → /posts/:slug
└── categories/
    └── [name].ts     → /categories/:name
```

**示例实现：**

```typescript
// routes/users/[id].ts
import type { Context } from 'hono'

export const GET = (c: Context) => {
	const id = c.req.param('id')

	// 验证 ID
	if (!id || isNaN(Number(id))) {
		return c.json({ error: 'Invalid user ID' }, 400)
	}

	return c.json({
		user: {
			id: Number(id),
			name: `用户 ${id}`,
			email: `user${id}@example.com`,
		},
	})
}

export const PUT = async (c: Context) => {
	const id = c.req.param('id')
	const body = await c.req.json()

	return c.json({
		message: `用户 ${id} 已更新`,
		data: body,
	})
}

export const DELETE = (c: Context) => {
	const id = c.req.param('id')

	return c.json({
		message: `用户 ${id} 已删除`,
	})
}
```

### 多参数路由

```
routes/
├── users/
│   └── [id]/
│       ├── posts/
│       │   └── [postId].ts → /users/:id/posts/:postId
│       ├── comments/
│       │   └── [commentId].ts → /users/:id/comments/:commentId
│       └── settings/
│           └── [section].ts → /users/:id/settings/:section
└── categories/
    └── [category]/
        └── [subcategory].ts → /categories/:category/:subcategory
```

**示例实现：**

```typescript
// routes/users/[id]/posts/[postId].ts
import type { Context } from 'hono'

export const GET = (c: Context) => {
	const userId = c.req.param('id')
	const postId = c.req.param('postId')

	return c.json({
		post: {
			id: postId,
			userId: userId,
			title: `用户 ${userId} 的文章 ${postId}`,
			content: '文章内容在这里...',
		},
	})
}

// routes/categories/[category]/[subcategory].ts
import type { Context } from 'hono'

export const GET = (c: Context) => {
	const category = c.req.param('category')
	const subcategory = c.req.param('subcategory')

	return c.json({
		category,
		subcategory,
		items: [{ id: 1, name: `${category}/${subcategory} 中的项目` }],
	})
}
```

## 通配符路由（捕获所有）

通配符路由使用 `[...param]` 语法来捕获多个路径段。

### 基本通配符路由

```
routes/
├── files/
│   └── [...path].ts  → /files/*
├── docs/
│   └── [...slug].ts  → /docs/*
└── api/
    └── proxy/
        └── [...route].ts → /api/proxy/*
```

**示例实现：**

```typescript
// routes/files/[...path].ts
import type { Context } from 'hono'

export const GET = (c: Context) => {
	const path = c.req.param('path')

	// path 将是整个剩余路径
	// 例如：/files/documents/2023/report.pdf → path = "documents/2023/report.pdf"

	return c.json({
		requestedPath: path,
		segments: path.split('/'),
		message: `访问文件：${path}`,
	})
}

// routes/docs/[...slug].ts
import type { Context } from 'hono'

export const GET = (c: Context) => {
	const slug = c.req.param('slug')
	const segments = slug.split('/')

	// 处理不同的文档路径
	if (segments[0] === 'api') {
		return c.json({
			type: 'api-docs',
			path: slug,
			content: `API 文档：${segments.slice(1).join('/')}`,
		})
	}

	if (segments[0] === 'guide') {
		return c.json({
			type: 'guide',
			path: slug,
			content: `指南内容：${segments.slice(1).join('/')}`,
		})
	}

	return c.json({
		type: 'general-docs',
		path: slug,
		content: `文档内容：${slug}`,
	})
}
```

### 高级通配符用法

```typescript
// routes/api/proxy/[...route].ts
import type { Context } from 'hono'

export const GET = async (c: Context) => {
	const route = c.req.param('route')
	const queryString = c.req.url.split('?')[1] || ''

	// 代理到外部 API
	const externalUrl = `https://api.external.com/${route}${
		queryString ? '?' + queryString : ''
	}`

	try {
		const response = await fetch(externalUrl)
		const data = await response.json()

		return c.json(data, response.status)
	} catch (error) {
		return c.json({ error: '代理请求失败', route }, 500)
	}
}

export const POST = async (c: Context) => {
	const route = c.req.param('route')
	const body = await c.req.json()

	// 代理 POST 请求
	const externalUrl = `https://api.external.com/${route}`

	try {
		const response = await fetch(externalUrl, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(body),
		})

		const data = await response.json()
		return c.json(data, response.status)
	} catch (error) {
		return c.json({ error: '代理 POST 请求失败', route }, 500)
	}
}
```

## 混合路由模式

你可以在同一个应用程序中组合不同的路由模式：

```
routes/
├── index.ts                    → /
├── about.ts                    → /about
├── api/
│   ├── health.ts              → /api/health
│   ├── users/
│   │   ├── index.ts           → /api/users
│   │   ├── [id].ts            → /api/users/:id
│   │   └── [id]/
│   │       ├── posts.ts       → /api/users/:id/posts
│   │       └── settings.ts    → /api/users/:id/settings
│   └── files/
│       └── [...path].ts       → /api/files/*
├── blog/
│   ├── index.ts               → /blog
│   ├── [slug].ts              → /blog/:slug
│   └── categories/
│       └── [category].ts      → /blog/categories/:category
└── docs/
    └── [...path].ts           → /docs/*
```

## 路由优先级和解析

当多个路由可能匹配一个 URL 时，hono-filebased-route 遵循以下优先级顺序：

1. **静态路由**（最高优先级）
2. **动态路由**（具有特定参数）
3. **通配符路由**（最低优先级）

### 优先级解析示例

```
routes/
├── users/
│   ├── new.ts        → /users/new（静态 - 最高优先级）
│   ├── [id].ts       → /users/:id（动态 - 中等优先级）
│   └── [...path].ts  → /users/*（通配符 - 最低优先级）
```

对于 URL `/users/new`：

1. ✅ 匹配 `users/new.ts`（静态路由）- **被选中**
2. ❌ 也会匹配 `users/[id].ts`，但静态路由优先
3. ❌ 也会匹配 `users/[...path].ts`，但静态路由优先

对于 URL `/users/123`：

1. ❌ 没有静态路由匹配
2. ✅ 匹配 `users/[id].ts`（动态路由）- **被选中**
3. ❌ 也会匹配 `users/[...path].ts`，但动态路由优先

对于 URL `/users/123/posts/456`：

1. ❌ 没有静态路由匹配
2. ❌ 没有动态路由匹配
3. ✅ 匹配 `users/[...path].ts`（通配符路由）- **被选中**

## 高级模式

### 可选参数

虽然不直接支持，但你可以模拟可选参数：

```
routes/
├── search/
│   ├── index.ts      → /search（无参数）
│   └── [query].ts    → /search/:query（有参数）
```

```typescript
// routes/search/index.ts
import type { Context } from 'hono'

export const GET = (c: Context) => {
	const query = c.req.query('q') || ''

	return c.json({
		query,
		results: query ? searchResults(query) : [],
	})
}

// routes/search/[query].ts
import type { Context } from 'hono'

export const GET = (c: Context) => {
	const query = c.req.param('query')

	return c.json({
		query,
		results: searchResults(query),
	})
}
```

### 路由分组

使用目录结构组织相关路由：

```
routes/
├── api/
│   ├── v1/
│   │   ├── users.ts
│   │   ├── posts.ts
│   │   └── comments.ts
│   └── v2/
│       ├── users.ts
│       ├── posts.ts
│       └── analytics.ts
└── admin/
    ├── dashboard.ts
    ├── users/
    │   ├── index.ts
    │   └── [id].ts
    └── settings/
        ├── general.ts
        └── security.ts
```

### 按路由模式应用中间件

```typescript
// routes/api/protected/[...route].ts
import type { Context } from 'hono'

// 身份验证中间件
const authenticate = (c: Context) => {
	const token = c.req.header('Authorization')
	if (!token) {
		return c.json({ error: '需要身份验证' }, 401)
	}
	return null
}

export const GET = (c: Context) => {
	const authError = authenticate(c)
	if (authError) return authError

	const route = c.req.param('route')
	return c.json({
		message: '已访问受保护的资源',
		route,
		user: 'authenticated-user',
	})
}
```

## 最佳实践

### 1. 一致的命名

```
✅ 好的做法：
routes/
├── users/
│   ├── [id].ts
│   └── [id]/
│       └── posts.ts

❌ 避免：
routes/
├── users/
│   ├── [userId].ts
│   └── [id]/
│       └── posts.ts
```

### 2. 逻辑分组

```
✅ 好的做法：
routes/
├── api/
│   ├── users/
│   ├── posts/
│   └── comments/
├── admin/
│   ├── dashboard.ts
│   └── settings.ts
└── public/
    ├── about.ts
    └── contact.ts

❌ 避免：
routes/
├── users.ts
├── admin-dashboard.ts
├── public-about.ts
└── api-posts.ts
```

### 3. 参数验证

```typescript
// 始终验证参数
export const GET = (c: Context) => {
	const id = c.req.param('id')

	// 验证 ID 格式
	if (!id || !/^\d+$/.test(id)) {
		return c.json({ error: 'ID 格式无效' }, 400)
	}

	const numericId = parseInt(id, 10)
	if (numericId <= 0) {
		return c.json({ error: 'ID 必须为正数' }, 400)
	}

	// 使用有效的 ID 继续
	return c.json({ user: { id: numericId } })
}
```

### 4. 通配符的错误处理

```typescript
// routes/files/[...path].ts
export const GET = (c: Context) => {
	const path = c.req.param('path')

	// 验证路径
	if (!path || path.includes('..')) {
		return c.json({ error: '无效的文件路径' }, 400)
	}

	// 检查文件是否存在
	if (!fileExists(path)) {
		return c.json({ error: '文件未找到' }, 404)
	}

	return serveFile(path)
}
```

## 路由测试

```typescript
// tests/routing-patterns.test.ts
import { Hono } from 'hono'
import { fileBasedRouting } from 'hono-filebased-route'

const app = new Hono()
fileBasedRouting(app, { dir: './routes' })

describe('路由模式', () => {
	// 静态路由
	test('静态路由 /about', async () => {
		const res = await app.request('/about')
		expect(res.status).toBe(200)
	})

	// 动态路由
	test('动态路由 /users/:id', async () => {
		const res = await app.request('/users/123')
		const data = await res.json()
		expect(data.user.id).toBe(123)
	})

	// 通配符路由
	test('通配符路由 /files/*', async () => {
		const res = await app.request('/files/documents/report.pdf')
		const data = await res.json()
		expect(data.requestedPath).toBe('documents/report.pdf')
	})

	// 路由优先级
	test('静态路由优先于动态路由', async () => {
		const res = await app.request('/users/new')
		const data = await res.json()
		expect(data.page).toBe('new-user-form') // 来自静态路由
	})
})
```

## 下一步

现在你了解了路由模式：

1. 学习[动态路由](/zh/guides/dynamic-routes)了解高级参数处理
2. 探索[高级功能](/zh/guides/advanced-features)了解中间件和钩子
3. 查看 [API 参考](/zh/reference/api)获取完整文档

准备构建复杂的路由结构了吗？让我们继续！🚀
