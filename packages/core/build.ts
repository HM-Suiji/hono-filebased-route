import { buildPackage } from '../../build'

await buildPackage({
  name: '@hono-filebased-route/core',
  entry: './index.ts',
  outDir: './dist',
  external: ['typescript', 'pino', 'pino-pretty'],
})
