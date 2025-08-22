# Best Practices

This guide covers recommended patterns, conventions, and best practices for building applications with hono-filebased-route.

## Project Structure

### Recommended Directory Layout

```
project/
├── package.json
├── tsconfig.json
├── .env.example
├── scripts/
│   └── generate-routes.ts
├── src/
│   ├── main.ts
│   ├── types/
│   │   ├── index.ts
│   │   ├── api.ts
│   │   └── database.ts
│   ├── utils/
│   │   ├── auth.ts
│   │   ├── validation.ts
│   │   ├── database.ts
│   │   └── constants.ts
│   ├── middleware/
│   │   ├── auth.ts
│   │   ├── cors.ts
│   │   └── validation.ts
│   └── routes/
│       ├── index.ts
│       ├── api/
│       │   └── v1/
│       │       ├── users/
│       │       ├── posts/
│       │       └── admin/
│       └── health.ts
├── tests/
│   ├── routes/
│   ├── utils/
│   └── setup.ts
└── docs/
    └── api.md
```

### File Naming Conventions

```typescript
// ✅ Good - Clear, descriptive names
src/routes/users/[id]/posts.ts
src/routes/api/v1/products/categories/[category].ts
src/routes/admin/dashboard/analytics.ts

// ❌ Avoid - Unclear or inconsistent names
src/routes/u/[id]/p.ts
src/routes/api/v1/prod/cat/[c].ts
src/routes/admin/dash/stats.ts
```

## Route Organization

### Logical Grouping

Group related functionality together:

```
routes/
├── auth/
│   ├── login.ts          # POST /auth/login
│   ├── register.ts       # POST /auth/register
│   ├── refresh.ts        # POST /auth/refresh
│   └── logout.ts         # POST /auth/logout
├── users/
│   ├── index.ts          # GET /users, POST /users
│   ├── [id].ts           # GET /users/:id, PUT /users/:id
│   └── [id]/
│       ├── posts.ts      # GET /users/:id/posts
│       └── settings.ts   # GET /users/:id/settings
└── posts/
    ├── index.ts          # GET /posts, POST /posts
    ├── [id].ts           # GET /posts/:id, PUT /posts/:id
    └── [id]/
        └── comments.ts   # GET /posts/:id/comments
```

### API Versioning

```
routes/
└── api/
    ├── v1/
    │   ├── users/
    │   └── posts/
    └── v2/
        ├── users/
        └── posts/
```

## Error Handling

### Consistent Error Responses

```typescript
// utils/errors.ts
export interface APIError {
  error: string
  message: string
  code?: string
  details?: any
  timestamp: string
}

export function createErrorResponse(
  error: string,
  message: string,
  code?: string,
  details?: any
): APIError {
  return {
    error,
    message,
    code,
    details,
    timestamp: new Date().toISOString()
  }
}

// Usage in routes
export const GET = async (c: Context) => {
  try {
    // Route logic
  } catch (error) {
    if (error instanceof ValidationError) {
      return c.json(
        createErrorResponse(
          'VALIDATION_ERROR',
          'Invalid input data',
          'VAL_001',
          error.details
        ),
        400
      )
    }
    
    return c.json(
      createErrorResponse(
        'INTERNAL_ERROR',
        'An unexpected error occurred'
      ),
      500
    )
  }
}
```

### Error Categories

```typescript
// utils/errors.ts
export enum ErrorCodes {
  // Authentication errors (AUTH_xxx)
  AUTH_REQUIRED = 'AUTH_001',
  AUTH_INVALID_TOKEN = 'AUTH_002',
  AUTH_EXPIRED_TOKEN = 'AUTH_003',
  AUTH_INSUFFICIENT_PERMISSIONS = 'AUTH_004',
  
  // Validation errors (VAL_xxx)
  VAL_INVALID_INPUT = 'VAL_001',
  VAL_MISSING_FIELD = 'VAL_002',
  VAL_INVALID_FORMAT = 'VAL_003',
  
  // Resource errors (RES_xxx)
  RES_NOT_FOUND = 'RES_001',
  RES_ALREADY_EXISTS = 'RES_002',
  RES_CONFLICT = 'RES_003',
  
  // System errors (SYS_xxx)
  SYS_DATABASE_ERROR = 'SYS_001',
  SYS_EXTERNAL_SERVICE_ERROR = 'SYS_002',
  SYS_RATE_LIMIT_EXCEEDED = 'SYS_003'
}

export class APIError extends Error {
  constructor(
    public code: ErrorCodes,
    public message: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message)
    this.name = 'APIError'
  }
}
```

## Input Validation

### Schema-Based Validation

```typescript
// utils/validation.ts
import { z } from 'zod'

// Define reusable schemas
export const userSchemas = {
  create: z.object({
    email: z.string().email('Invalid email format'),
    username: z.string().min(3).max(50),
    password: z.string().min(8).regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one lowercase letter, one uppercase letter, and one number'
    ),
    firstName: z.string().min(1).max(100),
    lastName: z.string().min(1).max(100)
  }),
  
  update: z.object({
    username: z.string().min(3).max(50).optional(),
    firstName: z.string().min(1).max(100).optional(),
    lastName: z.string().min(1).max(100).optional(),
    bio: z.string().max(500).optional()
  }),
  
  query: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(20),
    search: z.string().optional(),
    role: z.enum(['user', 'admin']).optional()
  })
}

// Validation middleware
export function validateBody<T>(schema: z.ZodSchema<T>) {
  return async (c: Context, next: () => Promise<void>) => {
    try {
      const body = await c.req.json()
      const validatedData = schema.parse(body)
      c.set('validatedBody', validatedData)
      await next()
    } catch (error) {
      if (error instanceof z.ZodError) {
        return c.json(
          createErrorResponse(
            'VALIDATION_ERROR',
            'Invalid input data',
            ErrorCodes.VAL_INVALID_INPUT,
            error.errors
          ),
          400
        )
      }
      throw error
    }
  }
}

export function validateQuery<T>(schema: z.ZodSchema<T>) {
  return async (c: Context, next: () => Promise<void>) => {
    try {
      const query = c.req.query()
      const validatedQuery = schema.parse(query)
      c.set('validatedQuery', validatedQuery)
      await next()
    } catch (error) {
      if (error instanceof z.ZodError) {
        return c.json(
          createErrorResponse(
            'VALIDATION_ERROR',
            'Invalid query parameters',
            ErrorCodes.VAL_INVALID_INPUT,
            error.errors
          ),
          400
        )
      }
      throw error
    }
  }
}
```

### Usage in Routes

```typescript
// routes/users/index.ts
import { validateBody, validateQuery, userSchemas } from '@/utils/validation'

export const GET = async (c: Context) => {
  // Validate query parameters
  const validation = userSchemas.query.safeParse(c.req.query())
  if (!validation.success) {
    return c.json(
      createErrorResponse(
        'VALIDATION_ERROR',
        'Invalid query parameters',
        ErrorCodes.VAL_INVALID_INPUT,
        validation.error.errors
      ),
      400
    )
  }
  
  const { page, limit, search, role } = validation.data
  
  // Use validated data
  const users = await getUsersWithFilters({ page, limit, search, role })
  
  return c.json({
    users,
    pagination: {
      page,
      limit,
      total: users.length
    }
  })
}

export const POST = async (c: Context) => {
  const validation = userSchemas.create.safeParse(await c.req.json())
  if (!validation.success) {
    return c.json(
      createErrorResponse(
        'VALIDATION_ERROR',
        'Invalid user data',
        ErrorCodes.VAL_INVALID_INPUT,
        validation.error.errors
      ),
      400
    )
  }
  
  const userData = validation.data
  const user = await createUser(userData)
  
  return c.json({ user }, 201)
}
```

## Authentication & Authorization

### JWT-Based Authentication

```typescript
// utils/auth.ts
import jwt from 'jsonwebtoken'
import type { Context } from 'hono'

interface JWTPayload {
  userId: string
  email: string
  role: string
  permissions: string[]
}

export function generateTokens(user: User) {
  const payload: JWTPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    permissions: user.permissions
  }
  
  const accessToken = jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: '15m'
  })
  
  const refreshToken = jwt.sign(
    { userId: user.id },
    process.env.JWT_REFRESH_SECRET!,
    { expiresIn: '7d' }
  )
  
  return { accessToken, refreshToken }
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload
  } catch {
    return null
  }
}

export function extractToken(c: Context): string | null {
  const authHeader = c.req.header('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return null
  }
  return authHeader.substring(7)
}

// Authentication middleware
export async function requireAuth(c: Context, next: () => Promise<void>) {
  const token = extractToken(c)
  if (!token) {
    return c.json(
      createErrorResponse(
        'AUTHENTICATION_REQUIRED',
        'Authentication token is required',
        ErrorCodes.AUTH_REQUIRED
      ),
      401
    )
  }
  
  const payload = verifyToken(token)
  if (!payload) {
    return c.json(
      createErrorResponse(
        'INVALID_TOKEN',
        'Invalid or expired token',
        ErrorCodes.AUTH_INVALID_TOKEN
      ),
      401
    )
  }
  
  c.set('user', payload)
  await next()
}

// Authorization middleware
export function requireRole(roles: string[]) {
  return async (c: Context, next: () => Promise<void>) => {
    const user = c.get('user') as JWTPayload
    if (!user || !roles.includes(user.role)) {
      return c.json(
        createErrorResponse(
          'INSUFFICIENT_PERMISSIONS',
          'Insufficient permissions for this action',
          ErrorCodes.AUTH_INSUFFICIENT_PERMISSIONS
        ),
        403
      )
    }
    await next()
  }
}

export function requirePermission(permission: string) {
  return async (c: Context, next: () => Promise<void>) => {
    const user = c.get('user') as JWTPayload
    if (!user || !user.permissions.includes(permission)) {
      return c.json(
        createErrorResponse(
          'INSUFFICIENT_PERMISSIONS',
          `Permission '${permission}' is required`,
          ErrorCodes.AUTH_INSUFFICIENT_PERMISSIONS
        ),
        403
      )
    }
    await next()
  }
}
```

## Database Integration

### Repository Pattern

```typescript
// utils/database/base-repository.ts
export abstract class BaseRepository<T> {
  constructor(protected tableName: string) {}
  
  abstract findById(id: string): Promise<T | null>
  abstract findMany(filters?: any): Promise<T[]>
  abstract create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T>
  abstract update(id: string, data: Partial<T>): Promise<T | null>
  abstract delete(id: string): Promise<boolean>
  
  protected generateId(): string {
    return crypto.randomUUID()
  }
  
  protected now(): string {
    return new Date().toISOString()
  }
}

// utils/database/user-repository.ts
import type { User } from '@/types'

export class UserRepository extends BaseRepository<User> {
  constructor() {
    super('users')
  }
  
  async findById(id: string): Promise<User | null> {
    // Implementation
  }
  
  async findByEmail(email: string): Promise<User | null> {
    // Implementation
  }
  
  async findMany(filters: {
    role?: string
    search?: string
    page?: number
    limit?: number
  } = {}): Promise<User[]> {
    // Implementation
  }
  
  async create(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const user: User = {
      ...userData,
      id: this.generateId(),
      createdAt: this.now(),
      updatedAt: this.now()
    }
    
    // Save to database
    return user
  }
  
  async update(id: string, updates: Partial<User>): Promise<User | null> {
    // Implementation
  }
  
  async delete(id: string): Promise<boolean> {
    // Implementation
  }
}
```

### Service Layer

```typescript
// utils/services/user-service.ts
import { UserRepository } from '@/utils/database/user-repository'
import { hashPassword, comparePassword } from '@/utils/auth'

export class UserService {
  constructor(private userRepo: UserRepository) {}
  
  async createUser(userData: CreateUserData): Promise<User> {
    // Check if user already exists
    const existingUser = await this.userRepo.findByEmail(userData.email)
    if (existingUser) {
      throw new APIError(
        ErrorCodes.RES_ALREADY_EXISTS,
        'User with this email already exists',
        409
      )
    }
    
    // Hash password
    const hashedPassword = await hashPassword(userData.password)
    
    // Create user
    return this.userRepo.create({
      ...userData,
      password: hashedPassword,
      role: 'user',
      permissions: ['read:profile', 'update:profile']
    })
  }
  
  async authenticateUser(email: string, password: string): Promise<User | null> {
    const user = await this.userRepo.findByEmail(email)
    if (!user) return null
    
    const isValidPassword = await comparePassword(password, user.password)
    return isValidPassword ? user : null
  }
  
  async getUserProfile(userId: string): Promise<User | null> {
    const user = await this.userRepo.findById(userId)
    if (user) {
      // Remove sensitive data
      const { password, ...profile } = user
      return profile as User
    }
    return null
  }
}
```

## Response Formatting

### Consistent Response Structure

```typescript
// utils/responses.ts
export interface APIResponse<T = any> {
  success: boolean
  data?: T
  error?: APIError
  meta?: {
    pagination?: PaginationMeta
    timestamp: string
    version: string
  }
}

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

export function createSuccessResponse<T>(
  data: T,
  meta?: Partial<APIResponse['meta']>
): APIResponse<T> {
  return {
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      ...meta
    }
  }
}

export function createPaginatedResponse<T>(
  data: T[],
  pagination: PaginationMeta
): APIResponse<T[]> {
  return createSuccessResponse(data, { pagination })
}

export function createErrorResponse(
  error: APIError
): APIResponse {
  return {
    success: false,
    error,
    meta: {
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    }
  }
}
```

## Testing

### Route Testing

```typescript
// tests/routes/users.test.ts
import { testClient } from 'hono/testing'
import { app } from '@/main'

describe('Users API', () => {
  const client = testClient(app)
  
  describe('GET /users', () => {
    it('should return paginated users', async () => {
      const res = await client.users.$get({
        query: { page: '1', limit: '10' }
      })
      
      expect(res.status).toBe(200)
      
      const data = await res.json()
      expect(data.success).toBe(true)
      expect(data.data).toBeInstanceOf(Array)
      expect(data.meta?.pagination).toBeDefined()
    })
    
    it('should validate query parameters', async () => {
      const res = await client.users.$get({
        query: { page: '0', limit: '101' }
      })
      
      expect(res.status).toBe(400)
      
      const data = await res.json()
      expect(data.success).toBe(false)
      expect(data.error?.code).toBe('VAL_001')
    })
  })
  
  describe('POST /users', () => {
    it('should create a new user', async () => {
      const userData = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'Password123',
        firstName: 'Test',
        lastName: 'User'
      }
      
      const res = await client.users.$post({
        json: userData
      })
      
      expect(res.status).toBe(201)
      
      const data = await res.json()
      expect(data.success).toBe(true)
      expect(data.data.email).toBe(userData.email)
      expect(data.data.password).toBeUndefined() // Should not return password
    })
  })
})
```

### Integration Testing

```typescript
// tests/integration/auth-flow.test.ts
describe('Authentication Flow', () => {
  let authToken: string
  
  it('should register a new user', async () => {
    const res = await client.auth.register.$post({
      json: {
        email: 'integration@test.com',
        username: 'integrationtest',
        password: 'Password123',
        firstName: 'Integration',
        lastName: 'Test'
      }
    })
    
    expect(res.status).toBe(201)
    const data = await res.json()
    expect(data.data.token).toBeDefined()
    authToken = data.data.token
  })
  
  it('should access protected route with token', async () => {
    const res = await client.users.profile.$get(
      {},
      {
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      }
    )
    
    expect(res.status).toBe(200)
  })
  
  it('should reject access without token', async () => {
    const res = await client.users.profile.$get()
    expect(res.status).toBe(401)
  })
})
```

## Performance Optimization

### Caching Strategies

```typescript
// utils/cache.ts
interface CacheOptions {
  ttl?: number // Time to live in seconds
  key?: string
}

const cache = new Map<string, { data: any; expires: number }>()

export function withCache<T>(
  fn: () => Promise<T>,
  options: CacheOptions = {}
): Promise<T> {
  const { ttl = 300, key = fn.toString() } = options
  const cacheKey = `cache:${key}`
  
  const cached = cache.get(cacheKey)
  if (cached && cached.expires > Date.now()) {
    return Promise.resolve(cached.data)
  }
  
  return fn().then(data => {
    cache.set(cacheKey, {
      data,
      expires: Date.now() + (ttl * 1000)
    })
    return data
  })
}

// Usage in routes
export const GET = async (c: Context) => {
  const users = await withCache(
    () => userService.getAllUsers(),
    { ttl: 600, key: 'all-users' }
  )
  
  return c.json(createSuccessResponse(users))
}
```

### Request Optimization

```typescript
// utils/optimization.ts
export function withRateLimit(requests: number, windowMs: number) {
  const requests_map = new Map<string, number[]>()
  
  return async (c: Context, next: () => Promise<void>) => {
    const clientId = c.req.header('x-forwarded-for') || 'unknown'
    const now = Date.now()
    const windowStart = now - windowMs
    
    const clientRequests = requests_map.get(clientId) || []
    const recentRequests = clientRequests.filter(time => time > windowStart)
    
    if (recentRequests.length >= requests) {
      return c.json(
        createErrorResponse(
          new APIError(
            ErrorCodes.SYS_RATE_LIMIT_EXCEEDED,
            'Rate limit exceeded',
            429
          )
        ),
        429
      )
    }
    
    recentRequests.push(now)
    requests_map.set(clientId, recentRequests)
    
    await next()
  }
}
```

## Security Best Practices

### Input Sanitization

```typescript
// utils/security.ts
import DOMPurify from 'isomorphic-dompurify'

export function sanitizeInput(input: string): string {
  return DOMPurify.sanitize(input, { ALLOWED_TAGS: [] })
}

export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const sanitized = {} as T
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key as keyof T] = sanitizeInput(value) as T[keyof T]
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key as keyof T] = sanitizeObject(value)
    } else {
      sanitized[key as keyof T] = value
    }
  }
  
  return sanitized
}
```

### CORS Configuration

```typescript
// main.ts
import { cors } from 'hono/cors'

app.use('*', cors({
  origin: (origin) => {
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000']
    return allowedOrigins.includes(origin) || !origin
  },
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  exposeHeaders: ['X-Total-Count'],
  credentials: true,
  maxAge: 86400
}))
```

## Monitoring and Logging

### Structured Logging

```typescript
// utils/logger.ts
enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3
}

interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  context?: any
  userId?: string
  requestId?: string
}

export class Logger {
  private level: LogLevel
  
  constructor(level: LogLevel = LogLevel.INFO) {
    this.level = level
  }
  
  private log(level: LogLevel, message: string, context?: any) {
    if (level <= this.level) {
      const entry: LogEntry = {
        level,
        message,
        timestamp: new Date().toISOString(),
        context
      }
      
      console.log(JSON.stringify(entry))
    }
  }
  
  error(message: string, context?: any) {
    this.log(LogLevel.ERROR, message, context)
  }
  
  warn(message: string, context?: any) {
    this.log(LogLevel.WARN, message, context)
  }
  
  info(message: string, context?: any) {
    this.log(LogLevel.INFO, message, context)
  }
  
  debug(message: string, context?: any) {
    this.log(LogLevel.DEBUG, message, context)
  }
}

export const logger = new Logger(
  process.env.NODE_ENV === 'development' ? LogLevel.DEBUG : LogLevel.INFO
)
```

## Deployment Considerations

### Environment Configuration

```typescript
// utils/config.ts
import { z } from 'zod'

const configSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  JWT_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url().optional(),
  ALLOWED_ORIGINS: z.string().default('http://localhost:3000'),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info')
})

export const config = configSchema.parse(process.env)
```

### Health Checks

```typescript
// routes/health.ts
import type { Context } from 'hono'
import { config } from '@/utils/config'

export const GET = async (c: Context) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: config.NODE_ENV,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    checks: {
      database: await checkDatabase(),
      redis: await checkRedis()
    }
  }
  
  const isHealthy = Object.values(health.checks).every(check => check.status === 'healthy')
  
  return c.json(health, isHealthy ? 200 : 503)
}

async function checkDatabase(): Promise<{ status: string; responseTime?: number }> {
  try {
    const start = Date.now()
    // Perform database health check
    const responseTime = Date.now() - start
    return { status: 'healthy', responseTime }
  } catch (error) {
    return { status: 'unhealthy' }
  }
}

async function checkRedis(): Promise<{ status: string; responseTime?: number }> {
  try {
    const start = Date.now()
    // Perform Redis health check
    const responseTime = Date.now() - start
    return { status: 'healthy', responseTime }
  } catch (error) {
    return { status: 'unhealthy' }
  }
}
```

## Next Steps

- [Performance Guide](../guides/performance.md) - Advanced optimization techniques
- [Deployment Guide](../guides/deployment.md) - Production deployment strategies
- [API Reference](../reference/api.md) - Complete API documentation
- [Project Examples](./projects.md) - Real-world application examples