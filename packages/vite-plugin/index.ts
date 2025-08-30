import type { Plugin } from 'vite'
import { createPluginName } from './shared/create'
import { generateRoutesFile, createLogger } from '@hono-filebased-route/core'
import path from 'path'
import { writeFile, readFile } from 'fs/promises'

interface Options {
  dir: string
  output: string
  verbose: boolean
  virtualRoute: boolean
  callback?: (router: string) => void
}

const useName = createPluginName(true)
const virtualFileId = 'virtual:generated-routes'

const newFileContent = `
import { Context } from 'hono'

export function GET(c: Context) {
	return c.text('')
}
`

const usePlugin = (options?: Partial<Options>): Plugin => {
  const {
    dir = './src/routes',
    virtualRoute = true,
    output = './src/generated-routes.ts',
    verbose = false,
    callback,
  } = options || {}
  let generated_route: string = ''
  const logger = createLogger(verbose)

  const generateRoutes = async () => {
    if (virtualRoute) {
      const router = await generateRoutesFile({
        dir,
        output: '',
        write: false,
        verbose,
        typescript: false,
      })
      generated_route = router
    } else {
      generateRoutesFile({
        dir,
        output,
        write: true,
        verbose,
      })
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
        if (!file.startsWith(path.resolve(dir))) return
        logger.info(`${event}, ${file}`)
        if (event === 'add') {
          const fileContent = (await readFile(file, 'utf-8')).trim()
          if (fileContent === '') return await writeFile(file, newFileContent.trimStart())
        }
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
