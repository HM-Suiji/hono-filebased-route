import type { Plugin } from 'vite'
import { createPluginName } from './shared/create'
import { generateRoutesFile } from '@hono-filebased-route/core'

interface Options {
  routesDir: string
  virtualRoute: boolean
  outputFile: string
  callback: (router: string) => void
}

const useName = createPluginName(true)

const usePlugin = (options?: Partial<Options>): Plugin => {
  const {
    routesDir = './src/routes',
    virtualRoute = true,
    outputFile = './src/generated-routes.ts',
    callback,
  } = options || {}
  const virtualFileId = 'generated-routes'
  let generated_route: string = ''

  const generateRoutes = async () => {
    if (virtualRoute) {
      const router = await generateRoutesFile(routesDir, '', false)
      generated_route = router
    } else {
      generateRoutesFile(routesDir, outputFile)
    }
    callback?.(generated_route)
  }

  return {
    name: useName('hono-router'),
    enforce: 'pre',
    async configureServer(server) {
      const events = ['add', 'change', 'unlink']
      await generateRoutes()

      server.watcher.on('all', async (event, file) => {
        if (events.includes(event)) {
          await generateRoutes()
          server.restart()
        }
      })
    },
    resolveId: virtualRoute
      ? id => {
          if (id === virtualFileId) {
            return virtualFileId
          }
        }
      : undefined,
    load: virtualRoute
      ? id => {
          if (id === virtualFileId) {
            return generated_route
          }
        }
      : undefined,
  }
}

export default usePlugin
