import { query } from '../db'
import type { MediaItem } from '../types'

export async function searchMedia(queryText: string): Promise<MediaItem[]> {
  return query<MediaItem>(
    `
      SELECT * FROM media
      WHERE title ILIKE $1
      ORDER BY vote_count DESC NULLS LAST, rating DESC NULLS LAST
      LIMIT 20
    `,
    [`%${queryText}%`],
  )
}
