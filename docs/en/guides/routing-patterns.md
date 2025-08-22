# Routing Patterns

This guide explores the various routing patterns supported by hono-filebased-route, from simple static routes to complex nested structures.

## Static Routes

Static routes are the simplest form of routing where the file path directly maps to the URL path.

### Basic Static Routes

```
routes/
├── index.ts          → /
├── about.ts          → /about
├── contact.ts        → /contact
├── pricing.ts        → /pricing
└── terms.ts          → /terms
```

**Example Implementation:**

```typescript
// routes/about.ts
import type { Context } from 'hono'

export const GET = (c: Context) => {
	return c.json({
		page: 'about',
		title: 'About Us',
		content: 'Learn more about our company...',
	})
}
```

### Nested Static Routes

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

**Example Implementation:**

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

## Dynamic Routes

Dynamic routes use square brackets `[]` to capture URL segments as parameters.

### Single Parameter Routes

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

**Example Implementation:**

```typescript
// routes/users/[id].ts
import type { Context } from 'hono'

export const GET = (c: Context) => {
	const id = c.req.param('id')

	// Validate ID
	if (!id || isNaN(Number(id))) {
		return c.json({ error: 'Invalid user ID' }, 400)
	}

	return c.json({
		user: {
			id: Number(id),
			name: `User ${id}`,
			email: `user${id}@example.com`,
		},
	})
}

export const PUT = async (c: Context) => {
	const id = c.req.param('id')
	const body = await c.req.json()

	return c.json({
		message: `User ${id} updated`,
		data: body,
	})
}

export const DELETE = (c: Context) => {
	const id = c.req.param('id')

	return c.json({
		message: `User ${id} deleted`,
	})
}
```

### Multiple Parameter Routes

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

**Example Implementation:**

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
			title: `Post ${postId} by User ${userId}`,
			content: 'Post content here...',
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
		items: [{ id: 1, name: `Item in ${category}/${subcategory}` }],
	})
}
```

## Wildcard Routes (Catch-All)

Wildcard routes use `[...param]` syntax to capture multiple path segments.

### Basic Wildcard Routes

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

**Example Implementation:**

```typescript
// routes/files/[...path].ts
import type { Context } from 'hono'

export const GET = (c: Context) => {
	const path = c.req.param('path')

	// path will be the entire remaining path
	// e.g., /files/documents/2023/report.pdf → path = "documents/2023/report.pdf"

	return c.json({
		requestedPath: path,
		segments: path.split('/'),
		message: `Accessing file at: ${path}`,
	})
}

// routes/docs/[...slug].ts
import type { Context } from 'hono'

export const GET = (c: Context) => {
	const slug = c.req.param('slug')
	const segments = slug.split('/')

	// Handle different documentation paths
	if (segments[0] === 'api') {
		return c.json({
			type: 'api-docs',
			path: slug,
			content: `API documentation for: ${segments.slice(1).join('/')}`,
		})
	}

	if (segments[0] === 'guide') {
		return c.json({
			type: 'guide',
			path: slug,
			content: `Guide content for: ${segments.slice(1).join('/')}`,
		})
	}

	return c.json({
		type: 'general-docs',
		path: slug,
		content: `Documentation for: ${slug}`,
	})
}
```

### Advanced Wildcard Usage

```typescript
// routes/api/proxy/[...route].ts
import type { Context } from 'hono'

export const GET = async (c: Context) => {
	const route = c.req.param('route')
	const queryString = c.req.url.split('?')[1] || ''

	// Proxy to external API
	const externalUrl = `https://api.external.com/${route}${
		queryString ? '?' + queryString : ''
	}`

	try {
		const response = await fetch(externalUrl)
		const data = await response.json()

		return c.json(data, response.status)
	} catch (error) {
		return c.json({ error: 'Failed to proxy request', route }, 500)
	}
}

export const POST = async (c: Context) => {
	const route = c.req.param('route')
	const body = await c.req.json()

	// Proxy POST request
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
		return c.json({ error: 'Failed to proxy POST request', route }, 500)
	}
}
```

## Mixed Routing Patterns

You can combine different routing patterns in the same application:

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

## Route Priority and Resolution

When multiple routes could match a URL, hono-filebased-route follows this priority order:

1. **Static routes** (highest priority)
2. **Dynamic routes** with specific parameters
3. **Wildcard routes** (lowest priority)

### Example Priority Resolution

```
routes/
├── users/
│   ├── new.ts        → /users/new (static - highest priority)
│   ├── [id].ts       → /users/:id (dynamic - medium priority)
│   └── [...path].ts  → /users/* (wildcard - lowest priority)
```

For the URL `/users/new`:

1. ✅ Matches `users/new.ts` (static route) - **Selected**
2. ❌ Would also match `users/[id].ts` but static takes priority
3. ❌ Would also match `users/[...path].ts` but static takes priority

For the URL `/users/123`:

1. ❌ No static route match
2. ✅ Matches `users/[id].ts` (dynamic route) - **Selected**
3. ❌ Would also match `users/[...path].ts` but dynamic takes priority

For the URL `/users/123/posts/456`:

1. ❌ No static route match
2. ❌ No dynamic route match
3. ✅ Matches `users/[...path].ts` (wildcard route) - **Selected**

## Advanced Patterns

### Optional Parameters

While not directly supported, you can simulate optional parameters:

```
routes/
├── search/
│   ├── index.ts      → /search (no parameters)
│   └── [query].ts    → /search/:query (with parameter)
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

### Route Groups

Organize related routes using directory structure:

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

### Middleware Application by Route Pattern

```typescript
// routes/api/protected/[...route].ts
import type { Context } from 'hono'

// Authentication middleware
const authenticate = (c: Context) => {
	const token = c.req.header('Authorization')
	if (!token) {
		return c.json({ error: 'Authentication required' }, 401)
	}
	return null
}

export const GET = (c: Context) => {
	const authError = authenticate(c)
	if (authError) return authError

	const route = c.req.param('route')
	return c.json({
		message: 'Protected resource accessed',
		route,
		user: 'authenticated-user',
	})
}
```

## Best Practices

### 1. Consistent Naming

```
✅ Good:
routes/
├── users/
│   ├── [id].ts
│   └── [id]/
│       └── posts.ts

❌ Avoid:
routes/
├── users/
│   ├── [userId].ts
│   └── [id]/
│       └── posts.ts
```

### 2. Logical Grouping

```
✅ Good:
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

❌ Avoid:
routes/
├── users.ts
├── admin-dashboard.ts
├── public-about.ts
└── api-posts.ts
```

### 3. Parameter Validation

```typescript
// Always validate parameters
export const GET = (c: Context) => {
	const id = c.req.param('id')

	// Validate ID format
	if (!id || !/^\d+$/.test(id)) {
		return c.json({ error: 'Invalid ID format' }, 400)
	}

	const numericId = parseInt(id, 10)
	if (numericId <= 0) {
		return c.json({ error: 'ID must be positive' }, 400)
	}

	// Continue with valid ID
	return c.json({ user: { id: numericId } })
}
```

### 4. Error Handling for Wildcards

```typescript
// routes/files/[...path].ts
export const GET = (c: Context) => {
	const path = c.req.param('path')

	// Validate path
	if (!path || path.includes('..')) {
		return c.json({ error: 'Invalid file path' }, 400)
	}

	// Check file existence
	if (!fileExists(path)) {
		return c.json({ error: 'File not found' }, 404)
	}

	return serveFile(path)
}
```

## Route Testing

```typescript
// tests/routing-patterns.test.ts
import { Hono } from 'hono'
import { fileBasedRouting } from 'hono-filebased-route'

const app = new Hono()
fileBasedRouting(app, { dir: './routes' })

describe('Routing Patterns', () => {
	// Static routes
	test('static route /about', async () => {
		const res = await app.request('/about')
		expect(res.status).toBe(200)
	})

	// Dynamic routes
	test('dynamic route /users/:id', async () => {
		const res = await app.request('/users/123')
		const data = await res.json()
		expect(data.user.id).toBe(123)
	})

	// Wildcard routes
	test('wildcard route /files/*', async () => {
		const res = await app.request('/files/documents/report.pdf')
		const data = await res.json()
		expect(data.requestedPath).toBe('documents/report.pdf')
	})

	// Route priority
	test('static route takes priority over dynamic', async () => {
		const res = await app.request('/users/new')
		const data = await res.json()
		expect(data.page).toBe('new-user-form') // from static route
	})
})
```

## Next Steps

Now that you understand routing patterns:

1. Learn about [Dynamic Routes](/guides/dynamic-routes) for advanced parameter handling
2. Explore [Advanced Features](/guides/advanced-features) for middleware and hooks
3. Check out the [API Reference](/reference/api) for complete documentation

Ready to build complex routing structures? Let's continue! 🚀
