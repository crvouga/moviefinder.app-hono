import type { Hono } from 'hono'
import type { AppEnv } from './auth/types'
import { withRequestDb } from './db'

let app: Hono<AppEnv> | null = null

async function handleRequest(request: Request): Promise<Response> {
  return withRequestDb(async () => {
    if (!app) {
      const { createApp } = await import('./app')
      app = createApp()
    }
    return app.fetch(request)
  })
}

const port = Number(process.env.PORT ?? 8080)

const server = Bun.serve({
  hostname: '0.0.0.0',
  port,
  fetch: handleRequest,
})

console.log(`[server] listening on ${server.hostname}:${server.port}`)
