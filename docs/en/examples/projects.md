# Project Examples

This document provides complete project examples showcasing real-world applications of hono-filebased-route.

## Blog API Project

A complete blog API with user authentication, post management, and commenting system.

### Project Structure

```
blog-api/
├── package.json
├── tsconfig.json
├── .env.example
├── scripts/
│   └── generate-routes.ts
├── src/
│   ├── main.ts
│   ├── types/
│   │   └── index.ts
│   ├── utils/
│   │   ├── auth.ts
│   │   ├── validation.ts
│   │   └── database.ts
│   └── routes/
│       ├── index.ts
│       ├── auth/
│       │   ├── login.ts
│       │   ├── register.ts
│       │   └── refresh.ts
│       ├── users/
│       │   ├── index.ts
│       │   ├── [id].ts
│       │   └── [id]/
│       │       └── posts.ts
│       ├── posts/
│       │   ├── index.ts
│       │   ├── [id].ts
│       │   └── [id]/
│       │       └── comments.ts
│       └── admin/
│           └── [...path].ts
└── README.md
```

### Configuration Files

**package.json**

```json
{
	"name": "blog-api",
	"version": "1.0.0",
	"description": "A complete blog API using Hono file-based routing",
	"scripts": {
		"generate-routes": "tsx scripts/generate-routes.ts",
		"predev": "npm run generate-routes",
		"dev": "tsx watch src/main.ts",
		"prebuild": "npm run generate-routes",
		"build": "tsc",
		"start": "node dist/main.js",
		"test": "jest"
	},
	"dependencies": {
		"hono": "^4.0.0",
		"@hono-filebased-route/core": "^1.0.0",
		"bcryptjs": "^2.4.3",
		"jsonwebtoken": "^9.0.0",
		"zod": "^3.22.0"
	},
	"devDependencies": {
		"typescript": "^5.0.0",
		"@types/node": "^20.0.0",
		"@types/bcryptjs": "^2.4.0",
		"@types/jsonwebtoken": "^9.0.0",
		"tsx": "^4.0.0",
		"jest": "^29.0.0"
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
		"skipLibCheck": true,
		"baseUrl": ".",
		"paths": {
			"@/*": ["src/*"]
		}
	},
	"include": ["src/**/*", "scripts/**/*"]
}
```

**.env.example**

```txt
# Server Configuration
PORT=3000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# Database Configuration (if using a real database)
DATABASE_URL=postgresql://user:password@localhost:5432/blog_db

# CORS Configuration
CORS_ORIGIN=http://localhost:3000
```

### Core Types

**src/types/index.ts**

```typescript
export interface User {
	id: string
	email: string
	username: string
	password: string
	role: 'user' | 'admin'
	createdAt: string
	updatedAt: string
}

export interface Post {
	id: string
	title: string
	content: string
	excerpt: string
	authorId: string
	status: 'draft' | 'published' | 'archived'
	tags: string[]
	createdAt: string
	updatedAt: string
}

export interface Comment {
	id: string
	content: string
	postId: string
	authorId: string
	parentId?: string
	createdAt: string
	updatedAt: string
}

export interface AuthenticatedUser {
	id: string
	email: string
	username: string
	role: 'user' | 'admin'
}

export interface JWTPayload {
	userId: string
	email: string
	role: string
	iat: number
	exp: number
}
```

### Utility Functions

**src/utils/auth.ts**

```typescript
import { Context } from 'hono'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import type { AuthenticatedUser, JWTPayload } from '@/types'

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret'

export function hashPassword(password: string): string {
	return bcrypt.hashSync(password, 10)
}

export function comparePassword(password: string, hash: string): boolean {
	return bcrypt.compareSync(password, hash)
}

export function generateToken(user: AuthenticatedUser): string {
	return jwt.sign(
		{
			userId: user.id,
			email: user.email,
			role: user.role,
		},
		JWT_SECRET,
		{ expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
	)
}

export function verifyToken(token: string): JWTPayload | null {
	try {
		return jwt.verify(token, JWT_SECRET) as JWTPayload
	} catch (error) {
		return null
	}
}

export function extractTokenFromHeader(c: Context): string | null {
	const authHeader = c.req.header('Authorization')
	if (!authHeader || !authHeader.startsWith('Bearer ')) {
		return null
	}
	return authHeader.substring(7)
}

export function authenticateRequest(c: Context): AuthenticatedUser | null {
	const token = extractTokenFromHeader(c)
	if (!token) return null

	const payload = verifyToken(token)
	if (!payload) return null

	return {
		id: payload.userId,
		email: payload.email,
		username: '', // Would be fetched from database in real app
		role: payload.role as 'user' | 'admin',
	}
}

export function requireAuth(c: Context): AuthenticatedUser {
	const user = authenticateRequest(c)
	if (!user) {
		throw new Error('Authentication required')
	}
	return user
}

export function requireAdmin(c: Context): AuthenticatedUser {
	const user = requireAuth(c)
	if (user.role !== 'admin') {
		throw new Error('Admin access required')
	}
	return user
}
```

**src/utils/validation.ts**

```typescript
import { z } from 'zod'

export const registerSchema = z.object({
	email: z.string().email('Invalid email format'),
	username: z.string().min(3, 'Username must be at least 3 characters'),
	password: z.string().min(6, 'Password must be at least 6 characters'),
})

export const loginSchema = z.object({
	email: z.string().email('Invalid email format'),
	password: z.string().min(1, 'Password is required'),
})

export const createPostSchema = z.object({
	title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
	content: z.string().min(1, 'Content is required'),
	excerpt: z.string().max(500, 'Excerpt too long').optional(),
	tags: z.array(z.string()).default([]),
	status: z.enum(['draft', 'published']).default('draft'),
})

export const updatePostSchema = createPostSchema.partial()

export const createCommentSchema = z.object({
	content: z
		.string()
		.min(1, 'Content is required')
		.max(1000, 'Comment too long'),
	parentId: z.string().optional(),
})

export function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): T {
	const result = schema.safeParse(data)
	if (!result.success) {
		throw new Error(
			`Validation failed: ${result.error.errors
				.map((e) => e.message)
				.join(', ')}`
		)
	}
	return result.data
}
```

**src/utils/database.ts**

```typescript
import type { User, Post, Comment } from '@/types'

// Mock database - in a real app, this would be a proper database
class MockDatabase {
	private users: User[] = [
		{
			id: '1',
			email: 'admin@example.com',
			username: 'admin',
			password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
			role: 'admin',
			createdAt: '2024-01-01T00:00:00Z',
			updatedAt: '2024-01-01T00:00:00Z',
		},
	]

	private posts: Post[] = [
		{
			id: '1',
			title: 'Welcome to Our Blog',
			content: 'This is the first post on our blog...',
			excerpt: 'Welcome post excerpt',
			authorId: '1',
			status: 'published',
			tags: ['welcome', 'blog'],
			createdAt: '2024-01-01T00:00:00Z',
			updatedAt: '2024-01-01T00:00:00Z',
		},
	]

	private comments: Comment[] = []

	// User methods
	async findUserByEmail(email: string): Promise<User | null> {
		return this.users.find((u) => u.email === email) || null
	}

	async findUserById(id: string): Promise<User | null> {
		return this.users.find((u) => u.id === id) || null
	}

	async createUser(
		userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>
	): Promise<User> {
		const user: User = {
			...userData,
			id: String(this.users.length + 1),
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		}
		this.users.push(user)
		return user
	}

	async getAllUsers(): Promise<User[]> {
		return this.users.map((u) => ({ ...u, password: '' })) // Don't return passwords
	}

	// Post methods
	async findPostById(id: string): Promise<Post | null> {
		return this.posts.find((p) => p.id === id) || null
	}

	async findPostsByAuthor(authorId: string): Promise<Post[]> {
		return this.posts.filter((p) => p.authorId === authorId)
	}

	async getAllPosts(
		status?: 'draft' | 'published' | 'archived'
	): Promise<Post[]> {
		if (status) {
			return this.posts.filter((p) => p.status === status)
		}
		return this.posts
	}

	async createPost(
		postData: Omit<Post, 'id' | 'createdAt' | 'updatedAt'>
	): Promise<Post> {
		const post: Post = {
			...postData,
			id: String(this.posts.length + 1),
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		}
		this.posts.push(post)
		return post
	}

	async updatePost(id: string, updates: Partial<Post>): Promise<Post | null> {
		const index = this.posts.findIndex((p) => p.id === id)
		if (index === -1) return null

		this.posts[index] = {
			...this.posts[index],
			...updates,
			updatedAt: new Date().toISOString(),
		}
		return this.posts[index]
	}

	async deletePost(id: string): Promise<boolean> {
		const index = this.posts.findIndex((p) => p.id === id)
		if (index === -1) return false

		this.posts.splice(index, 1)
		return true
	}

	// Comment methods
	async findCommentsByPost(postId: string): Promise<Comment[]> {
		return this.comments.filter((c) => c.postId === postId)
	}

	async createComment(
		commentData: Omit<Comment, 'id' | 'createdAt' | 'updatedAt'>
	): Promise<Comment> {
		const comment: Comment = {
			...commentData,
			id: String(this.comments.length + 1),
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		}
		this.comments.push(comment)
		return comment
	}
}

export const db = new MockDatabase()
```

### Route Implementations

**src/routes/index.ts**

```typescript
import type { Context } from 'hono'

export const GET = async (c: Context) => {
	return c.json({
		message: 'Welcome to Blog API',
		version: '1.0.0',
		endpoints: {
			auth: {
				login: 'POST /auth/login',
				register: 'POST /auth/register',
				refresh: 'POST /auth/refresh',
			},
			users: {
				list: 'GET /users',
				profile: 'GET /users/:id',
				posts: 'GET /users/:id/posts',
			},
			posts: {
				list: 'GET /posts',
				create: 'POST /posts',
				detail: 'GET /posts/:id',
				update: 'PUT /posts/:id',
				delete: 'DELETE /posts/:id',
				comments: 'GET /posts/:id/comments',
			},
			admin: {
				dashboard: 'GET /admin',
			},
		},
		documentation: '/docs',
	})
}
```

**src/routes/auth/register.ts**

```typescript
import type { Context } from 'hono'
import { db } from '@/utils/database'
import { hashPassword, generateToken } from '@/utils/auth'
import { validateRequest, registerSchema } from '@/utils/validation'

export const POST = async (c: Context) => {
	try {
		const body = await c.req.json()
		const { email, username, password } = validateRequest(registerSchema, body)

		// Check if user already exists
		const existingUser = await db.findUserByEmail(email)
		if (existingUser) {
			return c.json({ error: 'User already exists' }, 409)
		}

		// Create new user
		const hashedPassword = hashPassword(password)
		const user = await db.createUser({
			email,
			username,
			password: hashedPassword,
			role: 'user',
		})

		// Generate token
		const token = generateToken({
			id: user.id,
			email: user.email,
			username: user.username,
			role: user.role,
		})

		return c.json(
			{
				message: 'User registered successfully',
				user: {
					id: user.id,
					email: user.email,
					username: user.username,
					role: user.role,
				},
				token,
			},
			201
		)
	} catch (error) {
		return c.json(
			{
				error: error instanceof Error ? error.message : 'Registration failed',
			},
			400
		)
	}
}
```

**src/routes/auth/login.ts**

```typescript
import type { Context } from 'hono'
import { db } from '@/utils/database'
import { comparePassword, generateToken } from '@/utils/auth'
import { validateRequest, loginSchema } from '@/utils/validation'

export const POST = async (c: Context) => {
	try {
		const body = await c.req.json()
		const { email, password } = validateRequest(loginSchema, body)

		// Find user
		const user = await db.findUserByEmail(email)
		if (!user) {
			return c.json({ error: 'Invalid credentials' }, 401)
		}

		// Verify password
		if (!comparePassword(password, user.password)) {
			return c.json({ error: 'Invalid credentials' }, 401)
		}

		// Generate token
		const token = generateToken({
			id: user.id,
			email: user.email,
			username: user.username,
			role: user.role,
		})

		return c.json({
			message: 'Login successful',
			user: {
				id: user.id,
				email: user.email,
				username: user.username,
				role: user.role,
			},
			token,
		})
	} catch (error) {
		return c.json(
			{
				error: error instanceof Error ? error.message : 'Login failed',
			},
			400
		)
	}
}
```

**src/routes/posts/index.ts**

```typescript
import type { Context } from 'hono'
import { db } from '@/utils/database'
import { requireAuth } from '@/utils/auth'
import { validateRequest, createPostSchema } from '@/utils/validation'

export const GET = async (c: Context) => {
	try {
		const status = c.req.query('status') as 'draft' | 'published' | 'archived'
		const posts = await db.getAllPosts(status)

		return c.json({
			posts,
			count: posts.length,
			filters: { status: status || 'all' },
		})
	} catch (error) {
		return c.json({ error: 'Failed to fetch posts' }, 500)
	}
}

export const POST = async (c: Context) => {
	try {
		const user = requireAuth(c)
		const body = await c.req.json()
		const postData = validateRequest(createPostSchema, body)

		// Generate excerpt if not provided
		const excerpt =
			postData.excerpt || postData.content.substring(0, 200) + '...'

		const post = await db.createPost({
			...postData,
			excerpt,
			authorId: user.id,
		})

		return c.json(
			{
				message: 'Post created successfully',
				post,
			},
			201
		)
	} catch (error) {
		if (error instanceof Error && error.message.includes('Authentication')) {
			return c.json({ error: error.message }, 401)
		}
		return c.json(
			{
				error: error instanceof Error ? error.message : 'Failed to create post',
			},
			400
		)
	}
}
```

**src/routes/posts/[id].ts**

```typescript
import type { Context } from 'hono'
import { db } from '@/utils/database'
import { authenticateRequest } from '@/utils/auth'
import { validateRequest, updatePostSchema } from '@/utils/validation'

export const GET = async (c: Context) => {
	try {
		const id = c.req.param('id')
		const post = await db.findPostById(id)

		if (!post) {
			return c.json({ error: 'Post not found' }, 404)
		}

		return c.json({ post })
	} catch (error) {
		return c.json({ error: 'Failed to fetch post' }, 500)
	}
}

export const PUT = async (c: Context) => {
	try {
		const user = authenticateRequest(c)
		if (!user) {
			return c.json({ error: 'Authentication required' }, 401)
		}

		const id = c.req.param('id')
		const post = await db.findPostById(id)

		if (!post) {
			return c.json({ error: 'Post not found' }, 404)
		}

		// Check ownership or admin
		if (post.authorId !== user.id && user.role !== 'admin') {
			return c.json({ error: 'Permission denied' }, 403)
		}

		const body = await c.req.json()
		const updates = validateRequest(updatePostSchema, body)

		const updatedPost = await db.updatePost(id, updates)

		return c.json({
			message: 'Post updated successfully',
			post: updatedPost,
		})
	} catch (error) {
		return c.json(
			{
				error: error instanceof Error ? error.message : 'Failed to update post',
			},
			400
		)
	}
}

export const DELETE = async (c: Context) => {
	try {
		const user = authenticateRequest(c)
		if (!user) {
			return c.json({ error: 'Authentication required' }, 401)
		}

		const id = c.req.param('id')
		const post = await db.findPostById(id)

		if (!post) {
			return c.json({ error: 'Post not found' }, 404)
		}

		// Check ownership or admin
		if (post.authorId !== user.id && user.role !== 'admin') {
			return c.json({ error: 'Permission denied' }, 403)
		}

		const deleted = await db.deletePost(id)

		if (!deleted) {
			return c.json({ error: 'Failed to delete post' }, 500)
		}

		return c.json({ message: 'Post deleted successfully' })
	} catch (error) {
		return c.json({ error: 'Failed to delete post' }, 500)
	}
}
```

**src/routes/posts/[id]/comments.ts**

```typescript
import type { Context } from 'hono'
import { db } from '@/utils/database'
import { requireAuth } from '@/utils/auth'
import { validateRequest, createCommentSchema } from '@/utils/validation'

export const GET = async (c: Context) => {
	try {
		const postId = c.req.param('id')

		// Verify post exists
		const post = await db.findPostById(postId)
		if (!post) {
			return c.json({ error: 'Post not found' }, 404)
		}

		const comments = await db.findCommentsByPost(postId)

		return c.json({
			comments,
			count: comments.length,
			postId,
		})
	} catch (error) {
		return c.json({ error: 'Failed to fetch comments' }, 500)
	}
}

export const POST = async (c: Context) => {
	try {
		const user = requireAuth(c)
		const postId = c.req.param('id')

		// Verify post exists
		const post = await db.findPostById(postId)
		if (!post) {
			return c.json({ error: 'Post not found' }, 404)
		}

		const body = await c.req.json()
		const commentData = validateRequest(createCommentSchema, body)

		const comment = await db.createComment({
			...commentData,
			postId,
			authorId: user.id,
		})

		return c.json(
			{
				message: 'Comment created successfully',
				comment,
			},
			201
		)
	} catch (error) {
		if (error instanceof Error && error.message.includes('Authentication')) {
			return c.json({ error: error.message }, 401)
		}
		return c.json(
			{
				error:
					error instanceof Error ? error.message : 'Failed to create comment',
			},
			400
		)
	}
}
```

**src/routes/admin/[...path].ts**

```typescript
import type { Context } from 'hono'
import { requireAdmin } from '@/utils/auth'
import { db } from '@/utils/database'

export const GET = async (c: Context, pathSegments: string[]) => {
	try {
		const user = requireAdmin(c)
		const adminPath = pathSegments.join('/')

		switch (adminPath) {
			case '':
			case 'dashboard':
				const [users, posts] = await Promise.all([
					db.getAllUsers(),
					db.getAllPosts(),
				])

				return c.json({
					dashboard: {
						stats: {
							totalUsers: users.length,
							totalPosts: posts.length,
							publishedPosts: posts.filter((p) => p.status === 'published')
								.length,
							draftPosts: posts.filter((p) => p.status === 'draft').length,
						},
						recentPosts: posts.slice(-5),
						recentUsers: users.slice(-5),
					},
					user,
				})

			case 'users':
				const allUsers = await db.getAllUsers()
				return c.json({
					users: allUsers,
					count: allUsers.length,
					user,
				})

			case 'posts':
				const allPosts = await db.getAllPosts()
				return c.json({
					posts: allPosts,
					count: allPosts.length,
					user,
				})

			default:
				return c.json(
					{
						error: 'Admin section not found',
						availableSections: ['dashboard', 'users', 'posts'],
						requestedPath: adminPath,
					},
					404
				)
		}
	} catch (error) {
		if (error instanceof Error && error.message.includes('required')) {
			return c.json({ error: error.message }, 403)
		}
		return c.json({ error: 'Admin access failed' }, 500)
	}
}
```

### Main Application

**src/main.ts**

```typescript
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { registerGeneratedRoutes } from './generated-routes'

const app = new Hono()

// Middleware
app.use('*', logger())
app.use(
	'*',
	cors({
		origin: process.env.CORS_ORIGIN || '*',
		allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
		allowHeaders: ['Content-Type', 'Authorization'],
	})
)

// Register file-based routes
registerGeneratedRoutes(app)

// Global error handler
app.onError((err, c) => {
	console.error('Global error:', err)
	return c.json(
		{
			error: 'Internal server error',
			message:
				process.env.NODE_ENV === 'development'
					? err.message
					: 'Something went wrong',
		},
		500
	)
})

// 404 handler
app.notFound((c) => {
	return c.json(
		{
			error: 'Not found',
			path: c.req.path,
			method: c.req.method,
		},
		404
	)
})

const port = parseInt(process.env.PORT || '3000')

console.log(`🚀 Blog API server starting on port ${port}`)
console.log(`📚 Environment: ${process.env.NODE_ENV || 'development'}`)

export default {
	port,
	fetch: app.fetch,
}
```

### Testing the Blog API

**test-blog-api.js**

```javascript
const BASE_URL = 'http://localhost:3000'

async function testBlogAPI() {
	console.log('🧪 Testing Blog API\n')

	let authToken = ''

	// Test registration
	console.log('📝 Testing Registration:')
	const registerResponse = await testRoute('/auth/register', 'POST', {
		email: 'test@example.com',
		username: 'testuser',
		password: 'password123',
	})

	if (registerResponse?.token) {
		authToken = registerResponse.token
		console.log('✅ Registration successful, token received')
	}

	// Test login
	console.log('\n🔐 Testing Login:')
	const loginResponse = await testRoute('/auth/login', 'POST', {
		email: 'admin@example.com',
		password: 'password',
	})

	if (loginResponse?.token) {
		authToken = loginResponse.token
		console.log('✅ Login successful, admin token received')
	}

	// Test creating a post
	console.log('\n📝 Testing Post Creation:')
	const postResponse = await testRoute(
		'/posts',
		'POST',
		{
			title: 'Test Post',
			content: 'This is a test post content...',
			tags: ['test', 'api'],
			status: 'published',
		},
		{ Authorization: `Bearer ${authToken}` }
	)

	let postId = ''
	if (postResponse?.post?.id) {
		postId = postResponse.post.id
		console.log(`✅ Post created with ID: ${postId}`)
	}

	// Test getting posts
	console.log('\n📚 Testing Get Posts:')
	await testRoute('/posts')

	// Test getting specific post
	if (postId) {
		console.log('\n📖 Testing Get Specific Post:')
		await testRoute(`/posts/${postId}`)

		// Test adding comment
		console.log('\n💬 Testing Add Comment:')
		await testRoute(
			`/posts/${postId}/comments`,
			'POST',
			{
				content: 'This is a test comment',
			},
			{ Authorization: `Bearer ${authToken}` }
		)

		// Test getting comments
		console.log('\n💬 Testing Get Comments:')
		await testRoute(`/posts/${postId}/comments`)
	}

	// Test admin dashboard
	console.log('\n👑 Testing Admin Dashboard:')
	await testRoute('/admin/dashboard', 'GET', null, {
		Authorization: `Bearer ${authToken}`,
	})

	console.log('\n✅ Blog API testing complete!')
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
			console.log('❌ Error:', data.error)
		} else {
			console.log('✅ Success')
			if (data.message) console.log('   Message:', data.message)
		}

		return data
	} catch (error) {
		console.error(`❌ Error testing ${method} ${path}:`, error.message)
		return null
	}
}

testBlogAPI()
```

## E-commerce API Project

A simplified e-commerce API with products, orders, and cart management.

### Key Features

- Product catalog management
- Shopping cart functionality
- Order processing
- User authentication
- Admin panel for inventory

### Project Structure

```
ecommerce-api/
├── src/
│   └── routes/
│       ├── index.ts
│       ├── products/
│       │   ├── index.ts
│       │   ├── [id].ts
│       │   └── categories/
│       │       └── [category].ts
│       ├── cart/
│       │   ├── index.ts
│       │   └── items/
│       │       └── [itemId].ts
│       ├── orders/
│       │   ├── index.ts
│       │   └── [id].ts
│       └── admin/
│           ├── products/
│           │   └── [...path].ts
│           └── orders/
│               └── [...path].ts
```

### Sample Route Implementation

**src/routes/products/index.ts**

```typescript
import type { Context } from 'hono'

interface Product {
	id: string
	name: string
	description: string
	price: number
	category: string
	stock: number
	images: string[]
	featured: boolean
}

// Mock products database
const products: Product[] = [
	{
		id: '1',
		name: 'Wireless Headphones',
		description: 'High-quality wireless headphones with noise cancellation',
		price: 199.99,
		category: 'electronics',
		stock: 50,
		images: ['/images/headphones-1.jpg'],
		featured: true,
	},
	{
		id: '2',
		name: 'Coffee Mug',
		description: 'Ceramic coffee mug with custom design',
		price: 15.99,
		category: 'home',
		stock: 100,
		images: ['/images/mug-1.jpg'],
		featured: false,
	},
]

export const GET = async (c: Context) => {
	try {
		const category = c.req.query('category')
		const featured = c.req.query('featured') === 'true'
		const limit = parseInt(c.req.query('limit') || '20')
		const offset = parseInt(c.req.query('offset') || '0')

		let filteredProducts = [...products]

		if (category) {
			filteredProducts = filteredProducts.filter((p) => p.category === category)
		}

		if (featured) {
			filteredProducts = filteredProducts.filter((p) => p.featured)
		}

		const paginatedProducts = filteredProducts.slice(offset, offset + limit)

		return c.json({
			products: paginatedProducts,
			pagination: {
				total: filteredProducts.length,
				limit,
				offset,
				hasMore: offset + limit < filteredProducts.length,
			},
			filters: { category, featured },
		})
	} catch (error) {
		return c.json({ error: 'Failed to fetch products' }, 500)
	}
}
```

## Real-time Chat API Project

A WebSocket-based chat API with rooms and message history.

### Key Features

- Real-time messaging
- Chat rooms
- Message history
- User presence
- File sharing

### Project Structure

```
chat-api/
├── src/
│   └── routes/
│       ├── index.ts
│       ├── rooms/
│       │   ├── index.ts
│       │   ├── [id].ts
│       │   └── [id]/
│       │       ├── messages.ts
│       │       └── members.ts
│       ├── messages/
│       │   └── [id].ts
│       └── ws/
│           └── [...path].ts
```

## Development Workflow

### 1. Setting up a new project

```bash
# Clone template or create new project
mkdir my-hono-project
cd my-hono-project

# Initialize with package.json
npm init -y

# Install dependencies
npm install hono @hono-filebased-route/core
npm install -D typescript tsx @types/node

# Create basic structure
mkdir -p src/routes scripts
touch src/main.ts scripts/generate-routes.ts

# Setup TypeScript
npx tsc --init
```

### 2. Development commands

```bash
# Generate routes and start development
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Lint code
npm run lint
```

### 3. Deployment considerations

- Environment variables configuration
- Database connection setup
- Static file serving
- CORS configuration
- Rate limiting
- Logging and monitoring

## Next Steps

- [Best Practices](/examples/best-practices.md) - Recommended patterns and conventions
- [Performance Guide](/guides/performance.md) - Optimization techniques
- [Deployment Guide](/guides/deploy.md) - Production deployment
- [API Reference](/reference/api.md) - Complete API documentation
