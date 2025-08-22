# Basic Examples

This document provides practical examples of using hono-filebased-route in various scenarios.

## Quick Start Example

### Project Setup

```bash
# Create new project
mkdir my-hono-app
cd my-hono-app

# Initialize package.json
npm init -y

# Install dependencies
npm install hono @hono-filebased-route/core
npm install -D typescript @types/node tsx

# Create directory structure
mkdir -p src/routes scripts
touch src/main.ts scripts/generate-routes.ts
```

### Basic Configuration

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

### Route Generation Script

**scripts/generate-routes.ts**

```typescript
import { generateRoutesFile } from '@hono-filebased-route/core'

async function main() {
	try {
		console.log('🔄 Generating routes...')
		await generateRoutesFile()
		console.log('✅ Routes generated successfully!')
	} catch (error) {
		console.error('❌ Failed to generate routes:', error)
		process.exit(1)
	}
}

main()
```

### Main Application

**src/main.ts**

```typescript
import { Hono } from 'hono'
import { registerGeneratedRoutes } from './generated-routes'

const app = new Hono()

// Register all file-based routes
registerGeneratedRoutes(app)

// Global error handling
app.notFound((c) => {
	return c.json({ error: 'Not Found' }, 404)
})

app.onError((err, c) => {
	console.error('Error:', err)
	return c.json({ error: 'Internal Server Error' }, 500)
})

// Start server
const port = process.env.PORT || 3000
console.log(`🚀 Server running on http://localhost:${port}`)

export default {
	port,
	fetch: app.fetch,
}
```

## Route Examples

### 1. Static Routes

**src/routes/index.ts**

```typescript
import type { Context } from 'hono'

export const GET = async (c: Context) => {
	return c.json({
		message: 'Welcome to Hono File-based Routing!',
		timestamp: new Date().toISOString(),
		routes: ['GET /', 'GET /about', 'GET /users', 'GET /users/:id'],
	})
}
```

**src/routes/about.ts**

```typescript
import type { Context } from 'hono'

export const GET = async (c: Context) => {
	return c.json({
		title: 'About Us',
		description: 'This is a demo application using Hono file-based routing.',
		version: '1.0.0',
		features: [
			'File-based routing',
			'TypeScript support',
			'Hot reloading',
			'Automatic route generation',
		],
	})
}
```

### 2. Dynamic Routes

**src/routes/users/[id].ts**

```typescript
import type { Context } from 'hono'

// Mock user database
const users = [
	{ id: '1', name: 'Alice', email: 'alice@example.com' },
	{ id: '2', name: 'Bob', email: 'bob@example.com' },
	{ id: '3', name: 'Charlie', email: 'charlie@example.com' },
]

export const GET = async (c: Context) => {
	const id = c.req.param('id')

	const user = users.find((u) => u.id === id)

	if (!user) {
		return c.json({ error: 'User not found' }, 404)
	}

	return c.json({
		user,
		requestedId: id,
	})
}

export const POST = async (c: Context) => {
	const id = c.req.param('id')

	try {
		const body = await c.req.json()

		// Validate required fields
		if (!body.name || !body.email) {
			return c.json(
				{
					error: 'Missing required fields: name, email',
				},
				400
			)
		}

		// Update user (mock)
		const userIndex = users.findIndex((u) => u.id === id)
		if (userIndex === -1) {
			return c.json({ error: 'User not found' }, 404)
		}

		users[userIndex] = { ...users[userIndex], ...body }

		return c.json({
			message: 'User updated successfully',
			user: users[userIndex],
		})
	} catch (error) {
		return c.json({ error: 'Invalid JSON body' }, 400)
	}
}
```

### 3. Nested Routes

**src/routes/users/index.ts**

```typescript
import type { Context } from 'hono'

// Mock user database (same as above)
const users = [
	{ id: '1', name: 'Alice', email: 'alice@example.com' },
	{ id: '2', name: 'Bob', email: 'bob@example.com' },
	{ id: '3', name: 'Charlie', email: 'charlie@example.com' },
]

export const GET = async (c: Context) => {
	// Get query parameters
	const limit = parseInt(c.req.query('limit') || '10')
	const offset = parseInt(c.req.query('offset') || '0')

	const paginatedUsers = users.slice(offset, offset + limit)

	return c.json({
		users: paginatedUsers,
		pagination: {
			total: users.length,
			limit,
			offset,
			hasMore: offset + limit < users.length,
		},
	})
}

export const POST = async (c: Context) => {
	try {
		const body = await c.req.json()

		// Validate required fields
		if (!body.name || !body.email) {
			return c.json(
				{
					error: 'Missing required fields: name, email',
				},
				400
			)
		}

		// Create new user (mock)
		const newUser = {
			id: String(users.length + 1),
			name: body.name,
			email: body.email,
		}

		users.push(newUser)

		return c.json(
			{
				message: 'User created successfully',
				user: newUser,
			},
			201
		)
	} catch (error) {
		return c.json({ error: 'Invalid JSON body' }, 400)
	}
}
```

### 4. Catch-All Routes

**src/routes/api/[...path].ts**

```typescript
import type { Context } from 'hono'

export const GET = async (c: Context, pathSegments: string[]) => {
	return c.json({
		message: 'API catch-all route',
		path: pathSegments,
		fullPath: '/' + pathSegments.join('/'),
		method: 'GET',
		availableEndpoints: ['/api/health', '/api/version', '/api/status'],
	})
}

export const POST = async (c: Context, pathSegments: string[]) => {
	try {
		const body = await c.req.json()

		return c.json({
			message: 'API catch-all POST',
			path: pathSegments,
			receivedData: body,
			timestamp: new Date().toISOString(),
		})
	} catch (error) {
		return c.json({ error: 'Invalid JSON body' }, 400)
	}
}
```

### 5. API Routes with Different Response Types

**src/routes/api/health.ts**

```typescript
import type { Context } from 'hono'

export const GET = async (c: Context) => {
	const health = {
		status: 'healthy',
		timestamp: new Date().toISOString(),
		uptime: process.uptime(),
		memory: process.memoryUsage(),
		version: process.version,
	}

	return c.json(health)
}
```

**src/routes/api/version.ts**

```typescript
import type { Context } from 'hono'

export const GET = async (c: Context) => {
	// Return plain text
	return c.text('v1.0.0')
}
```

**src/routes/download/[filename].ts**

```typescript
import type { Context } from 'hono'

export const GET = async (c: Context) => {
	const filename = c.req.param('filename')

	// Mock file content
	const content = `This is a mock file: ${filename}`

	// Set headers for file download
	c.header('Content-Type', 'application/octet-stream')
	c.header('Content-Disposition', `attachment; filename="${filename}"`)

	return c.body(content)
}
```

## Testing Your Routes

### Manual Testing with curl

```bash
# Start the development server
npm run dev

# Test routes
curl http://localhost:3000/
curl http://localhost:3000/about
curl http://localhost:3000/users
curl http://localhost:3000/users/1
curl http://localhost:3000/api/health

# Test POST requests
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{"name":"David","email":"david@example.com"}'

curl -X POST http://localhost:3000/users/1 \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice Updated"}'

# Test catch-all routes
curl http://localhost:3000/api/some/nested/path
```

### Simple Test Script

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
		console.error(`Error testing ${method} ${path}:`, error.message)
	}
}

async function runTests() {
	console.log('🧪 Testing routes...\n')

	await testRoute('/')
	await testRoute('/about')
	await testRoute('/users')
	await testRoute('/users/1')
	await testRoute('/api/health')
	await testRoute('/users', 'POST', {
		name: 'Test User',
		email: 'test@example.com',
	})
	await testRoute('/api/some/path')

	console.log('✅ Tests completed!')
}

runTests()
```

## Common Patterns

### 1. Error Handling

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
			return c.json({ error: 'User ID is required' }, 400)
		}

		const user = users.find((u) => u.id === id)

		if (!user) {
			return c.json({ error: 'User not found' }, 404)
		}

		return c.json({ user })
	} catch (error) {
		console.error('Error in GET /api/users/:id:', error)
		return c.json({ error: 'Internal server error' }, 500)
	}
}
```

### 2. Input Validation

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
			return c.json(
				{
					error: 'Invalid input',
					required: ['name (string)', 'email (string)'],
					optional: ['age (number)'],
				},
				400
			)
		}

		// Process valid data
		const newUser = {
			id: crypto.randomUUID(),
			...body,
		}

		return c.json({ user: newUser }, 201)
	} catch (error) {
		return c.json({ error: 'Invalid JSON body' }, 400)
	}
}
```

### 3. Response Headers

```typescript
// src/routes/api/data.ts
import type { Context } from 'hono'

export const GET = async (c: Context) => {
	const data = { message: 'Hello World' }

	// Set custom headers
	c.header('X-API-Version', '1.0')
	c.header('Cache-Control', 'public, max-age=3600')
	c.header('X-Response-Time', Date.now().toString())

	return c.json(data)
}

export const POST = async (c: Context) => {
	const body = await c.req.json()

	// Set CORS headers
	c.header('Access-Control-Allow-Origin', '*')
	c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE')
	c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization')

	return c.json({ received: body })
}
```

## Development Workflow

### 1. Adding New Routes

```bash
# 1. Create route file
touch src/routes/products/[id].ts

# 2. Implement route handlers
echo 'export const GET = (c) => c.json({ product: c.req.param("id") })' > src/routes/products/[id].ts

# 3. Routes are automatically regenerated on next dev server start
npm run dev
```

### 2. Hot Reloading

When using `tsx watch`, the server will automatically restart when you:

- Modify route handlers
- Add new route files
- Change the main application file

Route generation happens automatically via the `predev` script.

### 3. Production Build

```bash
# Generate routes and build
npm run build

# Start production server
npm start
```

## Next Steps

- [Advanced Examples](/examples/advanced.md) - Complex routing patterns
- [Project Examples](/examples/projects.md) - Complete project setups
- [Best Practices](/examples/best-practices.md) - Recommended patterns
- [API Reference](/reference/api.md) - Complete API documentation
