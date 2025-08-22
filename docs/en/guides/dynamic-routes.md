# Dynamic Routes

Dynamic routes allow you to create flexible URL patterns that can capture and process variable segments. This guide covers advanced dynamic routing techniques in hono-filebased-route.

## Parameter Extraction

### Basic Parameter Access

```typescript
// routes/users/[id].ts
import type { Context } from 'hono'

export const GET = (c: Context) => {
  const id = c.req.param('id')
  
  return c.json({
    userId: id,
    message: `Fetching user ${id}`
  })
}
```

### Multiple Parameters

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
      title: `Post ${postId} by User ${userId}`
    }
  })
}
```

### Catch-All Parameters

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

## Parameter Validation

### Type Validation

```typescript
// routes/users/[id].ts
import type { Context } from 'hono'

// Validation helpers
const isValidId = (id: string): boolean => {
  return /^\d+$/.test(id) && parseInt(id, 10) > 0
}

const isValidUUID = (id: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(id)
}

export const GET = (c: Context) => {
  const id = c.req.param('id')
  
  // Validate numeric ID
  if (!isValidId(id)) {
    return c.json(
      { error: 'Invalid user ID format. Must be a positive integer.' },
      400
    )
  }
  
  const numericId = parseInt(id, 10)
  
  return c.json({
    user: {
      id: numericId,
      name: `User ${numericId}`,
      email: `user${numericId}@example.com`
    }
  })
}

// Alternative UUID-based route
// routes/users/uuid/[uuid].ts
export const GET_UUID = (c: Context) => {
  const uuid = c.req.param('uuid')
  
  if (!isValidUUID(uuid)) {
    return c.json(
      { error: 'Invalid UUID format' },
      400
    )
  }
  
  return c.json({
    user: {
      uuid,
      name: `User with UUID ${uuid}`
    }
  })
}
```

### Range Validation

```typescript
// routes/products/[id].ts
import type { Context } from 'hono'

const VALID_ID_RANGE = { min: 1, max: 999999 }

export const GET = (c: Context) => {
  const id = c.req.param('id')
  
  if (!id || !/^\d+$/.test(id)) {
    return c.json({ error: 'ID must be a number' }, 400)
  }
  
  const numericId = parseInt(id, 10)
  
  if (numericId < VALID_ID_RANGE.min || numericId > VALID_ID_RANGE.max) {
    return c.json({
      error: `ID must be between ${VALID_ID_RANGE.min} and ${VALID_ID_RANGE.max}`
    }, 400)
  }
  
  return c.json({
    product: {
      id: numericId,
      name: `Product ${numericId}`,
      price: Math.floor(Math.random() * 1000) + 10
    }
  })
}
```

### String Pattern Validation

```typescript
// routes/blog/[slug].ts
import type { Context } from 'hono'

const isValidSlug = (slug: string): boolean => {
  // Allow letters, numbers, hyphens, and underscores
  // Must start and end with alphanumeric character
  return /^[a-zA-Z0-9][a-zA-Z0-9_-]*[a-zA-Z0-9]$/.test(slug) && slug.length >= 3
}

export const GET = (c: Context) => {
  const slug = c.req.param('slug')
  
  if (!isValidSlug(slug)) {
    return c.json({
      error: 'Invalid slug format. Must be 3+ characters, alphanumeric with hyphens/underscores.'
    }, 400)
  }
  
  return c.json({
    post: {
      slug,
      title: slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      content: `Content for ${slug}...`
    }
  })
}
```

## Advanced Parameter Processing

### Parameter Transformation

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
      { name: 'Home', path: '/' },
      { name: formatCategoryName(category), path: `/categories/${category}` },
      { name: formatCategoryName(subcategory), path: `/categories/${category}/${subcategory}` }
    ]
  })
}
```

### Parameter Parsing with Query Integration

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
  
  // Validate query
  if (!query || query.length < 2) {
    return c.json(
      { error: 'Search query must be at least 2 characters long' },
      400
    )
  }
  
  return c.json({
    query,
    filters,
    results: [
      {
        id: 1,
        name: `Result for "${query}"`,
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

## Nested Dynamic Routes

### Deep Nesting Example

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
    return 'Invalid organization ID format'
  }
  if (!params.projectId || !/^proj_\d+$/.test(params.projectId)) {
    return 'Invalid project ID format'
  }
  if (!params.taskId || !/^task_\d+$/.test(params.taskId)) {
    return 'Invalid task ID format'
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
      title: `Task in ${params.projectId}`,
      status: 'in-progress'
    },
    breadcrumb: [
      { name: 'Organizations', path: '/organizations' },
      { name: params.orgId, path: `/organizations/${params.orgId}` },
      { name: 'Projects', path: `/organizations/${params.orgId}/projects` },
      { name: params.projectId, path: `/organizations/${params.orgId}/projects/${params.projectId}` },
      { name: 'Tasks', path: `/organizations/${params.orgId}/projects/${params.projectId}/tasks` },
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
    message: `Task ${params.taskId} updated`,
    task: {
      ...params,
      ...body,
      updatedAt: new Date().toISOString()
    }
  })
}
```

## Catch-All Route Patterns

### File System Proxy

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
  
  // Security: prevent directory traversal
  if (!path || path.includes('..') || path.includes('\\')) {
    return c.json({ error: 'Invalid file path' }, 400)
  }
  
  const filePath = join(BASE_PATH, path)
  const ext = extname(filePath).toLowerCase()
  
  // Check allowed extensions
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return c.json({ error: 'File type not allowed' }, 403)
  }
  
  try {
    const stats = await stat(filePath)
    
    if (!stats.isFile()) {
      return c.json({ error: 'Not a file' }, 404)
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
      return c.json({ error: 'File not found' }, 404)
    }
    return c.json({ error: 'Internal server error' }, 500)
  }
}
```

### API Proxy with Path Forwarding

```typescript
// routes/api/proxy/[...route].ts
import type { Context } from 'hono'

const EXTERNAL_API_BASE = 'https://jsonplaceholder.typicode.com'
const ALLOWED_ENDPOINTS = ['posts', 'comments', 'users', 'albums', 'photos']

export const GET = async (c: Context) => {
  const route = c.req.param('route')
  const segments = route.split('/')
  
  // Validate first segment is allowed
  if (!segments[0] || !ALLOWED_ENDPOINTS.includes(segments[0])) {
    return c.json({
      error: 'Endpoint not allowed',
      allowedEndpoints: ALLOWED_ENDPOINTS
    }, 403)
  }
  
  // Build external URL
  const queryString = new URL(c.req.url).search
  const externalUrl = `${EXTERNAL_API_BASE}/${route}${queryString}`
  
  try {
    const response = await fetch(externalUrl)
    
    if (!response.ok) {
      return c.json(
        { error: 'External API error', status: response.status },
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
      { error: 'Failed to fetch from external API' },
      500
    )
  }
}

export const POST = async (c: Context) => {
  const route = c.req.param('route')
  const segments = route.split('/')
  
  // Only allow POST to certain endpoints
  const postAllowed = ['posts', 'comments']
  if (!segments[0] || !postAllowed.includes(segments[0])) {
    return c.json(
      { error: 'POST not allowed for this endpoint' },
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
      { error: 'Failed to create resource' },
      500
    )
  }
}
```

## Error Handling for Dynamic Routes

### Centralized Parameter Validation

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
      return { isValid: false, error: 'ID must be a positive integer' }
    }
    const numericValue = parseInt(value, 10)
    if (numericValue <= 0) {
      return { isValid: false, error: 'ID must be greater than 0' }
    }
    return { isValid: true, value: numericValue }
  },
  
  slug: (value: string): ValidationResult => {
    if (!value || value.length < 3) {
      return { isValid: false, error: 'Slug must be at least 3 characters' }
    }
    if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]*[a-zA-Z0-9]$/.test(value)) {
      return { isValid: false, error: 'Invalid slug format' }
    }
    return { isValid: true, value: value.toLowerCase() }
  },
  
  uuid: (value: string): ValidationResult => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(value)) {
      return { isValid: false, error: 'Invalid UUID format' }
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
      { error: 'Validation failed', details: validation.errors },
      400
    )
  }
  
  const { id, postId } = validation.params
  
  return c.json({
    post: {
      id: postId,
      userId: id,
      title: `Post ${postId} by User ${id}`,
      content: 'Post content here...'
    }
  })
}
```

## Testing Dynamic Routes

```typescript
// tests/dynamic-routes.test.ts
import { Hono } from 'hono'
import { fileBasedRouting } from 'hono-filebased-route'

const app = new Hono()
fileBasedRouting(app, { dir: './routes' })

describe('Dynamic Routes', () => {
  describe('Parameter Validation', () => {
    test('valid numeric ID', async () => {
      const res = await app.request('/users/123')
      expect(res.status).toBe(200)
      
      const data = await res.json()
      expect(data.user.id).toBe(123)
    })
    
    test('invalid ID format', async () => {
      const res = await app.request('/users/abc')
      expect(res.status).toBe(400)
      
      const data = await res.json()
      expect(data.error).toContain('Invalid')
    })
    
    test('negative ID', async () => {
      const res = await app.request('/users/-1')
      expect(res.status).toBe(400)
    })
  })
  
  describe('Nested Parameters', () => {
    test('multiple valid parameters', async () => {
      const res = await app.request('/users/123/posts/456')
      expect(res.status).toBe(200)
      
      const data = await res.json()
      expect(data.userId).toBe('123')
      expect(data.postId).toBe('456')
    })
  })
  
  describe('Catch-All Routes', () => {
    test('deep path segments', async () => {
      const res = await app.request('/files/documents/2023/reports/annual.pdf')
      expect(res.status).toBe(200)
      
      const data = await res.json()
      expect(data.segments).toEqual(['documents', '2023', 'reports', 'annual.pdf'])
    })
    
    test('security - directory traversal', async () => {
      const res = await app.request('/files/../../../etc/passwd')
      expect(res.status).toBe(400)
    })
  })
})
```

## Best Practices

### 1. Always Validate Parameters

```typescript
// ✅ Good
export const GET = (c: Context) => {
  const id = c.req.param('id')
  
  if (!id || !/^\d+$/.test(id)) {
    return c.json({ error: 'Invalid ID' }, 400)
  }
  
  // Continue with valid ID
}

// ❌ Bad
export const GET = (c: Context) => {
  const id = c.req.param('id')
  // Using ID without validation
  return c.json({ userId: id })
}
```

### 2. Use Consistent Parameter Names

```typescript
// ✅ Good - consistent naming
routes/
├── users/[id].ts
├── users/[id]/posts/[postId].ts
└── users/[id]/comments/[commentId].ts

// ❌ Bad - inconsistent naming
routes/
├── users/[userId].ts
├── users/[id]/posts/[post_id].ts
└── users/[user_id]/comments/[cId].ts
```

### 3. Provide Clear Error Messages

```typescript
// ✅ Good
if (!isValidId(id)) {
  return c.json({
    error: 'Invalid user ID format',
    message: 'User ID must be a positive integer',
    received: id
  }, 400)
}

// ❌ Bad
if (!isValidId(id)) {
  return c.json({ error: 'Bad request' }, 400)
}
```

### 4. Handle Edge Cases

```typescript
export const GET = (c: Context) => {
  const id = c.req.param('id')
  
  // Handle missing parameter
  if (!id) {
    return c.json({ error: 'User ID is required' }, 400)
  }
  
  // Handle empty string
  if (id.trim() === '') {
    return c.json({ error: 'User ID cannot be empty' }, 400)
  }
  
  // Handle very large numbers
  const numericId = parseInt(id, 10)
  if (numericId > Number.MAX_SAFE_INTEGER) {
    return c.json({ error: 'User ID too large' }, 400)
  }
  
  // Continue with processing
}
```

## Next Steps

Now that you understand dynamic routes:

1. Learn about [Advanced Features](/en/guide/advanced-features) for middleware and hooks
2. Explore the [API Reference](/en/reference/) for complete documentation
3. Check out [Examples](/en/examples/) for real-world implementations

Ready to build dynamic, flexible routes? Let's continue! 🚀