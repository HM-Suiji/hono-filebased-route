# 类型定义

本文档提供 hono-filebased-route 的全面 TypeScript 类型定义。

## 核心类型

### 路由处理器类型

#### 基础路由处理器

```typescript
import type { Context } from 'hono'

/**
 * GET、POST、PUT、DELETE 等的标准路由处理器
 */
type RouteHandler = (c: Context) => Response | Promise<Response>

/**
 * 带类型参数的路由处理器
 */
type RouteHandlerWithParams<T = Record<string, string>> = (
	c: Context & { req: { param: (key: keyof T) => T[keyof T] } }
) => Response | Promise<Response>
```

#### 捕获所有路由处理器

```typescript
/**
 * 捕获所有路由的处理器（[...path].ts）
 * 接收路径段作为第二个参数
 */
type CatchAllHandler = (
	c: Context,
	pathSegments: string[]
) => Response | Promise<Response>
```

#### HTTP 方法处理器

```typescript
/**
 * 路由文件中支持的 HTTP 方法
 */
type HttpMethod =
	| 'GET'
	| 'POST'
	| 'PUT'
	| 'DELETE'
	| 'PATCH'
	| 'HEAD'
	| 'OPTIONS'

/**
 * 路由文件导出接口
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

### 配置类型

#### 核心配置

```typescript
/**
 * 路由生成的核心配置
 */
interface RouteConfig {
	/** 包含路由文件的目录 */
	routesDirectory: string

	/** 生成路由的输出文件 */
	outputFile: string

	/** 支持的 HTTP 方法 */
	supportedMethods: HttpMethod[]

	/** 要包含的文件扩展名 */
	fileExtensions: string[]

	/** 索引文件名 */
	indexFiles: string[]
}

/**
 * 扩展配置（计划用于未来版本）
 */
interface ExtendedRouteConfig extends RouteConfig {
	/** 路由转换选项 */
	routeTransform?: RouteTransformOptions

	/** 代码生成选项 */
	generation?: GenerationOptions

	/** 中间件集成 */
	middleware?: MiddlewareOptions

	/** 开发选项 */
	dev?: DevOptions
}
```

#### 路由转换

```typescript
/**
 * 路由路径转换选项
 */
interface RouteTransformOptions {
	/** 动态参数的模式 */
	parameterPattern?: RegExp

	/** 捕获所有路由的模式 */
	catchAllPattern?: RegExp

	/** 路由前缀 */
	prefix?: string

	/** 大小写转换 */
	caseTransform?: 'camelCase' | 'snake_case' | 'kebab-case'

	/** 自定义转换函数 */
	customTransform?: (filePath: string, baseDir: string) => string
}
```

#### 代码生成

```typescript
/**
 * 代码生成选项
 */
interface GenerationOptions {
	/** 导入样式 */
	importStyle?: 'static' | 'dynamic'

	/** TypeScript 选项 */
	typescript?: TypeScriptOptions

	/** 输出格式化 */
	formatting?: FormattingOptions
}

/**
 * TypeScript 生成选项
 */
interface TypeScriptOptions {
	/** 生成类型定义 */
	generateTypes?: boolean

	/** 使用严格模式 */
	strictMode?: boolean

	/** 生成 JSDoc 注释 */
	generateJSDoc?: boolean
}

/**
 * 代码格式化选项
 */
interface FormattingOptions {
	/** 使用分号 */
	semicolons?: boolean

	/** 引号样式 */
	quotes?: 'single' | 'double'

	/** 尾随逗号样式 */
	trailingComma?: 'none' | 'es5' | 'all'

	/** 缩进 */
	indent?: number | 'tab'
}
```

#### 中间件集成

```typescript
/**
 * 中间件配置选项
 */
interface MiddlewareOptions {
	/** 全局中间件文件 */
	global?: string[]

	/** 路由特定中间件模式 */
	patterns?: Record<string, string[]>

	/** 中间件执行顺序 */
	order?: 'before' | 'after' | 'around'
}
```

#### 开发选项

```typescript
/**
 * 开发特定选项
 */
interface DevOptions {
	/** 监视文件变更 */
	watch?: boolean

	/** 变更时自动重新生成 */
	autoRegenerate?: boolean

	/** 日志级别 */
	logLevel?: 'silent' | 'error' | 'warn' | 'info' | 'debug'

	/** 热模块替换 */
	hmr?: boolean
}
```

### 路由信息类型

#### 路由元数据

```typescript
/**
 * 发现的路由信息
 */
interface RouteInfo {
	/** 原始文件路径 */
	filePath: string

	/** 生成的路由路径 */
	routePath: string

	/** 支持的 HTTP 方法 */
	methods: HttpMethod[]

	/** 路由参数 */
	params: RouteParam[]

	/** 是否为捕获所有路由 */
	isCatchAll: boolean

	/** 是否为索引路由 */
	isIndex: boolean
}

/**
 * 路由参数信息
 */
interface RouteParam {
	/** 参数名 */
	name: string

	/** 参数类型 */
	type: 'static' | 'dynamic' | 'catchAll'

	/** 参数是否可选 */
	optional?: boolean
}
```

#### 生成的路由结构

```typescript
/**
 * 生成的路由注册结构
 */
interface GeneratedRoute {
	/** 导入语句 */
	importStatement: string

	/** 路由注册代码 */
	registrationCode: string

	/** 路由元数据 */
	metadata: RouteInfo
}

/**
 * 完整的生成路由文件结构
 */
interface GeneratedRoutesFile {
	/** 文件头注释 */
	header: string

	/** 导入语句 */
	imports: string[]

	/** 路由注册 */
	routes: GeneratedRoute[]

	/** 导出语句 */
	exports: string
}
```

### 工具类型

#### 文件系统类型

```typescript
/**
 * 文件发现选项
 */
interface FileDiscoveryOptions {
	/** 基础目录 */
	baseDir: string

	/** 包含模式 */
	include?: string[]

	/** 排除模式 */
	exclude?: string[]

	/** 跟随符号链接 */
	followSymlinks?: boolean
}

/**
 * 文件信息
 */
interface FileInfo {
	/** 绝对文件路径 */
	path: string

	/** 相对于基础目录的路径 */
	relativePath: string

	/** 文件扩展名 */
	extension: string

	/** 文件大小（字节） */
	size: number

	/** 最后修改时间戳 */
	lastModified: Date
}
```

#### 错误类型

```typescript
/**
 * 路由生成错误
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
 * 配置验证错误
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
 * 文件系统操作错误
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

### 插件类型（计划中）

#### Vite 插件类型

```typescript
/**
 * Vite 插件配置
 */
interface VitePluginOptions extends ExtendedRouteConfig {
	/** 热模块替换 */
	hmr?: boolean

	/** 开发中间件 */
	devMiddleware?: boolean

	/** 构建优化 */
	optimization?: {
		treeshaking?: boolean
		minify?: boolean
		sourcemap?: boolean
	}
}

/**
 * 多路由目录配置
 */
interface MultiRouteConfig {
	/** 路由配置 */
	routes: Array<{
		directory: string
		prefix?: string
		outputFile: string
		methods?: HttpMethod[]
	}>

	/** 全局选项 */
	global?: Partial<ExtendedRouteConfig>
}
```

#### 转换函数

```typescript
/**
 * 自定义路由路径转换
 */
type RoutePathTransform = (filePath: string, baseDir: string) => string

/**
 * 自定义代码生成
 */
type CodeGenerationTransform = (routes: RouteInfo[]) => string

/**
 * 插件转换选项
 */
interface TransformOptions {
	/** 路由路径转换 */
	routePath?: RoutePathTransform

	/** 代码生成转换 */
	codeGeneration?: CodeGenerationTransform

	/** 文件过滤 */
	fileFilter?: (filePath: string) => boolean
}
```

### 集成类型

#### OpenAPI 集成

```typescript
/**
 * OpenAPI 生成选项
 */
interface OpenAPIOptions {
	/** 启用 OpenAPI 生成 */
	enabled: boolean

	/** 输出文件路径 */
	outputFile: string

	/** OpenAPI 版本 */
	version?: '3.0' | '3.1'

	/** API 信息 */
	info?: {
		title: string
		version: string
		description?: string
	}
}

/**
 * OpenAPI 的路由模式信息
 */
interface RouteSchema {
	/** 路由路径 */
	path: string

	/** HTTP 方法 */
	method: HttpMethod

	/** 请求模式 */
	request?: {
		params?: Record<string, any>
		query?: Record<string, any>
		body?: Record<string, any>
	}

	/** 响应模式 */
	response?: Record<number, Record<string, any>>
}
```

#### 测试集成

```typescript
/**
 * 测试生成选项
 */
interface TestingOptions {
	/** 生成测试文件 */
	generateTests: boolean

	/** 测试框架 */
	testFramework: 'vitest' | 'jest' | 'mocha'

	/** 测试文件模式 */
	testFilePattern?: string

	/** 测试工具 */
	utilities?: {
		mockContext?: boolean
		testHelpers?: boolean
	}
}
```

## 类型守卫

### 路由处理器类型守卫

```typescript
/**
 * 检查导出是否为有效的路由处理器
 */
function isRouteHandler(value: unknown): value is RouteHandler {
	return typeof value === 'function'
}

/**
 * 检查导出是否为捕获所有处理器
 */
function isCatchAllHandler(value: unknown): value is CatchAllHandler {
	return typeof value === 'function' && value.length >= 2
}

/**
 * 检查路由文件是否有有效导出
 */
function hasValidRouteExports(
	exports: Record<string, unknown>
): exports is RouteExports {
	const validMethods: HttpMethod[] = [
		'GET',
		'POST',
		'PUT',
		'DELETE',
		'PATCH',
		'HEAD',
		'OPTIONS',
	]

	return Object.keys(exports).some(
		(key) =>
			validMethods.includes(key as HttpMethod) && isRouteHandler(exports[key])
	)
}
```

### 配置类型守卫

```typescript
/**
 * 验证路由配置
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

## 工具类型助手

### 路由参数提取

```typescript
/**
 * 从路由路径提取参数名
 */
type ExtractParams<T extends string> =
	T extends `${infer _Start}:${infer Param}/${infer Rest}`
		? Param | ExtractParams<Rest>
		: T extends `${infer _Start}:${infer Param}`
		? Param
		: never

/**
 * 为带参数的路由创建类型化上下文
 */
type TypedContext<T extends string> = Context & {
	req: {
		param: (key: ExtractParams<T>) => string
	}
}

// 使用示例：
// type UserRouteContext = TypedContext<'/users/:id'> // param('id') 可用
// type PostRouteContext = TypedContext<'/users/:userId/posts/:postId'> // param('userId') 和 param('postId') 可用
```

### 路由文件类型推断

```typescript
/**
 * 从文件路径推断路由导出
 */
type InferRouteExports<T extends string> =
	T extends `${infer _}[...${infer _}].ts`
		? { GET?: CatchAllHandler; POST?: CatchAllHandler }
		: RouteExports

/**
 * 创建强类型路由模块
 */
interface TypedRouteModule<T extends string> {
	path: T
	exports: InferRouteExports<T>
	params: ExtractParams<T>[]
}
```

## 使用示例

### 基础路由处理器

```typescript
import type { Context } from 'hono'
import type { RouteHandler } from '@hono-filebased-route/core'

// 简单路由处理器
export const GET: RouteHandler = async (c: Context) => {
	return c.json({ message: 'Hello World' })
}

// 带类型参数的路由处理器
export const POST: RouteHandlerWithParams<{ id: string }> = async (c) => {
	const id = c.req.param('id') // TypeScript 知道这是 string
	return c.json({ id })
}
```

### 捕获所有路由处理器

```typescript
import type { CatchAllHandler } from '@hono-filebased-route/core'

// 捕获所有路由处理器
export const GET: CatchAllHandler = async (c, pathSegments) => {
	return c.json({
		path: pathSegments,
		fullPath: pathSegments.join('/'),
	})
}
```

### 自定义配置

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
		caseTransform: 'kebab-case',
	},

	generation: {
		typescript: {
			generateTypes: true,
			strictMode: true,
		},
	},
}
```

## 迁移说明

### 从 v1.x 到 v2.x（计划中）

当添加配置支持时，类型定义将得到增强：

```typescript
// v1.x - 有限的类型
import { generateRoutesFile } from '@hono-filebased-route/core'

// v2.x - 完整类型支持
import {
	generateRoutesFile,
	type RouteConfig,
} from '@hono-filebased-route/core'

const config: RouteConfig = {
	// 完全类型化的配置
}

await generateRoutesFile(config)
```

### 类型安全改进

未来版本将提供：

- 编译时路由验证
- 参数类型推断
- 响应类型检查
- 中间件类型集成

## 下一步

- [API 参考](/zh/reference/api.md) - 函数签名和用法
- [配置参考](/zh/reference/configuration.md) - 配置选项
- [示例](/zh/examples/basic.md) - 实际使用示例
- [高级功能](/zh/guides/advanced-features.md) - 高级模式
