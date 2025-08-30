import { Context } from 'hono'

export function GET(c: Context, slug: string[]) {
  console.log(slug)
  return c.text(`Accessing article slug: ${slug || '/ (root of articles)'}`)
}
