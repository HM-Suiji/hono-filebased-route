# Routing Patterns

Routes are derived from file paths under the routes directory.

| File Path | Route Path | Notes |
| --- | --- | --- |
| `src/routes/index.ts` | `/` | Root index |
| `src/routes/about.ts` | `/about` | Static route |
| `src/routes/users/index.ts` | `/users` | Nested index |
| `src/routes/users/[id].ts` | `/users/:id` | Dynamic parameter |
| `src/routes/articles/[...slug].ts` | `/articles/*` | Catch-all |

## Nested Routes

```
src/routes/api/users/index.ts  -> /api/users
src/routes/api/users/[id].ts   -> /api/users/:id
```

## Index Rules

- `index.ts` becomes `/`
- `folder/index.ts` becomes `/folder`
