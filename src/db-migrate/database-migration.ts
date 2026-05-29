import type { Database } from 'bun:sqlite'

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

/**
 * A flat, append-only, idempotent schema migration DSL.
 *
 * Declarations are collected in order. Re-declaring a column overwrites its
 * definition (last write wins) while keeping its original position. Calling
 * `run` reconciles the live database to the declared schema: missing columns
 * are added, changed column definitions trigger a SQLite table rebuild, and
 * indexes/views are dropped and recreated.
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

  run(db: Database): void {
    db.run('PRAGMA journal_mode = WAL')
    db.run('PRAGMA foreign_keys = ON')
    db.run('PRAGMA synchronous = NORMAL')

    db.run(
      `CREATE TABLE IF NOT EXISTS ${SNAPSHOT_TABLE} (
        table_name   TEXT PRIMARY KEY,
        columns_json TEXT NOT NULL
      )`,
    )

    for (const table of this.tableOrder) {
      this.reconcileTable(db, table)
    }

    for (const idx of this.indexes) {
      db.run(`DROP INDEX IF EXISTS ${idx.name}`)
      db.run(
        `CREATE ${idx.unique ? 'UNIQUE ' : ''}INDEX ${idx.name} ON ${idx.target}`,
      )
    }

    for (const v of this.views) {
      db.run(`DROP VIEW IF EXISTS ${v.name}`)
      db.run(`CREATE VIEW ${v.name} AS ${v.select}`)
    }
  }

  private reconcileTable(db: Database, table: string): void {
    const desired = this.columns.get(table) ?? []
    const info = db.query(`PRAGMA table_info(${table})`).all() as {
      name: string
    }[]
    const exists = info.length > 0

    if (!exists) {
      const defs = desired.map((c) => `${c.name} ${c.definition}`).join(', ')
      db.run(`CREATE TABLE ${table} (${defs})`)
      this.writeSnapshot(db, table, desired)
      return
    }

    const actualNames = new Set(info.map((c) => c.name))
    const snapshot = this.readSnapshot(db, table)

    const changed =
      snapshot !== null &&
      (desired.some(
        (c) => snapshot.has(c.name) && snapshot.get(c.name) !== c.definition,
      ) ||
        [...snapshot.keys()].some(
          (name) => !desired.some((c) => c.name === name),
        ))

    if (changed) {
      this.rebuildTable(db, table, desired, actualNames)
    } else {
      const missing = desired.filter((c) => !actualNames.has(c.name))
      try {
        for (const c of missing) {
          db.run(`ALTER TABLE ${table} ADD COLUMN ${c.name} ${c.definition}`)
        }
      } catch {
        // SQLite refuses some ADD COLUMN forms (e.g. non-constant defaults or
        // NOT NULL without a default). Fall back to a full table rebuild.
        this.rebuildTable(db, table, desired, actualNames)
      }
    }

    this.writeSnapshot(db, table, desired)
  }

  private rebuildTable(
    db: Database,
    table: string,
    desired: ColumnDef[],
    actualNames: Set<string>,
  ): void {
    const tmp = `${table}__migrate_tmp`
    const defs = desired.map((c) => `${c.name} ${c.definition}`).join(', ')
    const shared = desired
      .filter((c) => actualNames.has(c.name))
      .map((c) => c.name)

    db.run('PRAGMA foreign_keys = OFF')
    db.transaction(() => {
      db.run(`DROP TABLE IF EXISTS ${tmp}`)
      db.run(`CREATE TABLE ${tmp} (${defs})`)
      if (shared.length > 0) {
        const cols = shared.join(', ')
        db.run(`INSERT INTO ${tmp} (${cols}) SELECT ${cols} FROM ${table}`)
      }
      db.run(`DROP TABLE ${table}`)
      db.run(`ALTER TABLE ${tmp} RENAME TO ${table}`)
    })()
    db.run('PRAGMA foreign_keys = ON')
  }

  private readSnapshot(
    db: Database,
    table: string,
  ): Map<string, string> | null {
    const row = db
      .query(`SELECT columns_json FROM ${SNAPSHOT_TABLE} WHERE table_name = ?`)
      .get(table) as { columns_json: string } | null
    if (!row) return null
    const parsed = JSON.parse(row.columns_json) as ColumnDef[]
    return new Map(parsed.map((c) => [c.name, c.definition]))
  }

  private writeSnapshot(
    db: Database,
    table: string,
    desired: ColumnDef[],
  ): void {
    db.run(
      `INSERT INTO ${SNAPSHOT_TABLE} (table_name, columns_json)
       VALUES (?, ?)
       ON CONFLICT(table_name) DO UPDATE SET columns_json = excluded.columns_json`,
      [table, JSON.stringify(desired)],
    )
  }
}
