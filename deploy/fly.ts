import { mkdir, writeFile, rm, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import {
  CONTAINER_IMAGE_REPO,
  FLY_APP,
  FLY_REGION,
  WWW_HOST,
} from './config'
import { captureJson, isDryRun, log, run } from './shell'

const STEP = 'fly'
const FLYCTL_BIN = process.env.FLYCTL_BIN ?? 'flyctl'
const FLY_CONFIG = join(import.meta.dir, '..', 'fly.toml')

function flyCmd(...args: string[]): string[] {
  return [FLYCTL_BIN, ...args]
}

function certHostname(entry: Record<string, unknown>): string | undefined {
  const value = entry.Hostname ?? entry.hostname
  return typeof value === 'string' ? value : undefined
}

/** Require a fully-qualified image ref that was built and pushed out-of-band. */
export function assertRegistryImage(image: string): void {
  const tagRef = `${CONTAINER_IMAGE_REPO}:`
  const digestRef = `${CONTAINER_IMAGE_REPO}@`
  if (!image.startsWith(tagRef) && !image.startsWith(digestRef)) {
    throw new Error(
      `DEPLOY_IMAGE must reference ${CONTAINER_IMAGE_REPO} by tag or digest (got ${image})`,
    )
  }
}

/** Create the Fly app if it does not exist yet (idempotent). */
export async function ensureApp(): Promise<void> {
  const existing = await captureJson<Record<string, unknown>>(
    flyCmd('apps', 'show', FLY_APP, '--json'),
  )
  if (existing) {
    log(STEP, `app ${FLY_APP} exists`)
    return
  }

  log(STEP, `create app ${FLY_APP}`)
  if (isDryRun()) {
    log(STEP, '(dry-run: skipped)')
    return
  }

  const createArgs = flyCmd('apps', 'create', FLY_APP, '--yes')
  const org = process.env.FLY_ORG
  if (org) createArgs.push('-o', org)
  await run(STEP, createArgs)
}

/** Request a TLS certificate for the custom hostname if missing (idempotent). */
export async function ensureCertificate(hostname: string): Promise<void> {
  const certs =
    (await captureJson<Record<string, unknown>[]>(
      flyCmd('certs', 'list', '-a', FLY_APP, '--json'),
    )) ?? []

  if (certs.some((entry) => certHostname(entry) === hostname)) {
    log(STEP, `certificate for ${hostname} exists`)
    return
  }

  log(STEP, `add certificate for ${hostname}`)
  if (isDryRun()) {
    log(STEP, '(dry-run: skipped)')
    return
  }
  await run(STEP, flyCmd('certs', 'add', hostname, '-a', FLY_APP))
}

/** Ensure Fly app and TLS cert exist before secrets or image promotion. */
export async function ensureAppReady(): Promise<void> {
  await ensureApp()
  await ensureCertificate(WWW_HOST)
}

/**
 * Upload runtime secrets to Fly. Values are written to a temp file and imported
 * via stdin so they never appear in argv. Uses --stage so secrets are not
 * deployed until the registry image is promoted.
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
    log(STEP, `${FLYCTL_BIN} secrets import --stage -a ${FLY_APP}`)
    const proc = Bun.spawn(
      [FLYCTL_BIN, 'secrets', 'import', '--stage', '-a', FLY_APP],
      { stdin: Buffer.from(content) },
    )
    const exitCode = await proc.exited
    if (exitCode !== 0) {
      throw new Error(`${FLYCTL_BIN} secrets import exited with code ${exitCode}`)
    }
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
}

/**
 * Promote a pre-built registry image to Fly Machines. Does not build locally or
 * on Fly — the image must already exist in the registry (CI builds and pushes).
 */
export async function promoteImage(image: string): Promise<void> {
  assertRegistryImage(image)
  log(STEP, `promote registry image ${image}`)
  await run(STEP, [
    ...flyCmd(
      'deploy',
      '--config',
      FLY_CONFIG,
      '--image',
      image,
      '-a',
      FLY_APP,
      '--primary-region',
      FLY_REGION,
      '--strategy',
      'immediate',
    ),
  ])
}
