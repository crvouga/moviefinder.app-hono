import { serveStatic } from 'hono/bun'
import { migrate } from './db/migrate'
import { createApp } from './app'

await migrate()

const app = createApp()

app.get('/styles.css', serveStatic({ path: './public/styles.css' }))

export default {
  port: Number(process.env.PORT ?? 3000),
  fetch: app.fetch,
}
