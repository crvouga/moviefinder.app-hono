import { Hono } from 'hono'
import { serveStatic } from 'hono/bun'
import { migrate } from './db/migrate'
import { auth } from './auth/auth'
import { authRoute } from './auth/route'
import type { AppEnv } from './auth/types'
import { searchRoute } from './search/route'
import { detailRoute } from './detail/route'
import { trendingRoute } from './trending/route'
import { listsRoute } from './lists/route'

migrate()

const app = new Hono<AppEnv>()

app.get('/health', (c) => c.text('ok'))

// Better Auth owns everything under /api/auth/* (sign-in, OTP, sessions, sign-out).
app.on(['POST', 'GET'], '/api/auth/*', (c) => auth.handler(c.req.raw))

app.use('/public/*', serveStatic({ root: './' }))

// Populate the current user on every page request (registered after the auth
// handler so it does not run for /api/auth/*).
app.use('*', async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers })
  c.set('user', session?.user ?? null)
  await next()
})

app.route('/', authRoute)
app.route('/', searchRoute)
app.route('/', detailRoute)
app.route('/', trendingRoute)
app.route('/', listsRoute)

export default {
  port: Number(process.env.PORT ?? 3000),
  fetch: app.fetch,
}
