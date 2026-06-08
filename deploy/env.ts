import { REQUIRED_DEPLOY_ENV, RUNTIME_SECRETS } from './config'

export function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name} (provide it via Vault)`,
    )
  }
  return value
}

/** Validate that all deploy-time tooling credentials are present. */
export function validateDeployEnv(): void {
  const missing = REQUIRED_DEPLOY_ENV.filter((name) => !process.env[name])
  if (missing.length > 0) {
    throw new Error(
      `Missing required deploy env vars: ${missing.join(', ')}. Run via \`vault run\`.`,
    )
  }
}

/**
 * Build the map of runtime secrets (from the allowlist) that are present in the
 * environment. Missing entries are skipped with a warning rather than failing,
 * so optional integrations do not block a deploy.
 */
export function collectRuntimeSecrets(): Record<string, string> {
  const secrets: Record<string, string> = {}
  for (const name of RUNTIME_SECRETS) {
    const value = process.env[name]
    if (value) {
      secrets[name] = value
    } else {
      console.warn(`[env] runtime secret ${name} not set in Vault; skipping`)
    }
  }
  return secrets
}
