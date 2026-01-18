import { Hono } from 'hono'
import { registerGeneratedRoutes } from './generated-routes'
import { openAPIRouteHandler } from 'hono-openapi'

const app = new Hono()

// 调用生成的函数来注册所有路由
registerGeneratedRoutes(app)

app.get(
  '/openapi',
  openAPIRouteHandler(app, {
    documentation: {
      info: {
        title: 'Hono API',
        version: '1.0.0',
        description: 'Greeting API',
      },
      servers: [{ url: process.env.HOST || 'http://localhost:3000', description: 'Local Server' }],
    },
  })
)

// 处理未匹配的路由
app.notFound(c => {
  return c.text('404 Not Found!', 404)
})

// 处理错误
app.onError((err, c) => {
  console.error(`Route error: ${err}`)
  return c.text('Internal Server Error', 500)
})

// 启动服务器
const port = 3000
console.log(`Server is running on http://localhost:${port}`)

export default {
  port: port,
  fetch: app.fetch,
}
