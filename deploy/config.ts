/**
 * Static deployment configuration. Everything environment-specific comes from
 * Vault-injected env vars (see env.ts); this file holds only stable constants.
 */

export const APP_NAME = 'moviefinder'

/** Fly CLI binary (`flyctl` on CI; override with FLY_BIN=fly locally if needed). */
export const FLY_BIN = process.env.FLY_BIN ?? 'flyctl'

export const ZONE = 'moviefinder.app'
export const WWW_HOST = `www.${ZONE}`

export const PRIMARY_REGION = 'iad'

export const FLY_REGISTRY = 'registry.fly.io'
export const FLY_IMAGE = `${FLY_REGISTRY}/${APP_NAME}`

/** Fly persistent volume backing the SQLite database (matches fly.toml mount). */
export const FLY_VOLUME = 'data'
export const FLY_VOLUME_SIZE_GB = 1

/**
 * Whether the `www` record is proxied through Cloudflare (orange cloud). The
 * apex record is always proxied so the redirect rule can run on it.
 */
export const WWW_PROXIED = true

/** Placeholder IP for the proxied apex record (traffic never reaches it; the
 * redirect rule intercepts first). */
export const APEX_PLACEHOLDER_IP = '192.0.2.1'

/**
 * Runtime secrets (from the allowlist) that get pushed to Fly via
 * `fly secrets set`. Deploy-time tooling creds (FLY_API_TOKEN, CLOUDFLARE_*)
 * are intentionally excluded so they never reach the app.
 */
export const RUNTIME_SECRETS = [
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
