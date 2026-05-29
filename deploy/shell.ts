import { $ } from 'bun'

let dryRun = false

export function setDryRun(value: boolean): void {
  dryRun = value
}

export function isDryRun(): boolean {
  return dryRun
}

export function log(step: string, message: string): void {
  console.log(`[${step}] ${message}`)
}

/**
 * Run a command that mutates state. In dry-run mode it is logged and skipped.
 * Throws on a non-zero exit code.
 */
export async function run(step: string, cmd: string[]): Promise<void> {
  log(step, cmd.join(' '))
  if (dryRun) {
    log(step, '(dry-run: skipped)')
    return
  }
  await $`${cmd}`
}

/**
 * Run a read-only command and capture stdout as text. Always executes, even in
 * dry-run mode, so state checks remain accurate. Throws on a non-zero exit code.
 */
export async function capture(cmd: string[]): Promise<string> {
  const result = await $`${cmd}`.quiet()
  return result.stdout.toString()
}

/**
 * Run a read-only command and parse stdout as JSON. Returns null if the command
 * fails (e.g. resource does not exist yet) or output is not valid JSON.
 */
export async function captureJson<T>(cmd: string[]): Promise<T | null> {
  try {
    const result = await $`${cmd}`.quiet().nothrow()
    if (result.exitCode !== 0) return null
    return JSON.parse(result.stdout.toString()) as T
  } catch {
    return null
  }
}
