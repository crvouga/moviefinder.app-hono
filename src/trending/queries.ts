import { db } from '../db'
import type { MediaItem } from '../types'

export function getTrending(): MediaItem[] {
  return db
    .query(
      `
      SELECT * FROM media
      ORDER BY vote_count DESC NULLS LAST, rating DESC NULLS LAST
      LIMIT 20
    `,
    )
    .all() as MediaItem[]
}
