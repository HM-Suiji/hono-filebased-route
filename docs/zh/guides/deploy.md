# Deploy

## Core

Generate routes before building or deploying:

```bash
bun run generate-routes
```

Then build and deploy your Hono app as usual.

## Runtime

No pre-generation step is required. Routes are registered at startup.

## Vite Plugin

- For production builds, use `virtualRoute: false` and commit or generate `generated-routes.ts` during build.
- The plugin only regenerates routes in dev server mode.
