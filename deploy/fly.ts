import { mkdir, writeFile, rm, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { FLY_APP } from './config'
import { isDryRun, log, run } from './shell'

const STEP = 'fly'
const FLYCTL_BIN = process.env.FLYCTL_BIN ?? 'flyctl'

function flyCmd(...args: string[]): string[] {
  return [FLYCTL_BIN, ...args]
}

/** Build CSS and other assets before deploying the container. */
export async function buildAssets(): Promise<void> {
  await run(STEP, ['bun', 'run', 'build'])
}

/**
 * Upload runtime secrets to Fly. Values are written to a temp file and imported
 * via stdin so they never appear in argv.
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
  const file = join(dir, 'secrets.env')
  const lines = names.map((name) => `${name}=${secrets[name]}`)
  await writeFile(file, `${lines.join('\n')}\n`)
  try {
    const content = await readFile(file, 'utf8')
    log(STEP, `${FLYCTL_BIN} secrets import -a ${FLY_APP}`)
    if (!isDryRun()) {
      const proc = Bun.spawn([FLYCTL_BIN, 'secrets', 'import', '-a', FLY_APP], {
        stdin: Buffer.from(content),
      })
      const exitCode = await proc.exited
      if (exitCode !== 0) {
        throw new Error(`${FLYCTL_BIN} secrets import exited with code ${exitCode}`)
      }
    }
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
}

/** Deploy a pre-built image to Fly.io. */
export async function deploy(image: string): Promise<void> {
  await run(STEP, [
    ...flyCmd(
      'deploy',
      '--image',
      image,
      '-a',
      FLY_APP,
      '--strategy',
      'immediate',
    ),
  ])
}
