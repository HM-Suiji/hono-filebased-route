# Advanced Examples

This document covers advanced usage patterns and complex routing scenarios with hono-filebased-route.

## Complex Route Patterns

### 1. Multi-level Dynamic Routes

**src/routes/api/v1/users/[userId]/posts/[postId].ts**

```typescript
import type { Context } from 'hono'

interface Post {
	id: string
	userId: string
	title: string
	content: string
	createdAt: string
}

// Mock database
const posts: Post[] = [
	{
		id: '1',
		userId: '1',
		title: 'First Post',
		content: 'This is my first post',
		createdAt: '2024-01-01T00:00:00Z',
	},
	{
		id: '2',
		userId: '1',
		title: 'Second Post',
		content: 'This is my second post',
		createdAt: '2024-01-02T00:00:00Z',
	},
]

export const GET = async (c: Context) => {
	const userId = c.req.param('userId')
	const postId = c.req.param('postId')

	const post = posts.find((p) => p.id === postId && p.userId === userId)

	if (!post) {
		return c.json(
			{
				error: 'Post not found or does not belong to user',
				userId,
				postId,
			},
			404
		)
	}

	return c.json({
		post,
		meta: {
			userId,
			postId,
			path: `/api/v1/users/${userId}/posts/${postId}`,
		},
	})
}

export const PUT = async (c: Context) => {
	const userId = c.req.param('userId')
	const postId = c.req.param('postId')

	try {
		const body = await c.req.json()

		const postIndex = posts.findIndex(
			(p) => p.id === postId && p.userId === userId
		)

		if (postIndex === -1) {
			return c.json({ error: 'Post not found' }, 404)
		}

		// Update post
		posts[postIndex] = {
			...posts[postIndex],
			...body,
			id: postId, // Ensure ID doesn't change
			userId: userId, // Ensure userId doesn't change
		}

		return c.json({
			message: 'Post updated successfully',
			post: posts[postIndex],
		})
	} catch (error) {
		return c.json({ error: 'Invalid JSON body' }, 400)
	}
}

export const DELETE = async (c: Context) => {
	const userId = c.req.param('userId')
	const postId = c.req.param('postId')

	const postIndex = posts.findIndex(
		(p) => p.id === postId && p.userId === userId
	)

	if (postIndex === -1) {
		return c.json({ error: 'Post not found' }, 404)
	}

	const deletedPost = posts.splice(postIndex, 1)[0]

	return c.json({
		message: 'Post deleted successfully',
		deletedPost,
	})
}
```

### 2. Advanced Catch-all Routes with Path Processing

**src/routes/files/[...path].ts**

```typescript
import type { Context } from 'hono'
import { join, extname, basename } from 'path'

interface FileInfo {
	name: string
	path: string
	extension: string
	size?: number
	mimeType: string
}

// Mock file system
const files: Record<string, FileInfo> = {
	'documents/readme.txt': {
		name: 'readme.txt',
		path: 'documents/readme.txt',
		extension: '.txt',
		size: 1024,
		mimeType: 'text/plain',
	},
	'images/logo.png': {
		name: 'logo.png',
		path: 'images/logo.png',
		extension: '.png',
		size: 2048,
		mimeType: 'image/png',
	},
	'data/users.json': {
		name: 'users.json',
		path: 'data/users.json',
		extension: '.json',
		size: 512,
		mimeType: 'application/json',
	},
}

function getMimeType(extension: string): string {
	const mimeTypes: Record<string, string> = {
		'.txt': 'text/plain',
		'.json': 'application/json',
		'.png': 'image/png',
		'.jpg': 'image/jpeg',
		'.pdf': 'application/pdf',
		'.html': 'text/html',
		'.css': 'text/css',
		'.js': 'application/javascript',
	}
	return mimeTypes[extension] || 'application/octet-stream'
}

export const GET = async (c: Context, pathSegments: string[]) => {
	const filePath = pathSegments.join('/')

	// Handle directory listing
	if (!filePath || filePath.endsWith('/')) {
		const directory = filePath.replace(/\/$/, '')
		const filesInDirectory = Object.values(files).filter((file) => {
			if (!directory) return !file.path.includes('/')
			return (
				file.path.startsWith(directory + '/') &&
				file.path.split('/').length === directory.split('/').length + 1
			)
		})

		return c.json({
			directory: directory || 'root',
			files: filesInDirectory,
			count: filesInDirectory.length,
		})
	}

	// Handle specific file
	const file = files[filePath]

	if (!file) {
		return c.json(
			{
				error: 'File not found',
				path: filePath,
				availableFiles: Object.keys(files),
			},
			404
		)
	}

	// Set appropriate headers
	c.header('Content-Type', file.mimeType)
	c.header('Content-Length', file.size?.toString() || '0')
	c.header('Cache-Control', 'public, max-age=3600')

	// For demonstration, return file info instead of actual content
	return c.json({
		file,
		downloadUrl: `/files/${filePath}/download`,
		metadata: {
			accessed: new Date().toISOString(),
			pathSegments,
			fullPath: filePath,
		},
	})
}

export const POST = async (c: Context, pathSegments: string[]) => {
	const filePath = pathSegments.join('/')

	if (files[filePath]) {
		return c.json({ error: 'File already exists' }, 409)
	}

	try {
		const body = await c.req.json()

		if (!body.content) {
			return c.json({ error: 'File content is required' }, 400)
		}

		const extension = extname(filePath)
		const name = basename(filePath)

		const newFile: FileInfo = {
			name,
			path: filePath,
			extension,
			size: JSON.stringify(body.content).length,
			mimeType: getMimeType(extension),
		}

		files[filePath] = newFile

		return c.json(
			{
				message: 'File created successfully',
				file: newFile,
			},
			201
		)
	} catch (error) {
		return c.json({ error: 'Invalid JSON body' }, 400)
	}
}
```

### 3. API Versioning with Route Organization

**src/routes/api/v1/index.ts**

```typescript
import type { Context } from 'hono'

export const GET = async (c: Context) => {
	return c.json({
		version: 'v1',
		status: 'active',
		endpoints: {
			users: '/api/v1/users',
			posts: '/api/v1/posts',
			auth: '/api/v1/auth',
		},
		documentation: '/api/v1/docs',
		deprecated: false,
	})
}
```

**src/routes/api/v2/index.ts**

```typescript
import type { Context } from 'hono'

export const GET = async (c: Context) => {
	return c.json({
		version: 'v2',
		status: 'beta',
		endpoints: {
			users: '/api/v2/users',
			posts: '/api/v2/posts',
			auth: '/api/v2/auth',
			analytics: '/api/v2/analytics', // New in v2
		},
		documentation: '/api/v2/docs',
		deprecated: false,
		changes: [
			'Added analytics endpoint',
			'Improved error responses',
			'Enhanced authentication',
		],
	})
}
```

## Middleware Integration Patterns

### 1. Authentication Middleware Simulation

**src/routes/admin/[...path].ts**

```typescript
import type { Context } from 'hono'

interface AuthenticatedUser {
	id: string
	email: string
	role: 'admin' | 'user'
}

// Simulate authentication check
function authenticateRequest(c: Context): AuthenticatedUser | null {
	const authHeader = c.req.header('Authorization')

	if (!authHeader || !authHeader.startsWith('Bearer ')) {
		return null
	}

	const token = authHeader.substring(7)

	// Mock token validation
	if (token === 'admin-token') {
		return {
			id: '1',
			email: 'admin@example.com',
			role: 'admin',
		}
	}

	return null
}

function requireAdmin(user: AuthenticatedUser | null): boolean {
	return user?.role === 'admin'
}

export const GET = async (c: Context, pathSegments: string[]) => {
	// Authentication check
	const user = authenticateRequest(c)

	if (!user) {
		return c.json({ error: 'Authentication required' }, 401)
	}

	if (!requireAdmin(user)) {
		return c.json({ error: 'Admin access required' }, 403)
	}

	const adminPath = pathSegments.join('/')

	// Admin-specific logic based on path
	switch (adminPath) {
		case 'users':
			return c.json({
				section: 'User Management',
				actions: ['list', 'create', 'update', 'delete'],
				user,
			})

		case 'settings':
			return c.json({
				section: 'System Settings',
				settings: {
					maintenance: false,
					debug: true,
					maxUsers: 1000,
				},
				user,
			})

		case 'logs':
			return c.json({
				section: 'System Logs',
				logs: [
					{
						level: 'info',
						message: 'Server started',
						timestamp: '2024-01-01T00:00:00Z',
					},
					{
						level: 'warn',
						message: 'High memory usage',
						timestamp: '2024-01-01T01:00:00Z',
					},
				],
				user,
			})

		default:
			return c.json({
				section: 'Admin Dashboard',
				availableSections: ['users', 'settings', 'logs'],
				path: adminPath,
				user,
			})
	}
}

export const POST = async (c: Context, pathSegments: string[]) => {
	const user = authenticateRequest(c)

	if (!user || !requireAdmin(user)) {
		return c.json({ error: 'Admin access required' }, 403)
	}

	try {
		const body = await c.req.json()
		const adminPath = pathSegments.join('/')

		return c.json({
			message: `Admin action performed on ${adminPath}`,
			action: body,
			user: user.email,
			timestamp: new Date().toISOString(),
		})
	} catch (error) {
		return c.json({ error: 'Invalid JSON body' }, 400)
	}
}
```

### 2. Rate Limiting Simulation

**src/routes/api/limited/[endpoint].ts**

```typescript
import type { Context } from 'hono'

interface RateLimitInfo {
	requests: number
	resetTime: number
	limit: number
}

// Mock rate limiting store
const rateLimits = new Map<string, RateLimitInfo>()

function getRateLimitKey(c: Context): string {
	// In real implementation, you might use IP address or user ID
	return c.req.header('x-client-id') || 'anonymous'
}

function checkRateLimit(
	key: string,
	limit: number = 10,
	windowMs: number = 60000
): {
	allowed: boolean
	remaining: number
	resetTime: number
} {
	const now = Date.now()
	const current = rateLimits.get(key)

	if (!current || now > current.resetTime) {
		// Reset or initialize
		rateLimits.set(key, {
			requests: 1,
			resetTime: now + windowMs,
			limit,
		})
		return {
			allowed: true,
			remaining: limit - 1,
			resetTime: now + windowMs,
		}
	}

	if (current.requests >= limit) {
		return {
			allowed: false,
			remaining: 0,
			resetTime: current.resetTime,
		}
	}

	current.requests++
	return {
		allowed: true,
		remaining: limit - current.requests,
		resetTime: current.resetTime,
	}
}

export const GET = async (c: Context) => {
	const endpoint = c.req.param('endpoint')
	const clientKey = getRateLimitKey(c)

	// Different limits for different endpoints
	const limits: Record<string, number> = {
		search: 5,
		upload: 2,
		download: 10,
		default: 10,
	}

	const limit = limits[endpoint] || limits.default
	const rateCheck = checkRateLimit(clientKey, limit)

	// Set rate limit headers
	c.header('X-RateLimit-Limit', limit.toString())
	c.header('X-RateLimit-Remaining', rateCheck.remaining.toString())
	c.header(
		'X-RateLimit-Reset',
		Math.ceil(rateCheck.resetTime / 1000).toString()
	)

	if (!rateCheck.allowed) {
		return c.json(
			{
				error: 'Rate limit exceeded',
				limit,
				resetTime: new Date(rateCheck.resetTime).toISOString(),
			},
			429
		)
	}

	// Simulate endpoint-specific logic
	const responses: Record<string, any> = {
		search: {
			results: ['result1', 'result2', 'result3'],
			query: c.req.query('q') || 'default',
		},
		upload: {
			message: 'Upload endpoint ready',
			maxSize: '10MB',
		},
		download: {
			message: 'Download endpoint ready',
			availableFiles: ['file1.txt', 'file2.pdf'],
		},
	}

	return c.json({
		endpoint,
		data: responses[endpoint] || { message: `Endpoint ${endpoint} accessed` },
		rateLimit: {
			remaining: rateCheck.remaining,
			resetTime: new Date(rateCheck.resetTime).toISOString(),
		},
	})
}
```

## Error Handling Patterns

### 1. Structured Error Responses

**src/routes/api/errors/[type].ts**

```typescript
import type { Context } from 'hono'

interface ApiError {
	code: string
	message: string
	details?: any
	timestamp: string
	path: string
}

function createError(
	code: string,
	message: string,
	details?: any,
	path?: string
): ApiError {
	return {
		code,
		message,
		details,
		timestamp: new Date().toISOString(),
		path: path || 'unknown',
	}
}

export const GET = async (c: Context) => {
	const errorType = c.req.param('type')
	const path = c.req.path

	switch (errorType) {
		case 'validation':
			return c.json(
				{
					error: createError(
						'VALIDATION_ERROR',
						'Input validation failed',
						{
							field: 'email',
							reason: 'Invalid email format',
							received: 'invalid-email',
						},
						path
					),
				},
				400
			)

		case 'not-found':
			return c.json(
				{
					error: createError(
						'RESOURCE_NOT_FOUND',
						'The requested resource was not found',
						{
							resource: 'user',
							id: '123',
						},
						path
					),
				},
				404
			)

		case 'unauthorized':
			return c.json(
				{
					error: createError(
						'UNAUTHORIZED',
						'Authentication required',
						{
							requiredAuth: 'Bearer token',
							provided: 'none',
						},
						path
					),
				},
				401
			)

		case 'forbidden':
			return c.json(
				{
					error: createError(
						'FORBIDDEN',
						'Insufficient permissions',
						{
							required: 'admin',
							current: 'user',
						},
						path
					),
				},
				403
			)

		case 'server':
			return c.json(
				{
					error: createError(
						'INTERNAL_SERVER_ERROR',
						'An unexpected error occurred',
						{
							errorId: 'err_' + Math.random().toString(36).substr(2, 9),
						},
						path
					),
				},
				500
			)

		default:
			return c.json({
				availableErrorTypes: [
					'validation',
					'not-found',
					'unauthorized',
					'forbidden',
					'server',
				],
				example: `/api/errors/validation`,
			})
	}
}
```

## Data Processing Patterns

### 1. Pagination and Filtering

**src/routes/api/data/[collection].ts**

```typescript
import type { Context } from 'hono'

interface PaginationParams {
	page: number
	limit: number
	offset: number
}

interface FilterParams {
	search?: string
	category?: string
	status?: string
	sortBy?: string
	sortOrder?: 'asc' | 'desc'
}

interface PaginatedResponse<T> {
	data: T[]
	pagination: {
		page: number
		limit: number
		total: number
		totalPages: number
		hasNext: boolean
		hasPrev: boolean
	}
	filters: FilterParams
}

// Mock data collections
const collections: Record<string, any[]> = {
	products: [
		{
			id: 1,
			name: 'Laptop',
			category: 'electronics',
			status: 'active',
			price: 999,
		},
		{
			id: 2,
			name: 'Phone',
			category: 'electronics',
			status: 'active',
			price: 599,
		},
		{ id: 3, name: 'Book', category: 'books', status: 'inactive', price: 29 },
		{
			id: 4,
			name: 'Tablet',
			category: 'electronics',
			status: 'active',
			price: 399,
		},
		{ id: 5, name: 'Magazine', category: 'books', status: 'active', price: 9 },
	],
	users: [
		{ id: 1, name: 'Alice', email: 'alice@example.com', status: 'active' },
		{ id: 2, name: 'Bob', email: 'bob@example.com', status: 'inactive' },
		{ id: 3, name: 'Charlie', email: 'charlie@example.com', status: 'active' },
	],
}

function parsePaginationParams(c: Context): PaginationParams {
	const page = Math.max(1, parseInt(c.req.query('page') || '1'))
	const limit = Math.min(
		100,
		Math.max(1, parseInt(c.req.query('limit') || '10'))
	)
	const offset = (page - 1) * limit

	return { page, limit, offset }
}

function parseFilterParams(c: Context): FilterParams {
	return {
		search: c.req.query('search'),
		category: c.req.query('category'),
		status: c.req.query('status'),
		sortBy: c.req.query('sortBy'),
		sortOrder: (c.req.query('sortOrder') as 'asc' | 'desc') || 'asc',
	}
}

function applyFilters(data: any[], filters: FilterParams): any[] {
	let filtered = [...data]

	if (filters.search) {
		const search = filters.search.toLowerCase()
		filtered = filtered.filter((item) =>
			Object.values(item).some((value) =>
				String(value).toLowerCase().includes(search)
			)
		)
	}

	if (filters.category) {
		filtered = filtered.filter((item) => item.category === filters.category)
	}

	if (filters.status) {
		filtered = filtered.filter((item) => item.status === filters.status)
	}

	if (filters.sortBy) {
		filtered.sort((a, b) => {
			const aVal = a[filters.sortBy!]
			const bVal = b[filters.sortBy!]

			if (filters.sortOrder === 'desc') {
				return aVal < bVal ? 1 : aVal > bVal ? -1 : 0
			}
			return aVal > bVal ? 1 : aVal < bVal ? -1 : 0
		})
	}

	return filtered
}

export const GET = async (c: Context) => {
	const collection = c.req.param('collection')

	if (!collections[collection]) {
		return c.json(
			{
				error: 'Collection not found',
				availableCollections: Object.keys(collections),
			},
			404
		)
	}

	const pagination = parsePaginationParams(c)
	const filters = parseFilterParams(c)

	// Apply filters
	const filteredData = applyFilters(collections[collection], filters)

	// Apply pagination
	const paginatedData = filteredData.slice(
		pagination.offset,
		pagination.offset + pagination.limit
	)

	const response: PaginatedResponse<any> = {
		data: paginatedData,
		pagination: {
			page: pagination.page,
			limit: pagination.limit,
			total: filteredData.length,
			totalPages: Math.ceil(filteredData.length / pagination.limit),
			hasNext: pagination.offset + pagination.limit < filteredData.length,
			hasPrev: pagination.page > 1,
		},
		filters,
	}

	return c.json(response)
}
```

## Testing Advanced Routes

### Comprehensive Test Script

**test-advanced.js**

```javascript
const BASE_URL = 'http://localhost:3000'

async function testAdvancedRoutes() {
	console.log('🧪 Testing Advanced Routes\n')

	// Test multi-level dynamic routes
	console.log('📁 Multi-level Dynamic Routes:')
	await testRoute('/api/v1/users/1/posts/1')
	await testRoute('/api/v1/users/1/posts/999') // Not found

	// Test catch-all with path processing
	console.log('📂 Catch-all Routes:')
	await testRoute('/files/documents/readme.txt')
	await testRoute('/files/images/')
	await testRoute('/files/nonexistent/file.txt')

	// Test API versioning
	console.log('🔄 API Versioning:')
	await testRoute('/api/v1')
	await testRoute('/api/v2')

	// Test authentication simulation
	console.log('🔐 Authentication:')
	await testRoute('/admin/users', 'GET', null, {
		Authorization: 'Bearer admin-token',
	})
	await testRoute('/admin/users', 'GET') // No auth

	// Test rate limiting
	console.log('⏱️ Rate Limiting:')
	for (let i = 0; i < 7; i++) {
		await testRoute('/api/limited/search', 'GET', null, {
			'x-client-id': 'test-client',
		})
	}

	// Test error handling
	console.log('❌ Error Handling:')
	await testRoute('/api/errors/validation')
	await testRoute('/api/errors/not-found')

	// Test data processing
	console.log('📊 Data Processing:')
	await testRoute('/api/data/products?page=1&limit=3')
	await testRoute(
		'/api/data/products?category=electronics&sortBy=price&sortOrder=desc'
	)
	await testRoute('/api/data/products?search=book')

	console.log('✅ Advanced testing complete!')
}

async function testRoute(path, method = 'GET', body = null, headers = {}) {
	try {
		const options = { method, headers }
		if (body) {
			options.headers['Content-Type'] = 'application/json'
			options.body = JSON.stringify(body)
		}

		const response = await fetch(`${BASE_URL}${path}`, options)
		const data = await response.json()

		console.log(`${method} ${path}: ${response.status}`)
		if (response.status >= 400) {
			console.log('Error:', data.error?.message || data.error)
		} else {
			console.log('Success:', Object.keys(data).join(', '))
		}
		console.log('---')
	} catch (error) {
		console.error(`Error testing ${method} ${path}:`, error.message)
	}
}

testAdvancedRoutes()
```

## Performance Considerations

### 1. Response Caching Patterns

**src/routes/api/cached/[resource].ts**

```typescript
import type { Context } from 'hono'

interface CacheEntry {
	data: any
	timestamp: number
	ttl: number
}

// Simple in-memory cache
const cache = new Map<string, CacheEntry>()

function getCacheKey(resource: string, query: string): string {
	return `${resource}:${query}`
}

function isCacheValid(entry: CacheEntry): boolean {
	return Date.now() - entry.timestamp < entry.ttl
}

function setCache(key: string, data: any, ttlMs: number = 300000): void {
	cache.set(key, {
		data,
		timestamp: Date.now(),
		ttl: ttlMs,
	})
}

function getCache(key: string): any | null {
	const entry = cache.get(key)
	if (entry && isCacheValid(entry)) {
		return entry.data
	}
	if (entry) {
		cache.delete(key) // Remove expired entry
	}
	return null
}

export const GET = async (c: Context) => {
	const resource = c.req.param('resource')
	const queryString = c.req.url.split('?')[1] || ''
	const cacheKey = getCacheKey(resource, queryString)

	// Check cache first
	const cached = getCache(cacheKey)
	if (cached) {
		c.header('X-Cache', 'HIT')
		c.header('Cache-Control', 'public, max-age=300')
		return c.json({
			...cached,
			meta: {
				cached: true,
				timestamp: new Date().toISOString(),
			},
		})
	}

	// Simulate expensive operation
	await new Promise((resolve) => setTimeout(resolve, 100))

	const data = {
		resource,
		query: queryString,
		data: `Expensive computation result for ${resource}`,
		computedAt: new Date().toISOString(),
	}

	// Cache the result
	setCache(cacheKey, data)

	c.header('X-Cache', 'MISS')
	c.header('Cache-Control', 'public, max-age=300')

	return c.json({
		...data,
		meta: {
			cached: false,
			timestamp: new Date().toISOString(),
		},
	})
}
```

## Next Steps

- [Project Examples](/examples/projects.md) - Complete project setups
- [Best Practices](/examples/best-practices.md) - Recommended patterns
- [Performance Guide](/guides/performance.md) - Optimization techniques
- [API Reference](/reference/api.md) - Complete API documentation
