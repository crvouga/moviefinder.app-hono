import { db } from '../db'
import type { MediaItem } from '../types'

export function searchMedia(query: string): MediaItem[] {
  return db
    .query(
      `
      SELECT * FROM media
      WHERE title LIKE ?
      ORDER BY vote_count DESC NULLS LAST, rating DESC NULLS LAST
      LIMIT 20
    `,
    )
    .all(`%${query}%`) as MediaItem[]
}
