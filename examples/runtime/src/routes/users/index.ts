import { Context } from 'hono'

export function GET(c: Context) {
	return c.json(
		[
			{ id: 1, name: 'Alice' },
			{ id: 2, name: 'Bob' },
		],
		200
	)
}
