import { Hono } from 'hono'
import { registerGeneratedRoutes } from './generated-routes'

const app = new Hono()

// 调用生成的函数来注册所有路由
registerGeneratedRoutes(app)

// 处理未匹配的路由
app.notFound(c => {
  return c.text('404 Not Found!', 404)
})

// 处理错误
app.onError((err, c) => {
  console.error(`Route error: ${err}`)
  return c.text('Internal Server Error', 500)
})

export default app
