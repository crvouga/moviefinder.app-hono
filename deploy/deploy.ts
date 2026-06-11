/**
 * Deterministic, idempotent deploy orchestrator.
 *
 * Promotes a pre-built container image to Fly.io (hosting www.moviefinder.app),
 * and configures Cloudflare DNS plus an apex -> www 301 redirect. DB migrations
 * run in CI before this script (see deployment-pipeline.yml). Secrets come
 * from the environment (inject via `vault run`).
 *
 * Flags:
 *   --plan              Print intended actions without mutating anything.
 *   --only=fly          Run only the Fly.io deploy steps.
 *   --only=cloudflare   Run only the Cloudflare DNS steps.
 *
 * Env:
 *   DEPLOY_IMAGE        Pushed OCI image ref (required for fly scope; built in CI).
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
  const scope: Scope =
    only === 'fly' || only === 'cloudflare' ? only : 'all'
  return { dryRun, scope }
}

async function runFly(): Promise<void> {
  const image = process.env.DEPLOY_IMAGE
  if (!image) {
    throw new Error(
      'DEPLOY_IMAGE is required (e.g. ghcr.io/crvouga/moviefinder.app-hono:latest)',
    )
  }
  fly.assertRegistryImage(image)
  await fly.ensureAppReady()
  await fly.setRuntimeSecrets(collectRuntimeSecrets())
  await fly.promoteImage(image)
}

async function main(): Promise<void> {
  const { dryRun, scope } = parseArgs(process.argv.slice(2))
  setDryRun(dryRun)
  validateDeployEnv()

  log('deploy', `starting (scope=${scope}${dryRun ? ', plan-only' : ''})`)

  if (scope === 'all' || scope === 'fly') {
    await runFly()
  }

  if (scope === 'all' || scope === 'cloudflare') {
    await cloudflare.configureDns()
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
