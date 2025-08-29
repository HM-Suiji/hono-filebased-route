# Installation and Configuration

This guide will walk you through installing and configuring `@hono-filebased-route/core` in your project.

## Prerequisites

Before installing `@hono-filebased-route/core`, please ensure you have:

- **Bun** (recommended) or **Node.js 18+**
- **Hono** framework already installed in your project
- A basic understanding of TypeScript

## Installation

### Using Bun (recommended)

```bash
bun add @hono-filebased-route/core
```

### Using npm

```bash
npm install @hono-filebased-route/core
```

### Using yarn

```bash
yarn add @hono-filebased-route/core
```

### Using pnpm

```bash
pnpm add @hono-filebased-route/core
```

## Basic Setup

### 1. Import and Initialize

In your project's `scripts` folder, add a file, such as `generate-routes.ts`:

```typescript
import { generateRoutesFile } from '@hono-filebased-route/core'

generateRoutesFile()
```

In your main application file (e.g., `index.ts` or `app.ts`):

```typescript
import { Hono } from 'hono'
import { registerGeneratedRoutes } from './generated-routes'

const app = new Hono()

// Call the generated function to register all routes
registerGeneratedRoutes(app)

// Handle unmatched routes
app.notFound(c => {
  return c.text('404 Not Found!', 404)
})

// Handle errors
app.onError((err, c) => {
  console.error(`Route error: ${err}`)
  return c.text('Internal Server Error', 500)
})

// Start the server
const port = 3000
console.log(`Server is running on http://localhost:${port}`)

export default {
  port: port,
  fetch: app.fetch,
}
```

### 2. Create the Routes Directory

Create a `routes` directory in your project's `src` folder:

```bash
mkdir src/routes
```

### 3. Create Your First Route

Create `src/routes/index.ts`:

```typescript
import type { Context } from 'hono'

export const GET = (c: Context) => {
  return c.json({ message: 'Hello World!' })
}
```

## Configuration Options

The `generateRoutesFile` function accepts a configuration object with the following options:

### Basic Configuration

```typescript
generateRoutesFile({
  dir: './src/routes', // Optional: Path to the routes directory, defaults to './src/routes'
  output: './src/generated-routes.ts', // Optional: Output file path, defaults to './src/generated-routes.ts' !It is recommended to add this file to .gitignore
})
```

## Project Structure Example

### Simple API Structure

```txt
project/
├── index.ts                # Main application file
├── routes/
│   ├── index.ts            # GET /
│   ├── health.ts           # GET /health
│   └── users.ts            # GET,POST /users
├── scripts/
│   └── generate-routes.ts  # Route generation script
└── package.json
```

## Environment-Specific Configuration

### Development Environment Configuration

```typescript
// dev.ts
import { fileBasedRouting } from 'hono-filebased-route'

fileBasedRouting(app, {
  dir: './routes',
  verbose: true, // Enable logging in development
  exclude: ['test', '_dev'],
})
```

### Production Environment Configuration

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

If you are using Vite, use `@hono-filebased-route/vite-plugin`:

```bash
bun add @hono-filebased-route/vite-plugin
```

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import honoFilebasedRoute from '@hono-filebased-route/vite-plugin'

export default defineConfig({
  plugins: [honoFilebasedRoute()],
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

1. **Check file extensions**: Ensure route files have `.ts` or `.js` extensions.
2. **Verify directory path**: Make sure the `dir` option points to the correct directory.

#### TypeScript Errors

1. **Install type definitions**: `bun add -d @types/node`
2. **Check imports**: Ensure `Context` is imported from 'hono'.
3. **Verify export syntax**: Use `export const GET = ...` instead of `export default`.

#### Build Issues

1. **Check build configuration**: Ensure your build tool includes the routes directory.
2. **Verify output path**: Make sure compiled routes are in the expected location.

## Next Steps

Now that you've installed and configured hono-filebased-route:

1. [Learn Basic Usage](/zh/guides/basic-usage)
2. [Explore Routing Patterns](/zh/guides/routing-patterns)
3. [Understand Dynamic Routes](/zh/guides/dynamic-routes)
4. [Discover Advanced Features](/zh/guides/advanced-features)

Ready to start building? Let's create some routes! 🚀
