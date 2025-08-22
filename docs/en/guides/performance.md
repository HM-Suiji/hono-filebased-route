# Performance Guide

This guide covers performance optimization techniques, best practices, and monitoring strategies for applications built with hono-filebased-route.

## Overview

Performance optimization in file-based routing applications involves several key areas:

- Route generation and loading
- Request handling optimization
- Caching strategies
- Database query optimization
- Memory management
- Monitoring and profiling

## Route Generation Optimization

### Build-Time Route Generation

Generate routes at build time rather than runtime for better performance:

```json
// package.json
{
	"scripts": {
		"prebuild": "tsx scripts/generate-routes.ts",
		"build": "tsc",
		"prestart": "npm run generate-routes",
		"start": "node dist/main.js"
	}
}
```

### Optimized Route Generation Script

```typescript
// scripts/generate-routes.ts
import { generateRoutesFile } from '@hono-filebased-route/core'
import { performance } from 'perf_hooks'
import fs from 'fs/promises'

async function generateOptimizedRoutes() {
	const startTime = performance.now()

	console.log('🔄 Generating routes...')

	try {
		// Generate routes with performance tracking
		await generateRoutesFile()

		// Verify generated file
		const stats = await fs.stat('./src/generated-routes.ts')
		const endTime = performance.now()

		console.log(`✅ Routes generated successfully`)
		console.log(`📊 File size: ${(stats.size / 1024).toFixed(2)} KB`)
		console.log(`⏱️  Generation time: ${(endTime - startTime).toFixed(2)}ms`)
	} catch (error) {
		console.error('❌ Route generation failed:', error)
		process.exit(1)
	}
}

generateOptimizedRoutes()
```

### Route File Organization for Performance

```
// Optimized structure - group related routes
routes/
├── api/
│   └── v1/
│       ├── users/           # User-related routes
│       ├── posts/           # Post-related routes
│       └── admin/           # Admin routes
├── public/                  # Public pages
└── health.ts               # Health check (separate for quick access)
```

## Request Handling Optimization

### Efficient Route Handlers

```typescript
// Optimized route handler pattern
export const GET = async (c: Context) => {
	// Early validation and quick returns
	const id = c.req.param('id')
	if (!id || !isValidId(id)) {
		return c.json({ error: 'Invalid ID' }, 400)
	}

	try {
		// Use Promise.all for parallel operations
		const [user, posts, stats] = await Promise.all([
			getUserById(id),
			getUserPosts(id, { limit: 10 }),
			getUserStats(id),
		])

		if (!user) {
			return c.json({ error: 'User not found' }, 404)
		}

		// Minimize response payload
		return c.json({
			user: {
				id: user.id,
				name: user.name,
				email: user.email,
				// Only include necessary fields
			},
			posts: posts.map((post) => ({
				id: post.id,
				title: post.title,
				createdAt: post.createdAt,
			})),
			stats,
		})
	} catch (error) {
		console.error('Error fetching user:', error)
		return c.json({ error: 'Internal server error' }, 500)
	}
}
```

### Request Validation Optimization

```typescript
// utils/validation-optimized.ts
import { z } from 'zod'

// Pre-compile schemas for better performance
const userQuerySchema = z.object({
	page: z.coerce.number().min(1).max(1000).default(1),
	limit: z.coerce.number().min(1).max(100).default(20),
	search: z.string().max(100).optional(),
	sort: z.enum(['name', 'email', 'createdAt']).default('createdAt'),
})

// Cache compiled schemas
const schemaCache = new Map<string, z.ZodSchema>()

export function getCachedSchema(key: string, schema: z.ZodSchema): z.ZodSchema {
	if (!schemaCache.has(key)) {
		schemaCache.set(key, schema)
	}
	return schemaCache.get(key)!
}

// Fast validation with early returns
export function validateQueryFast(query: any) {
	const schema = getCachedSchema('userQuery', userQuerySchema)
	const result = schema.safeParse(query)

	if (!result.success) {
		// Return first error for faster response
		const firstError = result.error.errors[0]
		throw new ValidationError(firstError.message, firstError.path)
	}

	return result.data
}
```

## Caching Strategies

### Multi-Level Caching

```typescript
// utils/cache-manager.ts
interface CacheConfig {
	ttl: number
	maxSize?: number
	strategy?: 'lru' | 'fifo'
}

class CacheManager {
	private memoryCache = new Map<
		string,
		{ data: any; expires: number; hits: number }
	>()
	private maxSize: number

	constructor(maxSize = 1000) {
		this.maxSize = maxSize
	}

	async get<T>(key: string): Promise<T | null> {
		const cached = this.memoryCache.get(key)

		if (cached && cached.expires > Date.now()) {
			cached.hits++
			return cached.data
		}

		if (cached) {
			this.memoryCache.delete(key)
		}

		return null
	}

	async set<T>(key: string, data: T, ttl: number): Promise<void> {
		// Implement LRU eviction if cache is full
		if (this.memoryCache.size >= this.maxSize) {
			this.evictLeastUsed()
		}

		this.memoryCache.set(key, {
			data,
			expires: Date.now() + ttl * 1000,
			hits: 0,
		})
	}

	private evictLeastUsed(): void {
		let leastUsedKey = ''
		let leastHits = Infinity

		for (const [key, value] of this.memoryCache.entries()) {
			if (value.hits < leastHits) {
				leastHits = value.hits
				leastUsedKey = key
			}
		}

		if (leastUsedKey) {
			this.memoryCache.delete(leastUsedKey)
		}
	}

	getStats() {
		return {
			size: this.memoryCache.size,
			maxSize: this.maxSize,
			hitRate: this.calculateHitRate(),
		}
	}

	private calculateHitRate(): number {
		const entries = Array.from(this.memoryCache.values())
		const totalHits = entries.reduce((sum, entry) => sum + entry.hits, 0)
		return entries.length > 0 ? totalHits / entries.length : 0
	}
}

export const cacheManager = new CacheManager()

// Cache decorator for functions
export function cached(ttl: number = 300) {
	return function (
		target: any,
		propertyKey: string,
		descriptor: PropertyDescriptor
	) {
		const originalMethod = descriptor.value

		descriptor.value = async function (...args: any[]) {
			const cacheKey = `${
				target.constructor.name
			}:${propertyKey}:${JSON.stringify(args)}`

			let result = await cacheManager.get(cacheKey)
			if (result !== null) {
				return result
			}

			result = await originalMethod.apply(this, args)
			await cacheManager.set(cacheKey, result, ttl)

			return result
		}

		return descriptor
	}
}
```

### Response Caching

```typescript
// middleware/response-cache.ts
import type { Context } from 'hono'

interface CacheOptions {
	ttl: number
	varyBy?: string[]
	skipIf?: (c: Context) => boolean
}

export function responseCache(options: CacheOptions) {
	const { ttl, varyBy = [], skipIf } = options
	const cache = new Map<
		string,
		{ data: any; expires: number; headers: Record<string, string> }
	>()

	return async (c: Context, next: () => Promise<void>) => {
		// Skip caching for certain conditions
		if (skipIf && skipIf(c)) {
			await next()
			return
		}

		// Generate cache key
		const baseKey = `${c.req.method}:${c.req.path}`
		const varyKey = varyBy.map((header) => c.req.header(header) || '').join(':')
		const cacheKey = `${baseKey}:${varyKey}`

		// Check cache
		const cached = cache.get(cacheKey)
		if (cached && cached.expires > Date.now()) {
			// Set cached headers
			Object.entries(cached.headers).forEach(([key, value]) => {
				c.header(key, value)
			})
			c.header('X-Cache', 'HIT')

			return c.json(cached.data)
		}

		// Execute route handler
		await next()

		// Cache successful responses
		if (c.res.status === 200) {
			const responseData = await c.res.clone().json()
			const headers: Record<string, string> = {}

			// Capture important headers
			c.res.headers.forEach((value, key) => {
				if (['content-type', 'cache-control'].includes(key.toLowerCase())) {
					headers[key] = value
				}
			})

			cache.set(cacheKey, {
				data: responseData,
				expires: Date.now() + ttl * 1000,
				headers,
			})

			c.header('X-Cache', 'MISS')
		}
	}
}

// Usage in routes
export const GET = async (c: Context) => {
	// This route will be cached for 5 minutes
	return c.json({ data: await getExpensiveData() })
}

// Apply caching middleware
app.use('/api/expensive-data', responseCache({ ttl: 300 }))
```

## Database Optimization

### Connection Pooling

```typescript
// utils/database-optimized.ts
interface PoolConfig {
	min: number
	max: number
	acquireTimeoutMillis: number
	idleTimeoutMillis: number
}

class DatabasePool {
	private connections: any[] = []
	private available: any[] = []
	private pending: Array<{ resolve: Function; reject: Function }> = []
	private config: PoolConfig

	constructor(config: PoolConfig) {
		this.config = config
		this.initialize()
	}

	private async initialize() {
		// Create minimum connections
		for (let i = 0; i < this.config.min; i++) {
			const connection = await this.createConnection()
			this.connections.push(connection)
			this.available.push(connection)
		}
	}

	async acquire(): Promise<any> {
		if (this.available.length > 0) {
			return this.available.pop()
		}

		if (this.connections.length < this.config.max) {
			const connection = await this.createConnection()
			this.connections.push(connection)
			return connection
		}

		// Wait for available connection
		return new Promise((resolve, reject) => {
			const timeout = setTimeout(() => {
				const index = this.pending.findIndex((p) => p.resolve === resolve)
				if (index !== -1) {
					this.pending.splice(index, 1)
					reject(new Error('Connection acquire timeout'))
				}
			}, this.config.acquireTimeoutMillis)

			this.pending.push({
				resolve: (conn: any) => {
					clearTimeout(timeout)
					resolve(conn)
				},
				reject,
			})
		})
	}

	release(connection: any) {
		if (this.pending.length > 0) {
			const { resolve } = this.pending.shift()!
			resolve(connection)
		} else {
			this.available.push(connection)
		}
	}

	private async createConnection() {
		// Implementation depends on your database
		// This is a placeholder
		return { id: Math.random() }
	}

	getStats() {
		return {
			total: this.connections.length,
			available: this.available.length,
			pending: this.pending.length,
		}
	}
}

export const dbPool = new DatabasePool({
	min: 2,
	max: 10,
	acquireTimeoutMillis: 5000,
	idleTimeoutMillis: 30000,
})
```

### Query Optimization

```typescript
// utils/query-optimizer.ts
class QueryOptimizer {
	private queryCache = new Map<string, any>()
	private preparedStatements = new Map<string, any>()

	// Batch queries to reduce database round trips
	async batchQuery<T>(
		queries: Array<{ sql: string; params: any[] }>
	): Promise<T[]> {
		const connection = await dbPool.acquire()

		try {
			const results = await Promise.all(
				queries.map(({ sql, params }) => connection.query(sql, params))
			)

			return results
		} finally {
			dbPool.release(connection)
		}
	}

	// Use prepared statements for repeated queries
	async preparedQuery<T>(key: string, sql: string, params: any[]): Promise<T> {
		const connection = await dbPool.acquire()

		try {
			if (!this.preparedStatements.has(key)) {
				const prepared = await connection.prepare(sql)
				this.preparedStatements.set(key, prepared)
			}

			const statement = this.preparedStatements.get(key)
			return await statement.execute(params)
		} finally {
			dbPool.release(connection)
		}
	}

	// Optimize SELECT queries with proper indexing hints
	optimizeSelect(
		table: string,
		conditions: Record<string, any>,
		options: {
			limit?: number
			offset?: number
			orderBy?: string
			indexes?: string[]
		} = {}
	) {
		const { limit = 100, offset = 0, orderBy, indexes = [] } = options

		let sql = `SELECT * FROM ${table}`

		// Add index hints if provided
		if (indexes.length > 0) {
			sql += ` USE INDEX (${indexes.join(', ')})`
		}

		// Add WHERE conditions
		const whereConditions = Object.keys(conditions)
		if (whereConditions.length > 0) {
			sql += ` WHERE ${whereConditions
				.map((key) => `${key} = ?`)
				.join(' AND ')}`
		}

		// Add ORDER BY
		if (orderBy) {
			sql += ` ORDER BY ${orderBy}`
		}

		// Add LIMIT and OFFSET
		sql += ` LIMIT ${limit} OFFSET ${offset}`

		return {
			sql,
			params: Object.values(conditions),
		}
	}
}

export const queryOptimizer = new QueryOptimizer()

// Usage in services
export class UserService {
	@cached(300) // Cache for 5 minutes
	async getUsers(filters: UserFilters) {
		const { sql, params } = queryOptimizer.optimizeSelect('users', filters, {
			limit: filters.limit,
			offset: (filters.page - 1) * filters.limit,
			orderBy: 'created_at DESC',
			indexes: ['idx_users_email', 'idx_users_created_at'],
		})

		return queryOptimizer.preparedQuery('getUsers', sql, params)
	}

	async getUserWithRelations(userId: string) {
		// Batch related queries
		const results = await queryOptimizer.batchQuery([
			{ sql: 'SELECT * FROM users WHERE id = ?', params: [userId] },
			{
				sql: 'SELECT * FROM posts WHERE user_id = ? LIMIT 10',
				params: [userId],
			},
			{
				sql: 'SELECT COUNT(*) as count FROM posts WHERE user_id = ?',
				params: [userId],
			},
		])

		const [user, posts, postCount] = results

		return {
			user: user[0],
			posts,
			postCount: postCount[0].count,
		}
	}
}
```

## Memory Management

### Memory Monitoring

```typescript
// utils/memory-monitor.ts
class MemoryMonitor {
	private interval: NodeJS.Timeout | null = null
	private thresholds = {
		warning: 0.8, // 80% of heap limit
		critical: 0.9, // 90% of heap limit
	}

	start(intervalMs = 30000) {
		this.interval = setInterval(() => {
			this.checkMemoryUsage()
		}, intervalMs)
	}

	stop() {
		if (this.interval) {
			clearInterval(this.interval)
			this.interval = null
		}
	}

	private checkMemoryUsage() {
		const usage = process.memoryUsage()
		const heapUsedMB = usage.heapUsed / 1024 / 1024
		const heapTotalMB = usage.heapTotal / 1024 / 1024
		const heapUsageRatio = usage.heapUsed / usage.heapTotal

		console.log(
			`Memory Usage: ${heapUsedMB.toFixed(2)}MB / ${heapTotalMB.toFixed(
				2
			)}MB (${(heapUsageRatio * 100).toFixed(1)}%)`
		)

		if (heapUsageRatio > this.thresholds.critical) {
			console.error('🚨 Critical memory usage detected!')
			this.triggerGarbageCollection()
		} else if (heapUsageRatio > this.thresholds.warning) {
			console.warn('⚠️  High memory usage detected')
		}
	}

	private triggerGarbageCollection() {
		if (global.gc) {
			console.log('🗑️  Triggering garbage collection...')
			global.gc()

			const afterGC = process.memoryUsage()
			console.log(
				`Memory after GC: ${(afterGC.heapUsed / 1024 / 1024).toFixed(2)}MB`
			)
		}
	}

	getMemoryStats() {
		const usage = process.memoryUsage()
		return {
			heapUsed: Math.round(usage.heapUsed / 1024 / 1024),
			heapTotal: Math.round(usage.heapTotal / 1024 / 1024),
			external: Math.round(usage.external / 1024 / 1024),
			rss: Math.round(usage.rss / 1024 / 1024),
			heapUsagePercent: Math.round((usage.heapUsed / usage.heapTotal) * 100),
		}
	}
}

export const memoryMonitor = new MemoryMonitor()

// Start monitoring in production
if (process.env.NODE_ENV === 'production') {
	memoryMonitor.start()
}
```

### Object Pool Pattern

```typescript
// utils/object-pool.ts
class ObjectPool<T> {
	private available: T[] = []
	private inUse = new Set<T>()
	private factory: () => T
	private reset: (obj: T) => void
	private maxSize: number

	constructor(factory: () => T, reset: (obj: T) => void, maxSize = 100) {
		this.factory = factory
		this.reset = reset
		this.maxSize = maxSize
	}

	acquire(): T {
		let obj: T

		if (this.available.length > 0) {
			obj = this.available.pop()!
		} else {
			obj = this.factory()
		}

		this.inUse.add(obj)
		return obj
	}

	release(obj: T) {
		if (this.inUse.has(obj)) {
			this.inUse.delete(obj)
			this.reset(obj)

			if (this.available.length < this.maxSize) {
				this.available.push(obj)
			}
		}
	}

	getStats() {
		return {
			available: this.available.length,
			inUse: this.inUse.size,
			total: this.available.length + this.inUse.size,
		}
	}
}

// Example: Response object pool
interface ResponseObject {
	data: any
	meta: any
	success: boolean
}

const responsePool = new ObjectPool<ResponseObject>(
	() => ({ data: null, meta: null, success: false }),
	(obj) => {
		obj.data = null
		obj.meta = null
		obj.success = false
	}
)

// Usage in routes
export const GET = async (c: Context) => {
	const response = responsePool.acquire()

	try {
		response.success = true
		response.data = await getData()
		response.meta = { timestamp: new Date().toISOString() }

		return c.json(response)
	} finally {
		responsePool.release(response)
	}
}
```

## Performance Monitoring

### Request Performance Tracking

```typescript
// middleware/performance-tracker.ts
import type { Context } from 'hono'

interface PerformanceMetrics {
	path: string
	method: string
	duration: number
	statusCode: number
	timestamp: number
	memoryUsage: number
}

class PerformanceTracker {
	private metrics: PerformanceMetrics[] = []
	private maxMetrics = 1000

	track(metric: PerformanceMetrics) {
		this.metrics.push(metric)

		// Keep only recent metrics
		if (this.metrics.length > this.maxMetrics) {
			this.metrics = this.metrics.slice(-this.maxMetrics)
		}
	}

	getStats(timeWindowMs = 300000) {
		// 5 minutes
		const now = Date.now()
		const recentMetrics = this.metrics.filter(
			(m) => now - m.timestamp < timeWindowMs
		)

		if (recentMetrics.length === 0) {
			return null
		}

		const durations = recentMetrics.map((m) => m.duration)
		const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length
		const maxDuration = Math.max(...durations)
		const minDuration = Math.min(...durations)

		// Calculate percentiles
		const sortedDurations = durations.sort((a, b) => a - b)
		const p50 = sortedDurations[Math.floor(sortedDurations.length * 0.5)]
		const p95 = sortedDurations[Math.floor(sortedDurations.length * 0.95)]
		const p99 = sortedDurations[Math.floor(sortedDurations.length * 0.99)]

		return {
			totalRequests: recentMetrics.length,
			avgDuration: Math.round(avgDuration),
			minDuration: Math.round(minDuration),
			maxDuration: Math.round(maxDuration),
			p50: Math.round(p50),
			p95: Math.round(p95),
			p99: Math.round(p99),
			errorRate:
				recentMetrics.filter((m) => m.statusCode >= 400).length /
				recentMetrics.length,
		}
	}

	getSlowRequests(thresholdMs = 1000) {
		return this.metrics
			.filter((m) => m.duration > thresholdMs)
			.sort((a, b) => b.duration - a.duration)
			.slice(0, 10)
	}
}

const performanceTracker = new PerformanceTracker()

export function performanceMiddleware() {
	return async (c: Context, next: () => Promise<void>) => {
		const startTime = performance.now()
		const startMemory = process.memoryUsage().heapUsed

		await next()

		const endTime = performance.now()
		const endMemory = process.memoryUsage().heapUsed

		performanceTracker.track({
			path: c.req.path,
			method: c.req.method,
			duration: endTime - startTime,
			statusCode: c.res.status,
			timestamp: Date.now(),
			memoryUsage: endMemory - startMemory,
		})
	}
}

// Performance monitoring endpoint
export const GET = async (c: Context) => {
	const stats = performanceTracker.getStats()
	const slowRequests = performanceTracker.getSlowRequests()
	const memoryStats = memoryMonitor.getMemoryStats()
	const cacheStats = cacheManager.getStats()

	return c.json({
		performance: stats,
		slowRequests,
		memory: memoryStats,
		cache: cacheStats,
		uptime: process.uptime(),
	})
}
```

## Load Testing

### Load Test Script

```javascript
// scripts/load-test.js
const BASE_URL = 'http://localhost:3000'
const CONCURRENT_USERS = 50
const TEST_DURATION = 60000 // 1 minute

class LoadTester {
	constructor(baseUrl, concurrentUsers, duration) {
		this.baseUrl = baseUrl
		this.concurrentUsers = concurrentUsers
		this.duration = duration
		this.results = []
		this.startTime = 0
	}

	async runTest() {
		console.log(
			`🚀 Starting load test with ${
				this.concurrentUsers
			} concurrent users for ${this.duration / 1000}s`
		)

		this.startTime = Date.now()
		const promises = []

		for (let i = 0; i < this.concurrentUsers; i++) {
			promises.push(this.simulateUser(i))
		}

		await Promise.all(promises)
		this.generateReport()
	}

	async simulateUser(userId) {
		const endTime = this.startTime + this.duration

		while (Date.now() < endTime) {
			await this.makeRequest('/api/users', 'GET')
			await this.sleep(Math.random() * 1000) // Random delay

			await this.makeRequest('/api/posts', 'GET')
			await this.sleep(Math.random() * 500)

			// Simulate creating a post occasionally
			if (Math.random() < 0.1) {
				await this.makeRequest('/api/posts', 'POST', {
					title: `Test post from user ${userId}`,
					content: 'This is a test post for load testing',
				})
			}
		}
	}

	async makeRequest(path, method, body = null) {
		const startTime = performance.now()

		try {
			const options = { method }
			if (body) {
				options.headers = { 'Content-Type': 'application/json' }
				options.body = JSON.stringify(body)
			}

			const response = await fetch(`${this.baseUrl}${path}`, options)
			const endTime = performance.now()

			this.results.push({
				path,
				method,
				status: response.status,
				duration: endTime - startTime,
				success: response.ok,
				timestamp: Date.now(),
			})
		} catch (error) {
			const endTime = performance.now()

			this.results.push({
				path,
				method,
				status: 0,
				duration: endTime - startTime,
				success: false,
				error: error.message,
				timestamp: Date.now(),
			})
		}
	}

	sleep(ms) {
		return new Promise((resolve) => setTimeout(resolve, ms))
	}

	generateReport() {
		const totalRequests = this.results.length
		const successfulRequests = this.results.filter((r) => r.success).length
		const failedRequests = totalRequests - successfulRequests

		const durations = this.results.map((r) => r.duration)
		const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length
		const maxDuration = Math.max(...durations)
		const minDuration = Math.min(...durations)

		const sortedDurations = durations.sort((a, b) => a - b)
		const p95 = sortedDurations[Math.floor(sortedDurations.length * 0.95)]

		const requestsPerSecond = totalRequests / (this.duration / 1000)

		console.log('\n📊 Load Test Results:')
		console.log(`Total Requests: ${totalRequests}`)
		console.log(
			`Successful: ${successfulRequests} (${(
				(successfulRequests / totalRequests) *
				100
			).toFixed(1)}%)`
		)
		console.log(
			`Failed: ${failedRequests} (${(
				(failedRequests / totalRequests) *
				100
			).toFixed(1)}%)`
		)
		console.log(`Requests/sec: ${requestsPerSecond.toFixed(2)}`)
		console.log(`Avg Response Time: ${avgDuration.toFixed(2)}ms`)
		console.log(`Min Response Time: ${minDuration.toFixed(2)}ms`)
		console.log(`Max Response Time: ${maxDuration.toFixed(2)}ms`)
		console.log(`95th Percentile: ${p95.toFixed(2)}ms`)

		// Show slowest endpoints
		const endpointStats = this.groupByEndpoint()
		console.log('\n🐌 Slowest Endpoints:')
		Object.entries(endpointStats)
			.sort(([, a], [, b]) => b.avgDuration - a.avgDuration)
			.slice(0, 5)
			.forEach(([endpoint, stats]) => {
				console.log(
					`${endpoint}: ${stats.avgDuration.toFixed(2)}ms avg (${
						stats.count
					} requests)`
				)
			})
	}

	groupByEndpoint() {
		const groups = {}

		this.results.forEach((result) => {
			const key = `${result.method} ${result.path}`
			if (!groups[key]) {
				groups[key] = { durations: [], count: 0 }
			}
			groups[key].durations.push(result.duration)
			groups[key].count++
		})

		Object.keys(groups).forEach((key) => {
			const durations = groups[key].durations
			groups[key].avgDuration =
				durations.reduce((a, b) => a + b, 0) / durations.length
		})

		return groups
	}
}

// Run the load test
const tester = new LoadTester(BASE_URL, CONCURRENT_USERS, TEST_DURATION)
tester.runTest().catch(console.error)
```

## Production Optimization

### Environment-Specific Optimizations

```typescript
// utils/production-config.ts
const productionOptimizations = {
	// Enable compression
	compression: true,

	// Optimize JSON parsing
	jsonLimit: '1mb',

	// Connection settings
	keepAliveTimeout: 65000,
	headersTimeout: 66000,

	// Memory settings
	maxOldSpaceSize: 4096, // 4GB

	// Garbage collection
	exposeGC: true,
}

// Apply optimizations based on environment
if (process.env.NODE_ENV === 'production') {
	// Set Node.js flags
	process.env.NODE_OPTIONS = [
		`--max-old-space-size=${productionOptimizations.maxOldSpaceSize}`,
		'--optimize-for-size',
		'--gc-interval=100',
	].join(' ')
}

export { productionOptimizations }
```

### Deployment Checklist

```markdown
## Performance Deployment Checklist

### Pre-deployment

- [ ] Run load tests
- [ ] Profile memory usage
- [ ] Optimize database queries
- [ ] Enable response compression
- [ ] Configure caching headers
- [ ] Minimize bundle size

### Monitoring Setup

- [ ] Set up performance monitoring
- [ ] Configure memory alerts
- [ ] Set up error tracking
- [ ] Enable request logging
- [ ] Configure health checks

### Post-deployment

- [ ] Monitor response times
- [ ] Check memory usage patterns
- [ ] Verify cache hit rates
- [ ] Monitor error rates
- [ ] Review slow query logs
```

## Next Steps

- [Deployment Guide](/guides/deploy.md) - Production deployment strategies
- [Best Practices](/examples/best-practices.md) - Code organization and patterns
- [API Reference](/reference/api.md) - Complete API documentation
- [Troubleshooting](/guides/troubleshooting.md) - Common issues and solutions
