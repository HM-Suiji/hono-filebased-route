import { buildPackage } from '../../build'

await buildPackage({
  name: '@hono-filebased-route/runtime',
  entry: './index.ts',
  outDir: './dist',
})
