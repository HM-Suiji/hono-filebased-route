# Best Practices

- Keep route files focused on a single path; move shared logic to helpers.
- Use `index.ts` for collection roots (`/users`, `/posts`).
- In core generation, remember that files without `GET` or `POST` are skipped.
- Ignore non-route files by passing `externals` to `generateRoutesFile`.
- Keep catch-all handlers explicit about the second `slug` argument.
