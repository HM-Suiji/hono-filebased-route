# Performance

This project keeps runtime overhead low by doing most work at startup or build time.

## Core

- Scans the file system once and writes a static `generated-routes.ts` file.
- Uses static imports in the generated file.

## Runtime

- Dynamically imports each route file during startup.
- Only registers `GET` and `POST` handlers.

## Vite Plugin

- Regenerates routes on file changes during dev server runs.
- In build workflows, prefer a generated file (disable `virtualRoute`).
