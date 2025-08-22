# Configuration Reference

This document provides detailed information about configuring hono-filebased-route for your project.

## Overview

Currently, hono-filebased-route uses hardcoded configuration values. This document outlines the current behavior and planned configuration options for future releases.

## Current Configuration

### Default Values

The following values are currently hardcoded in the core package:

```typescript
// Current hardcoded configuration
const CONFIG = {
  routesDirectory: './src/routes',
  outputFile: './src/generated-routes.ts',
  supportedMethods: ['GET', 'POST'],
  fileExtensions: ['.ts', '.js'],
  indexFiles: ['index.ts', 'index.js']
}
```

### Directory Structure

```
project-root/
├── src/
│   ├── routes/           # Routes directory (hardcoded)
│   │   ├── index.ts
│   │   ├── about.ts
│   │   └── users/
│   │       └── [id].ts
│   ├── generated-routes.ts  # Generated output (hardcoded)
│   └── main.ts
├── scripts/
│   └── generate-routes.ts   # Route generation script
└── package.json
```

## Build Integration

### Package.json Scripts

Recommended script configuration for different runtimes:

#### Bun Runtime
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

#### Node.js Runtime
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

### TypeScript Configuration

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
  "include": [
    "src/**/*",
    "scripts/**/*"
  ],
  "exclude": [
    "node_modules",
    "dist"
  ]
}
```

## Route File Conventions

### Naming Patterns

| Pattern | Route Path | Description |
|---------|------------|-------------|
| `index.ts` | `/` | Root route |
| `about.ts` | `/about` | Static route |
| `[id].ts` | `/:id` | Dynamic parameter |
| `[...path].ts` | `/*` | Catch-all route |
| `users/index.ts` | `/users` | Nested index |
| `users/[id].ts` | `/users/:id` | Nested dynamic |

### File Structure Examples

#### Simple Blog
```
src/routes/
├── index.ts          # GET /
├── about.ts          # GET /about
├── blog/
│   ├── index.ts      # GET /blog
│   └── [slug].ts     # GET /blog/:slug
└── contact.ts        # GET /contact
```

#### API with Admin
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

## Environment Configuration

### Development Environment

```bash
# .env.development
NODE_ENV=development
PORT=3000
HOST=localhost

# Enable hot reloading for route changes
WATCH_ROUTES=true
```

### Production Environment

```bash
# .env.production
NODE_ENV=production
PORT=8080
HOST=0.0.0.0

# Disable route watching in production
WATCH_ROUTES=false
```

## Planned Configuration (Future Releases)

### Configuration File Support

Future versions will support configuration files:

#### hono-routes.config.ts
```typescript
import { defineConfig } from '@hono-filebased-route/core'

export default defineConfig({
  // Route discovery
  routesDirectory: './src/routes',
  outputFile: './src/generated-routes.ts',
  
  // HTTP methods
  supportedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  
  // File patterns
  include: ['**/*.ts', '**/*.js'],
  exclude: ['**/*.test.ts', '**/*.spec.ts'],
  
  // Route transformation
  routeTransform: {
    // Custom parameter syntax
    parameterPattern: /\[([^\]]+)\]/g,
    catchAllPattern: /\[\.\.\.([^\]]+)\]/g,
    
    // Route prefixes
    prefix: '/api',
    
    // Case transformation
    caseTransform: 'kebab-case' // 'camelCase' | 'snake_case' | 'kebab-case'
  },
  
  // Code generation
  generation: {
    // Import style
    importStyle: 'dynamic', // 'static' | 'dynamic'
    
    // TypeScript options
    typescript: {
      generateTypes: true,
      strictMode: true
    },
    
    // Output formatting
    formatting: {
      semicolons: true,
      quotes: 'single', // 'single' | 'double'
      trailingComma: 'es5'
    }
  },
  
  // Middleware integration
  middleware: {
    // Global middleware
    global: ['./src/middleware/cors.ts', './src/middleware/auth.ts'],
    
    // Route-specific middleware patterns
    patterns: {
      '/api/admin/*': ['./src/middleware/admin-auth.ts'],
      '/api/auth/*': ['./src/middleware/rate-limit.ts']
    }
  },
  
  // Development options
  dev: {
    // Watch for changes
    watch: true,
    
    // Auto-regenerate on file changes
    autoRegenerate: true,
    
    // Logging level
    logLevel: 'info' // 'silent' | 'error' | 'warn' | 'info' | 'debug'
  }
})
```

### Package.json Configuration

Alternatively, configuration in package.json:

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

## Vite Plugin Configuration (Planned)

### Basic Setup
```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import { honoFilebasedRoute } from '@hono-filebased-route/vite-plugin'

export default defineConfig({
  plugins: [
    honoFilebasedRoute({
      routesDirectory: './src/routes',
      outputFile: './src/generated-routes.ts',
      
      // Development features
      hmr: true, // Hot module replacement
      devMiddleware: true, // Development middleware
      
      // Build optimization
      treeshaking: true,
      minify: true
    })
  ]
})
```

### Advanced Vite Configuration
```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import { honoFilebasedRoute } from '@hono-filebased-route/vite-plugin'

export default defineConfig({
  plugins: [
    honoFilebasedRoute({
      // Multiple route directories
      routes: [
        {
          directory: './src/api',
          prefix: '/api',
          outputFile: './src/generated-api-routes.ts'
        },
        {
          directory: './src/pages',
          prefix: '',
          outputFile: './src/generated-page-routes.ts'
        }
      ],
      
      // Custom transformations
      transform: {
        // Custom route path transformation
        routePath: (filePath, baseDir) => {
          // Custom logic here
          return customTransform(filePath, baseDir)
        },
        
        // Custom code generation
        codeGeneration: (routes) => {
          // Custom template
          return generateCustomCode(routes)
        }
      },
      
      // Integration with other tools
      integrations: {
        // OpenAPI generation
        openapi: {
          enabled: true,
          outputFile: './docs/openapi.json'
        },
        
        // Route testing
        testing: {
          generateTests: true,
          testFramework: 'vitest'
        }
      }
    })
  ]
})
```

## Migration Guide

### Upgrading from Manual Configuration

When configuration support is added, migration will be straightforward:

**Current (v1.x):**
```typescript
// Hardcoded behavior
import { generateRoutesFile } from '@hono-filebased-route/core'

// No configuration options
await generateRoutesFile()
```

**Future (v2.x):**
```typescript
// Configurable behavior
import { generateRoutesFile } from '@hono-filebased-route/core'

// With configuration
await generateRoutesFile({
  routesDirectory: './custom/routes',
  outputFile: './custom/output.ts',
  supportedMethods: ['GET', 'POST', 'PUT', 'DELETE']
})
```

### Breaking Changes (Planned)

Future versions may include breaking changes:

1. **Configuration Required**: Configuration file or options may become required
2. **Method Support**: Default supported methods may change
3. **File Structure**: Output file structure may be enhanced
4. **Import Paths**: Generated import paths may be optimized

## Troubleshooting

### Common Configuration Issues

#### Routes Not Found
```bash
# Check if routes directory exists
ls -la src/routes

# Verify file extensions
find src/routes -name "*.ts" -o -name "*.js"
```

#### Generated File Issues
```bash
# Remove generated file and regenerate
rm src/generated-routes.ts
npm run generate-routes

# Check TypeScript compilation
npx tsc --noEmit
```

#### Build Script Problems
```bash
# Verify script execution
npm run generate-routes -- --verbose

# Check script permissions
chmod +x scripts/generate-routes.ts
```

### Performance Optimization

#### Large Route Collections
```typescript
// For projects with many routes, consider:
// 1. Organizing routes in subdirectories
// 2. Using dynamic imports (planned feature)
// 3. Route-level code splitting (planned feature)

// Current: All routes are statically imported
// Future: Dynamic imports for better performance
```

#### Development Performance
```bash
# Use file watching for development
# (Planned feature)
npm run dev -- --watch-routes

# Skip route generation in development
# (When using cached routes)
npm run dev -- --skip-generation
```

## Best Practices

### 1. Script Organization

```json
// Recommended script setup
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

### 2. Development Workflow

```bash
# 1. Add new route file
touch src/routes/new-feature.ts

# 2. Implement route handlers
echo 'export const GET = (c) => c.text("Hello")' > src/routes/new-feature.ts

# 3. Regenerate routes (automatic with pre-scripts)
npm run dev
```

### 3. Production Deployment

```dockerfile
# Dockerfile example
FROM oven/bun:1 as builder

WORKDIR /app
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile

COPY . .
# Generate routes before build
RUN bun run generate-routes
RUN bun run build

FROM oven/bun:1-slim
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./

EXPOSE 3000
CMD ["bun", "dist/main.js"]
```

## Next Steps

- [API Reference](./api.md) - Complete API documentation
- [Type Definitions](./types.md) - TypeScript type reference
- [Examples](../examples/basic.md) - Practical usage examples
- [Advanced Features](../guide/advanced-features.md) - Advanced usage patterns