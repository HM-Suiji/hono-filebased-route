import devServer from '@hono/vite-dev-server'
import { defineConfig } from 'vite'
import build from '@hono/vite-build/node'
import honoRouter from '@hono-filebased-route/vite-plugin'

export default defineConfig({
  plugins: [
    honoRouter({
      virtualRoute: false,
      verbose: true,
    }),
    build(),
    devServer({
      entry: 'src/index.ts',
    }),
  ],
})
