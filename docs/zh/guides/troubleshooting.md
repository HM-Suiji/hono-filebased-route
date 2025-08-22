# 故障排除指南

本指南涵盖了在使用 hono-filebased-route 时可能遇到的常见问题及其解决方案。

## 目录

- [路由生成问题](#路由生成问题)
- [运行时错误](#运行时错误)
- [性能问题](#性能问题)
- [开发环境](#开发环境)
- [构建和部署](#构建和部署)
- [数据库和外部服务](#数据库和外部服务)
- [安全问题](#安全问题)
- [调试工具](#调试工具)

## 路由生成问题

### 路由未被生成

**问题**：路由生成脚本没有为您的文件创建路由。

**症状**：

- 空的或缺失的 `generated-routes.ts` 文件
- 现有路由文件出现 404 错误
- 路由未在应用程序中显示

**解决方案**：

1. **检查文件命名约定**：

   ```bash
   # 正确命名
   src/routes/users/[id].ts     ✓
   src/routes/api/posts.ts      ✓

   # 错误命名
   src/routes/users/id.ts       ✗ (缺少方括号)
   src/routes/api/posts.js      ✗ (错误的扩展名)
   ```

2. **验证导出格式**：

   ```typescript
   // 正确的导出
   export const GET = async (c: Context) => {
   	/* ... */
   }
   export const POST = async (c: Context) => {
   	/* ... */
   }

   // 错误的导出
   export default function handler() {
   	/* ... */
   } // ✗
   const GET = async (c: Context) => {
   	/* ... */
   } // ✗ (未导出)
   ```

3. **检查路由生成脚本**：

   ```bash
   # 使用详细输出运行
   DEBUG=route-generator npm run generate-routes

   # 检查脚本是否存在
   ls -la scripts/generate-routes.ts
   ```

4. **验证文件权限**：

   ```bash
   # 检查读取权限
   find src/routes -name "*.ts" -not -readable

   # 如需要，修复权限
   chmod -R 644 src/routes/**/*.ts
   ```

### 动态路由不工作

**问题**：像 `[id].ts` 或 `[...slug].ts` 这样的动态路由无法正确匹配。

**调试步骤**：

1. **检查参数提取**：

   ```typescript
   // 在您的路由处理器中
   export const GET = async (c: Context) => {
   	console.log('路由参数:', c.req.param()) // 调试输出
   	const id = c.req.param('id')
   	console.log('ID 参数:', id)

   	if (!id) {
   		return c.json({ error: '缺少 ID 参数' }, 400)
   	}

   	// 您的逻辑在这里
   }
   ```

2. **验证路由模式生成**：

   ```typescript
   // 检查生成的路由文件
   // 应该包含类似的模式：
   app.get('/users/:id', handler)
   app.get('/posts/*', catchAllHandler)
   ```

3. **测试路由匹配**：
   ```bash
   # 使用 curl 测试
   curl -v http://localhost:3000/users/123
   curl -v http://localhost:3000/posts/2023/12/my-post
   ```

### 路由优先级问题

**问题**：路由以错误的顺序匹配（例如，捕获所有路由覆盖特定路由）。

**解决方案**：确保生成脚本中的路由排序正确：

```typescript
// scripts/generate-routes.ts
function sortRoutes(routes: RouteInfo[]): RouteInfo[] {
	return routes.sort((a, b) => {
		// 静态路由优先
		const aStatic = !a.pattern.includes(':')
		const bStatic = !b.pattern.includes(':')

		if (aStatic && !bStatic) return -1
		if (!aStatic && bStatic) return 1

		// 更具体的路由优先
		const aSegments = a.pattern.split('/').length
		const bSegments = b.pattern.split('/').length

		if (aSegments !== bSegments) {
			return bSegments - aSegments
		}

		// 捕获所有路由最后
		if (a.pattern.includes('*') && !b.pattern.includes('*')) return 1
		if (!a.pattern.includes('*') && b.pattern.includes('*')) return -1

		return a.pattern.localeCompare(b.pattern)
	})
}
```

## 运行时错误

### "Cannot read property of undefined" 错误

**问题**：访问请求数据时出现常见的运行时错误。

**常见原因和解决方案**：

1. **缺少请求体解析**：

   ```typescript
   // 问题
   export const POST = async (c: Context) => {
   	const data = c.req.json() // ✗ 缺少 await
   	return c.json(data)
   }

   // 解决方案
   export const POST = async (c: Context) => {
   	const data = await c.req.json() // ✓ 正确的异步处理
   	return c.json(data)
   }
   ```

2. **未定义的路由参数**：

   ```typescript
   // 添加参数验证
   export const GET = async (c: Context) => {
   	const id = c.req.param('id')

   	if (!id) {
   		return c.json({ error: '需要 ID 参数' }, 400)
   	}

   	// 在这里安全使用 id
   	return c.json({ id })
   }
   ```

3. **缺少错误边界**：
   ```typescript
   // 添加 try-catch 块
   export const GET = async (c: Context) => {
   	try {
   		const data = await someAsyncOperation()
   		return c.json(data)
   	} catch (error) {
   		console.error('路由错误:', error)
   		return c.json({ error: '内部服务器错误' }, 500)
   	}
   }
   ```

### 内存泄漏

**问题**：应用程序内存使用量随时间增长。

**调试**：

1. **监控内存使用**：

   ```typescript
   // 添加到您的健康检查端点
   const memoryUsage = process.memoryUsage()
   console.log('内存使用:', {
   	rss: Math.round(memoryUsage.rss / 1024 / 1024) + 'MB',
   	heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + 'MB',
   	heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024) + 'MB',
   })
   ```

2. **检查未关闭的资源**：

   ```typescript
   // 数据库连接
   export const GET = async (c: Context) => {
   	const connection = await db.getConnection()
   	try {
   		const result = await connection.query('SELECT * FROM users')
   		return c.json(result)
   	} finally {
   		connection.release() // 始终释放连接
   	}
   }

   // 文件句柄
   import { promises as fs } from 'fs'

   export const GET = async (c: Context) => {
   	let fileHandle
   	try {
   		fileHandle = await fs.open('data.txt', 'r')
   		const data = await fileHandle.readFile('utf8')
   		return c.text(data)
   	} finally {
   		await fileHandle?.close() // 始终关闭文件句柄
   	}
   }
   ```

3. **清理定时器和间隔**：

   ```typescript
   // 存储定时器引用以便清理
   const timers = new Set<NodeJS.Timeout>()

   export const POST = async (c: Context) => {
   	const timer = setTimeout(() => {
   		// 一些延迟操作
   		timers.delete(timer)
   	}, 5000)

   	timers.add(timer)
   	return c.json({ scheduled: true })
   }

   // 关闭时清理
   process.on('SIGTERM', () => {
   	timers.forEach((timer) => clearTimeout(timer))
   })
   ```

## 性能问题

### 响应时间慢

**问题**：API 端点响应缓慢。

**调试步骤**：

1. **添加响应时间日志**：

   ```typescript
   // 跟踪响应时间的中间件
   export const responseTimeMiddleware = async (
   	c: Context,
   	next: () => Promise<void>
   ) => {
   	const start = performance.now()

   	await next()

   	const duration = performance.now() - start
   	c.header('X-Response-Time', `${duration.toFixed(2)}ms`)

   	if (duration > 1000) {
   		// 记录慢请求
   		console.warn(
   			`慢请求: ${c.req.method} ${c.req.url} 耗时 ${duration.toFixed(2)}ms`
   		)
   	}
   }
   ```

2. **分析数据库查询**：

   ```typescript
   // 添加查询计时
   async function executeQuery(sql: string, params: any[] = []) {
   	const start = performance.now()

   	try {
   		const result = await db.query(sql, params)
   		const duration = performance.now() - start

   		if (duration > 100) {
   			// 记录慢查询
   			console.warn(`慢查询 (${duration.toFixed(2)}ms):`, sql)
   		}

   		return result
   	} catch (error) {
   		console.error('查询错误:', { sql, params, error })
   		throw error
   	}
   }
   ```

3. **检查 N+1 查询**：

   ```typescript
   // 问题：N+1 查询模式
   export const GET = async (c: Context) => {
   	const users = await db.query('SELECT * FROM users')

   	for (const user of users) {
   		// 这会创建 N 个额外查询！
   		user.posts = await db.query('SELECT * FROM posts WHERE user_id = ?', [
   			user.id,
   		])
   	}

   	return c.json(users)
   }

   // 解决方案：使用连接或批量查询
   export const GET = async (c: Context) => {
   	const usersWithPosts = await db.query(`
       SELECT u.*, p.id as post_id, p.title, p.content
       FROM users u
       LEFT JOIN posts p ON u.id = p.user_id
     `)

   	// 按用户分组结果
   	const users = groupByUser(usersWithPosts)
   	return c.json(users)
   }
   ```

### 高 CPU 使用率

**问题**：应用程序消耗过多的 CPU 资源。

**常见原因**：

1. **低效算法**：

   ```typescript
   // 问题：O(n²) 复杂度
   function findDuplicates(arr: number[]): number[] {
   	const duplicates = []
   	for (let i = 0; i < arr.length; i++) {
   		for (let j = i + 1; j < arr.length; j++) {
   			if (arr[i] === arr[j]) {
   				duplicates.push(arr[i])
   			}
   		}
   	}
   	return duplicates
   }

   // 解决方案：O(n) 复杂度
   function findDuplicates(arr: number[]): number[] {
   	const seen = new Set()
   	const duplicates = new Set()

   	for (const item of arr) {
   		if (seen.has(item)) {
   			duplicates.add(item)
   		} else {
   			seen.add(item)
   		}
   	}

   	return Array.from(duplicates)
   }
   ```

2. **同步操作阻塞事件循环**：

   ```typescript
   // 问题：阻塞操作
   export const GET = async (c: Context) => {
   	const data = fs.readFileSync('large-file.json', 'utf8') // 阻塞事件循环
   	return c.json(JSON.parse(data))
   }

   // 解决方案：使用异步操作
   export const GET = async (c: Context) => {
   	const data = await fs.promises.readFile('large-file.json', 'utf8')
   	return c.json(JSON.parse(data))
   }
   ```

## 开发环境

### 热重载不工作

**问题**：对路由文件的更改不会触发应用程序重启。

**解决方案**：

1. **检查文件监视器配置**：

   ```json
   // package.json
   {
   	"scripts": {
   		"dev": "concurrently \"npm run watch-routes\" \"npm run start-dev\"",
   		"watch-routes": "chokidar \"src/routes/**/*.ts\" -c \"npm run generate-routes\"",
   		"start-dev": "tsx watch src/main.ts"
   	}
   }
   ```

2. **验证文件模式**：

   ```bash
   # 测试文件监视器模式
   npx chokidar "src/routes/**/*.ts" --verbose
   ```

3. **检查文件系统问题**：

   ```bash
   # 在 Linux/Mac 上，检查 inotify 限制
   cat /proc/sys/fs/inotify/max_user_watches

   # 如需要，增加限制
   echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
   sudo sysctl -p
   ```

### TypeScript 编译错误

**问题**：TypeScript 错误阻止开发或构建。

**常见问题**：

1. **缺少类型定义**：

   ```bash
   # 安装缺少的类型
   npm install --save-dev @types/node
   npm install --save-dev @types/jest  # 如果使用 Jest
   ```

2. **错误的 tsconfig.json**：

   ```json
   {
   	"compilerOptions": {
   		"target": "ES2022",
   		"module": "ESNext",
   		"moduleResolution": "node",
   		"esModuleInterop": true,
   		"allowSyntheticDefaultImports": true,
   		"strict": true,
   		"skipLibCheck": true,
   		"forceConsistentCasingInFileNames": true
   	},
   	"include": ["src/**/*"],
   	"exclude": ["node_modules", "dist"]
   }
   ```

3. **路径解析问题**：
   ```json
   // tsconfig.json
   {
   	"compilerOptions": {
   		"baseUrl": ".",
   		"paths": {
   			"@/*": ["src/*"],
   			"@/routes/*": ["src/routes/*"]
   		}
   	}
   }
   ```

## 构建和部署

### 构建失败

**问题**：生产构建失败或产生错误输出。

**调试步骤**：

1. **检查构建日志**：

   ```bash
   # 使用详细输出运行构建
   npm run build -- --verbose

   # 检查 TypeScript 编译
   npx tsc --noEmit --listFiles
   ```

2. **验证输出结构**：

   ```bash
   # 检查生成的文件
   find dist -name "*.js" -type f

   # 验证路由生成
   cat dist/generated-routes.js
   ```

3. **本地测试生产构建**：

   ```bash
   # 构建并测试
   npm run build
   NODE_ENV=production node dist/main.js

   # 测试端点
   curl http://localhost:3000/health
   ```

### Docker 构建问题

**问题**：Docker 构建失败或产生大镜像。

**解决方案**：

1. **优化 Dockerfile**：

   ```dockerfile
   # 使用特定的 Node 版本
   FROM node:18-alpine AS builder

   # 设置工作目录
   WORKDIR /app

   # 首先复制包文件（更好的缓存）
   COPY package*.json ./
   RUN npm ci --only=production

   # 复制源代码
   COPY . .
   RUN npm run build

   # 生产阶段
   FROM node:18-alpine AS production
   WORKDIR /app

   # 只复制必要文件
   COPY --from=builder /app/dist ./dist
   COPY --from=builder /app/node_modules ./node_modules
   COPY --from=builder /app/package.json ./package.json

   # 创建非 root 用户
   RUN addgroup -g 1001 -S nodejs && \
       adduser -S hono -u 1001
   USER hono

   EXPOSE 3000
   CMD ["node", "dist/main.js"]
   ```

2. **使用 .dockerignore**：

   ```
   # .dockerignore
   node_modules
   npm-debug.log
   .git
   .gitignore
   README.md
   .env
   .nyc_output
   coverage
   .nyc_output
   .vscode
   ```

3. **调试构建上下文**：

   ```bash
   # 检查构建上下文大小
   docker build --no-cache --progress=plain .

   # 检查镜像层
   docker history your-image:latest
   ```

## 数据库和外部服务

### 数据库连接问题

**问题**：无法连接到数据库或连接被断开。

**调试**：

1. **手动测试连接**：

   ```bash
   # PostgreSQL
   psql -h localhost -p 5432 -U username -d database

   # MySQL
   mysql -h localhost -P 3306 -u username -p database
   ```

2. **检查连接池配置**：

   ```typescript
   // 数据库池配置
   const pool = new Pool({
   	host: process.env.DB_HOST,
   	port: parseInt(process.env.DB_PORT || '5432'),
   	user: process.env.DB_USER,
   	password: process.env.DB_PASSWORD,
   	database: process.env.DB_NAME,
   	min: 2,
   	max: 10,
   	idleTimeoutMillis: 30000,
   	connectionTimeoutMillis: 2000,
   })

   // 添加连接事件处理器
   pool.on('connect', () => {
   	console.log('数据库已连接')
   })

   pool.on('error', (err) => {
   	console.error('数据库错误:', err)
   })
   ```

3. **实现连接重试逻辑**：

   ```typescript
   async function connectWithRetry(maxRetries = 5, delay = 1000) {
   	for (let i = 0; i < maxRetries; i++) {
   		try {
   			await pool.connect()
   			console.log('数据库连接成功')
   			return
   		} catch (error) {
   			console.error(`连接尝试 ${i + 1} 失败:`, error)

   			if (i === maxRetries - 1) {
   				throw error
   			}

   			await new Promise((resolve) =>
   				setTimeout(resolve, delay * Math.pow(2, i))
   			)
   		}
   	}
   }
   ```

### 外部 API 失败

**问题**：外部服务调用失败或超时。

**解决方案**：

1. **实现超时和重试**：

   ```typescript
   async function fetchWithRetry(
   	url: string,
   	options: RequestInit = {},
   	maxRetries = 3,
   	timeout = 5000
   ) {
   	const controller = new AbortController()
   	const timeoutId = setTimeout(() => controller.abort(), timeout)

   	for (let i = 0; i < maxRetries; i++) {
   		try {
   			const response = await fetch(url, {
   				...options,
   				signal: controller.signal,
   			})

   			clearTimeout(timeoutId)

   			if (!response.ok) {
   				throw new Error(`HTTP ${response.status}: ${response.statusText}`)
   			}

   			return response
   		} catch (error) {
   			console.error(`请求尝试 ${i + 1} 失败:`, error)

   			if (i === maxRetries - 1) {
   				throw error
   			}

   			// 指数退避
   			await new Promise((resolve) =>
   				setTimeout(resolve, 1000 * Math.pow(2, i))
   			)
   		}
   	}
   }
   ```

2. **添加断路器模式**：

   ```typescript
   class CircuitBreaker {
   	private failures = 0
   	private lastFailureTime = 0
   	private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED'

   	constructor(private threshold = 5, private timeout = 60000) {}

   	async execute<T>(operation: () => Promise<T>): Promise<T> {
   		if (this.state === 'OPEN') {
   			if (Date.now() - this.lastFailureTime > this.timeout) {
   				this.state = 'HALF_OPEN'
   			} else {
   				throw new Error('断路器处于打开状态')
   			}
   		}

   		try {
   			const result = await operation()
   			this.onSuccess()
   			return result
   		} catch (error) {
   			this.onFailure()
   			throw error
   		}
   	}

   	private onSuccess() {
   		this.failures = 0
   		this.state = 'CLOSED'
   	}

   	private onFailure() {
   		this.failures++
   		this.lastFailureTime = Date.now()

   		if (this.failures >= this.threshold) {
   			this.state = 'OPEN'
   		}
   	}
   }
   ```

## 安全问题

### CORS 错误

**问题**：浏览器由于 CORS 策略阻止请求。

**解决方案**：

1. **配置 CORS 中间件**：

   ```typescript
   import { cors } from 'hono/cors'

   app.use(
   	'*',
   	cors({
   		origin: ['http://localhost:3000', 'https://yourdomain.com'],
   		allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
   		allowHeaders: ['Content-Type', 'Authorization'],
   		credentials: true,
   	})
   )
   ```

2. **处理预检请求**：
   ```typescript
   app.options('*', (c) => {
   	return c.text('', 204, {
   		'Access-Control-Allow-Origin': '*',
   		'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
   		'Access-Control-Allow-Headers': 'Content-Type, Authorization',
   		'Access-Control-Max-Age': '86400',
   	})
   })
   ```

### 认证问题

**问题**：JWT 令牌不工作或认证失败。

**调试**：

1. **验证 JWT 令牌格式**：

   ```typescript
   import { verify } from 'jsonwebtoken'

   function debugToken(token: string) {
   	try {
   		// 不验证地解码以检查载荷
   		const decoded = JSON.parse(
   			Buffer.from(token.split('.')[1], 'base64').toString()
   		)
   		console.log('令牌载荷:', decoded)
   		console.log('令牌过期:', new Date(decoded.exp * 1000))

   		// 验证令牌
   		const verified = verify(token, process.env.JWT_SECRET!)
   		console.log('令牌已验证:', verified)
   	} catch (error) {
   		console.error('令牌错误:', error)
   	}
   }
   ```

2. **检查令牌过期**：
   ```typescript
   function isTokenExpired(token: string): boolean {
   	try {
   		const payload = JSON.parse(
   			Buffer.from(token.split('.')[1], 'base64').toString()
   		)
   		return Date.now() >= payload.exp * 1000
   	} catch {
   		return true
   	}
   }
   ```

## 调试工具

### 日志记录和监控

1. **结构化日志设置**：

   ```typescript
   // utils/logger.ts
   interface LogEntry {
   	level: 'error' | 'warn' | 'info' | 'debug'
   	message: string
   	timestamp: string
   	requestId?: string
   	userId?: string
   	metadata?: Record<string, any>
   }

   class Logger {
   	log(
   		level: LogEntry['level'],
   		message: string,
   		metadata?: Record<string, any>
   	) {
   		const entry: LogEntry = {
   			level,
   			message,
   			timestamp: new Date().toISOString(),
   			metadata,
   		}

   		console.log(JSON.stringify(entry))
   	}

   	error(message: string, error?: Error, metadata?: Record<string, any>) {
   		this.log('error', message, {
   			...metadata,
   			error: error
   				? {
   						name: error.name,
   						message: error.message,
   						stack: error.stack,
   				  }
   				: undefined,
   		})
   	}
   }

   export const logger = new Logger()
   ```

2. **请求跟踪中间件**：

   ```typescript
   import { v4 as uuidv4 } from 'uuid'

   export const requestTracing = async (
   	c: Context,
   	next: () => Promise<void>
   ) => {
   	const requestId = uuidv4()
   	const start = performance.now()

   	// 将请求 ID 添加到上下文
   	c.set('requestId', requestId)

   	console.log({
   		requestId,
   		method: c.req.method,
   		url: c.req.url,
   		userAgent: c.req.header('user-agent'),
   		timestamp: new Date().toISOString(),
   	})

   	try {
   		await next()
   	} catch (error) {
   		console.error({
   			requestId,
   			error:
   				error instanceof Error
   					? {
   							name: error.name,
   							message: error.message,
   							stack: error.stack,
   					  }
   					: error,
   		})
   		throw error
   	} finally {
   		const duration = performance.now() - start
   		console.log({
   			requestId,
   			status: c.res.status,
   			duration: `${duration.toFixed(2)}ms`,
   		})
   	}
   }
   ```

### 性能分析

1. **内存使用监控**：

   ```typescript
   // 添加到健康检查端点
   export const GET = async (c: Context) => {
   	const memoryUsage = process.memoryUsage()
   	const cpuUsage = process.cpuUsage()

   	return c.json({
   		status: 'healthy',
   		memory: {
   			rss: Math.round(memoryUsage.rss / 1024 / 1024),
   			heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
   			heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
   			external: Math.round(memoryUsage.external / 1024 / 1024),
   		},
   		cpu: {
   			user: cpuUsage.user / 1000000, // 转换为秒
   			system: cpuUsage.system / 1000000,
   		},
   		uptime: process.uptime(),
   	})
   }
   ```

2. **数据库查询分析**：

   ```typescript
   // 使用计时包装数据库查询
   async function profileQuery<T>(
   	name: string,
   	query: () => Promise<T>
   ): Promise<T> {
   	const start = performance.now()

   	try {
   		const result = await query()
   		const duration = performance.now() - start

   		console.log({
   			type: 'query',
   			name,
   			duration: `${duration.toFixed(2)}ms`,
   			success: true,
   		})

   		return result
   	} catch (error) {
   		const duration = performance.now() - start

   		console.error({
   			type: 'query',
   			name,
   			duration: `${duration.toFixed(2)}ms`,
   			success: false,
   			error: error instanceof Error ? error.message : error,
   		})

   		throw error
   	}
   }
   ```

## 获取帮助

如果在尝试这些解决方案后仍然遇到问题：

1. **查看文档**：查阅 [API 参考](/zh/reference/api.md) 和 [示例](/zh/examples/basic)
2. **搜索现有问题**：在 GitHub 问题中查找类似问题
3. **创建最小重现**：在小的、可重现的示例中隔离问题
4. **提供详细信息**：
   - Node.js 版本
   - 包版本
   - 操作系统
   - 错误消息和堆栈跟踪
   - 重现步骤

## 下一步

- [性能指南](/zh/guides/performance.md) - 优化技术
- [部署指南](/zh/guides/deploy.md) - 生产部署
- [最佳实践](/zh/examples/best-practices.md) - 代码组织模式
- [API 参考](/zh/reference/api.md) - 完整的 API 文档
