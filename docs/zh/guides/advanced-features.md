# 高级功能

本指南涵盖了 hono-filebased-route 的高级功能和模式，包括中间件集成、自定义钩子、性能优化和高级路由技术。

## 中间件集成

### 全局中间件

```typescript
// app.ts
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { timing } from 'hono/timing'
import { fileBasedRouting } from 'hono-filebased-route'

const app = new Hono()

// 全局中间件
app.use('*', cors({
  origin: ['http://localhost:3000', 'https://yourdomain.com'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization']
}))

app.use('*', logger())
app.use('*', timing())

// 自定义全局中间件
app.use('*', async (c, next) => {
  c.set('requestId', crypto.randomUUID())
  c.set('startTime', Date.now())
  
  await next()
  
  const duration = Date.now() - c.get('startTime')
  c.header('X-Response-Time', `${duration}ms`)
  c.header('X-Request-ID', c.get('requestId'))
})

// 应用基于文件的路由
fileBasedRouting(app, {
  dir: './routes'
})

export default app
```

### 路由特定中间件

```typescript
// routes/api/protected/[...path].ts
import type { Context, Next } from 'hono'
import { jwt } from 'hono/jwt'

// 身份验证中间件
const authMiddleware = jwt({
  secret: process.env.JWT_SECRET || 'your-secret-key'
})

// 速率限制中间件
const rateLimitMiddleware = async (c: Context, next: Next) => {
  const clientIP = c.req.header('x-forwarded-for') || 'unknown'
  const key = `rate_limit:${clientIP}`
  
  // 简单的内存速率限制（生产环境中使用 Redis）
  const requests = global.rateLimitStore?.get(key) || 0
  
  if (requests >= 100) { // 每个时间窗口 100 个请求
    return c.json({ error: 'Rate limit exceeded' }, 429)
  }
  
  global.rateLimitStore?.set(key, requests + 1)
  
  await next()
}

// 将中间件应用到所有方法
export const GET = [authMiddleware, rateLimitMiddleware, async (c: Context) => {
  const path = c.req.param('path')
  const payload = c.get('jwtPayload')
  
  return c.json({
    message: 'Protected resource accessed',
    path,
    user: payload.sub,
    requestId: c.get('requestId')
  })
}]

export const POST = [authMiddleware, rateLimitMiddleware, async (c: Context) => {
  const path = c.req.param('path')
  const body = await c.req.json()
  const payload = c.get('jwtPayload')
  
  return c.json({
    message: 'Resource created',
    path,
    data: body,
    createdBy: payload.sub
  }, 201)
}]
```

### 自定义中间件工厂

```typescript
// middleware/validation.ts
import type { Context, Next } from 'hono'
import { z } from 'zod'

export const validateBody = <T>(schema: z.ZodSchema<T>) => {
  return async (c: Context, next: Next) => {
    try {
      const body = await c.req.json()
      const validatedData = schema.parse(body)
      c.set('validatedBody', validatedData)
      await next()
    } catch (error) {
      if (error instanceof z.ZodError) {
        return c.json({
          error: 'Validation failed',
          details: error.errors
        }, 400)
      }
      return c.json({ error: 'Invalid JSON' }, 400)
    }
  }
}

export const validateParams = <T>(schema: z.ZodSchema<T>) => {
  return async (c: Context, next: Next) => {
    try {
      const params = c.req.param()
      const validatedParams = schema.parse(params)
      c.set('validatedParams', validatedParams)
      await next()
    } catch (error) {
      if (error instanceof z.ZodError) {
        return c.json({
          error: 'Invalid parameters',
          details: error.errors
        }, 400)
      }
      return c.json({ error: 'Parameter validation failed' }, 400)
    }
  }
}

// 在路由中使用
// routes/users/[id].ts
import { validateParams } from '../../middleware/validation'
import { z } from 'zod'

const paramsSchema = z.object({
  id: z.string().regex(/^\d+$/, 'ID must be numeric')
})

export const GET = [validateParams(paramsSchema), async (c: Context) => {
  const { id } = c.get('validatedParams')
  
  return c.json({
    user: {
      id: parseInt(id, 10),
      name: `User ${id}`
    }
  })
}]
```

## 自定义钩子和工具

### 请求上下文钩子

```typescript
// hooks/useContext.ts
import type { Context } from 'hono'

export const useAuth = (c: Context) => {
  const payload = c.get('jwtPayload')
  
  return {
    user: payload ? {
      id: payload.sub,
      email: payload.email,
      role: payload.role
    } : null,
    isAuthenticated: !!payload,
    requireAuth: () => {
      if (!payload) {
        throw new Error('Authentication required')
      }
      return payload
    }
  }
}

export const usePagination = (c: Context) => {
  const page = parseInt(c.req.query('page') || '1', 10)
  const limit = Math.min(parseInt(c.req.query('limit') || '10', 10), 100)
  const offset = (page - 1) * limit
  
  return {
    page: Math.max(1, page),
    limit,
    offset,
    createMeta: (total: number) => ({
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1
    })
  }
}

export const useValidation = (c: Context) => {
  return {
    body: <T>() => c.get('validatedBody') as T,
    params: <T>() => c.get('validatedParams') as T,
    query: <T>() => c.get('validatedQuery') as T
  }
}
```

### 数据库集成钩子

```typescript
// hooks/useDatabase.ts
import type { Context } from 'hono'

interface DatabaseConfig {
  host: string
  port: number
  database: string
  user: string
  password: string
}

class DatabaseConnection {
  private static instance: DatabaseConnection
  private config: DatabaseConfig
  
  private constructor(config: DatabaseConfig) {
    this.config = config
  }
  
  static getInstance(config: DatabaseConfig): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection(config)
    }
    return DatabaseConnection.instance
  }
  
  async query<T>(sql: string, params: any[] = []): Promise<T[]> {
    // 在这里实现您的数据库查询逻辑
    console.log('Executing query:', sql, params)
    return [] as T[]
  }
  
  async transaction<T>(callback: (db: DatabaseConnection) => Promise<T>): Promise<T> {
    // 实现事务逻辑
    console.log('Starting transaction')
    try {
      const result = await callback(this)
      console.log('Committing transaction')
      return result
    } catch (error) {
      console.log('Rolling back transaction')
      throw error
    }
  }
}

export const useDatabase = (c: Context) => {
  const config: DatabaseConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME || 'myapp',
    user: process.env.DB_USER || 'user',
    password: process.env.DB_PASSWORD || 'password'
  }
  
  const db = DatabaseConnection.getInstance(config)
  
  return {
    query: db.query.bind(db),
    transaction: db.transaction.bind(db),
    
    // 辅助方法
    findById: async <T>(table: string, id: string | number): Promise<T | null> => {
      const results = await db.query<T>(
        `SELECT * FROM ${table} WHERE id = $1 LIMIT 1`,
        [id]
      )
      return results[0] || null
    },
    
    create: async <T>(table: string, data: Partial<T>): Promise<T> => {
      const keys = Object.keys(data)
      const values = Object.values(data)
      const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ')
      
      const results = await db.query<T>(
        `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders}) RETURNING *`,
        values
      )
      return results[0]
    },
    
    update: async <T>(table: string, id: string | number, data: Partial<T>): Promise<T | null> => {
      const keys = Object.keys(data)
      const values = Object.values(data)
      const setClause = keys.map((key, i) => `${key} = $${i + 2}`).join(', ')
      
      const results = await db.query<T>(
        `UPDATE ${table} SET ${setClause} WHERE id = $1 RETURNING *`,
        [id, ...values]
      )
      return results[0] || null
    },
    
    delete: async (table: string, id: string | number): Promise<boolean> => {
      const results = await db.query(
        `DELETE FROM ${table} WHERE id = $1`,
        [id]
      )
      return results.length > 0
    }
  }
}
```

## 性能优化

### 响应缓存

```typescript
// middleware/cache.ts
import type { Context, Next } from 'hono'

interface CacheOptions {
  ttl?: number // 生存时间（秒）
  key?: (c: Context) => string
  condition?: (c: Context) => boolean
}

const cache = new Map<string, { data: any; expires: number }>()

export const cacheMiddleware = (options: CacheOptions = {}) => {
  const {
    ttl = 300, // 默认 5 分钟
    key = (c) => c.req.url,
    condition = (c) => c.req.method === 'GET'
  } = options
  
  return async (c: Context, next: Next) => {
    if (!condition(c)) {
      await next()
      return
    }
    
    const cacheKey = key(c)
    const cached = cache.get(cacheKey)
    
    if (cached && cached.expires > Date.now()) {
      c.header('X-Cache', 'HIT')
      return c.json(cached.data)
    }
    
    await next()
    
    // 缓存成功的响应
    if (c.res.status === 200) {
      const responseClone = c.res.clone()
      const data = await responseClone.json()
      
      cache.set(cacheKey, {
        data,
        expires: Date.now() + (ttl * 1000)
      })
      
      c.header('X-Cache', 'MISS')
    }
  }
}

// 使用方法
// routes/api/posts/index.ts
import { cacheMiddleware } from '../../../middleware/cache'

export const GET = [cacheMiddleware({ ttl: 600 }), async (c: Context) => {
  // 此响应将被缓存 10 分钟
  return c.json({
    posts: [
      { id: 1, title: 'First Post', content: 'Content...' },
      { id: 2, title: 'Second Post', content: 'More content...' }
    ]
  })
}]
```

### 请求压缩

```typescript
// middleware/compression.ts
import type { Context, Next } from 'hono'
import { compress } from 'hono/compress'

export const compressionMiddleware = compress({
  encoding: 'gzip',
  threshold: 1024 // 只压缩大于 1KB 的响应
})

// 在 app.ts 中全局应用
app.use('*', compressionMiddleware)
```

### 数据库连接池

```typescript
// utils/database.ts
class ConnectionPool {
  private connections: any[] = []
  private maxConnections: number
  private currentConnections: number = 0
  
  constructor(maxConnections: number = 10) {
    this.maxConnections = maxConnections
  }
  
  async getConnection() {
    if (this.connections.length > 0) {
      return this.connections.pop()
    }
    
    if (this.currentConnections < this.maxConnections) {
      this.currentConnections++
      // 创建新连接（实现您的数据库连接逻辑）
      return this.createConnection()
    }
    
    // 等待可用连接
    return new Promise((resolve) => {
      const checkForConnection = () => {
        if (this.connections.length > 0) {
          resolve(this.connections.pop())
        } else {
          setTimeout(checkForConnection, 10)
        }
      }
      checkForConnection()
    })
  }
  
  releaseConnection(connection: any) {
    this.connections.push(connection)
  }
  
  private createConnection() {
    // 实现您的数据库连接创建逻辑
    return {
      query: async (sql: string, params: any[]) => {
        // 数据库查询实现
        return []
      }
    }
  }
}

export const pool = new ConnectionPool()
```

## 高级路由模式

### 具有共享逻辑的路由组

```typescript
// routes/api/v1/_middleware.ts
import type { Context, Next } from 'hono'

// 所有 v1 API 路由的共享中间件
export const apiV1Middleware = async (c: Context, next: Next) => {
  // API 版本控制
  c.header('API-Version', 'v1')
  
  // 请求日志记录
  console.log(`[API v1] ${c.req.method} ${c.req.url}`)
  
  // API 速率限制
  const apiKey = c.req.header('X-API-Key')
  if (!apiKey) {
    return c.json({ error: 'API key required' }, 401)
  }
  
  // 验证 API 密钥（实现您的逻辑）
  if (!isValidApiKey(apiKey)) {
    return c.json({ error: 'Invalid API key' }, 401)
  }
  
  c.set('apiKey', apiKey)
  await next()
}

const isValidApiKey = (key: string): boolean => {
  // 实现 API 密钥验证
  return key.startsWith('ak_') && key.length === 32
}
```

### 条件路由加载

```typescript
// routes/admin/[...path].ts
import type { Context } from 'hono'

// 仅在开发环境或启用管理员标志时加载管理员路由
if (process.env.NODE_ENV === 'development' || process.env.ENABLE_ADMIN === 'true') {
  
  const adminAuth = async (c: Context, next: any) => {
    const token = c.req.header('Authorization')?.replace('Bearer ', '')
    
    if (!token || !isAdminToken(token)) {
      return c.json({ error: 'Admin access required' }, 403)
    }
    
    await next()
  }
  
  export const GET = [adminAuth, async (c: Context) => {
    const path = c.req.param('path')
    
    return c.json({
      message: 'Admin panel access',
      path,
      environment: process.env.NODE_ENV
    })
  }]
  
  export const POST = [adminAuth, async (c: Context) => {
    const path = c.req.param('path')
    const body = await c.req.json()
    
    return c.json({
      message: 'Admin action performed',
      path,
      action: body
    })
  }]
  
} else {
  // 在生产环境中为管理员路由返回 404
  export const GET = (c: Context) => c.json({ error: 'Not found' }, 404)
  export const POST = (c: Context) => c.json({ error: 'Not found' }, 404)
}

const isAdminToken = (token: string): boolean => {
  // 实现管理员令牌验证
  return token === process.env.ADMIN_TOKEN
}
```

### 动态路由注册

```typescript
// utils/dynamicRoutes.ts
import type { Hono } from 'hono'

interface DynamicRoute {
  path: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  handler: (c: any) => any
  middleware?: any[]
}

export const registerDynamicRoutes = (app: Hono, routes: DynamicRoute[]) => {
  routes.forEach(({ path, method, handler, middleware = [] }) => {
    const routeHandler = middleware.length > 0 
      ? [...middleware, handler]
      : handler
    
    switch (method) {
      case 'GET':
        app.get(path, ...routeHandler)
        break
      case 'POST':
        app.post(path, ...routeHandler)
        break
      case 'PUT':
        app.put(path, ...routeHandler)
        break
      case 'DELETE':
        app.delete(path, ...routeHandler)
        break
    }
  })
}

// 在 app.ts 中使用
const dynamicRoutes: DynamicRoute[] = [
  {
    path: '/health',
    method: 'GET',
    handler: (c) => c.json({ status: 'healthy', timestamp: new Date().toISOString() })
  },
  {
    path: '/metrics',
    method: 'GET',
    handler: (c) => c.json({ 
      requests: global.requestCount || 0,
      uptime: process.uptime()
    }),
    middleware: [authMiddleware]
  }
]

registerDynamicRoutes(app, dynamicRoutes)
```

## 错误处理和监控

### 全局错误处理器

```typescript
// middleware/errorHandler.ts
import type { Context, Next } from 'hono'

export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export const errorHandler = async (c: Context, next: Next) => {
  try {
    await next()
  } catch (error) {
    console.error('Error occurred:', error)
    
    if (error instanceof AppError) {
      return c.json({
        error: error.message,
        code: error.code,
        requestId: c.get('requestId')
      }, error.statusCode)
    }
    
    // 处理验证错误
    if (error.name === 'ZodError') {
      return c.json({
        error: 'Validation failed',
        details: error.errors,
        requestId: c.get('requestId')
      }, 400)
    }
    
    // 通用错误
    return c.json({
      error: 'Internal server error',
      requestId: c.get('requestId')
    }, 500)
  }
}
```

### 请求监控

```typescript
// middleware/monitoring.ts
import type { Context, Next } from 'hono'

interface RequestMetrics {
  path: string
  method: string
  statusCode: number
  duration: number
  timestamp: number
  userAgent?: string
  ip?: string
}

const metrics: RequestMetrics[] = []

export const monitoringMiddleware = async (c: Context, next: Next) => {
  const startTime = Date.now()
  
  await next()
  
  const duration = Date.now() - startTime
  const metric: RequestMetrics = {
    path: c.req.path,
    method: c.req.method,
    statusCode: c.res.status,
    duration,
    timestamp: startTime,
    userAgent: c.req.header('user-agent'),
    ip: c.req.header('x-forwarded-for') || 'unknown'
  }
  
  metrics.push(metric)
  
  // 只保留最近 1000 个请求
  if (metrics.length > 1000) {
    metrics.shift()
  }
  
  // 记录慢请求
  if (duration > 1000) {
    console.warn(`Slow request: ${metric.method} ${metric.path} took ${duration}ms`)
  }
}

export const getMetrics = () => {
  const now = Date.now()
  const last24h = metrics.filter(m => now - m.timestamp < 24 * 60 * 60 * 1000)
  
  return {
    total: metrics.length,
    last24h: last24h.length,
    averageResponseTime: metrics.reduce((sum, m) => sum + m.duration, 0) / metrics.length,
    statusCodes: metrics.reduce((acc, m) => {
      acc[m.statusCode] = (acc[m.statusCode] || 0) + 1
      return acc
    }, {} as Record<number, number>),
    topPaths: Object.entries(
      metrics.reduce((acc, m) => {
        acc[m.path] = (acc[m.path] || 0) + 1
        return acc
      }, {} as Record<string, number>)
    ).sort(([,a], [,b]) => b - a).slice(0, 10)
  }
}
```

## 测试高级功能

```typescript
// tests/advanced-features.test.ts
import { Hono } from 'hono'
import { fileBasedRouting } from 'hono-filebased-route'

const app = new Hono()
fileBasedRouting(app, { dir: './routes' })

describe('Advanced Features', () => {
  describe('Middleware Integration', () => {
    test('applies global middleware', async () => {
      const res = await app.request('/api/test')
      expect(res.headers.get('X-Request-ID')).toBeTruthy()
    })
    
    test('applies route-specific middleware', async () => {
      const res = await app.request('/api/protected/data', {
        headers: { 'Authorization': 'Bearer valid-token' }
      })
      expect(res.status).toBe(200)
    })
  })
  
  describe('Caching', () => {
    test('caches GET requests', async () => {
      const res1 = await app.request('/api/posts')
      const res2 = await app.request('/api/posts')
      
      expect(res1.headers.get('X-Cache')).toBe('MISS')
      expect(res2.headers.get('X-Cache')).toBe('HIT')
    })
  })
  
  describe('Error Handling', () => {
    test('handles application errors', async () => {
      const res = await app.request('/api/error-test')
      expect(res.status).toBe(500)
      
      const data = await res.json()
      expect(data.requestId).toBeTruthy()
    })
  })
})
```

## 最佳实践

### 1. 中间件组织

```typescript
// ✅ 良好 - 有组织的中间件结构
middleware/
├── auth/
│   ├── jwt.ts
│   ├── apiKey.ts
│   └── rbac.ts
├── validation/
│   ├── body.ts
│   ├── params.ts
│   └── query.ts
├── performance/
│   ├── cache.ts
│   ├── compression.ts
│   └── rateLimit.ts
└── monitoring/
    ├── logging.ts
    ├── metrics.ts
    └── errorHandler.ts
```

### 2. 环境配置

```typescript
// config/index.ts
interface Config {
  port: number
  database: {
    host: string
    port: number
    name: string
  }
  jwt: {
    secret: string
    expiresIn: string
  }
  cache: {
    ttl: number
    maxSize: number
  }
}

const config: Config = {
  port: parseInt(process.env.PORT || '3000', 10),
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    name: process.env.DB_NAME || 'myapp'
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  },
  cache: {
    ttl: parseInt(process.env.CACHE_TTL || '300', 10),
    maxSize: parseInt(process.env.CACHE_MAX_SIZE || '1000', 10)
  }
}

export default config
```

### 3. 类型安全

```typescript
// types/context.ts
import type { Context } from 'hono'

// 扩展 Hono 上下文类型
declare module 'hono' {
  interface ContextVariableMap {
    requestId: string
    startTime: number
    jwtPayload?: {
      sub: string
      email: string
      role: string
    }
    validatedBody?: any
    validatedParams?: any
    validatedQuery?: any
  }
}

// 自定义上下文类型
export interface AppContext extends Context {
  get<T extends keyof ContextVariableMap>(key: T): ContextVariableMap[T]
  set<T extends keyof ContextVariableMap>(key: T, value: ContextVariableMap[T]): void
}
```

### 4. 错误处理策略

```typescript
// ✅ 良好 - 结构化错误处理
export enum ErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  INTERNAL_ERROR = 'INTERNAL_ERROR'
}

export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number,
    public code: ErrorCode,
    public details?: any
  ) {
    super(message)
    this.name = 'AppError'
  }
}

// 预定义错误
export const createValidationError = (details: any) => 
  new AppError('Validation failed', 400, ErrorCode.VALIDATION_ERROR, details)

export const createAuthError = (message = 'Authentication required') => 
  new AppError(message, 401, ErrorCode.AUTHENTICATION_ERROR)

export const createNotFoundError = (resource = 'Resource') => 
  new AppError(`${resource} not found`, 404, ErrorCode.NOT_FOUND)
```

### 5. 性能监控

```typescript
// ✅ 良好 - 性能监控最佳实践
export const performanceMiddleware = async (c: Context, next: Next) => {
  const start = performance.now()
  
  await next()
  
  const duration = performance.now() - start
  
  // 记录性能指标
  console.log({
    method: c.req.method,
    path: c.req.path,
    status: c.res.status,
    duration: Math.round(duration * 100) / 100,
    timestamp: new Date().toISOString()
  })
  
  // 添加性能头
  c.header('X-Response-Time', `${Math.round(duration)}ms`)
  
  // 警告慢请求
  if (duration > 1000) {
    console.warn(`Slow request detected: ${c.req.method} ${c.req.path} (${duration}ms)`)
  }
}
```

## 下一步

- [API 参考](../reference/api.md) - 详细的 API 文档
- [配置选项](../reference/configuration.md) - 所有配置选项
- [示例项目](../examples/projects.md) - 完整的示例项目
- [部署指南](../deployment/guide.md) - 生产环境部署
- [故障排除](../deployment/troubleshooting.md) - 常见问题解决方案