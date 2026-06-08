/**
 * Fail if application code references the Postgres `public` schema.
 * All database objects must live in moviefinder_app_hono (see src/db/schema.ts).
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = join(import.meta.dir, '..', 'src')
const ALLOWLIST = new Set(['src/db/schema.ts'])

const PATTERNS: { re: RegExp; label: string }[] = [
  { re: /\bpublic\s*\./i, label: 'qualified public.* reference' },
  {
    re: /search_path\s*=\s*[^;\n]*\bpublic\b/i,
    label: 'search_path includes public',
  },
  {
    re: /SET\s+search_path\s+TO\s+public\b/i,
    label: 'SET search_path TO public',
  },
  {
    re: /CREATE\s+SCHEMA\s+(IF\s+NOT\s+EXISTS\s+)?public\b/i,
    label: 'CREATE SCHEMA public',
  },
  {
    re: /table_schema\s*=\s*['"]public['"]/i,
    label: 'information_schema filter on public',
  },
]

function walk(dir: string, base = 'src'): string[] {
  const out: string[] = []
  for (const name of readdirSync(dir)) {
    const path = join(dir, name)
    const rel = `${base}/${name}`
    if (statSync(path).isDirectory()) {
      out.push(...walk(path, rel))
    } else if (name.endsWith('.ts') || name.endsWith('.tsx')) {
      out.push(rel)
    }
  }
  return out
}

const violations: string[] = []

for (const file of walk(ROOT)) {
  if (ALLOWLIST.has(file)) continue
  const content = readFileSync(join(ROOT, '..', file), 'utf8')
  for (const { re, label } of PATTERNS) {
    if (re.test(content)) {
      violations.push(`${file}: ${label}`)
    }
  }
}

if (violations.length > 0) {
  console.error('public schema references found (forbidden):\n')
  for (const v of violations) console.error(`  ${v}`)
  process.exit(1)
}

console.log('no public schema references OK')
