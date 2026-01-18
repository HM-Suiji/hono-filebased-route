# Repository Guidelines

## Project Structure & Module Organization
- `packages/` contains the published modules: `core`, `runtime`, and `vite-plugin`. Each package keeps its source at the package root (for example `packages/core/index.ts`, `packages/core/utils/`, `packages/core/types/`).
- `examples/` holds runnable demos for Bun, runtime, and Vite plugin usage. Route files live under `examples/*/src/routes/`.
- `docs/` is the VitePress documentation site; `scripts/` contains repo utilities.
- `src/generated-routes.ts` files are auto-generated in examples; edit `src/routes/` instead.

## Build, Test, and Development Commands
- `bun run build`: Build all packages via Turborepo.
- `bun run dev`: Run all dev tasks in the monorepo (persistent).
- `bun run lint`: Lint with ESLint + Prettier.
- `bun run type-check`: TypeScript type checking.
- `bun run test`: Runs test tasks (currently no dedicated test suite).
- `bun run docs:dev`: Run docs locally with VitePress.
- `bun run test:bun`: Start the Bun example (`examples/bun`) for manual verification.

## Coding Style & Naming Conventions
- Indentation is 2 spaces; no semicolons; single quotes; 120-char line width (see `.prettierrc`).
- ESLint uses TypeScript ESLint + Prettier integration (`eslint.config.mts`).
- File-based routes follow Hono conventions in `src/routes/`: `index.ts` → `/`, `[id].ts` → `/:id`, `[...slug].ts` → `/*`.

## Testing Guidelines
- There are no committed test files yet; `turbo run test` is wired for future coverage.
- If adding tests, keep them close to packages (for example `packages/core/test/...`) and use clear names like `router.test.ts`.

## Commit & Pull Request Guidelines
- Commit history follows Conventional Commits (examples: `feat: ...`, `docs: ...`, `chore: ...`, `version: ...`).
- Include a short, focused PR description; link issues when relevant.
- For user-facing package changes, add a Changeset in `.changeset/` and ensure `bun run lint`/`bun run type-check` pass.

## Configuration Tips
- The workspace uses `bun@1.2.20` and Turborepo; prefer `bun install` and `bun run <script>`.
- For route changes, update `src/routes/` and re-run the generator where applicable (`bun run generate-routes` in the Bun example).
