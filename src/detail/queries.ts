import { queryOne } from '../db'
import type { MediaItem } from '../types'

export async function getMediaById(id: number): Promise<MediaItem | null> {
  return queryOne<MediaItem>(`SELECT * FROM media WHERE id = $1`, [id])
}
