# Basic Usage

This guide covers the fundamental concepts and patterns for using hono-filebased-route in your applications.

## Route File Structure

Each route file should export HTTP method handlers as named exports. The file name and directory structure determine the URL path.

### Basic Route Handler

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

This creates:

- `GET /hello`
- `POST /hello`

## Supported HTTP Methods

hono-filebased-route supports all standard HTTP methods:

```typescript
// routes/api/users.ts
import type { Context } from 'hono'

// GET /api/users - List all users
export const GET = (c: Context) => {
	return c.json({ users: [] })
}

// POST /api/users - Create a new user
export const POST = async (c: Context) => {
	const body = await c.req.json()
	return c.json({ message: 'User created', data: body })
}

// PUT /api/users - Update users (bulk)
export const PUT = async (c: Context) => {
	const body = await c.req.json()
	return c.json({ message: 'Users updated', data: body })
}

// DELETE /api/users - Delete all users
export const DELETE = (c: Context) => {
	return c.json({ message: 'All users deleted' })
}

// PATCH /api/users - Partial update
export const PATCH = async (c: Context) => {
	const body = await c.req.json()
	return c.json({ message: 'Users patched', data: body })
}

// HEAD /api/users - Headers only
export const HEAD = (c: Context) => {
	c.header('X-Total-Count', '0')
	return c.body(null)
}

// OPTIONS /api/users - CORS preflight
export const OPTIONS = (c: Context) => {
	c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH')
	return c.body(null)
}
```

## File-to-Route Mapping

Understanding how files map to routes is crucial:

### Static Routes

```
routes/index.ts        → GET /
routes/about.ts        → GET /about
routes/contact.ts      → GET /contact
routes/api/health.ts   → GET /api/health
```

### Directory Index Files

```
routes/users/index.ts  → GET /users
routes/api/index.ts    → GET /api
```

### Nested Directories

```
routes/api/users/profile.ts → GET /api/users/profile
routes/blog/posts/draft.ts  → GET /blog/posts/draft
```

## Working with Request Data

### Query Parameters

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

// Usage: GET /search?q=hono&page=2&limit=20
```

### Request Body

```typescript
// routes/api/posts.ts
import type { Context } from 'hono'

export const POST = async (c: Context) => {
	try {
		const body = await c.req.json()

		// Validate required fields
		if (!body.title || !body.content) {
			return c.json({ error: 'Title and content are required' }, 400)
		}

		// Process the data
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

### Form Data

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

### Headers

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

## Response Handling

### JSON Responses

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

### Custom Status Codes

```typescript
// routes/api/users.ts
import type { Context } from 'hono'

export const POST = async (c: Context) => {
	const body = await c.req.json()

	// Created successfully
	return c.json({ user: body }, 201)
}

export const DELETE = (c: Context) => {
	// No content
	return c.body(null, 204)
}
```

### Custom Headers

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

### HTML Responses

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
        <h1>Welcome to Dashboard</h1>
        <p>Current time: ${new Date().toLocaleString()}</p>
      </body>
    </html>
  `

	return c.html(html)
}
```

## Error Handling

### Basic Error Handling

```typescript
// routes/api/users/[id].ts
import type { Context } from 'hono'

export const GET = (c: Context) => {
	const id = c.req.param('id')

	if (!id || isNaN(Number(id))) {
		return c.json({ error: 'Invalid user ID' }, 400)
	}

	// Simulate user not found
	if (Number(id) > 1000) {
		return c.json({ error: 'User not found' }, 404)
	}

	return c.json({ id: Number(id), name: `User ${id}` })
}
```

### Try-Catch Error Handling

```typescript
// routes/api/external.ts
import type { Context } from 'hono'

export const GET = async (c: Context) => {
	try {
		// Simulate external API call
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

## Middleware Integration

You can use Hono middleware in your route handlers:

### CORS Middleware

```typescript
// routes/api/public.ts
import type { Context } from 'hono'
import { cors } from 'hono/cors'

// Apply CORS to specific routes
export const GET = async (c: Context) => {
	// Apply CORS middleware
	const corsMiddleware = cors({
		origin: ['http://localhost:3000', 'https://myapp.com'],
		allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
	})

	await corsMiddleware(c, async () => {})

	return c.json({ message: 'Public API endpoint' })
}
```

### Authentication Check

```typescript
// routes/api/private.ts
import type { Context } from 'hono'

const authenticate = (c: Context) => {
	const token = c.req.header('Authorization')?.replace('Bearer ', '')

	if (!token || token !== 'valid-token') {
		return c.json({ error: 'Unauthorized' }, 401)
	}

	return null // Continue to handler
}

export const GET = (c: Context) => {
	// Check authentication
	const authError = authenticate(c)
	if (authError) return authError

	return c.json({ message: 'Private data', user: 'authenticated-user' })
}
```

## Best Practices

### 1. Consistent Response Format

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

### 2. Input Validation

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

### 3. Environment Configuration

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

## Testing Routes

### Basic Testing Setup

```typescript
// tests/routes.test.ts
import { Hono } from 'hono'
import { fileBasedRouting } from 'hono-filebased-route'

const app = new Hono()
fileBasedRouting(app, { dir: './routes' })

// Test with your preferred testing framework
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

## Next Steps

Now that you understand the basics:

1. Learn about [Routing Patterns](/guides/routing-patterns) for more complex URL structures
2. Explore [Dynamic Routes](/guides/dynamic-routes) for parameterized paths
3. Discover [Advanced Features](/guides/advanced-features) for powerful routing capabilities

Ready to build more complex routes? Let's dive deeper! 🚀
