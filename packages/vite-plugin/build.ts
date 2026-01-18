import { buildPackage } from '../../build'

await buildPackage({
  name: '@hono-filebased-route/vite-plugin',
  entry: './index.ts',
  outDir: './dist',
  external: ['typescript', 'pino', 'pino-pretty'],
})
