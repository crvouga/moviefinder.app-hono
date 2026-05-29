/**
 * Enforces lowercase kebab-case names for every path segment and file stem
 * under src/, deploy/, and scripts/.
 */
import { existsSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const ROOT = join(import.meta.dir, '..')
const SCAN_ROOTS = ['src', 'deploy', 'scripts', '.github'] as const
const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/

function isKebabCase(name: string): boolean {
  return KEBAB.test(name)
}

function checkSegment(segment: string, kind: 'directory' | 'file', relPath: string): string | null {
  if (!isKebabCase(segment)) {
    return `${relPath}: ${kind} "${segment}" must be lowercase kebab-case (a-z, 0-9, hyphens)`
  }
  return null
}

function walk(dir: string, errors: string[]): void {
  for (const entry of readdirSync(dir)) {
    if (entry.startsWith('.')) continue

    const abs = join(dir, entry)
    const rel = relative(ROOT, abs)

    if (statSync(abs).isDirectory()) {
      const err = checkSegment(entry, 'directory', rel)
      if (err) errors.push(err)
      walk(abs, errors)
      continue
    }

    const dot = entry.lastIndexOf('.')
    const stem = dot === -1 ? entry : entry.slice(0, dot)
    const err = checkSegment(stem, 'file', rel)
    if (err) errors.push(err)
  }
}

const errors: string[] = []

for (const root of SCAN_ROOTS) {
  const abs = join(ROOT, root)
  if (!existsSync(abs)) continue
  walk(abs, errors)
}

if (errors.length > 0) {
  console.error('Filename check failed:\n')
  for (const e of errors) console.error(`  - ${e}`)
  process.exit(1)
}

console.log(`kebab-case OK (${SCAN_ROOTS.join(', ')})`)
