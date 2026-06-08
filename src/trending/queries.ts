import { query } from '../db'
import type { MediaItem } from '../types'

export const PAGE_SIZE = 20

export async function getTrending(
  limit: number = PAGE_SIZE,
  offset = 0,
): Promise<MediaItem[]> {
  return query<MediaItem>(
    `
      SELECT * FROM media
      ORDER BY vote_count DESC NULLS LAST, rating DESC NULLS LAST
      LIMIT $1 OFFSET $2
    `,
    [limit, offset],
  )
}
