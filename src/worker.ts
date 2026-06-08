import type { Hono } from 'hono'
import type { AppEnv } from './auth/types'
import { withRequestDb } from './db'
import { setRuntimeEnv } from './runtime-env'

let app: Hono<AppEnv> | null = null

export default {
  async fetch(
    request: Request,
    env: Cloudflare.Env,
    ctx: ExecutionContext,
  ): Promise<Response> {
    setRuntimeEnv(env as unknown as Record<string, string | undefined>)
    return withRequestDb(async () => {
      if (!app) {
        const { createApp } = await import('./app')
        app = createApp()
      }
      return app.fetch(request, env, ctx)
    })
  },
}
