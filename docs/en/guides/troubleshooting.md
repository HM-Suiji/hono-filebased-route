# Troubleshooting Guide

This guide covers common issues you might encounter when working with hono-filebased-route and their solutions.

## Table of Contents

- [Route Generation Issues](#route-generation-issues)
- [Runtime Errors](#runtime-errors)
- [Performance Issues](#performance-issues)
- [Development Environment](#development-environment)
- [Build and Deployment](#build-and-deployment)
- [Database and External Services](#database-and-external-services)
- [Security Issues](#security-issues)
- [Debugging Tools](#debugging-tools)

## Route Generation Issues

### Routes Not Being Generated

**Problem**: The route generation script doesn't create routes for your files.

**Symptoms**:

- Empty or missing `generated-routes.ts` file
- 404 errors for existing route files
- Routes not appearing in the application

**Solutions**:

1. **Check file naming convention**:

   ```bash
   # Correct naming
   src/routes/users/[id].ts     ✓
   src/routes/api/posts.ts      ✓

   # Incorrect naming
   src/routes/users/id.ts       ✗ (missing brackets)
   src/routes/api/posts.js      ✗ (wrong extension)
   ```

2. **Verify export format**:

   ```typescript
   // Correct exports
   export const GET = async (c: Context) => {
   	/* ... */
   }
   export const POST = async (c: Context) => {
   	/* ... */
   }

   // Incorrect exports
   export default function handler() {
   	/* ... */
   } // ✗
   const GET = async (c: Context) => {
   	/* ... */
   } // ✗ (not exported)
   ```

3. **Check route generation script**:

   ```bash
   # Run with verbose output
   DEBUG=route-generator npm run generate-routes

   # Check if script exists
   ls -la scripts/generate-routes.ts
   ```

4. **Verify file permissions**:

   ```bash
   # Check read permissions
   find src/routes -name "*.ts" -not -readable

   # Fix permissions if needed
   chmod -R 644 src/routes/**/*.ts
   ```

### Dynamic Routes Not Working

**Problem**: Dynamic routes like `[id].ts` or `[...slug].ts` don't match correctly.

**Debugging steps**:

1. **Check parameter extraction**:

   ```typescript
   // In your route handler
   export const GET = async (c: Context) => {
   	console.log('Route params:', c.req.param()) // Debug output
   	const id = c.req.param('id')
   	console.log('ID parameter:', id)

   	if (!id) {
   		return c.json({ error: 'Missing ID parameter' }, 400)
   	}

   	// Your logic here
   }
   ```

2. **Verify route pattern generation**:

   ```typescript
   // Check generated routes file
   // Should contain patterns like:
   app.get('/users/:id', handler)
   app.get('/posts/*', catchAllHandler)
   ```

3. **Test route matching**:
   ```bash
   # Test with curl
   curl -v http://localhost:3000/users/123
   curl -v http://localhost:3000/posts/2023/12/my-post
   ```

### Route Priority Issues

**Problem**: Routes are matched in wrong order (e.g., catch-all routes override specific routes).

**Solution**: Ensure proper route ordering in generation script:

```typescript
// scripts/generate-routes.ts
function sortRoutes(routes: RouteInfo[]): RouteInfo[] {
	return routes.sort((a, b) => {
		// Static routes first
		const aStatic = !a.pattern.includes(':')
		const bStatic = !b.pattern.includes(':')

		if (aStatic && !bStatic) return -1
		if (!aStatic && bStatic) return 1

		// More specific routes first
		const aSegments = a.pattern.split('/').length
		const bSegments = b.pattern.split('/').length

		if (aSegments !== bSegments) {
			return bSegments - aSegments
		}

		// Catch-all routes last
		if (a.pattern.includes('*') && !b.pattern.includes('*')) return 1
		if (!a.pattern.includes('*') && b.pattern.includes('*')) return -1

		return a.pattern.localeCompare(b.pattern)
	})
}
```

## Runtime Errors

### "Cannot read property of undefined" Errors

**Problem**: Common runtime errors when accessing request data.

**Common causes and solutions**:

1. **Missing request body parsing**:

   ```typescript
   // Problem
   export const POST = async (c: Context) => {
   	const data = c.req.json() // ✗ Missing await
   	return c.json(data)
   }

   // Solution
   export const POST = async (c: Context) => {
   	const data = await c.req.json() // ✓ Proper async handling
   	return c.json(data)
   }
   ```

2. **Undefined route parameters**:

   ```typescript
   // Add parameter validation
   export const GET = async (c: Context) => {
   	const id = c.req.param('id')

   	if (!id) {
   		return c.json({ error: 'ID parameter is required' }, 400)
   	}

   	// Safe to use id here
   	return c.json({ id })
   }
   ```

3. **Missing error boundaries**:
   ```typescript
   // Add try-catch blocks
   export const GET = async (c: Context) => {
   	try {
   		const data = await someAsyncOperation()
   		return c.json(data)
   	} catch (error) {
   		console.error('Route error:', error)
   		return c.json({ error: 'Internal server error' }, 500)
   	}
   }
   ```

### Memory Leaks

**Problem**: Application memory usage grows over time.

**Debugging**:

1. **Monitor memory usage**:

   ```typescript
   // Add to your health check endpoint
   const memoryUsage = process.memoryUsage()
   console.log('Memory usage:', {
   	rss: Math.round(memoryUsage.rss / 1024 / 1024) + 'MB',
   	heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + 'MB',
   	heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024) + 'MB',
   })
   ```

2. **Check for unclosed resources**:

   ```typescript
   // Database connections
   export const GET = async (c: Context) => {
   	const connection = await db.getConnection()
   	try {
   		const result = await connection.query('SELECT * FROM users')
   		return c.json(result)
   	} finally {
   		connection.release() // Always release connections
   	}
   }

   // File handles
   import { promises as fs } from 'fs'

   export const GET = async (c: Context) => {
   	let fileHandle
   	try {
   		fileHandle = await fs.open('data.txt', 'r')
   		const data = await fileHandle.readFile('utf8')
   		return c.text(data)
   	} finally {
   		await fileHandle?.close() // Always close file handles
   	}
   }
   ```

3. **Clear timers and intervals**:

   ```typescript
   // Store timer references for cleanup
   const timers = new Set<NodeJS.Timeout>()

   export const POST = async (c: Context) => {
   	const timer = setTimeout(() => {
   		// Some delayed operation
   		timers.delete(timer)
   	}, 5000)

   	timers.add(timer)
   	return c.json({ scheduled: true })
   }

   // Cleanup on shutdown
   process.on('SIGTERM', () => {
   	timers.forEach((timer) => clearTimeout(timer))
   })
   ```

## Performance Issues

### Slow Response Times

**Problem**: API endpoints respond slowly.

**Debugging steps**:

1. **Add response time logging**:

   ```typescript
   // Middleware to track response times
   export const responseTimeMiddleware = async (
   	c: Context,
   	next: () => Promise<void>
   ) => {
   	const start = performance.now()

   	await next()

   	const duration = performance.now() - start
   	c.header('X-Response-Time', `${duration.toFixed(2)}ms`)

   	if (duration > 1000) {
   		// Log slow requests
   		console.warn(
   			`Slow request: ${c.req.method} ${c.req.url} took ${duration.toFixed(
   				2
   			)}ms`
   		)
   	}
   }
   ```

2. **Profile database queries**:

   ```typescript
   // Add query timing
   async function executeQuery(sql: string, params: any[] = []) {
   	const start = performance.now()

   	try {
   		const result = await db.query(sql, params)
   		const duration = performance.now() - start

   		if (duration > 100) {
   			// Log slow queries
   			console.warn(`Slow query (${duration.toFixed(2)}ms):`, sql)
   		}

   		return result
   	} catch (error) {
   		console.error('Query error:', { sql, params, error })
   		throw error
   	}
   }
   ```

3. **Check for N+1 queries**:

   ```typescript
   // Problem: N+1 query pattern
   export const GET = async (c: Context) => {
   	const users = await db.query('SELECT * FROM users')

   	for (const user of users) {
   		// This creates N additional queries!
   		user.posts = await db.query('SELECT * FROM posts WHERE user_id = ?', [
   			user.id,
   		])
   	}

   	return c.json(users)
   }

   // Solution: Use joins or batch queries
   export const GET = async (c: Context) => {
   	const usersWithPosts = await db.query(`
       SELECT u.*, p.id as post_id, p.title, p.content
       FROM users u
       LEFT JOIN posts p ON u.id = p.user_id
     `)

   	// Group results by user
   	const users = groupByUser(usersWithPosts)
   	return c.json(users)
   }
   ```

### High CPU Usage

**Problem**: Application consumes excessive CPU resources.

**Common causes**:

1. **Inefficient algorithms**:

   ```typescript
   // Problem: O(n²) complexity
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

   // Solution: O(n) complexity
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

2. **Synchronous operations blocking event loop**:

   ```typescript
   // Problem: Blocking operation
   export const GET = async (c: Context) => {
   	const data = fs.readFileSync('large-file.json', 'utf8') // Blocks event loop
   	return c.json(JSON.parse(data))
   }

   // Solution: Use async operations
   export const GET = async (c: Context) => {
   	const data = await fs.promises.readFile('large-file.json', 'utf8')
   	return c.json(JSON.parse(data))
   }
   ```

## Development Environment

### Hot Reload Not Working

**Problem**: Changes to route files don't trigger application restart.

**Solutions**:

1. **Check file watcher configuration**:

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

2. **Verify file patterns**:

   ```bash
   # Test file watcher patterns
   npx chokidar "src/routes/**/*.ts" --verbose
   ```

3. **Check for file system issues**:

   ```bash
   # On Linux/Mac, check inotify limits
   cat /proc/sys/fs/inotify/max_user_watches

   # Increase if needed
   echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
   sudo sysctl -p
   ```

### TypeScript Compilation Errors

**Problem**: TypeScript errors prevent development or building.

**Common issues**:

1. **Missing type definitions**:

   ```bash
   # Install missing types
   npm install --save-dev @types/node
   npm install --save-dev @types/jest  # if using Jest
   ```

2. **Incorrect tsconfig.json**:

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

3. **Path resolution issues**:
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

## Build and Deployment

### Build Failures

**Problem**: Production build fails or produces incorrect output.

**Debugging steps**:

1. **Check build logs**:

   ```bash
   # Run build with verbose output
   npm run build -- --verbose

   # Check TypeScript compilation
   npx tsc --noEmit --listFiles
   ```

2. **Verify output structure**:

   ```bash
   # Check generated files
   find dist -name "*.js" -type f

   # Verify route generation
   cat dist/generated-routes.js
   ```

3. **Test production build locally**:

   ```bash
   # Build and test
   npm run build
   NODE_ENV=production node dist/main.js

   # Test endpoints
   curl http://localhost:3000/health
   ```

### Docker Build Issues

**Problem**: Docker build fails or produces large images.

**Solutions**:

1. **Optimize Dockerfile**:

   ```dockerfile
   # Use specific Node version
   FROM node:18-alpine AS builder

   # Set working directory
   WORKDIR /app

   # Copy package files first (better caching)
   COPY package*.json ./
   RUN npm ci --only=production

   # Copy source code
   COPY . .
   RUN npm run build

   # Production stage
   FROM node:18-alpine AS production
   WORKDIR /app

   # Copy only necessary files
   COPY --from=builder /app/dist ./dist
   COPY --from=builder /app/node_modules ./node_modules
   COPY --from=builder /app/package.json ./package.json

   # Create non-root user
   RUN addgroup -g 1001 -S nodejs && \
       adduser -S hono -u 1001
   USER hono

   EXPOSE 3000
   CMD ["node", "dist/main.js"]
   ```

2. **Use .dockerignore**:

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

3. **Debug build context**:

   ```bash
   # Check build context size
   docker build --no-cache --progress=plain .

   # Inspect image layers
   docker history your-image:latest
   ```

## Database and External Services

### Database Connection Issues

**Problem**: Cannot connect to database or connections are dropped.

**Debugging**:

1. **Test connection manually**:

   ```bash
   # PostgreSQL
   psql -h localhost -p 5432 -U username -d database

   # MySQL
   mysql -h localhost -P 3306 -u username -p database
   ```

2. **Check connection pool configuration**:

   ```typescript
   // Database pool configuration
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

   // Add connection event handlers
   pool.on('connect', () => {
   	console.log('Database connected')
   })

   pool.on('error', (err) => {
   	console.error('Database error:', err)
   })
   ```

3. **Implement connection retry logic**:
   ```typescript
   async function connectWithRetry(maxRetries = 5, delay = 1000) {
   	for (let i = 0; i < maxRetries; i++) {
   		try {
   			await pool.connect()
   			console.log('Database connected successfully')
   			return
   		} catch (error) {
   			console.error(`Connection attempt ${i + 1} failed:`, error)

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

### External API Failures

**Problem**: External service calls fail or timeout.

**Solutions**:

1. **Implement timeout and retry**:

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
   			console.error(`Request attempt ${i + 1} failed:`, error)

   			if (i === maxRetries - 1) {
   				throw error
   			}

   			// Exponential backoff
   			await new Promise((resolve) =>
   				setTimeout(resolve, 1000 * Math.pow(2, i))
   			)
   		}
   	}
   }
   ```

2. **Add circuit breaker pattern**:
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
   				throw new Error('Circuit breaker is OPEN')
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

## Security Issues

### CORS Errors

**Problem**: Browser blocks requests due to CORS policy.

**Solutions**:

1. **Configure CORS middleware**:

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

2. **Handle preflight requests**:
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

### Authentication Issues

**Problem**: JWT tokens not working or authentication failing.

**Debugging**:

1. **Verify JWT token format**:

   ```typescript
   import { verify } from 'jsonwebtoken'

   function debugToken(token: string) {
   	try {
   		// Decode without verification to inspect payload
   		const decoded = JSON.parse(
   			Buffer.from(token.split('.')[1], 'base64').toString()
   		)
   		console.log('Token payload:', decoded)
   		console.log('Token expires:', new Date(decoded.exp * 1000))

   		// Verify token
   		const verified = verify(token, process.env.JWT_SECRET!)
   		console.log('Token verified:', verified)
   	} catch (error) {
   		console.error('Token error:', error)
   	}
   }
   ```

2. **Check token expiration**:
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

## Debugging Tools

### Logging and Monitoring

1. **Structured logging setup**:

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

2. **Request tracing middleware**:

   ```typescript
   import { v4 as uuidv4 } from 'uuid'

   export const requestTracing = async (
   	c: Context,
   	next: () => Promise<void>
   ) => {
   	const requestId = uuidv4()
   	const start = performance.now()

   	// Add request ID to context
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

### Performance Profiling

1. **Memory usage monitoring**:

   ```typescript
   // Add to health check endpoint
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
   			user: cpuUsage.user / 1000000, // Convert to seconds
   			system: cpuUsage.system / 1000000,
   		},
   		uptime: process.uptime(),
   	})
   }
   ```

2. **Database query profiling**:
   ```typescript
   // Wrap database queries with timing
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

## Getting Help

If you're still experiencing issues after trying these solutions:

1. **Check the documentation**: Review the [API Reference](/reference/api.md) and [Examples](/examples/basic)
2. **Search existing issues**: Look through GitHub issues for similar problems
3. **Create a minimal reproduction**: Isolate the problem in a small, reproducible example
4. **Provide detailed information**:
   - Node.js version
   - Package versions
   - Operating system
   - Error messages and stack traces
   - Steps to reproduce

## Next Steps

- [Performance Guide](/guides/performance.md) - Optimization techniques
- [Deployment Guide](/guides/deploy.md) - Production deployment
- [Best Practices](/examples/best-practices.md) - Code organization patterns
- [API Reference](/reference/api.md) - Complete API documentation
