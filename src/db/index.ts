import { AsyncLocalStorage } from 'node:async_hooks'
import {
  Pool,
  neonConfig,
  type PoolClient,
} from '@neondatabase/serverless'
import { PostgresDialect } from 'kysely'
import {
  APP_SCHEMA,
  SET_APP_SEARCH_PATH,
  assertAppScopedSql,
} from './schema'
import { requireRuntimeEnv } from '../runtime-env'

neonConfig.webSocketConstructor = WebSocket

interface RequestDb {
  pool: Pool
}

const requestDb = new AsyncLocalStorage<RequestDb>()

function wrapPool(pool: Pool): Pool {
  return new Proxy(pool, {
    get(target, prop, receiver) {
      if (prop === 'query') {
        return async (text: string, params?: unknown[]) => {
          assertAppScopedSql(text)
          const client = await target.connect()
          try {
            await client.query(SET_APP_SEARCH_PATH)
            return client.query(text, params)
          } finally {
            client.release()
          }
        }
      }
      if (prop === 'connect') {
        return async () => {
          const client = await target.connect()
          await client.query(SET_APP_SEARCH_PATH)
          return client
        }
      }
      return Reflect.get(target, prop, receiver)
    },
  }) as Pool
}

function getRequestPool(): Pool {
  const store = requestDb.getStore()
  if (!store) {
    throw new Error('Database used outside an active request')
  }
  return store.pool
}

/**
 * Run handler code with a Pool scoped to this Worker request. WebSocket
 * connections must not be shared across requests on Cloudflare Workers.
 */
export async function withRequestDb<T>(fn: () => Promise<T>): Promise<T> {
  const basePool = new Pool({
    connectionString: requireRuntimeEnv('DATABASE_URL'),
  })
  const pool = wrapPool(basePool)
  try {
    return await requestDb.run({ pool }, fn)
  } finally {
    await basePool.end()
  }
}

/** Kysely dialect for Better Auth (explicit type avoids adapter auto-detection on Proxies). */
export function createAuthDatabase() {
  return {
    dialect: new PostgresDialect({ pool }),
    type: 'postgres' as const,
  }
}

/** App-scoped pool: every connection uses search_path = moviefinder_app_hono only. */
export const pool = new Proxy({} as Pool, {
  get(_target, prop, receiver) {
    const p = getRequestPool()
    const value = Reflect.get(p, prop, receiver)
    return typeof value === 'function'
      ? (value as (...args: unknown[]) => unknown).bind(p)
      : value
  },
  has(_target, prop) {
    return prop in getRequestPool()
  },
})

export async function query<T>(
  sql: string,
  params: unknown[] = [],
): Promise<T[]> {
  assertAppScopedSql(sql)
  const { rows } = await pool.query(sql, params)
  return rows as T[]
}

export async function queryOne<T>(
  sql: string,
  params: unknown[] = [],
): Promise<T | null> {
  const rows = await query<T>(sql, params)
  return rows[0] ?? null
}

export async function execute(
  sql: string,
  params: unknown[] = [],
): Promise<void> {
  assertAppScopedSql(sql)
  await pool.query(sql, params)
}

export async function withTransaction<T>(
  fn: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const result = await fn(client)
    await client.query('COMMIT')
    return result
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

/** Run SQL on an open client; enforces app-schema-only policy. */
export async function clientQuery(
  client: PoolClient,
  sql: string,
  params: unknown[] = [],
) {
  assertAppScopedSql(sql)
  return client.query(sql, params)
}

export { APP_SCHEMA }
