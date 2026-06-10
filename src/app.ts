import { Hono } from 'hono'
import { serveStatic } from 'hono/bun'
import { getAuth } from './auth/auth'
import { authRoute } from './auth/route'
import type { AppEnv } from './auth/types'
import { searchRoute } from './search/route'
import { detailRoute } from './detail/route'
import { trendingRoute } from './trending/route'
import { listsRoute } from './lists/route'

export function createApp(): Hono<AppEnv> {
  const app = new Hono<AppEnv>()

  app.get('/health', (c) => c.text('ok'))

  app.use('/styles.css', serveStatic({ root: './public' }))
  app.use('/client.js', serveStatic({ root: './public' }))

  // Better Auth owns everything under /api/auth/* (sign-in, OTP, sessions, sign-out).
  app.on(['POST', 'GET'], '/api/auth/*', (c) => getAuth().handler(c.req.raw))

  // Populate the current user on every page request (registered after the auth
  // handler so it does not run for /api/auth/*).
  app.use('*', async (c, next) => {
    const session = await getAuth().api.getSession({
      headers: c.req.raw.headers,
    })
    c.set('user', session?.user ?? null)
    await next()
  })

  app.route('/', authRoute)
  app.route('/', searchRoute)
  app.route('/', detailRoute)
  app.route('/', trendingRoute)
  app.route('/', listsRoute)

  return app
}
