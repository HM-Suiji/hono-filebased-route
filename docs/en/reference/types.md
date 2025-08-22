# Type Definitions

This document provides comprehensive TypeScript type definitions for hono-filebased-route.

## Core Types

### Route Handler Types

#### Basic Route Handler
```typescript
import type { Context } from 'hono'

/**
 * Standard route handler for GET, POST, PUT, DELETE, etc.
 */
type RouteHandler = (c: Context) => Response | Promise<Response>

/**
 * Route handler with typed parameters
 */
type RouteHandlerWithParams<T = Record<string, string>> = (
  c: Context & { req: { param: (key: keyof T) => T[keyof T] } }
) => Response | Promise<Response>
```

#### Catch-All Route Handler
```typescript
/**
 * Handler for catch-all routes ([...path].ts)
 * Receives path segments as second parameter
 */
type CatchAllHandler = (
  c: Context,
  pathSegments: string[]
) => Response | Promise<Response>
```

#### HTTP Method Handlers
```typescript
/**
 * Supported HTTP methods in route files
 */
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS'

/**
 * Route file exports interface
 */
interface RouteExports {
  GET?: RouteHandler
  POST?: RouteHandler
  PUT?: RouteHandler
  DELETE?: RouteHandler
  PATCH?: RouteHandler
  HEAD?: RouteHandler
  OPTIONS?: RouteHandler
}
```

### Configuration Types

#### Core Configuration
```typescript
/**
 * Core configuration for route generation
 */
interface RouteConfig {
  /** Directory containing route files */
  routesDirectory: string
  
  /** Output file for generated routes */
  outputFile: string
  
  /** Supported HTTP methods */
  supportedMethods: HttpMethod[]
  
  /** File extensions to include */
  fileExtensions: string[]
  
  /** Index file names */
  indexFiles: string[]
}

/**
 * Extended configuration (planned for future versions)
 */
interface ExtendedRouteConfig extends RouteConfig {
  /** Route transformation options */
  routeTransform?: RouteTransformOptions
  
  /** Code generation options */
  generation?: GenerationOptions
  
  /** Middleware integration */
  middleware?: MiddlewareOptions
  
  /** Development options */
  dev?: DevOptions
}
```

#### Route Transformation
```typescript
/**
 * Options for route path transformation
 */
interface RouteTransformOptions {
  /** Pattern for dynamic parameters */
  parameterPattern?: RegExp
  
  /** Pattern for catch-all routes */
  catchAllPattern?: RegExp
  
  /** Route prefix */
  prefix?: string
  
  /** Case transformation */
  caseTransform?: 'camelCase' | 'snake_case' | 'kebab-case'
  
  /** Custom transformation function */
  customTransform?: (filePath: string, baseDir: string) => string
}
```

#### Code Generation
```typescript
/**
 * Code generation options
 */
interface GenerationOptions {
  /** Import style */
  importStyle?: 'static' | 'dynamic'
  
  /** TypeScript options */
  typescript?: TypeScriptOptions
  
  /** Output formatting */
  formatting?: FormattingOptions
}

/**
 * TypeScript generation options
 */
interface TypeScriptOptions {
  /** Generate type definitions */
  generateTypes?: boolean
  
  /** Use strict mode */
  strictMode?: boolean
  
  /** Generate JSDoc comments */
  generateJSDoc?: boolean
}

/**
 * Code formatting options
 */
interface FormattingOptions {
  /** Use semicolons */
  semicolons?: boolean
  
  /** Quote style */
  quotes?: 'single' | 'double'
  
  /** Trailing comma style */
  trailingComma?: 'none' | 'es5' | 'all'
  
  /** Indentation */
  indent?: number | 'tab'
}
```

#### Middleware Integration
```typescript
/**
 * Middleware configuration options
 */
interface MiddlewareOptions {
  /** Global middleware files */
  global?: string[]
  
  /** Route-specific middleware patterns */
  patterns?: Record<string, string[]>
  
  /** Middleware execution order */
  order?: 'before' | 'after' | 'around'
}
```

#### Development Options
```typescript
/**
 * Development-specific options
 */
interface DevOptions {
  /** Watch for file changes */
  watch?: boolean
  
  /** Auto-regenerate on changes */
  autoRegenerate?: boolean
  
  /** Logging level */
  logLevel?: 'silent' | 'error' | 'warn' | 'info' | 'debug'
  
  /** Hot module replacement */
  hmr?: boolean
}
```

### Route Information Types

#### Route Metadata
```typescript
/**
 * Information about a discovered route
 */
interface RouteInfo {
  /** Original file path */
  filePath: string
  
  /** Generated route path */
  routePath: string
  
  /** Supported HTTP methods */
  methods: HttpMethod[]
  
  /** Route parameters */
  params: RouteParam[]
  
  /** Whether it's a catch-all route */
  isCatchAll: boolean
  
  /** Whether it's an index route */
  isIndex: boolean
}

/**
 * Route parameter information
 */
interface RouteParam {
  /** Parameter name */
  name: string
  
  /** Parameter type */
  type: 'static' | 'dynamic' | 'catchAll'
  
  /** Whether parameter is optional */
  optional?: boolean
}
```

#### Generated Route Structure
```typescript
/**
 * Structure of generated route registration
 */
interface GeneratedRoute {
  /** Import statement */
  importStatement: string
  
  /** Route registration code */
  registrationCode: string
  
  /** Route metadata */
  metadata: RouteInfo
}

/**
 * Complete generated routes file structure
 */
interface GeneratedRoutesFile {
  /** File header comment */
  header: string
  
  /** Import statements */
  imports: string[]
  
  /** Route registrations */
  routes: GeneratedRoute[]
  
  /** Export statement */
  exports: string
}
```

### Utility Types

#### File System Types
```typescript
/**
 * File discovery options
 */
interface FileDiscoveryOptions {
  /** Base directory */
  baseDir: string
  
  /** Include patterns */
  include?: string[]
  
  /** Exclude patterns */
  exclude?: string[]
  
  /** Follow symbolic links */
  followSymlinks?: boolean
}

/**
 * File information
 */
interface FileInfo {
  /** Absolute file path */
  path: string
  
  /** Relative path from base directory */
  relativePath: string
  
  /** File extension */
  extension: string
  
  /** File size in bytes */
  size: number
  
  /** Last modified timestamp */
  lastModified: Date
}
```

#### Error Types
```typescript
/**
 * Route generation errors
 */
class RouteGenerationError extends Error {
  constructor(
    message: string,
    public readonly filePath?: string,
    public readonly cause?: Error
  ) {
    super(message)
    this.name = 'RouteGenerationError'
  }
}

/**
 * Configuration validation errors
 */
class ConfigValidationError extends Error {
  constructor(
    message: string,
    public readonly field: string,
    public readonly value: unknown
  ) {
    super(message)
    this.name = 'ConfigValidationError'
  }
}

/**
 * File system operation errors
 */
class FileSystemError extends Error {
  constructor(
    message: string,
    public readonly operation: 'read' | 'write' | 'scan',
    public readonly path: string,
    public readonly cause?: Error
  ) {
    super(message)
    this.name = 'FileSystemError'
  }
}
```

### Plugin Types (Planned)

#### Vite Plugin Types
```typescript
/**
 * Vite plugin configuration
 */
interface VitePluginOptions extends ExtendedRouteConfig {
  /** Hot module replacement */
  hmr?: boolean
  
  /** Development middleware */
  devMiddleware?: boolean
  
  /** Build optimization */
  optimization?: {
    treeshaking?: boolean
    minify?: boolean
    sourcemap?: boolean
  }
}

/**
 * Multiple route directory configuration
 */
interface MultiRouteConfig {
  /** Route configurations */
  routes: Array<{
    directory: string
    prefix?: string
    outputFile: string
    methods?: HttpMethod[]
  }>
  
  /** Global options */
  global?: Partial<ExtendedRouteConfig>
}
```

#### Transform Functions
```typescript
/**
 * Custom route path transformation
 */
type RoutePathTransform = (filePath: string, baseDir: string) => string

/**
 * Custom code generation
 */
type CodeGenerationTransform = (routes: RouteInfo[]) => string

/**
 * Plugin transform options
 */
interface TransformOptions {
  /** Route path transformation */
  routePath?: RoutePathTransform
  
  /** Code generation transformation */
  codeGeneration?: CodeGenerationTransform
  
  /** File filtering */
  fileFilter?: (filePath: string) => boolean
}
```

### Integration Types

#### OpenAPI Integration
```typescript
/**
 * OpenAPI generation options
 */
interface OpenAPIOptions {
  /** Enable OpenAPI generation */
  enabled: boolean
  
  /** Output file path */
  outputFile: string
  
  /** OpenAPI version */
  version?: '3.0' | '3.1'
  
  /** API information */
  info?: {
    title: string
    version: string
    description?: string
  }
}

/**
 * Route schema information for OpenAPI
 */
interface RouteSchema {
  /** Route path */
  path: string
  
  /** HTTP method */
  method: HttpMethod
  
  /** Request schema */
  request?: {
    params?: Record<string, any>
    query?: Record<string, any>
    body?: Record<string, any>
  }
  
  /** Response schema */
  response?: Record<number, Record<string, any>>
}
```

#### Testing Integration
```typescript
/**
 * Testing generation options
 */
interface TestingOptions {
  /** Generate test files */
  generateTests: boolean
  
  /** Test framework */
  testFramework: 'vitest' | 'jest' | 'mocha'
  
  /** Test file pattern */
  testFilePattern?: string
  
  /** Test utilities */
  utilities?: {
    mockContext?: boolean
    testHelpers?: boolean
  }
}
```

## Type Guards

### Route Handler Type Guards
```typescript
/**
 * Check if export is a valid route handler
 */
function isRouteHandler(value: unknown): value is RouteHandler {
  return typeof value === 'function'
}

/**
 * Check if export is a catch-all handler
 */
function isCatchAllHandler(value: unknown): value is CatchAllHandler {
  return typeof value === 'function' && value.length >= 2
}

/**
 * Check if route file has valid exports
 */
function hasValidRouteExports(exports: Record<string, unknown>): exports is RouteExports {
  const validMethods: HttpMethod[] = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS']
  
  return Object.keys(exports).some(key => 
    validMethods.includes(key as HttpMethod) && 
    isRouteHandler(exports[key])
  )
}
```

### Configuration Type Guards
```typescript
/**
 * Validate route configuration
 */
function isValidRouteConfig(config: unknown): config is RouteConfig {
  if (typeof config !== 'object' || config === null) {
    return false
  }
  
  const c = config as Record<string, unknown>
  
  return (
    typeof c.routesDirectory === 'string' &&
    typeof c.outputFile === 'string' &&
    Array.isArray(c.supportedMethods) &&
    Array.isArray(c.fileExtensions) &&
    Array.isArray(c.indexFiles)
  )
}
```

## Utility Type Helpers

### Route Parameter Extraction
```typescript
/**
 * Extract parameter names from route path
 */
type ExtractParams<T extends string> = 
  T extends `${infer _Start}:${infer Param}/${infer Rest}`
    ? Param | ExtractParams<Rest>
    : T extends `${infer _Start}:${infer Param}`
    ? Param
    : never

/**
 * Create typed context for route with parameters
 */
type TypedContext<T extends string> = Context & {
  req: {
    param: (key: ExtractParams<T>) => string
  }
}

// Usage example:
// type UserRouteContext = TypedContext<'/users/:id'> // param('id') is available
// type PostRouteContext = TypedContext<'/users/:userId/posts/:postId'> // param('userId') and param('postId') available
```

### Route File Type Inference
```typescript
/**
 * Infer route exports from file path
 */
type InferRouteExports<T extends string> = 
  T extends `${infer _}[...${infer _}].ts`
    ? { GET?: CatchAllHandler; POST?: CatchAllHandler }
    : RouteExports

/**
 * Create strongly typed route module
 */
interface TypedRouteModule<T extends string> {
  path: T
  exports: InferRouteExports<T>
  params: ExtractParams<T>[]
}
```

## Example Usage

### Basic Route Handler
```typescript
import type { Context } from 'hono'
import type { RouteHandler } from '@hono-filebased-route/core'

// Simple route handler
export const GET: RouteHandler = async (c: Context) => {
  return c.json({ message: 'Hello World' })
}

// Route handler with typed parameters
export const POST: RouteHandlerWithParams<{ id: string }> = async (c) => {
  const id = c.req.param('id') // TypeScript knows this is string
  return c.json({ id })
}
```

### Catch-All Route Handler
```typescript
import type { CatchAllHandler } from '@hono-filebased-route/core'

// Catch-all route handler
export const GET: CatchAllHandler = async (c, pathSegments) => {
  return c.json({ 
    path: pathSegments,
    fullPath: pathSegments.join('/')
  })
}
```

### Custom Configuration
```typescript
import type { ExtendedRouteConfig } from '@hono-filebased-route/core'

const config: ExtendedRouteConfig = {
  routesDirectory: './src/api',
  outputFile: './src/generated-api.ts',
  supportedMethods: ['GET', 'POST', 'PUT', 'DELETE'],
  fileExtensions: ['.ts'],
  indexFiles: ['index.ts'],
  
  routeTransform: {
    prefix: '/api/v1',
    caseTransform: 'kebab-case'
  },
  
  generation: {
    typescript: {
      generateTypes: true,
      strictMode: true
    }
  }
}
```

## Migration Notes

### From v1.x to v2.x (Planned)

When configuration support is added, type definitions will be enhanced:

```typescript
// v1.x - Limited types
import { generateRoutesFile } from '@hono-filebased-route/core'

// v2.x - Full type support
import { generateRoutesFile, type RouteConfig } from '@hono-filebased-route/core'

const config: RouteConfig = {
  // Fully typed configuration
}

await generateRoutesFile(config)
```

### Type Safety Improvements

Future versions will provide:
- Compile-time route validation
- Parameter type inference
- Response type checking
- Middleware type integration

## Next Steps

- [API Reference](./api.md) - Function signatures and usage
- [Configuration Reference](./configuration.md) - Configuration options
- [Examples](../examples/basic.md) - Practical usage examples
- [Advanced Features](../guide/advanced-features.md) - Advanced patterns