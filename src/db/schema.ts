/** Postgres schema for all app tables, views, and indexes. Never use `public`. */
export const APP_SCHEMA = 'moviefinder_app_hono' as const

export function quoteIdent(name: string): string {
  return `"${name.replace(/"/g, '""')}"`
}

/** Fully-qualified relation: "moviefinder_app_hono"."table" */
export function qualify(name: string): string {
  return `${quoteIdent(APP_SCHEMA)}.${quoteIdent(name)}`
}

export const SET_APP_SEARCH_PATH = `SET search_path TO ${quoteIdent(APP_SCHEMA)}`

/** Reject SQL that references or opens the public schema. */
export function assertAppScopedSql(sql: string): void {
  if (/\bpublic\s*\./i.test(sql)) {
    throw new Error('SQL must not reference the public schema')
  }
  if (/search_path\s*=\s*[^;]*\bpublic\b/i.test(sql)) {
    throw new Error('SQL must not include public in search_path')
  }
}
