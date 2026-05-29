/**
 * Deterministic, idempotent deploy orchestrator.
 *
 * Ships the GHCR image to Fly.io (hosting www.moviefinder.app) and configures
 * Cloudflare DNS plus an apex -> www 301 redirect. All secrets come from the
 * environment (inject via `doppler run`).
 *
 * Flags:
 *   --plan          Print intended actions without mutating anything.
 *   --only=fly       Run only the Fly.io steps.
 *   --only=cloudflare Run only the Cloudflare steps.
 */
import { collectRuntimeSecrets, validateDeployEnv } from './env'
import * as cloudflare from './cloudflare'
import * as fly from './fly'
import { log, setDryRun } from './shell'

type Scope = 'all' | 'fly' | 'cloudflare'

function parseArgs(argv: string[]): { dryRun: boolean; scope: Scope } {
  const dryRun = argv.includes('--plan') || argv.includes('--dry-run')
  const onlyArg = argv.find((a) => a.startsWith('--only='))
  const only = onlyArg?.split('=')[1]
  const scope: Scope = only === 'fly' || only === 'cloudflare' ? only : 'all'
  return { dryRun, scope }
}

async function runFly(): Promise<{ ipv6: string | null; cert: fly.CertDns }> {
  const ghcrRepository = process.env.GHCR_REPOSITORY
  const imageTag = process.env.IMAGE_TAG

  await fly.ensureApp()
  await fly.ensureVolume()

  let flyImage: string | null = null
  if (ghcrRepository && imageTag) {
    flyImage = await fly.pushImageToFlyRegistry(ghcrRepository, imageTag)
  } else {
    log(
      'deploy',
      'GHCR_REPOSITORY/IMAGE_TAG not set; deploying by building from Dockerfile',
    )
  }

  await fly.setRuntimeSecrets(collectRuntimeSecrets())
  await fly.deploy(flyImage)

  const ipv6 = await fly.ensureIpv6()
  await fly.ensureCert()
  const cert = await fly.readCertDns()
  return { ipv6, cert }
}

async function main(): Promise<void> {
  const { dryRun, scope } = parseArgs(process.argv.slice(2))
  setDryRun(dryRun)
  validateDeployEnv()

  log('deploy', `starting (scope=${scope}${dryRun ? ', plan-only' : ''})`)

  let ipv6: string | null = null
  let cert: fly.CertDns = {}

  if (scope === 'all' || scope === 'fly') {
    const result = await runFly()
    ipv6 = result.ipv6
    cert = result.cert
  }

  if (scope === 'all' || scope === 'cloudflare') {
    await cloudflare.configureDns(ipv6, cert)
    await cloudflare.upsertRedirectRule()
  }

  log('deploy', 'done')
}

main().catch((err) => {
  console.error(
    `[deploy] failed: ${err instanceof Error ? err.message : String(err)}`,
  )
  process.exit(1)
})
