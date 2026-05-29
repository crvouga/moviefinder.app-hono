import { DatabaseMigration } from '../db-migrate/database-migration'
import { registerAuthSchema } from '../auth/schema'
import { db } from './index'

const MEDIA_VIEW_SELECT = `
SELECT
  e.id,
  e.entity_id                                              AS tmdb_id,
  e.entity_type                                            AS media_type,
  e.fetched_at,
  COALESCE(
    json_extract(e.data, '$.title'),
    json_extract(e.data, '$.name')
  )                                                        AS title,
  json_extract(e.data, '$.overview')                       AS overview,
  json_extract(e.data, '$.poster_path')                    AS poster_path,
  json_extract(e.data, '$.backdrop_path')                  AS backdrop_path,
  json_extract(e.data, '$.vote_average')                   AS rating,
  json_extract(e.data, '$.vote_count')                     AS vote_count,
  CAST(SUBSTR(
    COALESCE(
      json_extract(e.data, '$.release_date'),
      json_extract(e.data, '$.first_air_date')
    ), 1, 4
  ) AS INTEGER)                                            AS year,
  json_extract(e.data, '$.runtime')                        AS runtime,
  json_extract(e.data, '$.number_of_seasons')              AS seasons,
  json_extract(e.data, '$.number_of_episodes')             AS episodes,
  json_extract(e.data, '$.status')                         AS status
FROM entities e
WHERE e.namespace = 'tmdb'
  AND e.entity_type IN ('movie', 'tv')
`

export function migrate() {
  const m = new DatabaseMigration()

  m.table('entities')
  m.col('entities', 'id', 'INTEGER PRIMARY KEY AUTOINCREMENT')
  m.col('entities', 'namespace', 'TEXT NOT NULL')
  m.col('entities', 'entity_type', 'TEXT NOT NULL')
  m.col('entities', 'entity_id', 'TEXT NOT NULL')
  m.col('entities', 'data', 'TEXT NOT NULL')
  m.col('entities', 'fetched_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP')

  // Upsert conflict target (replaces the old table-level UNIQUE constraint).
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
  m.col('events', 'id', 'INTEGER PRIMARY KEY AUTOINCREMENT')
  m.col('events', 'event_id', 'TEXT NOT NULL')
  m.col('events', 'namespace', "TEXT NOT NULL DEFAULT 'media_list'")
  m.col('events', 'aggregate_id', 'TEXT NOT NULL')
  m.col('events', 'event_type', 'TEXT NOT NULL')
  m.col('events', 'payload_json', 'TEXT NOT NULL')
  m.col('events', 'actor_id', 'TEXT NOT NULL')
  m.col('events', 'version', 'INTEGER NOT NULL')
  m.col('events', 'created_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP')

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
  m.col('media_list', 'created_at', 'TIMESTAMP')
  m.col('media_list', 'updated_at', 'TIMESTAMP')
  m.col('media_list', 'deleted_at', 'TIMESTAMP')
  m.col('media_list', 'item_count', 'INTEGER NOT NULL DEFAULT 0')

  m.table('media_list_item')
  m.col('media_list_item', 'list_id', 'TEXT NOT NULL')
  m.col('media_list_item', 'media_id', 'INTEGER NOT NULL')
  m.col('media_list_item', 'position', 'INTEGER NOT NULL')
  m.col('media_list_item', 'added_by', 'TEXT')
  m.col('media_list_item', 'added_at', 'TIMESTAMP')
  m.index('idx_media_list_item_unique', 'media_list_item (list_id, media_id)', {
    unique: true,
  })
  m.index('idx_media_list_item_order', 'media_list_item (list_id, position)')

  m.table('media_list_member')
  m.col('media_list_member', 'list_id', 'TEXT NOT NULL')
  m.col('media_list_member', 'actor_id', 'TEXT NOT NULL')
  m.col('media_list_member', 'role', 'TEXT NOT NULL')
  m.col('media_list_member', 'joined_at', 'TIMESTAMP')
  m.index(
    'idx_media_list_member_unique',
    'media_list_member (list_id, actor_id)',
    { unique: true },
  )

  m.run(db)
}
