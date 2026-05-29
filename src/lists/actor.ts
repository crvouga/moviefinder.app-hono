import type { Context } from 'hono'
import { getCookie, setCookie } from 'hono/cookie'
import type { AppEnv } from '../auth/types'

const ACTOR_COOKIE = 'mf_actor'
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365

/**
 * Resolve the acting identity for list commands. A signed-in Better Auth user
 * is authoritative; otherwise we mint and persist an opaque anonymous id in a
 * cookie so a visitor keeps a stable identity across requests.
 */
export function getActorId(c: Context<AppEnv>): string {
  const user = c.get('user')
  if (user?.id) return user.id

  const existing = getCookie(c, ACTOR_COOKIE)
  if (existing) return existing

  const actorId = `anon_${crypto.randomUUID()}`
  setCookie(c, ACTOR_COOKIE, actorId, {
    path: '/',
    httpOnly: true,
    sameSite: 'Lax',
    maxAge: ONE_YEAR_SECONDS,
  })
  return actorId
}
