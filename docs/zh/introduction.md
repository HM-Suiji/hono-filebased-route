# Introduction

hono-filebased-route is a small set of utilities that turn a folder of route files into registered Hono routes.
It does not run a server or provide a CLI. You keep full control of your Hono app and choose one of the three
integration modes below.

## Packages

### @hono-filebased-route/core

- Scans a routes directory and generates `generated-routes.ts`.
- The generated file exports `registerGeneratedRoutes(app)`.
- Supports per-method middleware via an exported `config` object in route files.

### @hono-filebased-route/runtime

- Registers routes at runtime with dynamic imports.
- Only supports `GET` and `POST` handlers.
- Does not read the `config` middleware object.

### @hono-filebased-route/vite-plugin

- Generates routes during dev server startup and on file changes.
- Can emit a real file or expose a virtual module `virtual:generated-routes`.
- Writes a template when a new route file is created and empty.

## Routing Rules

Route paths are derived from file paths under your routes directory:

- `index.ts` -> `/`
- `users/index.ts` -> `/users`
- `[id].ts` -> `/:id`
- `[...slug].ts` -> `/*`

Only named exports like `export function GET()` or `export const POST = ...` are detected.

## What It Is Not

- Not a web server or framework (Hono provides that).
- No CLI or scaffold generator.
- No automatic OpenAPI or schema generation (examples may integrate third-party tools).

If you want a guided setup, start with the Quick Start page and pick the module that matches your workflow.
