import { db } from '../db'
import { tmdbFetch } from './client'
import type { MediaType } from '../types'

function upsertEntity(
  namespace: string,
  entityType: string,
  entityId: string,
  data: unknown,
) {
  db.query(
    `
    INSERT INTO entities (namespace, entity_type, entity_id, data)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(namespace, entity_type, entity_id)
    DO UPDATE SET data = excluded.data, fetched_at = CURRENT_TIMESTAMP
  `,
  ).run(namespace, entityType, entityId, JSON.stringify(data))
}

interface MultiResult {
  results?: { id: number; media_type: string }[]
}

export async function searchAndIngest(query: string) {
  const json = (await tmdbFetch('/search/multi', { query })) as MultiResult
  for (const item of json.results ?? []) {
    if (item.media_type === 'movie' || item.media_type === 'tv') {
      upsertEntity('tmdb', item.media_type, String(item.id), item)
    }
  }
}

export async function fetchDetailAndIngest(
  entityType: MediaType,
  tmdbId: string,
) {
  const json = await tmdbFetch(`/${entityType}/${tmdbId}`, {
    append_to_response: 'credits',
  })
  upsertEntity('tmdb', entityType, tmdbId, json)
}

export async function fetchTrendingAndIngest() {
  const json = (await tmdbFetch('/trending/all/week')) as MultiResult
  for (const item of json.results ?? []) {
    if (item.media_type === 'movie' || item.media_type === 'tv') {
      upsertEntity('tmdb', item.media_type, String(item.id), item)
    }
  }
}
