# 高级示例

本文档涵盖了 hono-filebased-route 的高级使用模式和复杂路由场景。

## 复杂路由模式

### 1. 多级动态路由

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

// 模拟数据库
const posts: Post[] = [
  {
    id: '1',
    userId: '1',
    title: '第一篇文章',
    content: '这是我的第一篇文章',
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    userId: '1',
    title: '第二篇文章',
    content: '这是我的第二篇文章',
    createdAt: '2024-01-02T00:00:00Z'
  }
]

export const GET = async (c: Context) => {
  const userId = c.req.param('userId')
  const postId = c.req.param('postId')
  
  const post = posts.find(p => p.id === postId && p.userId === userId)
  
  if (!post) {
    return c.json({ 
      error: '文章未找到或不属于该用户',
      userId,
      postId
    }, 404)
  }
  
  return c.json({
    post,
    meta: {
      userId,
      postId,
      path: `/api/v1/users/${userId}/posts/${postId}`
    }
  })
}

export const PUT = async (c: Context) => {
  const userId = c.req.param('userId')
  const postId = c.req.param('postId')
  
  try {
    const body = await c.req.json()
    
    const postIndex = posts.findIndex(p => p.id === postId && p.userId === userId)
    
    if (postIndex === -1) {
      return c.json({ error: '文章未找到' }, 404)
    }
    
    // 更新文章
    posts[postIndex] = {
      ...posts[postIndex],
      ...body,
      id: postId, // 确保 ID 不变
      userId: userId // 确保 userId 不变
    }
    
    return c.json({
      message: '文章更新成功',
      post: posts[postIndex]
    })
  } catch (error) {
    return c.json({ error: '无效的 JSON 主体' }, 400)
  }
}

export const DELETE = async (c: Context) => {
  const userId = c.req.param('userId')
  const postId = c.req.param('postId')
  
  const postIndex = posts.findIndex(p => p.id === postId && p.userId === userId)
  
  if (postIndex === -1) {
    return c.json({ error: '文章未找到' }, 404)
  }
  
  const deletedPost = posts.splice(postIndex, 1)[0]
  
  return c.json({
    message: '文章删除成功',
    deletedPost
  })
}
```

### 2. 高级捕获所有路由与路径处理

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

// 模拟文件系统
const files: Record<string, FileInfo> = {
  'documents/readme.txt': {
    name: 'readme.txt',
    path: 'documents/readme.txt',
    extension: '.txt',
    size: 1024,
    mimeType: 'text/plain'
  },
  'images/logo.png': {
    name: 'logo.png',
    path: 'images/logo.png',
    extension: '.png',
    size: 2048,
    mimeType: 'image/png'
  },
  'data/users.json': {
    name: 'users.json',
    path: 'data/users.json',
    extension: '.json',
    size: 512,
    mimeType: 'application/json'
  }
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
    '.js': 'application/javascript'
  }
  return mimeTypes[extension] || 'application/octet-stream'
}

export const GET = async (c: Context, pathSegments: string[]) => {
  const filePath = pathSegments.join('/')
  
  // 处理目录列表
  if (!filePath || filePath.endsWith('/')) {
    const directory = filePath.replace(/\/$/, '')
    const filesInDirectory = Object.values(files)
      .filter(file => {
        if (!directory) return !file.path.includes('/')
        return file.path.startsWith(directory + '/') && 
               file.path.split('/').length === directory.split('/').length + 1
      })
    
    return c.json({
      directory: directory || 'root',
      files: filesInDirectory,
      count: filesInDirectory.length
    })
  }
  
  // 处理特定文件
  const file = files[filePath]
  
  if (!file) {
    return c.json({ 
      error: '文件未找到',
      path: filePath,
      availableFiles: Object.keys(files)
    }, 404)
  }
  
  // 设置适当的头部
  c.header('Content-Type', file.mimeType)
  c.header('Content-Length', file.size?.toString() || '0')
  c.header('Cache-Control', 'public, max-age=3600')
  
  // 为了演示，返回文件信息而不是实际内容
  return c.json({
    file,
    downloadUrl: `/files/${filePath}/download`,
    metadata: {
      accessed: new Date().toISOString(),
      pathSegments,
      fullPath: filePath
    }
  })
}

export const POST = async (c: Context, pathSegments: string[]) => {
  const filePath = pathSegments.join('/')
  
  if (files[filePath]) {
    return c.json({ error: '文件已存在' }, 409)
  }
  
  try {
    const body = await c.req.json()
    
    if (!body.content) {
      return c.json({ error: '文件内容是必需的' }, 400)
    }
    
    const extension = extname(filePath)
    const name = basename(filePath)
    
    const newFile: FileInfo = {
      name,
      path: filePath,
      extension,
      size: JSON.stringify(body.content).length,
      mimeType: getMimeType(extension)
    }
    
    files[filePath] = newFile
    
    return c.json({
      message: '文件创建成功',
      file: newFile
    }, 201)
  } catch (error) {
    return c.json({ error: '无效的 JSON 主体' }, 400)
  }
}
```

### 3. API 版本控制与路由组织

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
      auth: '/api/v1/auth'
    },
    documentation: '/api/v1/docs',
    deprecated: false
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
      analytics: '/api/v2/analytics' // v2 新增
    },
    documentation: '/api/v2/docs',
    deprecated: false,
    changes: [
      '添加了分析端点',
      '改进了错误响应',
      '增强了身份验证'
    ]
  })
}
```

## 中间件集成模式

### 1. 身份验证中间件模拟

**src/routes/admin/[...path].ts**
```typescript
import type { Context } from 'hono'

interface AuthenticatedUser {
  id: string
  email: string
  role: 'admin' | 'user'
}

// 模拟身份验证检查
function authenticateRequest(c: Context): AuthenticatedUser | null {
  const authHeader = c.req.header('Authorization')
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }
  
  const token = authHeader.substring(7)
  
  // 模拟令牌验证
  if (token === 'admin-token') {
    return {
      id: '1',
      email: 'admin@example.com',
      role: 'admin'
    }
  }
  
  return null
}

function requireAdmin(user: AuthenticatedUser | null): boolean {
  return user?.role === 'admin'
}

export const GET = async (c: Context, pathSegments: string[]) => {
  // 身份验证检查
  const user = authenticateRequest(c)
  
  if (!user) {
    return c.json({ error: '需要身份验证' }, 401)
  }
  
  if (!requireAdmin(user)) {
    return c.json({ error: '需要管理员权限' }, 403)
  }
  
  const adminPath = pathSegments.join('/')
  
  // 基于路径的管理员特定逻辑
  switch (adminPath) {
    case 'users':
      return c.json({
        section: '用户管理',
        actions: ['列表', '创建', '更新', '删除'],
        user
      })
    
    case 'settings':
      return c.json({
        section: '系统设置',
        settings: {
          maintenance: false,
          debug: true,
          maxUsers: 1000
        },
        user
      })
    
    case 'logs':
      return c.json({
        section: '系统日志',
        logs: [
          { level: 'info', message: '服务器启动', timestamp: '2024-01-01T00:00:00Z' },
          { level: 'warn', message: '内存使用率高', timestamp: '2024-01-01T01:00:00Z' }
        ],
        user
      })
    
    default:
      return c.json({
        section: '管理员仪表板',
        availableSections: ['users', 'settings', 'logs'],
        path: adminPath,
        user
      })
  }
}

export const POST = async (c: Context, pathSegments: string[]) => {
  const user = authenticateRequest(c)
  
  if (!user || !requireAdmin(user)) {
    return c.json({ error: '需要管理员权限' }, 403)
  }
  
  try {
    const body = await c.req.json()
    const adminPath = pathSegments.join('/')
    
    return c.json({
      message: `在 ${adminPath} 上执行了管理员操作`,
      action: body,
      user: user.email,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return c.json({ error: '无效的 JSON 主体' }, 400)
  }
}
```

### 2. 速率限制模拟

**src/routes/api/limited/[endpoint].ts**
```typescript
import type { Context } from 'hono'

interface RateLimitInfo {
  requests: number
  resetTime: number
  limit: number
}

// 模拟速率限制存储
const rateLimits = new Map<string, RateLimitInfo>()

function getRateLimitKey(c: Context): string {
  // 在实际实现中，您可能使用 IP 地址或用户 ID
  return c.req.header('x-client-id') || 'anonymous'
}

function checkRateLimit(key: string, limit: number = 10, windowMs: number = 60000): {
  allowed: boolean
  remaining: number
  resetTime: number
} {
  const now = Date.now()
  const current = rateLimits.get(key)
  
  if (!current || now > current.resetTime) {
    // 重置或初始化
    rateLimits.set(key, {
      requests: 1,
      resetTime: now + windowMs,
      limit
    })
    return {
      allowed: true,
      remaining: limit - 1,
      resetTime: now + windowMs
    }
  }
  
  if (current.requests >= limit) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: current.resetTime
    }
  }
  
  current.requests++
  return {
    allowed: true,
    remaining: limit - current.requests,
    resetTime: current.resetTime
  }
}

export const GET = async (c: Context) => {
  const endpoint = c.req.param('endpoint')
  const clientKey = getRateLimitKey(c)
  
  // 不同端点的不同限制
  const limits: Record<string, number> = {
    'search': 5,
    'upload': 2,
    'download': 10,
    'default': 10
  }
  
  const limit = limits[endpoint] || limits.default
  const rateCheck = checkRateLimit(clientKey, limit)
  
  // 设置速率限制头部
  c.header('X-RateLimit-Limit', limit.toString())
  c.header('X-RateLimit-Remaining', rateCheck.remaining.toString())
  c.header('X-RateLimit-Reset', Math.ceil(rateCheck.resetTime / 1000).toString())
  
  if (!rateCheck.allowed) {
    return c.json({
      error: '超出速率限制',
      limit,
      resetTime: new Date(rateCheck.resetTime).toISOString()
    }, 429)
  }
  
  // 模拟端点特定逻辑
  const responses: Record<string, any> = {
    'search': {
      results: ['结果1', '结果2', '结果3'],
      query: c.req.query('q') || 'default'
    },
    'upload': {
      message: '上传端点就绪',
      maxSize: '10MB'
    },
    'download': {
      message: '下载端点就绪',
      availableFiles: ['file1.txt', 'file2.pdf']
    }
  }
  
  return c.json({
    endpoint,
    data: responses[endpoint] || { message: `端点 ${endpoint} 已访问` },
    rateLimit: {
      remaining: rateCheck.remaining,
      resetTime: new Date(rateCheck.resetTime).toISOString()
    }
  })
}
```

## 错误处理模式

### 1. 结构化错误响应

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

function createError(code: string, message: string, details?: any, path?: string): ApiError {
  return {
    code,
    message,
    details,
    timestamp: new Date().toISOString(),
    path: path || 'unknown'
  }
}

export const GET = async (c: Context) => {
  const errorType = c.req.param('type')
  const path = c.req.path
  
  switch (errorType) {
    case 'validation':
      return c.json({
        error: createError(
          'VALIDATION_ERROR',
          '输入验证失败',
          {
            field: 'email',
            reason: '无效的邮箱格式',
            received: 'invalid-email'
          },
          path
        )
      }, 400)
    
    case 'not-found':
      return c.json({
        error: createError(
          'RESOURCE_NOT_FOUND',
          '请求的资源未找到',
          {
            resource: 'user',
            id: '123'
          },
          path
        )
      }, 404)
    
    case 'unauthorized':
      return c.json({
        error: createError(
          'UNAUTHORIZED',
          '需要身份验证',
          {
            requiredAuth: 'Bearer token',
            provided: 'none'
          },
          path
        )
      }, 401)
    
    case 'forbidden':
      return c.json({
        error: createError(
          'FORBIDDEN',
          '权限不足',
          {
            required: 'admin',
            current: 'user'
          },
          path
        )
      }, 403)
    
    case 'server':
      return c.json({
        error: createError(
          'INTERNAL_SERVER_ERROR',
          '发生意外错误',
          {
            errorId: 'err_' + Math.random().toString(36).substr(2, 9)
          },
          path
        )
      }, 500)
    
    default:
      return c.json({
        availableErrorTypes: [
          'validation',
          'not-found',
          'unauthorized',
          'forbidden',
          'server'
        ],
        example: `/api/errors/validation`
      })
  }
}
```

## 数据处理模式

### 1. 分页和过滤

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

// 模拟数据集合
const collections: Record<string, any[]> = {
  products: [
    { id: 1, name: '笔记本电脑', category: 'electronics', status: 'active', price: 999 },
    { id: 2, name: '手机', category: 'electronics', status: 'active', price: 599 },
    { id: 3, name: '书籍', category: 'books', status: 'inactive', price: 29 },
    { id: 4, name: '平板电脑', category: 'electronics', status: 'active', price: 399 },
    { id: 5, name: '杂志', category: 'books', status: 'active', price: 9 }
  ],
  users: [
    { id: 1, name: 'Alice', email: 'alice@example.com', status: 'active' },
    { id: 2, name: 'Bob', email: 'bob@example.com', status: 'inactive' },
    { id: 3, name: 'Charlie', email: 'charlie@example.com', status: 'active' }
  ]
}

function parsePaginationParams(c: Context): PaginationParams {
  const page = Math.max(1, parseInt(c.req.query('page') || '1'))
  const limit = Math.min(100, Math.max(1, parseInt(c.req.query('limit') || '10')))
  const offset = (page - 1) * limit
  
  return { page, limit, offset }
}

function parseFilterParams(c: Context): FilterParams {
  return {
    search: c.req.query('search'),
    category: c.req.query('category'),
    status: c.req.query('status'),
    sortBy: c.req.query('sortBy'),
    sortOrder: (c.req.query('sortOrder') as 'asc' | 'desc') || 'asc'
  }
}

function applyFilters(data: any[], filters: FilterParams): any[] {
  let filtered = [...data]
  
  if (filters.search) {
    const search = filters.search.toLowerCase()
    filtered = filtered.filter(item => 
      Object.values(item).some(value => 
        String(value).toLowerCase().includes(search)
      )
    )
  }
  
  if (filters.category) {
    filtered = filtered.filter(item => item.category === filters.category)
  }
  
  if (filters.status) {
    filtered = filtered.filter(item => item.status === filters.status)
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
    return c.json({
      error: '集合未找到',
      availableCollections: Object.keys(collections)
    }, 404)
  }
  
  const pagination = parsePaginationParams(c)
  const filters = parseFilterParams(c)
  
  // 应用过滤器
  const filteredData = applyFilters(collections[collection], filters)
  
  // 应用分页
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
      hasPrev: pagination.page > 1
    },
    filters
  }
  
  return c.json(response)
}
```

## 测试高级路由

### 综合测试脚本

**test-advanced.js**
```javascript
const BASE_URL = 'http://localhost:3000'

async function testAdvancedRoutes() {
  console.log('🧪 测试高级路由\n')
  
  // 测试多级动态路由
  console.log('📁 多级动态路由:')
  await testRoute('/api/v1/users/1/posts/1')
  await testRoute('/api/v1/users/1/posts/999') // 未找到
  
  // 测试捕获所有路由与路径处理
  console.log('📂 捕获所有路由:')
  await testRoute('/files/documents/readme.txt')
  await testRoute('/files/images/')
  await testRoute('/files/nonexistent/file.txt')
  
  // 测试 API 版本控制
  console.log('🔄 API 版本控制:')
  await testRoute('/api/v1')
  await testRoute('/api/v2')
  
  // 测试身份验证模拟
  console.log('🔐 身份验证:')
  await testRoute('/admin/users', 'GET', null, { 'Authorization': 'Bearer admin-token' })
  await testRoute('/admin/users', 'GET') // 无身份验证
  
  // 测试速率限制
  console.log('⏱️ 速率限制:')
  for (let i = 0; i < 7; i++) {
    await testRoute('/api/limited/search', 'GET', null, { 'x-client-id': 'test-client' })
  }
  
  // 测试错误处理
  console.log('❌ 错误处理:')
  await testRoute('/api/errors/validation')
  await testRoute('/api/errors/not-found')
  
  // 测试数据处理
  console.log('📊 数据处理:')
  await testRoute('/api/data/products?page=1&limit=3')
  await testRoute('/api/data/products?category=electronics&sortBy=price&sortOrder=desc')
  await testRoute('/api/data/products?search=book')
  
  console.log('✅ 高级测试完成！')
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
      console.log('错误:', data.error?.message || data.error)
    } else {
      console.log('成功:', Object.keys(data).join(', '))
    }
    console.log('---')
  } catch (error) {
    console.error(`测试 ${method} ${path} 时出错:`, error.message)
  }
}

testAdvancedRoutes()
```

## 性能考虑

### 1. 响应缓存模式

**src/routes/api/cached/[resource].ts**
```typescript
import type { Context } from 'hono'

interface CacheEntry {
  data: any
  timestamp: number
  ttl: number
}

// 简单的内存缓存
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
    ttl: ttlMs
  })
}

function getCache(key: string): any | null {
  const entry = cache.get(key)
  if (entry && isCacheValid(entry)) {
    return entry.data
  }
  if (entry) {
    cache.delete(key) // 删除过期条目
  }
  return null
}

export const GET = async (c: Context) => {
  const resource = c.req.param('resource')
  const queryString = c.req.url.split('?')[1] || ''
  const cacheKey = getCacheKey(resource, queryString)
  
  // 首先检查缓存
  const cached = getCache(cacheKey)
  if (cached) {
    c.header('X-Cache', 'HIT')
    c.header('Cache-Control', 'public, max-age=300')
    return c.json({
      ...cached,
      meta: {
        cached: true,
        timestamp: new Date().toISOString()
      }
    })
  }
  
  // 模拟昂贵的操作
  await new Promise(resolve => setTimeout(resolve, 100))
  
  const data = {
    resource,
    query: queryString,
    data: `${resource} 的昂贵计算结果`,
    computedAt: new Date().toISOString()
  }
  
  // 缓存结果
  setCache(cacheKey, data)
  
  c.header('X-Cache', 'MISS')
  c.header('Cache-Control', 'public, max-age=300')
  
  return c.json({
    ...data,
    meta: {
      cached: false,
      timestamp: new Date().toISOString()
    }
  })
}
```

## 下一步

- [项目示例](./projects.md) - 完整项目设置
- [最佳实践](./best-practices.md) - 推荐模式
- [性能指南](../guides/performance.md) - 优化技术
- [API 参考](../reference/api.md) - 完整 API 文档