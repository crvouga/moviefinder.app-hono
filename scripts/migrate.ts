/**
 * Apply idempotent schema migrations to Neon Postgres.
 * Run locally via `bun run migrate` or in CI before deploy.
 */
import { Pool, neonConfig } from '@neondatabase/serverless'
import { qualify } from '../src/db/schema'
import { registerAuthSchema } from './db-migrate/auth-schema'
import { DatabaseMigration } from './db-migrate/database-migration'

neonConfig.webSocketConstructor = WebSocket

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

const MEDIA_VIEW_SELECT = `
SELECT
  e.id,
  e.entity_id                                              AS tmdb_id,
  e.entity_type                                            AS media_type,
  e.fetched_at,
  COALESCE(
    e.data->>'title',
    e.data->>'name'
  )                                                        AS title,
  e.data->>'overview'                                        AS overview,
  e.data->>'poster_path'                                   AS poster_path,
  e.data->>'backdrop_path'                                 AS backdrop_path,
  (e.data->>'vote_average')::double precision              AS rating,
  (e.data->>'vote_count')::integer                         AS vote_count,
  CAST(LEFT(
    COALESCE(
      e.data->>'release_date',
      e.data->>'first_air_date'
    ), 4
  ) AS INTEGER)                                            AS year,
  (e.data->>'runtime')::integer                            AS runtime,
  (e.data->>'number_of_seasons')::integer                  AS seasons,
  (e.data->>'number_of_episodes')::integer                 AS episodes,
  e.data->>'status'                                          AS status
FROM ${qualify('entities')} e
WHERE e.namespace = 'tmdb'
  AND e.entity_type IN ('movie', 'tv')
`

const pool = new Pool({ connectionString: requireEnv('DATABASE_URL') })

try {
  const m = new DatabaseMigration()

  m.table('entities')
  m.col('entities', 'id', 'SERIAL PRIMARY KEY')
  m.col('entities', 'namespace', 'TEXT NOT NULL')
  m.col('entities', 'entity_type', 'TEXT NOT NULL')
  m.col('entities', 'entity_id', 'TEXT NOT NULL')
  m.col('entities', 'data', 'JSONB NOT NULL')
  m.col('entities', 'fetched_at', 'TIMESTAMPTZ NOT NULL DEFAULT NOW()')

  m.index(
    'idx_entities_unique',
    'entities (namespace, entity_type, entity_id)',
    { unique: true },
  )
  m.index('idx_entities_lookup', 'entities (namespace, entity_type, entity_id)')

  m.view('media', MEDIA_VIEW_SELECT)

  registerAuthSchema(m)

  // --- Event store (collaborative lists) ---
  m.table('events')
  m.col('events', 'id', 'SERIAL PRIMARY KEY')
  m.col('events', 'event_id', 'TEXT NOT NULL')
  m.col('events', 'namespace', "TEXT NOT NULL DEFAULT 'media_list'")
  m.col('events', 'aggregate_id', 'TEXT NOT NULL')
  m.col('events', 'event_type', 'TEXT NOT NULL')
  m.col('events', 'payload_json', 'TEXT NOT NULL')
  m.col('events', 'actor_id', 'TEXT NOT NULL')
  m.col('events', 'version', 'INTEGER NOT NULL')
  m.col('events', 'created_at', 'TIMESTAMPTZ NOT NULL DEFAULT NOW()')

  m.index('idx_events_event_id', 'events (event_id)', { unique: true })
  m.index('idx_events_aggregate_version', 'events (aggregate_id, version)', {
    unique: true,
  })
  m.index('idx_events_aggregate', 'events (aggregate_id, id)')

  // --- Projections (read models folded from the event stream) ---
  m.table('media_list')
  m.col('media_list', 'list_id', 'TEXT PRIMARY KEY')
  m.col('media_list', 'name', 'TEXT')
  m.col('media_list', 'created_by', 'TEXT')
  m.col('media_list', 'created_at', 'TIMESTAMPTZ')
  m.col('media_list', 'updated_at', 'TIMESTAMPTZ')
  m.col('media_list', 'deleted_at', 'TIMESTAMPTZ')
  m.col('media_list', 'item_count', 'INTEGER NOT NULL DEFAULT 0')

  m.table('media_list_item')
  m.col('media_list_item', 'list_id', 'TEXT NOT NULL')
  m.col('media_list_item', 'media_id', 'INTEGER NOT NULL')
  m.col('media_list_item', 'position', 'INTEGER NOT NULL')
  m.col('media_list_item', 'added_by', 'TEXT')
  m.col('media_list_item', 'added_at', 'TIMESTAMPTZ')
  m.index('idx_media_list_item_unique', 'media_list_item (list_id, media_id)', {
    unique: true,
  })
  m.index('idx_media_list_item_order', 'media_list_item (list_id, position)')

  m.table('media_list_member')
  m.col('media_list_member', 'list_id', 'TEXT NOT NULL')
  m.col('media_list_member', 'actor_id', 'TEXT NOT NULL')
  m.col('media_list_member', 'role', 'TEXT NOT NULL')
  m.col('media_list_member', 'joined_at', 'TIMESTAMPTZ')
  m.index(
    'idx_media_list_member_unique',
    'media_list_member (list_id, actor_id)',
    { unique: true },
  )

  await m.run(pool)
  console.log('[migrate] schema up to date')
} finally {
  await pool.end()
}
