import { Context } from 'hono'

export function GET(c: Context) {
	const fullPath = c.req.path
	const baseRoute = '/articles'
	const slug = fullPath.substring(baseRoute.length)

	return c.text(`Accessing article slug: ${slug || '/ (root of articles)'}`)
}
