import { DatabaseMigration } from '../db-migrate/database-migration'
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
  m.index('idx_entities_unique', 'entities (namespace, entity_type, entity_id)', { unique: true })
  m.index('idx_entities_lookup', 'entities (namespace, entity_type, entity_id)')

  m.view('media', MEDIA_VIEW_SELECT)

  m.run(db)
}
