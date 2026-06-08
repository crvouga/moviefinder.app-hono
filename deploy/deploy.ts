/**
 * Deterministic, idempotent deploy orchestrator.
 *
 * Builds assets, runs DB migrations, deploys to Cloudflare Workers (hosting
 * www.moviefinder.app), and configures Cloudflare DNS plus an apex -> www 301
 * redirect. All secrets come from the environment (inject via `vault run`).
 *
 * Flags:
 *   --plan              Print intended actions without mutating anything.
 *   --only=worker       Run only the Workers deploy steps.
 *   --only=cloudflare   Run only the Cloudflare DNS steps.
 */
import { collectRuntimeSecrets, validateDeployEnv } from './env'
import * as cloudflare from './cloudflare'
import * as workers from './workers'
import { log, setDryRun } from './shell'

type Scope = 'all' | 'worker' | 'cloudflare'

function parseArgs(argv: string[]): { dryRun: boolean; scope: Scope } {
  const dryRun = argv.includes('--plan') || argv.includes('--dry-run')
  const onlyArg = argv.find((a) => a.startsWith('--only='))
  const only = onlyArg?.split('=')[1]
  const scope: Scope =
    only === 'worker' || only === 'cloudflare' ? only : 'all'
  return { dryRun, scope }
}

async function runWorker(): Promise<void> {
  await workers.buildAssets()
  await workers.runMigrations()
  await workers.setRuntimeSecrets(collectRuntimeSecrets())
  await workers.deploy()
}

async function main(): Promise<void> {
  const { dryRun, scope } = parseArgs(process.argv.slice(2))
  setDryRun(dryRun)
  validateDeployEnv()

  log('deploy', `starting (scope=${scope}${dryRun ? ', plan-only' : ''})`)

  if (scope === 'all' || scope === 'worker') {
    await runWorker()
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
