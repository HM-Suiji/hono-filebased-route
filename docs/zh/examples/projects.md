# 项目示例

本文档提供了展示 hono-filebased-route 实际应用的完整项目示例。

## 博客 API 项目

一个完整的博客 API，包含用户认证、文章管理和评论系统。

### 项目结构

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

### 配置文件

**package.json**

```json
{
	"name": "blog-api",
	"version": "1.0.0",
	"description": "使用 Hono 基于文件路由的完整博客 API",
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
# 服务器配置
PORT=3000
NODE_ENV=development

# JWT 配置
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# 数据库配置（如果使用真实数据库）
DATABASE_URL=postgresql://user:password@localhost:5432/blog_db

# CORS 配置
CORS_ORIGIN=http://localhost:3000
```

### 核心类型

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

### 工具函数

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
		username: '', // 在真实应用中会从数据库获取
		role: payload.role as 'user' | 'admin',
	}
}

export function requireAuth(c: Context): AuthenticatedUser {
	const user = authenticateRequest(c)
	if (!user) {
		throw new Error('需要身份验证')
	}
	return user
}

export function requireAdmin(c: Context): AuthenticatedUser {
	const user = requireAuth(c)
	if (user.role !== 'admin') {
		throw new Error('需要管理员权限')
	}
	return user
}
```

**src/utils/validation.ts**

```typescript
import { z } from 'zod'

export const registerSchema = z.object({
	email: z.string().email('无效的邮箱格式'),
	username: z.string().min(3, '用户名至少需要3个字符'),
	password: z.string().min(6, '密码至少需要6个字符'),
})

export const loginSchema = z.object({
	email: z.string().email('无效的邮箱格式'),
	password: z.string().min(1, '密码是必需的'),
})

export const createPostSchema = z.object({
	title: z.string().min(1, '标题是必需的').max(200, '标题太长'),
	content: z.string().min(1, '内容是必需的'),
	excerpt: z.string().max(500, '摘要太长').optional(),
	tags: z.array(z.string()).default([]),
	status: z.enum(['draft', 'published']).default('draft'),
})

export const updatePostSchema = createPostSchema.partial()

export const createCommentSchema = z.object({
	content: z.string().min(1, '内容是必需的').max(1000, '评论太长'),
	parentId: z.string().optional(),
})

export function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): T {
	const result = schema.safeParse(data)
	if (!result.success) {
		throw new Error(
			`验证失败: ${result.error.errors.map((e) => e.message).join(', ')}`
		)
	}
	return result.data
}
```

**src/utils/database.ts**

```typescript
import type { User, Post, Comment } from '@/types'

// 模拟数据库 - 在真实应用中，这将是一个真正的数据库
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
			title: '欢迎来到我们的博客',
			content: '这是我们博客的第一篇文章...',
			excerpt: '欢迎文章摘要',
			authorId: '1',
			status: 'published',
			tags: ['欢迎', '博客'],
			createdAt: '2024-01-01T00:00:00Z',
			updatedAt: '2024-01-01T00:00:00Z',
		},
	]

	private comments: Comment[] = []

	// 用户方法
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
		return this.users.map((u) => ({ ...u, password: '' })) // 不返回密码
	}

	// 文章方法
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

	// 评论方法
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

### 路由实现

**src/routes/index.ts**

```typescript
import type { Context } from 'hono'

export const GET = async (c: Context) => {
	return c.json({
		message: '欢迎使用博客 API',
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

		// 检查用户是否已存在
		const existingUser = await db.findUserByEmail(email)
		if (existingUser) {
			return c.json({ error: '用户已存在' }, 409)
		}

		// 创建新用户
		const hashedPassword = hashPassword(password)
		const user = await db.createUser({
			email,
			username,
			password: hashedPassword,
			role: 'user',
		})

		// 生成令牌
		const token = generateToken({
			id: user.id,
			email: user.email,
			username: user.username,
			role: user.role,
		})

		return c.json(
			{
				message: '用户注册成功',
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
				error: error instanceof Error ? error.message : '注册失败',
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

		// 查找用户
		const user = await db.findUserByEmail(email)
		if (!user) {
			return c.json({ error: '无效的凭据' }, 401)
		}

		// 验证密码
		if (!comparePassword(password, user.password)) {
			return c.json({ error: '无效的凭据' }, 401)
		}

		// 生成令牌
		const token = generateToken({
			id: user.id,
			email: user.email,
			username: user.username,
			role: user.role,
		})

		return c.json({
			message: '登录成功',
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
				error: error instanceof Error ? error.message : '登录失败',
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
		return c.json({ error: '获取文章失败' }, 500)
	}
}

export const POST = async (c: Context) => {
	try {
		const user = requireAuth(c)
		const body = await c.req.json()
		const postData = validateRequest(createPostSchema, body)

		// 如果没有提供摘要，则生成摘要
		const excerpt =
			postData.excerpt || postData.content.substring(0, 200) + '...'

		const post = await db.createPost({
			...postData,
			excerpt,
			authorId: user.id,
		})

		return c.json(
			{
				message: '文章创建成功',
				post,
			},
			201
		)
	} catch (error) {
		if (error instanceof Error && error.message.includes('身份验证')) {
			return c.json({ error: error.message }, 401)
		}
		return c.json(
			{
				error: error instanceof Error ? error.message : '创建文章失败',
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
			return c.json({ error: '文章未找到' }, 404)
		}

		return c.json({ post })
	} catch (error) {
		return c.json({ error: '获取文章失败' }, 500)
	}
}

export const PUT = async (c: Context) => {
	try {
		const user = authenticateRequest(c)
		if (!user) {
			return c.json({ error: '需要身份验证' }, 401)
		}

		const id = c.req.param('id')
		const post = await db.findPostById(id)

		if (!post) {
			return c.json({ error: '文章未找到' }, 404)
		}

		// 检查所有权或管理员权限
		if (post.authorId !== user.id && user.role !== 'admin') {
			return c.json({ error: '权限被拒绝' }, 403)
		}

		const body = await c.req.json()
		const updates = validateRequest(updatePostSchema, body)

		const updatedPost = await db.updatePost(id, updates)

		return c.json({
			message: '文章更新成功',
			post: updatedPost,
		})
	} catch (error) {
		return c.json(
			{
				error: error instanceof Error ? error.message : '更新文章失败',
			},
			400
		)
	}
}

export const DELETE = async (c: Context) => {
	try {
		const user = authenticateRequest(c)
		if (!user) {
			return c.json({ error: '需要身份验证' }, 401)
		}

		const id = c.req.param('id')
		const post = await db.findPostById(id)

		if (!post) {
			return c.json({ error: '文章未找到' }, 404)
		}

		// 检查所有权或管理员权限
		if (post.authorId !== user.id && user.role !== 'admin') {
			return c.json({ error: '权限被拒绝' }, 403)
		}

		const deleted = await db.deletePost(id)

		if (!deleted) {
			return c.json({ error: '删除文章失败' }, 500)
		}

		return c.json({ message: '文章删除成功' })
	} catch (error) {
		return c.json({ error: '删除文章失败' }, 500)
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

		// 验证文章是否存在
		const post = await db.findPostById(postId)
		if (!post) {
			return c.json({ error: '文章未找到' }, 404)
		}

		const comments = await db.findCommentsByPost(postId)

		return c.json({
			comments,
			count: comments.length,
			postId,
		})
	} catch (error) {
		return c.json({ error: '获取评论失败' }, 500)
	}
}

export const POST = async (c: Context) => {
	try {
		const user = requireAuth(c)
		const postId = c.req.param('id')

		// 验证文章是否存在
		const post = await db.findPostById(postId)
		if (!post) {
			return c.json({ error: '文章未找到' }, 404)
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
				message: '评论创建成功',
				comment,
			},
			201
		)
	} catch (error) {
		if (error instanceof Error && error.message.includes('身份验证')) {
			return c.json({ error: error.message }, 401)
		}
		return c.json(
			{
				error: error instanceof Error ? error.message : '创建评论失败',
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
						error: '管理员部分未找到',
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
		return c.json({ error: '管理员访问失败' }, 500)
	}
}
```

### 主应用程序

**src/main.ts**

```typescript
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { registerGeneratedRoutes } from './generated-routes'

const app = new Hono()

// 中间件
app.use('*', logger())
app.use(
	'*',
	cors({
		origin: process.env.CORS_ORIGIN || '*',
		allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
		allowHeaders: ['Content-Type', 'Authorization'],
	})
)

// 注册基于文件的路由
registerGeneratedRoutes(app)

// 全局错误处理器
app.onError((err, c) => {
	console.error('全局错误:', err)
	return c.json(
		{
			error: '内部服务器错误',
			message:
				process.env.NODE_ENV === 'development' ? err.message : '出现了问题',
		},
		500
	)
})

// 404 处理器
app.notFound((c) => {
	return c.json(
		{
			error: '未找到',
			path: c.req.path,
			method: c.req.method,
		},
		404
	)
})

const port = parseInt(process.env.PORT || '3000')

console.log(`🚀 博客 API 服务器在端口 ${port} 上启动`)
console.log(`📚 环境: ${process.env.NODE_ENV || 'development'}`)

export default {
	port,
	fetch: app.fetch,
}
```

### 测试博客 API

**test-blog-api.js**

```javascript
const BASE_URL = 'http://localhost:3000'

async function testBlogAPI() {
	console.log('🧪 测试博客 API\n')

	let authToken = ''

	// 测试注册
	console.log('📝 测试注册:')
	const registerResponse = await testRoute('/auth/register', 'POST', {
		email: 'test@example.com',
		username: 'testuser',
		password: 'password123',
	})

	if (registerResponse?.token) {
		authToken = registerResponse.token
		console.log('✅ 注册成功，收到令牌')
	}

	// 测试登录
	console.log('\n🔐 测试登录:')
	const loginResponse = await testRoute('/auth/login', 'POST', {
		email: 'admin@example.com',
		password: 'password',
	})

	if (loginResponse?.token) {
		authToken = loginResponse.token
		console.log('✅ 登录成功，收到管理员令牌')
	}

	// 测试创建文章
	console.log('\n📝 测试文章创建:')
	const postResponse = await testRoute(
		'/posts',
		'POST',
		{
			title: '测试文章',
			content: '这是一篇测试文章的内容...',
			tags: ['测试', 'api'],
			status: 'published',
		},
		{ Authorization: `Bearer ${authToken}` }
	)

	let postId = ''
	if (postResponse?.post?.id) {
		postId = postResponse.post.id
		console.log(`✅ 文章创建成功，ID: ${postId}`)
	}

	// 测试获取文章
	console.log('\n📚 测试获取文章:')
	await testRoute('/posts')

	// 测试获取特定文章
	if (postId) {
		console.log('\n📖 测试获取特定文章:')
		await testRoute(`/posts/${postId}`)

		// 测试添加评论
		console.log('\n💬 测试添加评论:')
		await testRoute(
			`/posts/${postId}/comments`,
			'POST',
			{
				content: '这是一条测试评论',
			},
			{ Authorization: `Bearer ${authToken}` }
		)

		// 测试获取评论
		console.log('\n💬 测试获取评论:')
		await testRoute(`/posts/${postId}/comments`)
	}

	// 测试管理员仪表板
	console.log('\n👑 测试管理员仪表板:')
	await testRoute('/admin/dashboard', 'GET', null, {
		Authorization: `Bearer ${authToken}`,
	})

	console.log('\n✅ 博客 API 测试完成！')
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
			console.log('❌ 错误:', data.error)
		} else {
			console.log('✅ 成功')
			if (data.message) console.log('   消息:', data.message)
		}

		return data
	} catch (error) {
		console.error(`❌ 测试 ${method} ${path} 时出错:`, error.message)
		return null
	}
}

testBlogAPI()
```

## 电商 API 项目

一个简化的电商 API，包含产品、订单和购物车管理。

### 主要功能

- 产品目录管理
- 购物车功能
- 订单处理
- 用户认证
- 库存管理后台

### 项目结构

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

### 示例路由实现

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

// 模拟产品数据库
const products: Product[] = [
	{
		id: '1',
		name: '无线耳机',
		description: '高品质无线耳机，具有降噪功能',
		price: 199.99,
		category: 'electronics',
		stock: 50,
		images: ['/images/headphones-1.jpg'],
		featured: true,
	},
	{
		id: '2',
		name: '咖啡杯',
		description: '定制设计的陶瓷咖啡杯',
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
		return c.json({ error: '获取产品失败' }, 500)
	}
}
```

## 实时聊天 API 项目

基于 WebSocket 的聊天 API，包含房间和消息历史。

### 主要功能

- 实时消息传递
- 聊天室
- 消息历史
- 用户在线状态
- 文件分享

### 项目结构

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

## 开发工作流

### 1. 设置新项目

```bash
# 克隆模板或创建新项目
mkdir my-hono-project
cd my-hono-project

# 使用 package.json 初始化
npm init -y

# 安装依赖
npm install hono @hono-filebased-route/core
npm install -D typescript tsx @types/node

# 创建基本结构
mkdir -p src/routes scripts
touch src/main.ts scripts/generate-routes.ts

# 设置 TypeScript
npx tsc --init
```

### 2. 开发命令

```bash
# 生成路由并启动开发
npm run dev

# 构建生产版本
npm run build

# 运行测试
npm test

# 代码检查
npm run lint
```

### 3. 部署考虑

- 环境变量配置
- 数据库连接设置
- 静态文件服务
- CORS 配置
- 速率限制
- 日志记录和监控

## 下一步

- [最佳实践](/zh/examples/best-practices.md) - 推荐的模式和约定
- [性能指南](/zh/guides/performance.md) - 优化技术
- [部署指南](/zh/guides/deploy.md) - 生产部署
- [API 参考](/zh/reference/api.md) - 完整 API 文档
