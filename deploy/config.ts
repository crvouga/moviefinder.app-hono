/**
 * Static deployment configuration. Everything environment-specific comes from
 * Vault-injected env vars (see env.ts); this file holds only stable constants.
 */

export const APP_NAME = 'moviefinder'

export const FLY_PREFIX = 'chrisvouga-'
export const FLY_APP = `${FLY_PREFIX}${APP_NAME}`
export const FLY_HOSTNAME = `${FLY_APP}.fly.dev`
/** Matches `primary_region` in fly.toml (used when provisioning a new app). */
export const FLY_REGION = 'iad'

export const ZONE = 'moviefinder.app'
export const WWW_HOST = `www.${ZONE}`

/**
 * Whether the `www` record is proxied through Cloudflare (orange cloud). The
 * apex record is always proxied so the redirect rule can run on it.
 */
export const WWW_PROXIED = true

/** Placeholder IP for the proxied apex record (traffic never reaches it; the
 * redirect rule intercepts first). */
export const APEX_PLACEHOLDER_IP = '192.0.2.1'

/**
 * Runtime secrets (from the allowlist) pushed to Fly via `fly secrets import`.
 * Deploy-time tooling creds are intentionally excluded so they never reach the app.
 */
export const RUNTIME_SECRETS = [
  'DATABASE_URL',
  'TMDB_API_READ_ACCESS_TOKEN',
  'OPENAI_API_KEY',
  'OPENAI_PROJECT_ID',
  'TWILIO_ACCOUNT_SID',
  'TWILIO_AUTH_TOKEN',
  'TWILIO_SERVICE_SID',
  'BETTER_AUTH_SECRET',
  'BETTER_AUTH_URL',
] as const

/** Env vars required by the deploy tooling itself (validated up front). */
export const REQUIRED_DEPLOY_ENV = [
  'FLY_API_TOKEN',
  'CLOUDFLARE_API_TOKEN',
  'CLOUDFLARE_ACCOUNT_ID',
] as const
