type EnvRecord = Record<string, string | undefined>

let current: EnvRecord =
  typeof process !== 'undefined' && process.env
    ? (process.env as EnvRecord)
    : {}

/** Merge per-request env overrides (e.g. test doubles) into the process environment. */
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
