# Installation & Configuration

This guide will walk you through installing and configuring hono-filebased-route in your project.

## Prerequisites

Before installing hono-filebased-route, ensure you have:

- **Bun** (recommended) or **Node.js 18+**
- **Hono** framework installed in your project
- Basic understanding of TypeScript

## Installation

### Using Bun (Recommended)

```bash
bun add hono-filebased-route
```

### Using npm

```bash
npm install hono-filebased-route
```

### Using yarn

```bash
yarn add hono-filebased-route
```

### Using pnpm

```bash
pnpm add hono-filebased-route
```

## Basic Setup

### 1. Import and Initialize

In your main application file (e.g., `index.ts` or `app.ts`):

```typescript
import { Hono } from 'hono'
import { fileBasedRouting } from 'hono-filebased-route'

const app = new Hono()

// Apply file-based routing
fileBasedRouting(app, {
	dir: './routes', // Path to your routes directory
})

export default app
```

### 2. Create Routes Directory

Create a `routes` directory in your project root:

```bash
mkdir routes
```

### 3. Create Your First Route

Create `routes/index.ts`:

```typescript
import type { Context } from 'hono'

export const GET = (c: Context) => {
	return c.json({ message: 'Hello World!' })
}
```

## Configuration Options

The `fileBasedRouting` function accepts a configuration object with the following options:

### Basic Configuration

```typescript
fileBasedRouting(app, {
	dir: './routes', // Required: Routes directory path
	verbose: false, // Optional: Enable verbose logging
	prefix: '/api', // Optional: Add prefix to all routes
	exclude: ['_helpers'], // Optional: Exclude certain directories/files
})
```

### Advanced Configuration

```typescript
interface FileBasedRoutingOptions {
	/** Path to the routes directory */
	dir: string

	/** Enable verbose logging during route registration */
	verbose?: boolean

	/** Prefix to add to all routes */
	prefix?: string

	/** Array of file/directory names to exclude */
	exclude?: string[]

	/** Custom file extensions to process (default: ['.ts', '.js']) */
	extensions?: string[]

	/** Custom route transformation function */
	transform?: (path: string) => string
}
```

## Configuration Examples

### With API Prefix

```typescript
fileBasedRouting(app, {
	dir: './routes',
	prefix: '/api/v1',
})

// routes/users.ts becomes /api/v1/users
```

### Excluding Files

```typescript
fileBasedRouting(app, {
	dir: './routes',
	exclude: ['_helpers', '_utils', 'test'],
})

// Files in _helpers/, _utils/, and test/ directories will be ignored
```

### Custom Extensions

```typescript
fileBasedRouting(app, {
	dir: './routes',
	extensions: ['.ts', '.js', '.mjs'],
})
```

### Custom Path Transformation

```typescript
fileBasedRouting(app, {
	dir: './routes',
	transform: (path: string) => {
		// Convert kebab-case to camelCase in URLs
		return path.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())
	},
})
```

### Verbose Logging

```typescript
fileBasedRouting(app, {
	dir: './routes',
	verbose: true,
})

// Output:
// [hono-filebased-route] Registered: GET /
// [hono-filebased-route] Registered: GET /users
// [hono-filebased-route] Registered: GET /users/:id
```

## Project Structure Examples

### Simple API Structure

```
project/
├── index.ts              # Main app file
├── routes/
│   ├── index.ts          # GET /
│   ├── health.ts         # GET /health
│   └── users.ts          # GET,POST /users
└── package.json
```

### Complex API Structure

```
project/
├── src/
│   ├── index.ts          # Main app file
│   ├── routes/
│   │   ├── index.ts      # GET /
│   │   ├── auth/
│   │   │   ├── login.ts  # POST /auth/login
│   │   │   └── logout.ts # POST /auth/logout
│   │   ├── api/
│   │   │   ├── users/
│   │   │   │   ├── index.ts    # GET,POST /api/users
│   │   │   │   └── [id].ts     # GET,PUT,DELETE /api/users/:id
│   │   │   └── posts/
│   │   │       ├── index.ts    # GET,POST /api/posts
│   │   │       └── [...slug].ts # GET /api/posts/*
│   │   └── _helpers/     # Excluded directory
│   │       └── utils.ts
│   └── middleware/
└── package.json
```

## Environment-Specific Configuration

### Development Configuration

```typescript
// dev.ts
import { fileBasedRouting } from 'hono-filebased-route'

fileBasedRouting(app, {
	dir: './routes',
	verbose: true, // Enable logging in development
	exclude: ['test', '_dev'],
})
```

### Production Configuration

```typescript
// prod.ts
import { fileBasedRouting } from 'hono-filebased-route'

fileBasedRouting(app, {
	dir: './dist/routes', // Use compiled routes
	verbose: false, // Disable logging in production
	exclude: ['test', '_dev', '_internal'],
})
```

## Integration with Build Tools

### Vite Configuration

If you're using Vite, you might need to configure it to handle dynamic imports:

```typescript
// vite.config.ts
import { defineConfig } from 'vite'

export default defineConfig({
	build: {
		rollupOptions: {
			external: ['hono-filebased-route'],
		},
	},
})
```

### TypeScript Configuration

Ensure your `tsconfig.json` includes the routes directory:

```json
{
	"compilerOptions": {
		"target": "ES2022",
		"module": "ESNext",
		"moduleResolution": "bundler",
		"strict": true,
		"esModuleInterop": true,
		"skipLibCheck": true,
		"forceConsistentCasingInFileNames": true
	},
	"include": ["src/**/*", "routes/**/*"]
}
```

## Troubleshooting

### Common Issues

#### Routes Not Loading

1. **Check file extensions**: Ensure your route files have `.ts` or `.js` extensions
2. **Verify directory path**: Make sure the `dir` option points to the correct directory
3. **Enable verbose logging**: Set `verbose: true` to see which routes are being registered

#### TypeScript Errors

1. **Install type definitions**: `bun add -d @types/node`
2. **Check imports**: Ensure you're importing `Context` from 'hono'
3. **Verify export syntax**: Use `export const GET = ...` not `export default`

#### Build Issues

1. **Check build configuration**: Ensure your build tool includes the routes directory
2. **Verify output paths**: Make sure the built routes are in the expected location

### Debug Mode

Enable debug mode to troubleshoot routing issues:

```typescript
fileBasedRouting(app, {
	dir: './routes',
	verbose: true,
})
```

## Next Steps

Now that you have hono-filebased-route installed and configured:

1. Learn about [Basic Usage](/guides/basic-usage)
2. Explore [Routing Patterns](/guides/routing-patterns)
3. Understand [Dynamic Routes](/guides/dynamic-routes)
4. Check out [Advanced Features](/guides/advanced-features)

Ready to start building? Let's create some routes! 🚀
