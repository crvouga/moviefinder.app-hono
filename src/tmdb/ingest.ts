import { execute } from '../db'
import { tmdbFetch } from './client'
import type { MediaType } from '../types'

async function upsertEntity(
  namespace: string,
  entityType: string,
  entityId: string,
  data: unknown,
) {
  await execute(
    `
    INSERT INTO entities (namespace, entity_type, entity_id, data)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (namespace, entity_type, entity_id)
    DO UPDATE SET data = EXCLUDED.data, fetched_at = NOW()
  `,
    [namespace, entityType, entityId, JSON.stringify(data)],
  )
}

interface MultiResult {
  results?: { id: number; media_type: string }[]
}

export async function searchAndIngest(query: string) {
  const json = (await tmdbFetch('/search/multi', { query })) as MultiResult
  for (const item of json.results ?? []) {
    if (item.media_type === 'movie' || item.media_type === 'tv') {
      await upsertEntity('tmdb', item.media_type, String(item.id), item)
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
  await upsertEntity('tmdb', entityType, tmdbId, json)
}

export async function fetchTrendingAndIngest() {
  const json = (await tmdbFetch('/trending/all/week')) as MultiResult
  for (const item of json.results ?? []) {
    if (item.media_type === 'movie' || item.media_type === 'tv') {
      await upsertEntity('tmdb', item.media_type, String(item.id), item)
    }
  }
}
