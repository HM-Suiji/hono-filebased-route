import { Context } from 'hono'

export function GET(c: Context) {
	return c.text('This is the About Us page.')
}
