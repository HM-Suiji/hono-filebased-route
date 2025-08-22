# 配置参考

本文档提供了为您的项目配置 hono-filebased-route 的详细信息。

## 概述

目前，hono-filebased-route 使用硬编码的配置值。本文档概述了当前行为和未来版本的计划配置选项。

## 当前配置

### 默认值

以下值目前在核心包中是硬编码的：

```typescript
// 当前硬编码配置
const CONFIG = {
	routesDirectory: './src/routes',
	outputFile: './src/generated-routes.ts',
	supportedMethods: ['GET', 'POST'],
	fileExtensions: ['.ts', '.js'],
	indexFiles: ['index.ts', 'index.js'],
}
```

### 目录结构

```
project-root/
├── src/
│   ├── routes/           # 路由目录（硬编码）
│   │   ├── index.ts
│   │   ├── about.ts
│   │   └── users/
│   │       └── [id].ts
│   ├── generated-routes.ts  # 生成的输出（硬编码）
│   └── main.ts
├── scripts/
│   └── generate-routes.ts   # 路由生成脚本
└── package.json
```

## 构建集成

### Package.json 脚本

不同运行时的推荐脚本配置：

#### Bun 运行时

```json
{
	"scripts": {
		"generate-routes": "bun run scripts/generate-routes.ts",
		"predev": "bun run generate-routes",
		"dev": "bun --hot --watch src/main.ts",
		"prestart": "bun run generate-routes",
		"start": "bun src/main.ts",
		"prebuild": "bun run generate-routes",
		"build": "tsc"
	}
}
```

#### Node.js 运行时

```json
{
	"scripts": {
		"generate-routes": "tsx scripts/generate-routes.ts",
		"predev": "npm run generate-routes",
		"dev": "tsx watch src/main.ts",
		"prestart": "npm run generate-routes",
		"start": "node dist/main.js",
		"prebuild": "npm run generate-routes",
		"build": "tsc"
	}
}
```

### TypeScript 配置

#### tsconfig.json

```json
{
	"compilerOptions": {
		"target": "ES2022",
		"module": "ESNext",
		"moduleResolution": "bundler",
		"allowImportingTsExtensions": true,
		"noEmit": true,
		"strict": true,
		"skipLibCheck": true,
		"types": ["bun-types"]
	},
	"include": ["src/**/*", "scripts/**/*"],
	"exclude": ["node_modules", "dist"]
}
```

## 路由文件约定

### 命名模式

| 模式             | 路由路径     | 描述         |
| ---------------- | ------------ | ------------ |
| `index.ts`       | `/`          | 根路由       |
| `about.ts`       | `/about`     | 静态路由     |
| `[id].ts`        | `/:id`       | 动态参数     |
| `[...path].ts`   | `/*`         | 捕获所有路由 |
| `users/index.ts` | `/users`     | 嵌套索引     |
| `users/[id].ts`  | `/users/:id` | 嵌套动态     |

### 文件结构示例

#### 简单博客

```
src/routes/
├── index.ts          # GET /
├── about.ts          # GET /about
├── blog/
│   ├── index.ts      # GET /blog
│   └── [slug].ts     # GET /blog/:slug
└── contact.ts        # GET /contact
```

#### 带管理员的 API

```
src/routes/
├── api/
│   ├── auth/
│   │   ├── login.ts     # GET,POST /api/auth/login
│   │   └── logout.ts    # POST /api/auth/logout
│   ├── users/
│   │   ├── index.ts     # GET,POST /api/users
│   │   └── [id].ts      # GET,POST /api/users/:id
│   └── [...path].ts     # GET,POST /api/*
└── admin/
    ├── index.ts         # GET /admin
    └── dashboard.ts     # GET /admin/dashboard
```

## 环境配置

### 开发环境

```bash
# .env.development
NODE_ENV=development
PORT=3000
HOST=localhost

# 为路由变更启用热重载
WATCH_ROUTES=true
```

### 生产环境

```bash
# .env.production
NODE_ENV=production
PORT=8080
HOST=0.0.0.0

# 在生产环境中禁用路由监视
WATCH_ROUTES=false
```

## 计划配置（未来版本）

### 配置文件支持

未来版本将支持配置文件：

#### hono-routes.config.ts

```typescript
import { defineConfig } from '@hono-filebased-route/core'

export default defineConfig({
	// 路由发现
	routesDirectory: './src/routes',
	outputFile: './src/generated-routes.ts',

	// HTTP 方法
	supportedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],

	// 文件模式
	include: ['**/*.ts', '**/*.js'],
	exclude: ['**/*.test.ts', '**/*.spec.ts'],

	// 路由转换
	routeTransform: {
		// 自定义参数语法
		parameterPattern: /\[([^\]]+)\]/g,
		catchAllPattern: /\[\.\.\.([^\]]+)\]/g,

		// 路由前缀
		prefix: '/api',

		// 大小写转换
		caseTransform: 'kebab-case', // 'camelCase' | 'snake_case' | 'kebab-case'
	},

	// 代码生成
	generation: {
		// 导入样式
		importStyle: 'dynamic', // 'static' | 'dynamic'

		// TypeScript 选项
		typescript: {
			generateTypes: true,
			strictMode: true,
		},

		// 输出格式化
		formatting: {
			semicolons: true,
			quotes: 'single', // 'single' | 'double'
			trailingComma: 'es5',
		},
	},

	// 中间件集成
	middleware: {
		// 全局中间件
		global: ['./src/middleware/cors.ts', './src/middleware/auth.ts'],

		// 路由特定中间件模式
		patterns: {
			'/api/admin/*': ['./src/middleware/admin-auth.ts'],
			'/api/auth/*': ['./src/middleware/rate-limit.ts'],
		},
	},

	// 开发选项
	dev: {
		// 监视变更
		watch: true,

		// 文件变更时自动重新生成
		autoRegenerate: true,

		// 日志级别
		logLevel: 'info', // 'silent' | 'error' | 'warn' | 'info' | 'debug'
	},
})
```

### Package.json 配置

或者，在 package.json 中配置：

```json
{
	"hono-filebased-route": {
		"routesDirectory": "./src/routes",
		"outputFile": "./src/generated-routes.ts",
		"supportedMethods": ["GET", "POST", "PUT", "DELETE"],
		"typescript": {
			"generateTypes": true
		}
	}
}
```

## Vite 插件配置（计划中）

### 基础设置

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import { honoFilebasedRoute } from '@hono-filebased-route/vite-plugin'

export default defineConfig({
	plugins: [
		honoFilebasedRoute({
			routesDirectory: './src/routes',
			outputFile: './src/generated-routes.ts',

			// 开发功能
			hmr: true, // 热模块替换
			devMiddleware: true, // 开发中间件

			// 构建优化
			treeshaking: true,
			minify: true,
		}),
	],
})
```

### 高级 Vite 配置

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import { honoFilebasedRoute } from '@hono-filebased-route/vite-plugin'

export default defineConfig({
	plugins: [
		honoFilebasedRoute({
			// 多个路由目录
			routes: [
				{
					directory: './src/api',
					prefix: '/api',
					outputFile: './src/generated-api-routes.ts',
				},
				{
					directory: './src/pages',
					prefix: '',
					outputFile: './src/generated-page-routes.ts',
				},
			],

			// 自定义转换
			transform: {
				// 自定义路由路径转换
				routePath: (filePath, baseDir) => {
					// 自定义逻辑在这里
					return customTransform(filePath, baseDir)
				},

				// 自定义代码生成
				codeGeneration: (routes) => {
					// 自定义模板
					return generateCustomCode(routes)
				},
			},

			// 与其他工具集成
			integrations: {
				// OpenAPI 生成
				openapi: {
					enabled: true,
					outputFile: './docs/openapi.json',
				},

				// 路由测试
				testing: {
					generateTests: true,
					testFramework: 'vitest',
				},
			},
		}),
	],
})
```

## 迁移指南

### 从手动配置升级

当添加配置支持时，迁移将很简单：

**当前（v1.x）：**

```typescript
// 硬编码行为
import { generateRoutesFile } from '@hono-filebased-route/core'

// 没有配置选项
await generateRoutesFile()
```

**未来（v2.x）：**

```typescript
// 可配置行为
import { generateRoutesFile } from '@hono-filebased-route/core'

// 带配置
await generateRoutesFile({
	routesDirectory: './custom/routes',
	outputFile: './custom/output.ts',
	supportedMethods: ['GET', 'POST', 'PUT', 'DELETE'],
})
```

### 破坏性变更（计划中）

未来版本可能包含破坏性变更：

1. **需要配置**：配置文件或选项可能变为必需
2. **方法支持**：默认支持的方法可能会改变
3. **文件结构**：输出文件结构可能会增强
4. **导入路径**：生成的导入路径可能会优化

## 故障排除

### 常见配置问题

#### 找不到路由

```bash
# 检查路由目录是否存在
ls -la src/routes

# 验证文件扩展名
find src/routes -name "*.ts" -o -name "*.js"
```

#### 生成文件问题

```bash
# 删除生成的文件并重新生成
rm src/generated-routes.ts
npm run generate-routes

# 检查 TypeScript 编译
npx tsc --noEmit
```

#### 构建脚本问题

```bash
# 验证脚本执行
npm run generate-routes -- --verbose

# 检查脚本权限
chmod +x scripts/generate-routes.ts
```

### 性能优化

#### 大型路由集合

```typescript
// 对于有很多路由的项目，考虑：
// 1. 在子目录中组织路由
// 2. 使用动态导入（计划功能）
// 3. 路由级代码分割（计划功能）

// 当前：所有路由都是静态导入
// 未来：动态导入以获得更好的性能
```

#### 开发性能

```bash
# 为开发使用文件监视
# （计划功能）
npm run dev -- --watch-routes

# 在开发中跳过路由生成
# （使用缓存路由时）
npm run dev -- --skip-generation
```

## 最佳实践

### 1. 脚本组织

```json
// 推荐的脚本设置
{
	"scripts": {
		"routes:generate": "bun run scripts/generate-routes.ts",
		"routes:watch": "bun run scripts/generate-routes.ts --watch",
		"routes:clean": "rm -f src/generated-routes.ts",
		"predev": "npm run routes:generate",
		"prebuild": "npm run routes:generate"
	}
}
```

### 2. 开发工作流

```bash
# 1. 添加新路由文件
touch src/routes/new-feature.ts

# 2. 实现路由处理器
echo 'export const GET = (c) => c.text("Hello")' > src/routes/new-feature.ts

# 3. 重新生成路由（使用 pre-scripts 自动）
npm run dev
```

### 3. 生产部署

```dockerfile
# Dockerfile 示例
FROM oven/bun:1 as builder

WORKDIR /app
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile

COPY . .
# 构建前生成路由
RUN bun run generate-routes
RUN bun run build

FROM oven/bun:1-slim
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./

EXPOSE 3000
CMD ["bun", "dist/main.js"]
```

## 下一步

- [API 参考](/zh/reference/api.md) - 完整的 API 文档
- [类型定义](/zh/reference/types.md) - TypeScript 类型参考
- [示例](/zh/examples/basic.md) - 实际使用示例
- [高级功能](/zh/guides/advanced-features.md) - 高级使用模式
