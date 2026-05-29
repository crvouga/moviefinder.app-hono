import { db } from '../db'
import type { MediaItem } from '../types'

export const PAGE_SIZE = 20

export function getTrending(
  limit: number = PAGE_SIZE,
  offset = 0,
): MediaItem[] {
  return db
    .query(
      `
      SELECT * FROM media
      ORDER BY vote_count DESC NULLS LAST, rating DESC NULLS LAST
      LIMIT ? OFFSET ?
    `,
    )
    .all(limit, offset) as MediaItem[]
}
