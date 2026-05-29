import { db } from '../db'
import type { MediaItem } from '../types'

export function getMediaById(id: number): MediaItem | null {
  const row = db
    .query(`SELECT * FROM media WHERE id = ?`)
    .get(id) as MediaItem | null
  return row ?? null
}
