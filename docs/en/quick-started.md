# Quick Started

Get up and running with hono-filebased-route in just a few minutes.

## Prerequisites

Before you begin, make sure you have the following installed:

- [Bun](https://bun.sh/) (recommended) or Node.js 18+
- A text editor or IDE

## Installation

### 1. Create a new project

```bash
mkdir my-hono-app
cd my-hono-app
bun init -y
```

### 2. Install hono-filebased-route

```bash
bun add hono-filebased-route
bun add -d @types/bun
```

### 3. Create your first route

Create a `routes` directory and add your first route file:

```bash
mkdir routes
```

Create `routes/index.ts`:

```typescript
import type { Context } from 'hono'

export const GET = (c: Context) => {
  return c.json({ message: 'Hello from hono-filebased-route!' })
}

export const POST = (c: Context) => {
  return c.json({ message: 'POST request received!' })
}
```

### 4. Set up your main application

Create `index.ts` in your project root:

```typescript
import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import { fileBasedRouting } from 'hono-filebased-route'

const app = new Hono()

// Apply file-based routing
fileBasedRouting(app, {
  dir: './routes'
})

const port = 3000
console.log(`Server is running on port ${port}`)

serve({
  fetch: app.fetch,
  port
})
```

### 5. Add scripts to package.json

Update your `package.json` to include these scripts:

```json
{
  "scripts": {
    "dev": "bun run --watch index.ts",
    "start": "bun run index.ts",
    "build": "bun build index.ts --outdir ./dist"
  }
}
```

### 6. Start the development server

```bash
bun run dev
```

Your server should now be running at `http://localhost:3000`!

## Test your routes

Open your browser or use curl to test your routes:

```bash
# Test GET request
curl http://localhost:3000
# Response: {"message":"Hello from hono-filebased-route!"}

# Test POST request
curl -X POST http://localhost:3000
# Response: {"message":"POST request received!"}
```

## Add more routes

Let's add a few more routes to see the power of file-based routing:

### Static route

Create `routes/about.ts`:

```typescript
import type { Context } from 'hono'

export const GET = (c: Context) => {
  return c.json({ 
    page: 'About',
    description: 'This is the about page'
  })
}
```

Access at: `http://localhost:3000/about`

### Dynamic route

Create `routes/users/[id].ts`:

```typescript
import type { Context } from 'hono'

export const GET = (c: Context) => {
  const id = c.req.param('id')
  return c.json({ 
    userId: id,
    message: `User profile for ID: ${id}`
  })
}
```

Access at: `http://localhost:3000/users/123`

### Wildcard route

Create `routes/blog/[...slug].ts`:

```typescript
import type { Context } from 'hono'

export const GET = (c: Context) => {
  const slug = c.req.param('slug')
  return c.json({ 
    slug: slug,
    message: `Blog post: ${slug}`
  })
}
```

Access at: `http://localhost:3000/blog/2024/my-first-post`

## Project structure

Your project should now look like this:

```
my-hono-app/
├── routes/
│   ├── index.ts          # GET/POST /
│   ├── about.ts          # GET /about
│   ├── users/
│   │   └── [id].ts       # GET /users/:id
│   └── blog/
│       └── [...slug].ts  # GET /blog/*
├── index.ts              # Main application
└── package.json
```

## Next steps

Congratulations! You've successfully set up hono-filebased-route. Here's what you can explore next:

- [Basic Usage Guide](/guide/basic-usage) - Learn more about creating routes
- [Routing Patterns](/guide/routing-patterns) - Understand different routing patterns
- [Dynamic Routes](/guide/dynamic-routes) - Master dynamic and wildcard routes
- [API Reference](/reference/api) - Explore all available APIs

## Need help?

If you encounter any issues:

1. Check the [troubleshooting guide](/guide/advanced-features#troubleshooting)
2. Review the [examples](/reference/examples)
3. Open an issue on [GitHub](https://github.com/your-repo/hono-filebased-route)

Happy coding! 🚀