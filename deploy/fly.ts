import { $ } from 'bun'
import {
  APP_NAME,
  FLY_IMAGE,
  FLY_VOLUME,
  FLY_VOLUME_SIZE_GB,
  PRIMARY_REGION,
  WWW_HOST,
} from './config'
import { captureJson, isDryRun, log, run } from './shell'

const STEP = 'fly'

interface FlyIp {
  Address?: string
  address?: string
  Type?: string
  type?: string
}

/** Result of reading a certificate's required DNS validation records. */
export interface CertDns {
  /** Cert ownership / validation record name (host). */
  name?: string
  /** Record value/target. */
  value?: string
  /** Record type (CNAME or TXT), best-effort from the CLI output. */
  type?: 'CNAME' | 'TXT'
}

function flagApp(): string[] {
  return ['--app', APP_NAME]
}

export async function ensureApp(): Promise<void> {
  const existing = await captureJson<{ Name?: string }[]>(['fly', 'apps', 'list', '--json'])
  const found = existing?.some((a) => a.Name === APP_NAME)
  if (found) {
    log(STEP, `app ${APP_NAME} already exists`)
    return
  }
  await run(STEP, ['fly', 'apps', 'create', APP_NAME, '--org', 'personal'])
}

export async function ensureVolume(): Promise<void> {
  const volumes = await captureJson<{ name?: string }[]>([
    'fly',
    'volumes',
    'list',
    ...flagApp(),
    '--json',
  ])
  const found = volumes?.some((v) => v.name === FLY_VOLUME)
  if (found) {
    log(STEP, `volume ${FLY_VOLUME} already exists`)
    return
  }
  await run(STEP, [
    'fly',
    'volumes',
    'create',
    FLY_VOLUME,
    '--region',
    PRIMARY_REGION,
    '--size',
    String(FLY_VOLUME_SIZE_GB),
    '--yes',
    ...flagApp(),
  ])
}

/**
 * Re-push the GHCR image to Fly's registry (Fly cannot pull private GHCR
 * images directly). Returns the registry.fly.io reference to deploy.
 */
export async function pushImageToFlyRegistry(ghcrRepository: string, tag: string): Promise<string> {
  const ghcrImage = `ghcr.io/${ghcrRepository.toLowerCase()}:${tag}`
  const flyImage = `${FLY_IMAGE}:${tag}`

  await run(STEP, ['fly', 'auth', 'docker'])
  await run(STEP, ['docker', 'pull', ghcrImage])
  await run(STEP, ['docker', 'tag', ghcrImage, flyImage])
  await run(STEP, ['docker', 'push', flyImage])
  return flyImage
}

/** Stage runtime secrets so they apply on the next deploy. Fed via stdin so
 * values never appear in argv. */
export async function setRuntimeSecrets(secrets: Record<string, string>): Promise<void> {
  const names = Object.keys(secrets)
  if (names.length === 0) {
    log(STEP, 'no runtime secrets to set')
    return
  }
  log(STEP, `staging ${names.length} runtime secrets: ${names.join(', ')}`)
  if (isDryRun()) {
    log(STEP, '(dry-run: skipped)')
    return
  }
  const payload = names.map((name) => `${name}=${secrets[name]}`).join('\n')
  // Bun shell stdin redirection requires a Buffer/Blob, not a plain string.
  await $`fly secrets import --stage ${flagApp()} < ${Buffer.from(payload)}`
}

/** Deploy a prebuilt image, or build from the Dockerfile when no image is given. */
export async function deploy(flyImage: string | null): Promise<void> {
  if (flyImage) {
    await run(STEP, ['fly', 'deploy', '--image', flyImage, ...flagApp(), '--yes'])
  } else {
    await run(STEP, ['fly', 'deploy', '--remote-only', ...flagApp(), '--yes'])
  }
}

/** Ensure the app has a dedicated public IPv6 and return it. */
export async function ensureIpv6(): Promise<string | null> {
  const ips = await captureJson<FlyIp[]>(['fly', 'ips', 'list', ...flagApp(), '--json'])
  const existing = ips?.find((ip) => (ip.Type ?? ip.type) === 'v6')
  const existingAddr = existing?.Address ?? existing?.address
  if (existingAddr) {
    log(STEP, `dedicated IPv6 already allocated: ${existingAddr}`)
    return existingAddr
  }

  await run(STEP, ['fly', 'ips', 'allocate-v6', ...flagApp()])
  if (isDryRun()) return null

  const after = await captureJson<FlyIp[]>(['fly', 'ips', 'list', ...flagApp(), '--json'])
  const created = after?.find((ip) => (ip.Type ?? ip.type) === 'v6')
  return created?.Address ?? created?.address ?? null
}

export async function ensureCert(): Promise<void> {
  const certs = await captureJson<{ Hostname?: string; hostname?: string }[]>([
    'fly',
    'certs',
    'list',
    ...flagApp(),
    '--json',
  ])
  const found = certs?.some((c) => (c.Hostname ?? c.hostname) === WWW_HOST)
  if (found) {
    log(STEP, `certificate for ${WWW_HOST} already requested`)
    return
  }
  await run(STEP, ['fly', 'certs', 'add', WWW_HOST, ...flagApp()])
}

/**
 * Read the DNS validation record Fly requires for the www certificate.
 * The flyctl JSON shape varies across versions, so we scan known field names.
 */
export async function readCertDns(): Promise<CertDns> {
  if (isDryRun()) return {}
  const raw = await captureJson<Record<string, unknown>>([
    'fly',
    'certs',
    'show',
    WWW_HOST,
    ...flagApp(),
    '--json',
  ])
  if (!raw) {
    log(STEP, `could not read cert details for ${WWW_HOST}`)
    return {}
  }

  const get = (...keys: string[]): string | undefined => {
    for (const key of keys) {
      const v = raw[key]
      if (typeof v === 'string' && v.length > 0) return v
    }
    return undefined
  }

  const name = get('DNSValidationHostname', 'dns_validation_hostname', 'DNSValidationInstructions')
  const value = get('DNSValidationTarget', 'dns_validation_target')
  const type = value?.includes('.') && !value.includes(' ') ? 'CNAME' : 'TXT'

  if (name && value) {
    log(STEP, `cert validation record: ${name} ${type} -> ${value}`)
  } else {
    log(STEP, `no DNS validation record reported (cert may already be issued)`)
  }
  return { name, value, type }
}
