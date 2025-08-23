import { getFiles, getRoutePath } from '@hono-filebased-route/core'
import path from 'path'
import { pathToFileURL } from 'url'
import { Hono } from 'hono'

const ROUTES_DIR = './src/routes'

export async function registerRoutes(
  mainApp: Hono,
  dir: string = ROUTES_DIR
) {
  const absoluteRoutesDir = path.resolve(dir)
  const files = await getFiles(absoluteRoutesDir)
  const methods = ['GET', 'POST'] as const
  type Method = 'get' | 'post'

  for (const file of files) {
    const routePath = getRoutePath(file, absoluteRoutesDir)
      .replace(/\\/g, '/')
      .replace(/\/index$/, '')

    const fileUrl = pathToFileURL(file).href
    const module = await import(fileUrl)
    const tempHono = new Hono()

    for (const method of methods) {
      if (typeof module[method] === 'function') {
        if (routePath.endsWith('/*')) {
          const len = routePath.replace(/\/\*$/g, '').length + 1
          tempHono[method.toLowerCase() as Method]('/', async (c) => module[method](c, c.req.path.substring(len).split('/')))
        } else
          tempHono[method.toLowerCase() as Method]('/', async (c) => module[method](c))
      }
    }

    mainApp.route(routePath, tempHono)
  }

  return mainApp
}
