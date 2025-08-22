import { Context } from 'hono'

export function GET(c: Context) {
	const id = c.req.param('id')
	return c.text(`Viewing user with ID: ${id}`)
}

export function DELETE(c: Context) {
	const id = c.req.param('id')
	return c.text(`Deleting user with ID: ${id}`)
}
