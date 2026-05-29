import { Hono } from 'hono'
import { LoginPage } from './login-page'
import type { AppEnv } from './types'

export const authRoute = new Hono<AppEnv>()

authRoute.get('/login', (c) => {
  // Already signed in: nothing to do here.
  if (c.get('user')) return c.redirect('/')
  return c.html(<LoginPage />)
})
