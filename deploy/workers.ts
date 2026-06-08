import { mkdir, writeFile, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { APP_NAME } from './config'
import { isDryRun, log, run } from './shell'

const STEP = 'workers'
const WRANGLER_BIN = process.env.WRANGLER_BIN ?? 'wrangler'

function wranglerCmd(...args: string[]): string[] {
  return [WRANGLER_BIN, ...args]
}

/** Build CSS and other assets before bundling the Worker. */
export async function buildAssets(): Promise<void> {
  await run(STEP, ['bun', 'run', 'build'])
}

/**
 * Upload runtime secrets to the Worker. Values are written to a temp JSON file
 * so they never appear in argv.
 */
export async function setRuntimeSecrets(
  secrets: Record<string, string>,
): Promise<void> {
  const names = Object.keys(secrets)
  if (names.length === 0) {
    log(STEP, 'no runtime secrets to set')
    return
  }
  log(STEP, `uploading ${names.length} runtime secrets: ${names.join(', ')}`)
  if (isDryRun()) {
    log(STEP, '(dry-run: skipped)')
    return
  }

  const dir = join(tmpdir(), `moviefinder-secrets-${Date.now()}`)
  await mkdir(dir, { recursive: true })
  const file = join(dir, 'secrets.json')
  await writeFile(file, JSON.stringify(secrets))
  try {
    await run(STEP, wranglerCmd('secret', 'bulk', file, '--name', APP_NAME))
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
}

/** Bundle and deploy the Worker to Cloudflare. */
export async function deploy(): Promise<void> {
  await run(STEP, wranglerCmd('deploy', '--name', APP_NAME))
}
