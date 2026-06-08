type EnvRecord = Record<string, string | undefined>

let current: EnvRecord =
  typeof process !== 'undefined' && process.env
    ? (process.env as EnvRecord)
    : {}

/** Workers pass bindings per request; Bun uses process.env at import time. */
export function setRuntimeEnv(env: EnvRecord): void {
  current = env
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
