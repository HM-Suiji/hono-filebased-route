# Hono File-Based Routing

<p align="center">English | <a href="./README.zh.md">中文</a></p>

<hr/>

[![GitHub](https://img.shields.io/github/license/HM-Suiji/hono-filebased-route)](https://github.com/HM-Suiji/hono-filebased-route/blob/main/LICENSE)
[![npm](https://img.shields.io/npm/v/%40hono-filebased-route%2Fcore)](https://www.npmjs.com/package/%40hono-filebased-route%2Fcore)
![NPM Downloads](https://img.shields.io/npm/dm/%40hono-filebased-route%2Fcore)
[![Bundle Size](https://img.shields.io/bundlephobia/min/%40hono-filebased-route%2Fcore)](https://bundlephobia.com/result?p=%40hono-filebased-route%2Fcore)
[![Bundle Size](https://img.shields.io/bundlephobia/minzip/%40hono-filebased-route%2Fcore)](https://bundlephobia.com/result?p=%40hono-filebased-route%2Fcore)
[![GitHub last commit](https://img.shields.io/github/last-commit/HM-Suiji/hono-filebased-route)](https://github.com/HM-Suiji/hono-filebased-route/commits/main)
[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/HM-Suiji/hono-filebased-route)

## Intro

A file-based routing system for the Hono framework, utilizing a monorepo managed by Turborepo, supporting a file-routing pattern similar to Next.js.

## Features

- 🚀 **File-based Routing System**: Automatically generates routes based on file structure.
- ⚡ **Bun Runtime**: Fast JavaScript runtime.
- 🔥 **Hot Reloading**: Automatically reloads during development.
- 📁 **Dynamic Routes**: Supports dynamic parameters and wildcard routes.
- 🎯 **Type Safety**: Full TypeScript support.
- 🛠️ **Automatic Generation**: Route configurations are automatically generated, eliminating manual maintenance.
- 📦 **Monorepo**: Manages multi-package projects using Turborepo.
- ⚡ **Build Caching**: Intelligent caching and parallel build optimization.

## Project Modules (Choose One of the Three)

| Module                          | Core Module (@hono-filebased-route/core)                                                                                                                                                                                                                | Runtime Module (@hono-filebased-route/runtime)                                                              | Vite Plugin Module (@hono-filebased-route/vite-plugin)                                                                                                                                         |
| :------------------------------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | :---------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Description**                 | A route registration library for Node/Bun environments. Uses `predev` to run `scripts/generate-routes.ts` which scans the route directory (default: `./src/routes`) and automatically generates corresponding route configurations based on file paths. | This module provides runtime route registration capabilities for dynamically registering routes at runtime. | This plugin is for Vite projects and automatically registers routes. It can optionally generate route files or leverage Vite's virtual file system.                                            |
| **How it Works**                | Scans files in a specified directory (default: `./src/routes`) and generates route configurations based on their paths (e.g., creating route files).                                                                                                    | Dynamically registers routes at runtime, without relying on pre-generated files.                            | Integrates with the Vite build tool to automatically register routes, with the option to generate route files or use Vite's virtual file system.                                               |
| **Advantages**                  | Smallest core library size.                                                                                                                                                                                                                             | Does not generate additional route files.<br />Supports hot updating (depending on the build tool).         | Can freely choose to generate route files or use Vite's virtual file system.<br>Supports hot updating.<br>Developer-friendly with automatic generation of default template code for new files. |
| **Disadvantages**               | Does not support hot reloading: After creating new route files, you need to manually run `bun run generate-routes` or `bun dev` to generate the route configurations.                                                                                   |                                                                                                             | Requires a dependency on Vite.                                                                                                                                                                 |
| **Target Environment/Use Case** | Node/Bun environments, for generating route configurations during the build process.                                                                                                                                                                    | Runtime dynamic route registration.                                                                         | Vite projects, for automated route registration.                                                                                                                                               |
| **Hot Reloading Support**       | **Not Supported**                                                                                                                                                                                                                                       | **Supported (depending on the build tool)**                                                                 | **Supported**                                                                                                                                                                                  |
| **File Generation**             | **Primary Function: Generates route files/configurations.**                                                                                                                                                                                             | **Does Not Generate**                                                                                       | **Optional: Generates route files or uses virtual file system**                                                                                                                                |
| **Developer Experience**        | Requires extra steps after adding new routes.                                                                                                                                                                                                           | Directly registers at runtime.                                                                              | **Highly Friendly:** New files automatically generate default templates.                                                                                                                       |
| **Integration Needs**           | Needs to be used in conjunction with `predev` or manual execution of the route generation script.                                                                                                                                                       |                                                                                                             | **Native Support for Vite Projects**                                                                                                                                                           |

## Routing Rules

### Basic Route Examples

| File Path                          | Route Path    | Description             |
| :--------------------------------- | :------------ | :---------------------- |
| `src/routes/index.ts`              | `/`           | Root route              |
| `src/routes/about.ts`              | `/about`      | Static route            |
| `src/routes/users/index.ts`        | `/users`      | Nested route            |
| `src/routes/users/[id].ts`         | `/users/:id`  | Dynamic parameter route |
| `src/routes/articles/[...slug].ts` | `/articles/*` | Wildcard route          |

## Quick Start

### Using the Core Module

1. Install the core module:

   ```bash
   bun add hono @hono-filebased-route/core
   ```

2. Add `scripts/generate-routes.ts`:

   ```typescript
   import { generateRoutesFile } from '@hono-filebased-route/core'
   generateRoutesFile()
   ```

3. Configure `package.json`:

   ```json
   {
     "scripts": {
       "predev": "bun generate-routes",
       "generate-routes": "bun run scripts/generate-routes.ts"
     }
   }
   ```

4. Configure `src/index.ts`:

   ```typescript
   import { Hono } from 'hono'
   import { registerGeneratedRoutes } from './generated-routes'

   const app = new Hono()

   // Call the generated function to register all routes
   registerGeneratedRoutes(app)

   // Start the server
   const port = 3000
   console.log(`Server is running on http://localhost:${port}`)

   export default {
     port: port,
     fetch: app.fetch,
   }
   ```

5. Generate the route configuration:

   ```bash
   bun run generate-routes
   # or
   bun dev
   ```

### Using the Runtime Module

1. Install the runtime module:

   ```bash
   bun add hono @hono-filebased-route/runtime
   ```

2. Configure `src/index.ts`:

   ```typescript
   import { Hono } from 'hono'
   import { registerRoutes } from '@hono-filebased-route/runtime'

   const app = new Hono()

   // Call the generated function to register all routes
   registerRoutes(app)

   // Start the server
   const port = 3000
   console.log(`Server is running on http://localhost:${port}`)

   export default {
     port: port,
     fetch: app.fetch,
   }
   ```

### Vite Plugin

1. Install the plugin:

   ```bash
   bun add hono @hono-filebased-route/vite-plugin
   bun add -D @hono/vite-dev-server @hono/vite-build/node
   ```

2. Configure `vite.config.ts`:

   ```typescript
   import devServer from '@hono/vite-dev-server'
   import { defineConfig } from 'vite'
   import build from '@hono/vite-build/node'
   import honoRouter from '@hono-filebased-route/vite-plugin'

   export default defineConfig({
     plugins: [
       honoRouter({
         virtualRoute: false, // Set to true to use virtual routes
         verbose: true,
       }),
       build(),
       devServer({
         entry: 'src/index.ts',
       }),
     ],
   })
   ```

3. Configure `src/index.ts`:

   ```typescript
   import { Hono } from 'hono'
   // If virtualRoute is false in vite.config.ts
   import { registerGeneratedRoutes } from './generated-routes'
   // If virtualRoute is true in vite.config.ts
   // import { registerGeneratedRoutes } from 'virtual:generated-routes'

   const app = new Hono()

   // Call the generated function to register all routes
   registerGeneratedRoutes(app)

   export default app
   ```

4. Create `index.d.ts` (if using virtual routes):

   ```typescript
   declare module 'virtual:generated-routes' {
     function registerGeneratedRoutes(app: Hono): void
   }
   ```

## Creating Routes

Create TypeScript files in the `src/routes` directory and export HTTP method handler functions:

```typescript
import { Context } from 'hono'

// GET request handler
export function GET(c: Context) {
  return c.json({ message: 'Hello from GET' })
}

// POST request handler
export function POST(c: Context) {
  return c.json({ message: 'Hello from POST' })
}
```

### Dynamic Routes

Use brackets to create dynamic routes:

```typescript
import { Context } from 'hono'

export function GET(c: Context) {
  const id = c.req.param('id')
  return c.json({ userId: id })
}
```

### Wildcard Routes

Use `[...slug]` to create wildcard routes:

This project populates the `slug` parameter via `c.req.path`, providing it as the second argument to the `GET/POST` function.

```typescript
import { Context } from 'hono'

export function GET(c: Context, slug: string[]) {
  return c.json({ slug })
}
```

## Development Scripts

### Root Directory Scripts (Turborepo)

- `turbo run build`: Builds all packages (supports caching and parallel builds).
- `turbo run dev`: Starts all development services.
- `turbo run test`: Runs all tests.
- `turbo run lint`: Code checking.
- `turbo run type-check`: TypeScript type checking.
- `turbo run clean`: Cleans all build artifacts.
- `turbo run test:basic`: Quickly starts the basic example.

### Package Level Scripts

- `bun run build`: Builds the current package.
- `bun run dev`: Development mode (includes hot reloading).
- `bun run clean`: Cleans build artifacts.
- `bun run generate-routes`: Generates route configurations (example project only).

## Stack

- **Hono [<sup>1</sup>](https://hono.dev/)**: Lightweight web framework.
- **bun [<sup>2</sup>](https://bun.sh/)**: Fast JavaScript runtime.
- **Turborepo [<sup>3</sup>](https://turbo.build/)**: High-performance monorepo build system.
- **TypeScript**: Type-safe JavaScript.
- **Workspace**: Bun workspace management.

## License

MIT License

## Contributing

Issues and Pull Requests are welcome!

---

**Note**: The `src/generated-routes.ts` file is auto-generated; please do not edit it manually. If you need to modify routes, directly edit the files within the `src/routes` directory.
