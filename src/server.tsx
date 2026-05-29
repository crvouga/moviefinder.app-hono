import { Hono } from 'hono'
import { serveStatic } from 'hono/bun'
import { migrate } from './db/migrate'
import { searchRoute } from './search/route'
import { detailRoute } from './detail/route'
import { trendingRoute } from './trending/route'

migrate()

const app = new Hono()

app.get('/health', (c) => c.text('ok'))
app.use('/public/*', serveStatic({ root: './' }))

app.route('/', searchRoute)
app.route('/', detailRoute)
app.route('/', trendingRoute)

export default {
  port: Number(process.env.PORT ?? 3000),
  fetch: app.fetch,
}
