import type { AuthInstance } from './auth'

export type AuthSession = AuthInstance['$Infer']['Session']
export type AuthUser = AuthSession['user']

/** Hono environment: the session middleware populates `user` on every request. */
export type AppEnv = {
  Variables: {
    user: AuthUser | null
  }
}
