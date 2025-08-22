# 性能指南

本指南涵盖了使用 hono-filebased-route 构建应用程序的性能优化技术、最佳实践和监控策略。

## 概述

基于文件路由的应用程序性能优化涉及几个关键领域：

- 路由生成和加载
- 请求处理优化
- 缓存策略
- 数据库查询优化
- 内存管理
- 监控和性能分析

## 路由生成优化

### 构建时路由生成

在构建时而不是运行时生成路由以获得更好的性能：

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

### 优化的路由生成脚本

```typescript
// scripts/generate-routes.ts
import { generateRoutesFile } from '@hono-filebased-route/core'
import { performance } from 'perf_hooks'
import fs from 'fs/promises'

async function generateOptimizedRoutes() {
  const startTime = performance.now()
  
  console.log('🔄 正在生成路由...')
  
  try {
    // 生成路由并跟踪性能
    await generateRoutesFile()
    
    // 验证生成的文件
    const stats = await fs.stat('./src/generated-routes.ts')
    const endTime = performance.now()
    
    console.log(`✅ 路由生成成功`)
    console.log(`📊 文件大小: ${(stats.size / 1024).toFixed(2)} KB`)
    console.log(`⏱️  生成时间: ${(endTime - startTime).toFixed(2)}ms`)
    
  } catch (error) {
    console.error('❌ 路由生成失败:', error)
    process.exit(1)
  }
}

generateOptimizedRoutes()
```

### 性能优化的路由文件组织

```
// 优化结构 - 将相关路由分组
routes/
├── api/
│   └── v1/
│       ├── users/           # 用户相关路由
│       ├── posts/           # 文章相关路由
│       └── admin/           # 管理员路由
├── public/                  # 公共页面
└── health.ts               # 健康检查（独立以便快速访问）
```

## 请求处理优化

### 高效的路由处理器

```typescript
// 优化的路由处理器模式
export const GET = async (c: Context) => {
  // 早期验证和快速返回
  const id = c.req.param('id')
  if (!id || !isValidId(id)) {
    return c.json({ error: '无效的ID' }, 400)
  }
  
  try {
    // 使用 Promise.all 进行并行操作
    const [user, posts, stats] = await Promise.all([
      getUserById(id),
      getUserPosts(id, { limit: 10 }),
      getUserStats(id)
    ])
    
    if (!user) {
      return c.json({ error: '用户不存在' }, 404)
    }
    
    // 最小化响应负载
    return c.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email
        // 只包含必要字段
      },
      posts: posts.map(post => ({
        id: post.id,
        title: post.title,
        createdAt: post.createdAt
      })),
      stats
    })
  } catch (error) {
    console.error('获取用户信息错误:', error)
    return c.json({ error: '内部服务器错误' }, 500)
  }
}
```

### 请求验证优化

```typescript
// utils/validation-optimized.ts
import { z } from 'zod'

// 预编译模式以获得更好的性能
const userQuerySchema = z.object({
  page: z.coerce.number().min(1).max(1000).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().max(100).optional(),
  sort: z.enum(['name', 'email', 'createdAt']).default('createdAt')
})

// 缓存编译的模式
const schemaCache = new Map<string, z.ZodSchema>()

export function getCachedSchema(key: string, schema: z.ZodSchema): z.ZodSchema {
  if (!schemaCache.has(key)) {
    schemaCache.set(key, schema)
  }
  return schemaCache.get(key)!
}

// 快速验证，早期返回
export function validateQueryFast(query: any) {
  const schema = getCachedSchema('userQuery', userQuerySchema)
  const result = schema.safeParse(query)
  
  if (!result.success) {
    // 返回第一个错误以获得更快的响应
    const firstError = result.error.errors[0]
    throw new ValidationError(firstError.message, firstError.path)
  }
  
  return result.data
}
```

## 缓存策略

### 多级缓存

```typescript
// utils/cache-manager.ts
interface CacheConfig {
  ttl: number
  maxSize?: number
  strategy?: 'lru' | 'fifo'
}

class CacheManager {
  private memoryCache = new Map<string, { data: any; expires: number; hits: number }>()
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
    // 如果缓存已满，实现LRU淘汰
    if (this.memoryCache.size >= this.maxSize) {
      this.evictLeastUsed()
    }
    
    this.memoryCache.set(key, {
      data,
      expires: Date.now() + (ttl * 1000),
      hits: 0
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
      hitRate: this.calculateHitRate()
    }
  }
  
  private calculateHitRate(): number {
    const entries = Array.from(this.memoryCache.values())
    const totalHits = entries.reduce((sum, entry) => sum + entry.hits, 0)
    return entries.length > 0 ? totalHits / entries.length : 0
  }
}

export const cacheManager = new CacheManager()

// 函数缓存装饰器
export function cached(ttl: number = 300) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value
    
    descriptor.value = async function (...args: any[]) {
      const cacheKey = `${target.constructor.name}:${propertyKey}:${JSON.stringify(args)}`
      
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

### 响应缓存

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
  const cache = new Map<string, { data: any; expires: number; headers: Record<string, string> }>()
  
  return async (c: Context, next: () => Promise<void>) => {
    // 在某些条件下跳过缓存
    if (skipIf && skipIf(c)) {
      await next()
      return
    }
    
    // 生成缓存键
    const baseKey = `${c.req.method}:${c.req.path}`
    const varyKey = varyBy.map(header => c.req.header(header) || '').join(':')
    const cacheKey = `${baseKey}:${varyKey}`
    
    // 检查缓存
    const cached = cache.get(cacheKey)
    if (cached && cached.expires > Date.now()) {
      // 设置缓存的头部
      Object.entries(cached.headers).forEach(([key, value]) => {
        c.header(key, value)
      })
      c.header('X-Cache', 'HIT')
      
      return c.json(cached.data)
    }
    
    // 执行路由处理器
    await next()
    
    // 缓存成功的响应
    if (c.res.status === 200) {
      const responseData = await c.res.clone().json()
      const headers: Record<string, string> = {}
      
      // 捕获重要的头部
      c.res.headers.forEach((value, key) => {
        if (['content-type', 'cache-control'].includes(key.toLowerCase())) {
          headers[key] = value
        }
      })
      
      cache.set(cacheKey, {
        data: responseData,
        expires: Date.now() + (ttl * 1000),
        headers
      })
      
      c.header('X-Cache', 'MISS')
    }
  }
}

// 在路由中使用
export const GET = async (c: Context) => {
  // 此路由将被缓存5分钟
  return c.json({ data: await getExpensiveData() })
}

// 应用缓存中间件
app.use('/api/expensive-data', responseCache({ ttl: 300 }))
```

## 数据库优化

### 连接池

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
    // 创建最小连接数
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
    
    // 等待可用连接
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        const index = this.pending.findIndex(p => p.resolve === resolve)
        if (index !== -1) {
          this.pending.splice(index, 1)
          reject(new Error('连接获取超时'))
        }
      }, this.config.acquireTimeoutMillis)
      
      this.pending.push({
        resolve: (conn: any) => {
          clearTimeout(timeout)
          resolve(conn)
        },
        reject
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
    // 实现取决于您的数据库
    // 这是一个占位符
    return { id: Math.random() }
  }
  
  getStats() {
    return {
      total: this.connections.length,
      available: this.available.length,
      pending: this.pending.length
    }
  }
}

export const dbPool = new DatabasePool({
  min: 2,
  max: 10,
  acquireTimeoutMillis: 5000,
  idleTimeoutMillis: 30000
})
```

### 查询优化

```typescript
// utils/query-optimizer.ts
class QueryOptimizer {
  private queryCache = new Map<string, any>()
  private preparedStatements = new Map<string, any>()
  
  // 批量查询以减少数据库往返次数
  async batchQuery<T>(queries: Array<{ sql: string; params: any[] }>): Promise<T[]> {
    const connection = await dbPool.acquire()
    
    try {
      const results = await Promise.all(
        queries.map(({ sql, params }) => 
          connection.query(sql, params)
        )
      )
      
      return results
    } finally {
      dbPool.release(connection)
    }
  }
  
  // 对重复查询使用预处理语句
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
  
  // 使用适当的索引提示优化SELECT查询
  optimizeSelect(table: string, conditions: Record<string, any>, options: {
    limit?: number
    offset?: number
    orderBy?: string
    indexes?: string[]
  } = {}) {
    const { limit = 100, offset = 0, orderBy, indexes = [] } = options
    
    let sql = `SELECT * FROM ${table}`
    
    // 如果提供了索引提示，则添加
    if (indexes.length > 0) {
      sql += ` USE INDEX (${indexes.join(', ')})`
    }
    
    // 添加WHERE条件
    const whereConditions = Object.keys(conditions)
    if (whereConditions.length > 0) {
      sql += ` WHERE ${whereConditions.map(key => `${key} = ?`).join(' AND ')}`
    }
    
    // 添加ORDER BY
    if (orderBy) {
      sql += ` ORDER BY ${orderBy}`
    }
    
    // 添加LIMIT和OFFSET
    sql += ` LIMIT ${limit} OFFSET ${offset}`
    
    return {
      sql,
      params: Object.values(conditions)
    }
  }
}

export const queryOptimizer = new QueryOptimizer()

// 在服务中使用
export class UserService {
  @cached(300) // 缓存5分钟
  async getUsers(filters: UserFilters) {
    const { sql, params } = queryOptimizer.optimizeSelect('users', filters, {
      limit: filters.limit,
      offset: (filters.page - 1) * filters.limit,
      orderBy: 'created_at DESC',
      indexes: ['idx_users_email', 'idx_users_created_at']
    })
    
    return queryOptimizer.preparedQuery('getUsers', sql, params)
  }
  
  async getUserWithRelations(userId: string) {
    // 批量相关查询
    const results = await queryOptimizer.batchQuery([
      { sql: 'SELECT * FROM users WHERE id = ?', params: [userId] },
      { sql: 'SELECT * FROM posts WHERE user_id = ? LIMIT 10', params: [userId] },
      { sql: 'SELECT COUNT(*) as count FROM posts WHERE user_id = ?', params: [userId] }
    ])
    
    const [user, posts, postCount] = results
    
    return {
      user: user[0],
      posts,
      postCount: postCount[0].count
    }
  }
}
```

## 内存管理

### 内存监控

```typescript
// utils/memory-monitor.ts
class MemoryMonitor {
  private interval: NodeJS.Timeout | null = null
  private thresholds = {
    warning: 0.8,  // 堆限制的80%
    critical: 0.9  // 堆限制的90%
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
    
    console.log(`内存使用: ${heapUsedMB.toFixed(2)}MB / ${heapTotalMB.toFixed(2)}MB (${(heapUsageRatio * 100).toFixed(1)}%)`)
    
    if (heapUsageRatio > this.thresholds.critical) {
      console.error('🚨 检测到严重内存使用!')
      this.triggerGarbageCollection()
    } else if (heapUsageRatio > this.thresholds.warning) {
      console.warn('⚠️  检测到高内存使用')
    }
  }
  
  private triggerGarbageCollection() {
    if (global.gc) {
      console.log('🗑️  触发垃圾回收...')
      global.gc()
      
      const afterGC = process.memoryUsage()
      console.log(`GC后内存: ${(afterGC.heapUsed / 1024 / 1024).toFixed(2)}MB`)
    }
  }
  
  getMemoryStats() {
    const usage = process.memoryUsage()
    return {
      heapUsed: Math.round(usage.heapUsed / 1024 / 1024),
      heapTotal: Math.round(usage.heapTotal / 1024 / 1024),
      external: Math.round(usage.external / 1024 / 1024),
      rss: Math.round(usage.rss / 1024 / 1024),
      heapUsagePercent: Math.round((usage.heapUsed / usage.heapTotal) * 100)
    }
  }
}

export const memoryMonitor = new MemoryMonitor()

// 在生产环境中启动监控
if (process.env.NODE_ENV === 'production') {
  memoryMonitor.start()
}
```

### 对象池模式

```typescript
// utils/object-pool.ts
class ObjectPool<T> {
  private available: T[] = []
  private inUse = new Set<T>()
  private factory: () => T
  private reset: (obj: T) => void
  private maxSize: number
  
  constructor(
    factory: () => T,
    reset: (obj: T) => void,
    maxSize = 100
  ) {
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
      total: this.available.length + this.inUse.size
    }
  }
}

// 示例：响应对象池
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

// 在路由中使用
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

## 性能监控

### 请求性能跟踪

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
    
    // 只保留最近的指标
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics)
    }
  }
  
  getStats(timeWindowMs = 300000) { // 5分钟
    const now = Date.now()
    const recentMetrics = this.metrics.filter(
      m => now - m.timestamp < timeWindowMs
    )
    
    if (recentMetrics.length === 0) {
      return null
    }
    
    const durations = recentMetrics.map(m => m.duration)
    const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length
    const maxDuration = Math.max(...durations)
    const minDuration = Math.min(...durations)
    
    // 计算百分位数
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
      errorRate: recentMetrics.filter(m => m.statusCode >= 400).length / recentMetrics.length
    }
  }
  
  getSlowRequests(thresholdMs = 1000) {
    return this.metrics
      .filter(m => m.duration > thresholdMs)
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
      memoryUsage: endMemory - startMemory
    })
  }
}

// 性能监控端点
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
    uptime: process.uptime()
  })
}
```

## 负载测试

### 负载测试脚本

```javascript
// scripts/load-test.js
const BASE_URL = 'http://localhost:3000'
const CONCURRENT_USERS = 50
const TEST_DURATION = 60000 // 1分钟

class LoadTester {
  constructor(baseUrl, concurrentUsers, duration) {
    this.baseUrl = baseUrl
    this.concurrentUsers = concurrentUsers
    this.duration = duration
    this.results = []
    this.startTime = 0
  }
  
  async runTest() {
    console.log(`🚀 开始负载测试，${this.concurrentUsers}个并发用户，持续${this.duration/1000}秒`)
    
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
      await this.sleep(Math.random() * 1000) // 随机延迟
      
      await this.makeRequest('/api/posts', 'GET')
      await this.sleep(Math.random() * 500)
      
      // 偶尔模拟创建文章
      if (Math.random() < 0.1) {
        await this.makeRequest('/api/posts', 'POST', {
          title: `用户${userId}的测试文章`,
          content: '这是用于负载测试的测试文章'
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
        timestamp: Date.now()
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
        timestamp: Date.now()
      })
    }
  }
  
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
  
  generateReport() {
    const totalRequests = this.results.length
    const successfulRequests = this.results.filter(r => r.success).length
    const failedRequests = totalRequests - successfulRequests
    
    const durations = this.results.map(r => r.duration)
    const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length
    const maxDuration = Math.max(...durations)
    const minDuration = Math.min(...durations)
    
    const sortedDurations = durations.sort((a, b) => a - b)
    const p95 = sortedDurations[Math.floor(sortedDurations.length * 0.95)]
    
    const requestsPerSecond = totalRequests / (this.duration / 1000)
    
    console.log('\n📊 负载测试结果:')
    console.log(`总请求数: ${totalRequests}`)
    console.log(`成功: ${successfulRequests} (${((successfulRequests/totalRequests)*100).toFixed(1)}%)`)
    console.log(`失败: ${failedRequests} (${((failedRequests/totalRequests)*100).toFixed(1)}%)`)
    console.log(`请求/秒: ${requestsPerSecond.toFixed(2)}`)
    console.log(`平均响应时间: ${avgDuration.toFixed(2)}ms`)
    console.log(`最小响应时间: ${minDuration.toFixed(2)}ms`)
    console.log(`最大响应时间: ${maxDuration.toFixed(2)}ms`)
    console.log(`95百分位: ${p95.toFixed(2)}ms`)
    
    // 显示最慢的端点
    const endpointStats = this.groupByEndpoint()
    console.log('\n🐌 最慢的端点:')
    Object.entries(endpointStats)
      .sort(([,a], [,b]) => b.avgDuration - a.avgDuration)
      .slice(0, 5)
      .forEach(([endpoint, stats]) => {
        console.log(`${endpoint}: ${stats.avgDuration.toFixed(2)}ms 平均 (${stats.count} 请求)`)
      })
  }
  
  groupByEndpoint() {
    const groups = {}
    
    this.results.forEach(result => {
      const key = `${result.method} ${result.path}`
      if (!groups[key]) {
        groups[key] = { durations: [], count: 0 }
      }
      groups[key].durations.push(result.duration)
      groups[key].count++
    })
    
    Object.keys(groups).forEach(key => {
      const durations = groups[key].durations
      groups[key].avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length
    })
    
    return groups
  }
}

// 运行负载测试
const tester = new LoadTester(BASE_URL, CONCURRENT_USERS, TEST_DURATION)
tester.runTest().catch(console.error)
```

## 生产环境优化

### 环境特定优化

```typescript
// utils/production-config.ts
const productionOptimizations = {
  // 启用压缩
  compression: true,
  
  // 优化JSON解析
  jsonLimit: '1mb',
  
  // 连接设置
  keepAliveTimeout: 65000,
  headersTimeout: 66000,
  
  // 内存设置
  maxOldSpaceSize: 4096, // 4GB
  
  // 垃圾回收
  exposeGC: true
}

// 根据环境应用优化
if (process.env.NODE_ENV === 'production') {
  // 设置Node.js标志
  process.env.NODE_OPTIONS = [
    `--max-old-space-size=${productionOptimizations.maxOldSpaceSize}`,
    '--optimize-for-size',
    '--gc-interval=100'
  ].join(' ')
}

export { productionOptimizations }
```

### 部署检查清单

```markdown
## 性能部署检查清单

### 部署前
- [ ] 运行负载测试
- [ ] 分析内存使用情况
- [ ] 优化数据库查询
- [ ] 启用响应压缩
- [ ] 配置缓存头
- [ ] 最小化包大小

### 监控设置
- [ ] 设置性能监控
- [ ] 配置内存警报
- [ ] 设置错误跟踪
- [ ] 启用请求日志
- [ ] 配置健康检查

### 部署后
- [ ] 监控响应时间
- [ ] 检查内存使用模式
- [ ] 验证缓存命中率
- [ ] 监控错误率
- [ ] 查看慢查询日志
```

## 下一步

- [部署指南](./deployment.md) - 生产环境部署策略
- [最佳实践](../examples/best-practices.md) - 代码组织和模式
- [API参考](../reference/api.md) - 完整的API文档
- [故障排除](./troubleshooting.md) - 常见问题和解决方案