/**
 * Write `.dev.vars` from the current process environment (inject via `vault run`).
 * Wrangler local dev reads secrets from that file; shell env is not passed through.
 */
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { RUNTIME_SECRETS } from '../deploy/config'

const LOCAL_DEV_URL = 'http://localhost:8787'
const OUT = join(import.meta.dir, '..', '.dev.vars')

const REQUIRED = ['DATABASE_URL', 'BETTER_AUTH_SECRET'] as const

function formatDevVar(name: string, value: string): string {
  if (/[\n"\\]/.test(value)) {
    return `${name}=${JSON.stringify(value)}`
  }
  return `${name}=${value}`
}

const missing = REQUIRED.filter((name) => !process.env[name])
if (missing.length > 0) {
  throw new Error(
    `Missing ${missing.join(', ')}. Start dev with \`bun run dev\` (wraps vault run).`,
  )
}

const lines: string[] = []
for (const name of RUNTIME_SECRETS) {
  const value = process.env[name]
  if (value) lines.push(formatDevVar(name, value))
}

if (!process.env.BETTER_AUTH_URL) {
  lines.push(formatDevVar('BETTER_AUTH_URL', LOCAL_DEV_URL))
}

writeFileSync(OUT, `${lines.join('\n')}\n`)
console.log(`[dev-vars] wrote ${OUT} (${lines.length} vars from Vault)`)
