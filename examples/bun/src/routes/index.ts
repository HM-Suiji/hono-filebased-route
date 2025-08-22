import { Context } from 'hono'

export function GET(c: Context) {
  return c.html(`
    <h1>Welcome to Hono File-Based Routing!</h1>
    <p>Using Hono + Next.js Route Handlers + Generated Routes</p>
    <ul>
      <li><a href="/about">About Us</a></li>
      <li><a href="/users">List Users</a></li>
      <li><a href="/users/123">User 123</a></li>
      <li><a href="/articles/something/else">Article Slug</a></li>
    </ul>
  `)
}

export function POST(c: Context) {
  return c.text('POST request to root received!')
}
