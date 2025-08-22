# 动态路由

动态路由允许你创建灵活的 URL 模式，可以捕获和处理可变的路径段。本指南涵盖了 hono-filebased-route 中的高级动态路由技术。

## 参数提取

### 基本参数访问

```typescript
// routes/users/[id].ts
import type { Context } from 'hono'

export const GET = (c: Context) => {
  const id = c.req.param('id')
  
  return c.json({
    userId: id,
    message: `获取用户 ${id}`
  })
}
```

### 多个参数

```typescript
// routes/users/[id]/posts/[postId].ts
import type { Context } from 'hono'

export const GET = (c: Context) => {
  const userId = c.req.param('id')
  const postId = c.req.param('postId')
  
  return c.json({
    userId,
    postId,
    post: {
      id: postId,
      author: userId,
      title: `用户 ${userId} 的文章 ${postId}`
    }
  })
}
```

### 捕获所有参数

```typescript
// routes/files/[...path].ts
import type { Context } from 'hono'

export const GET = (c: Context) => {
  const path = c.req.param('path')
  const segments = path.split('/')
  
  return c.json({
    fullPath: path,
    segments,
    depth: segments.length
  })
}
```

## 参数验证

### 类型验证

```typescript
// routes/users/[id].ts
import type { Context } from 'hono'

// 验证辅助函数
const isValidId = (id: string): boolean => {
  return /^\d+$/.test(id) && parseInt(id, 10) > 0
}

const isValidUUID = (id: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(id)
}

export const GET = (c: Context) => {
  const id = c.req.param('id')
  
  // 验证数字 ID
  if (!isValidId(id)) {
    return c.json(
      { error: '无效的用户 ID 格式。必须是正整数。' },
      400
    )
  }
  
  const numericId = parseInt(id, 10)
  
  return c.json({
    user: {
      id: numericId,
      name: `用户 ${numericId}`,
      email: `user${numericId}@example.com`
    }
  })
}

// 基于 UUID 的替代路由
// routes/users/uuid/[uuid].ts
export const GET_UUID = (c: Context) => {
  const uuid = c.req.param('uuid')
  
  if (!isValidUUID(uuid)) {
    return c.json(
      { error: '无效的 UUID 格式' },
      400
    )
  }
  
  return c.json({
    user: {
      uuid,
      name: `UUID 为 ${uuid} 的用户`
    }
  })
}
```

### 范围验证

```typescript
// routes/products/[id].ts
import type { Context } from 'hono'

const VALID_ID_RANGE = { min: 1, max: 999999 }

export const GET = (c: Context) => {
  const id = c.req.param('id')
  
  if (!id || !/^\d+$/.test(id)) {
    return c.json({ error: 'ID 必须是数字' }, 400)
  }
  
  const numericId = parseInt(id, 10)
  
  if (numericId < VALID_ID_RANGE.min || numericId > VALID_ID_RANGE.max) {
    return c.json({
      error: `ID 必须在 ${VALID_ID_RANGE.min} 到 ${VALID_ID_RANGE.max} 之间`
    }, 400)
  }
  
  return c.json({
    product: {
      id: numericId,
      name: `产品 ${numericId}`,
      price: Math.floor(Math.random() * 1000) + 10
    }
  })
}
```

### 字符串模式验证

```typescript
// routes/blog/[slug].ts
import type { Context } from 'hono'

const isValidSlug = (slug: string): boolean => {
  // 允许字母、数字、连字符和下划线
  // 必须以字母数字字符开始和结束
  return /^[a-zA-Z0-9][a-zA-Z0-9_-]*[a-zA-Z0-9]$/.test(slug) && slug.length >= 3
}

export const GET = (c: Context) => {
  const slug = c.req.param('slug')
  
  if (!isValidSlug(slug)) {
    return c.json({
      error: '无效的 slug 格式。必须是 3+ 字符，字母数字加连字符/下划线。'
    }, 400)
  }
  
  return c.json({
    post: {
      slug,
      title: slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      content: `${slug} 的内容...`
    }
  })
}
```

## 高级参数处理

### 参数转换

```typescript
// routes/categories/[category]/[subcategory].ts
import type { Context } from 'hono'

const normalizeCategory = (category: string): string => {
  return category.toLowerCase().replace(/[^a-z0-9-]/g, '-')
}

const formatCategoryName = (category: string): string => {
  return category
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export const GET = (c: Context) => {
  const rawCategory = c.req.param('category')
  const rawSubcategory = c.req.param('subcategory')
  
  const category = normalizeCategory(rawCategory)
  const subcategory = normalizeCategory(rawSubcategory)
  
  return c.json({
    category: {
      slug: category,
      name: formatCategoryName(category)
    },
    subcategory: {
      slug: subcategory,
      name: formatCategoryName(subcategory)
    },
    breadcrumb: [
      { name: '首页', path: '/' },
      { name: formatCategoryName(category), path: `/categories/${category}` },
      { name: formatCategoryName(subcategory), path: `/categories/${category}/${subcategory}` }
    ]
  })
}
```

### 参数解析与查询集成

```typescript
// routes/search/[query].ts
import type { Context } from 'hono'

interface SearchFilters {
  category?: string
  minPrice?: number
  maxPrice?: number
  sortBy?: 'price' | 'name' | 'date'
  order?: 'asc' | 'desc'
}

const parseFilters = (c: Context): SearchFilters => {
  const category = c.req.query('category')
  const minPrice = c.req.query('min_price')
  const maxPrice = c.req.query('max_price')
  const sortBy = c.req.query('sort') as SearchFilters['sortBy']
  const order = c.req.query('order') as SearchFilters['order']
  
  return {
    category: category || undefined,
    minPrice: minPrice ? parseFloat(minPrice) : undefined,
    maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
    sortBy: ['price', 'name', 'date'].includes(sortBy || '') ? sortBy : 'name',
    order: ['asc', 'desc'].includes(order || '') ? order : 'asc'
  }
}

export const GET = (c: Context) => {
  const query = c.req.param('query')
  const filters = parseFilters(c)
  
  // 验证查询
  if (!query || query.length < 2) {
    return c.json(
      { error: '搜索查询必须至少 2 个字符长' },
      400
    )
  }
  
  return c.json({
    query,
    filters,
    results: [
      {
        id: 1,
        name: `"${query}" 的搜索结果`,
        category: filters.category || 'general',
        price: 99.99
      }
    ],
    meta: {
      total: 1,
      page: 1,
      limit: 10
    }
  })
}
```

## 嵌套动态路由

### 深度嵌套示例

```
routes/
├── organizations/
│   └── [orgId]/
│       ├── projects/
│       │   └── [projectId]/
│       │       ├── tasks/
│       │       │   └── [taskId].ts
│       │       └── members/
│       │           └── [memberId].ts
│       └── settings/
│           └── [section].ts
```

```typescript
// routes/organizations/[orgId]/projects/[projectId]/tasks/[taskId].ts
import type { Context } from 'hono'

interface TaskParams {
  orgId: string
  projectId: string
  taskId: string
}

const validateTaskParams = (params: TaskParams): string | null => {
  if (!params.orgId || !/^org_\d+$/.test(params.orgId)) {
    return '无效的组织 ID 格式'
  }
  if (!params.projectId || !/^proj_\d+$/.test(params.projectId)) {
    return '无效的项目 ID 格式'
  }
  if (!params.taskId || !/^task_\d+$/.test(params.taskId)) {
    return '无效的任务 ID 格式'
  }
  return null
}

export const GET = (c: Context) => {
  const params: TaskParams = {
    orgId: c.req.param('orgId'),
    projectId: c.req.param('projectId'),
    taskId: c.req.param('taskId')
  }
  
  const validationError = validateTaskParams(params)
  if (validationError) {
    return c.json({ error: validationError }, 400)
  }
  
  return c.json({
    task: {
      id: params.taskId,
      project: params.projectId,
      organization: params.orgId,
      title: `${params.projectId} 中的任务`,
      status: 'in-progress'
    },
    breadcrumb: [
      { name: '组织', path: '/organizations' },
      { name: params.orgId, path: `/organizations/${params.orgId}` },
      { name: '项目', path: `/organizations/${params.orgId}/projects` },
      { name: params.projectId, path: `/organizations/${params.orgId}/projects/${params.projectId}` },
      { name: '任务', path: `/organizations/${params.orgId}/projects/${params.projectId}/tasks` },
      { name: params.taskId, path: `/organizations/${params.orgId}/projects/${params.projectId}/tasks/${params.taskId}` }
    ]
  })
}

export const PUT = async (c: Context) => {
  const params: TaskParams = {
    orgId: c.req.param('orgId'),
    projectId: c.req.param('projectId'),
    taskId: c.req.param('taskId')
  }
  
  const validationError = validateTaskParams(params)
  if (validationError) {
    return c.json({ error: validationError }, 400)
  }
  
  const body = await c.req.json()
  
  return c.json({
    message: `任务 ${params.taskId} 已更新`,
    task: {
      ...params,
      ...body,
      updatedAt: new Date().toISOString()
    }
  })
}
```

## 捕获所有路由模式

### 文件系统代理

```typescript
// routes/files/[...path].ts
import type { Context } from 'hono'
import { readFile, stat } from 'fs/promises'
import { join, extname } from 'path'

const ALLOWED_EXTENSIONS = ['.txt', '.md', '.json', '.csv']
const BASE_PATH = './public/files'

const getMimeType = (ext: string): string => {
  const mimeTypes: Record<string, string> = {
    '.txt': 'text/plain',
    '.md': 'text/markdown',
    '.json': 'application/json',
    '.csv': 'text/csv'
  }
  return mimeTypes[ext] || 'application/octet-stream'
}

export const GET = async (c: Context) => {
  const path = c.req.param('path')
  
  // 安全：防止目录遍历
  if (!path || path.includes('..') || path.includes('\\')) {
    return c.json({ error: '无效的文件路径' }, 400)
  }
  
  const filePath = join(BASE_PATH, path)
  const ext = extname(filePath).toLowerCase()
  
  // 检查允许的扩展名
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return c.json({ error: '不允许的文件类型' }, 403)
  }
  
  try {
    const stats = await stat(filePath)
    
    if (!stats.isFile()) {
      return c.json({ error: '不是文件' }, 404)
    }
    
    const content = await readFile(filePath, 'utf-8')
    const mimeType = getMimeType(ext)
    
    return new Response(content, {
      headers: {
        'Content-Type': mimeType,
        'Content-Length': stats.size.toString(),
        'Last-Modified': stats.mtime.toUTCString()
      }
    })
  } catch (error) {
    if ((error as any).code === 'ENOENT') {
      return c.json({ error: '文件未找到' }, 404)
    }
    return c.json({ error: '内部服务器错误' }, 500)
  }
}
```

### 带路径转发的 API 代理

```typescript
// routes/api/proxy/[...route].ts
import type { Context } from 'hono'

const EXTERNAL_API_BASE = 'https://jsonplaceholder.typicode.com'
const ALLOWED_ENDPOINTS = ['posts', 'comments', 'users', 'albums', 'photos']

export const GET = async (c: Context) => {
  const route = c.req.param('route')
  const segments = route.split('/')
  
  // 验证第一个段是否被允许
  if (!segments[0] || !ALLOWED_ENDPOINTS.includes(segments[0])) {
    return c.json({
      error: '端点不被允许',
      allowedEndpoints: ALLOWED_ENDPOINTS
    }, 403)
  }
  
  // 构建外部 URL
  const queryString = new URL(c.req.url).search
  const externalUrl = `${EXTERNAL_API_BASE}/${route}${queryString}`
  
  try {
    const response = await fetch(externalUrl)
    
    if (!response.ok) {
      return c.json(
        { error: '外部 API 错误', status: response.status },
        response.status
      )
    }
    
    const data = await response.json()
    
    return c.json({
      data,
      meta: {
        source: 'external-api',
        route,
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    return c.json(
      { error: '从外部 API 获取失败' },
      500
    )
  }
}

export const POST = async (c: Context) => {
  const route = c.req.param('route')
  const segments = route.split('/')
  
  // 只允许 POST 到某些端点
  const postAllowed = ['posts', 'comments']
  if (!segments[0] || !postAllowed.includes(segments[0])) {
    return c.json(
      { error: '此端点不允许 POST' },
      405
    )
  }
  
  const body = await c.req.json()
  const externalUrl = `${EXTERNAL_API_BASE}/${route}`
  
  try {
    const response = await fetch(externalUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    })
    
    const data = await response.json()
    
    return c.json({
      data,
      meta: {
        action: 'created',
        route,
        timestamp: new Date().toISOString()
      }
    }, response.status)
  } catch (error) {
    return c.json(
      { error: '创建资源失败' },
      500
    )
  }
}
```

## 动态路由的错误处理

### 集中式参数验证

```typescript
// utils/validation.ts
export interface ValidationResult {
  isValid: boolean
  error?: string
  value?: any
}

export const validators = {
  id: (value: string): ValidationResult => {
    if (!value || !/^\d+$/.test(value)) {
      return { isValid: false, error: 'ID 必须是正整数' }
    }
    const numericValue = parseInt(value, 10)
    if (numericValue <= 0) {
      return { isValid: false, error: 'ID 必须大于 0' }
    }
    return { isValid: true, value: numericValue }
  },
  
  slug: (value: string): ValidationResult => {
    if (!value || value.length < 3) {
      return { isValid: false, error: 'Slug 必须至少 3 个字符' }
    }
    if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]*[a-zA-Z0-9]$/.test(value)) {
      return { isValid: false, error: '无效的 slug 格式' }
    }
    return { isValid: true, value: value.toLowerCase() }
  },
  
  uuid: (value: string): ValidationResult => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(value)) {
      return { isValid: false, error: '无效的 UUID 格式' }
    }
    return { isValid: true, value: value.toLowerCase() }
  }
}

export const validateParams = (params: Record<string, string>, schema: Record<string, keyof typeof validators>) => {
  const errors: Record<string, string> = {}
  const validatedParams: Record<string, any> = {}
  
  for (const [key, validatorName] of Object.entries(schema)) {
    const value = params[key]
    const result = validators[validatorName](value)
    
    if (!result.isValid) {
      errors[key] = result.error!
    } else {
      validatedParams[key] = result.value
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    params: validatedParams
  }
}
```

```typescript
// routes/users/[id]/posts/[postId].ts
import type { Context } from 'hono'
import { validateParams } from '../../../utils/validation'

export const GET = (c: Context) => {
  const rawParams = {
    id: c.req.param('id'),
    postId: c.req.param('postId')
  }
  
  const validation = validateParams(rawParams, {
    id: 'id',
    postId: 'id'
  })
  
  if (!validation.isValid) {
    return c.json(
      { error: '验证失败', details: validation.errors },
      400
    )
  }
  
  const { id, postId } = validation.params
  
  return c.json({
    post: {
      id: postId,
      userId: id,
      title: `用户 ${id} 的文章 ${postId}`,
      content: '文章内容在这里...'
    }
  })
}
```

## 测试动态路由

```typescript
// tests/dynamic-routes.test.ts
import { Hono } from 'hono'
import { fileBasedRouting } from 'hono-filebased-route'

const app = new Hono()
fileBasedRouting(app, { dir: './routes' })

describe('动态路由', () => {
  describe('参数验证', () => {
    test('有效的数字 ID', async () => {
      const res = await app.request('/users/123')
      expect(res.status).toBe(200)
      
      const data = await res.json()
      expect(data.user.id).toBe(123)
    })
    
    test('无效的 ID 格式', async () => {
      const res = await app.request('/users/abc')
      expect(res.status).toBe(400)
      
      const data = await res.json()
      expect(data.error).toContain('无效')
    })
    
    test('负数 ID', async () => {
      const res = await app.request('/users/-1')
      expect(res.status).toBe(400)
    })
  })
  
  describe('嵌套参数', () => {
    test('多个有效参数', async () => {
      const res = await app.request('/users/123/posts/456')
      expect(res.status).toBe(200)
      
      const data = await res.json()
      expect(data.userId).toBe('123')
      expect(data.postId).toBe('456')
    })
  })
  
  describe('捕获所有路由', () => {
    test('深层路径段', async () => {
      const res = await app.request('/files/documents/2023/reports/annual.pdf')
      expect(res.status).toBe(200)
      
      const data = await res.json()
      expect(data.segments).toEqual(['documents', '2023', 'reports', 'annual.pdf'])
    })
    
    test('安全 - 目录遍历', async () => {
      const res = await app.request('/files/../../../etc/passwd')
      expect(res.status).toBe(400)
    })
  })
})
```

## 最佳实践

### 1. 始终验证参数

```typescript
// ✅ 好的做法
export const GET = (c: Context) => {
  const id = c.req.param('id')
  
  if (!id || !/^\d+$/.test(id)) {
    return c.json({ error: '无效的 ID' }, 400)
  }
  
  // 使用有效的 ID 继续
}

// ❌ 不好的做法
export const GET = (c: Context) => {
  const id = c.req.param('id')
  // 不验证就使用 ID
  return c.json({ userId: id })
}
```

### 2. 使用一致的参数名称

```typescript
// ✅ 好的做法 - 一致的命名
routes/
├── users/[id].ts
├── users/[id]/posts/[postId].ts
└── users/[id]/comments/[commentId].ts

// ❌ 不好的做法 - 不一致的命名
routes/
├── users/[userId].ts
├── users/[id]/posts/[post_id].ts
└── users/[user_id]/comments/[cId].ts
```

### 3. 提供清晰的错误消息

```typescript
// ✅ 好的做法
if (!isValidId(id)) {
  return c.json({
    error: '无效的用户 ID 格式',
    message: '用户 ID 必须是正整数',
    received: id
  }, 400)
}

// ❌ 不好的做法
if (!isValidId(id)) {
  return c.json({ error: '错误请求' }, 400)
}
```

### 4. 处理边缘情况

```typescript
export const GET = (c: Context) => {
  const id = c.req.param('id')
  
  // 处理缺失参数
  if (!id) {
    return c.json({ error: '用户 ID 是必需的' }, 400)
  }
  
  // 处理空字符串
  if (id.trim() === '') {
    return c.json({ error: '用户 ID 不能为空' }, 400)
  }
  
  // 处理非常大的数字
  const numericId = parseInt(id, 10)
  if (numericId > Number.MAX_SAFE_INTEGER) {
    return c.json({ error: '用户 ID 太大' }, 400)
  }
  
  // 继续处理
}
```

## 下一步

现在你了解了动态路由：

1. 学习[高级功能](/zh/guide/advanced-features)了解中间件和钩子
2. 探索 [API 参考](/zh/reference/)获取完整文档
3. 查看[示例](/zh/examples/)了解实际实现

准备构建动态、灵活的路由了吗？让我们继续！🚀