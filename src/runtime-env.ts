type EnvRecord = Record<string, string | undefined>

let current: EnvRecord =
  typeof process !== 'undefined' && process.env
    ? (process.env as EnvRecord)
    : {}

/** Workers pass bindings per request; merge so .dev.vars / secrets are not wiped by ASSETS. */
export function setRuntimeEnv(env: EnvRecord): void {
  const merged: EnvRecord = { ...current }
  for (const [key, value] of Object.entries(env)) {
    if (typeof value === 'string') merged[key] = value
  }
  current = merged
}

export function getRuntimeEnv(name: string): string | undefined {
  return current[name]
}

export function requireRuntimeEnv(name: string): string {
  const value = current[name]
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name} (provide it via Vault)`,
    )
  }
  return value
}
