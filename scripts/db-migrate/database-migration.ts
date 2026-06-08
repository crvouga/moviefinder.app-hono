import type { Pool, PoolClient } from '@neondatabase/serverless'
import {
  APP_SCHEMA,
  SET_APP_SEARCH_PATH,
  assertAppScopedSql,
  qualify,
  quoteIdent,
} from '../../src/db/schema'

interface ColumnDef {
  name: string
  definition: string
}

interface IndexDef {
  name: string
  target: string
  unique: boolean
}

interface ViewDef {
  name: string
  select: string
}

const SNAPSHOT_TABLE = '_migration_snapshot'

type Db = Pool | PoolClient

async function runQuery(db: Db, sql: string, params: unknown[] = []) {
  assertAppScopedSql(sql)
  return db.query(sql, params)
}

/**
 * A flat, append-only, idempotent schema migration DSL for PostgreSQL.
 *
 * All objects are created in {@link APP_SCHEMA}. The public schema is never
 * used or referenced.
 */
export class DatabaseMigration {
  private readonly tableOrder: string[] = []
  private readonly columns = new Map<string, ColumnDef[]>()
  private readonly indexes: IndexDef[] = []
  private readonly views: ViewDef[] = []

  table(name: string): this {
    if (!this.tableOrder.includes(name)) {
      this.tableOrder.push(name)
      this.columns.set(name, [])
    }
    return this
  }

  col(table: string, name: string, definition: string): this {
    this.table(table)
    const cols = this.columns.get(table)!
    const existing = cols.find((c) => c.name === name)
    if (existing) {
      existing.definition = definition
    } else {
      cols.push({ name, definition })
    }
    return this
  }

  index(name: string, target: string, opts: { unique?: boolean } = {}): this {
    const existing = this.indexes.find((i) => i.name === name)
    if (existing) {
      existing.target = target
      existing.unique = opts.unique ?? false
    } else {
      this.indexes.push({ name, target, unique: opts.unique ?? false })
    }
    return this
  }

  view(name: string, select: string): this {
    const existing = this.views.find((v) => v.name === name)
    if (existing) {
      existing.select = select
    } else {
      this.views.push({ name, select })
    }
    return this
  }

  async run(db: Pool): Promise<void> {
    const client = await db.connect()
    try {
      await client.query(
        `CREATE SCHEMA IF NOT EXISTS ${quoteIdent(APP_SCHEMA)}`,
      )
      await client.query(SET_APP_SEARCH_PATH)

      await runQuery(
        client,
        `CREATE TABLE IF NOT EXISTS ${qualify(SNAPSHOT_TABLE)} (
        table_name   TEXT PRIMARY KEY,
        columns_json TEXT NOT NULL
      )`,
      )

      for (const table of this.tableOrder) {
        await this.reconcileTable(client, table)
      }

      for (const idx of this.indexes) {
        await runQuery(
          client,
          `DROP INDEX IF EXISTS ${quoteIdent(APP_SCHEMA)}.${quoteIdent(idx.name)}`,
        )
        await runQuery(
          client,
          `CREATE ${idx.unique ? 'UNIQUE ' : ''}INDEX ${quoteIdent(idx.name)} ON ${idx.target}`,
        )
      }

      for (const v of this.views) {
        await runQuery(client, `DROP VIEW IF EXISTS ${qualify(v.name)}`)
        await runQuery(client, `CREATE VIEW ${qualify(v.name)} AS ${v.select}`)
      }
    } finally {
      client.release()
    }
  }

  private formatColumn(c: ColumnDef): string {
    return `${quoteIdent(c.name)} ${c.definition}`
  }

  private async reconcileTable(db: Db, table: string): Promise<void> {
    const desired = this.columns.get(table) ?? []
    const { rows: info } = await runQuery(
      db,
      `SELECT column_name AS name
       FROM information_schema.columns
       WHERE table_schema = $1 AND table_name = $2
       ORDER BY ordinal_position`,
      [APP_SCHEMA, table],
    )
    const exists = info.length > 0

    if (!exists) {
      const defs = desired.map((c) => this.formatColumn(c)).join(', ')
      await runQuery(db, `CREATE TABLE ${qualify(table)} (${defs})`)
      await this.writeSnapshot(db, table, desired)
      return
    }

    const actualNames = new Set(info.map((c) => (c as { name: string }).name))
    const snapshot = await this.readSnapshot(db, table)

    const changed =
      snapshot !== null &&
      (desired.some(
        (c) => snapshot.has(c.name) && snapshot.get(c.name) !== c.definition,
      ) ||
        [...snapshot.keys()].some(
          (name) => !desired.some((c) => c.name === name),
        ))

    if (changed) {
      await this.rebuildTable(db, table, desired, actualNames)
    } else {
      const missing = desired.filter((c) => !actualNames.has(c.name))
      try {
        for (const c of missing) {
          await runQuery(
            db,
            `ALTER TABLE ${qualify(table)} ADD COLUMN ${this.formatColumn(c)}`,
          )
        }
      } catch {
        await this.rebuildTable(db, table, desired, actualNames)
      }
    }

    await this.writeSnapshot(db, table, desired)
  }

  private async rebuildTable(
    db: Db,
    table: string,
    desired: ColumnDef[],
    actualNames: Set<string>,
  ): Promise<void> {
    const tmp = `${table}__migrate_tmp`
    const defs = desired.map((c) => this.formatColumn(c)).join(', ')
    const shared = desired
      .filter((c) => actualNames.has(c.name))
      .map((c) => quoteIdent(c.name))

    await db.query('BEGIN')
    try {
      await db.query('SET session_replication_role = replica')
      await db.query(`DROP TABLE IF EXISTS ${qualify(tmp)}`)
      await db.query(`CREATE TABLE ${qualify(tmp)} (${defs})`)
      if (shared.length > 0) {
        const cols = shared.join(', ')
        await db.query(
          `INSERT INTO ${qualify(tmp)} (${cols}) SELECT ${cols} FROM ${qualify(table)}`,
        )
      }
      await db.query(`DROP TABLE ${qualify(table)}`)
      await db.query(
        `ALTER TABLE ${qualify(tmp)} RENAME TO ${quoteIdent(table)}`,
      )
      await db.query('SET session_replication_role = DEFAULT')
      await db.query('COMMIT')
    } catch (err) {
      await db.query('ROLLBACK')
      throw err
    }
  }

  private async readSnapshot(
    db: Db,
    table: string,
  ): Promise<Map<string, string> | null> {
    const { rows } = await runQuery(
      db,
      `SELECT columns_json FROM ${qualify(SNAPSHOT_TABLE)} WHERE table_name = $1`,
      [table],
    )
    const row = rows[0] as { columns_json: string } | undefined
    if (!row) return null
    const parsed = JSON.parse(row.columns_json) as ColumnDef[]
    return new Map(parsed.map((c) => [c.name, c.definition]))
  }

  private async writeSnapshot(
    db: Db,
    table: string,
    desired: ColumnDef[],
  ): Promise<void> {
    await runQuery(
      db,
      `INSERT INTO ${qualify(SNAPSHOT_TABLE)} (table_name, columns_json)
       VALUES ($1, $2)
       ON CONFLICT(table_name) DO UPDATE SET columns_json = EXCLUDED.columns_json`,
      [table, JSON.stringify(desired)],
    )
  }
}
