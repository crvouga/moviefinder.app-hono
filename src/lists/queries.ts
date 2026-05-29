import { db } from '../db'
import type { MediaItem } from '../types'

export interface MediaList {
  list_id: string
  name: string | null
  created_by: string
  created_at: string
  updated_at: string
  item_count: number
}

export interface MediaListMember {
  list_id: string
  actor_id: string
  role: string
  joined_at: string
}

export type MediaListItem = MediaItem & { position: number; added_at: string }

/** Lists the actor can see (any list they are a member of), newest activity first. */
export function getListsForActor(actorId: string): MediaList[] {
  return db
    .query(
      `SELECT l.list_id, l.name, l.created_by, l.created_at, l.updated_at, l.item_count
       FROM media_list_member m
       JOIN media_list l ON l.list_id = m.list_id
       WHERE m.actor_id = ? AND l.deleted_at IS NULL
       ORDER BY l.updated_at DESC`,
    )
    .all(actorId) as MediaList[]
}

export function getList(listId: string): MediaList | null {
  const row = db
    .query(
      `SELECT list_id, name, created_by, created_at, updated_at, item_count
       FROM media_list
       WHERE list_id = ? AND deleted_at IS NULL`,
    )
    .get(listId) as MediaList | null
  return row ?? null
}

/** Ordered list items joined to the `media` view for display metadata. */
export function getListItems(listId: string): MediaListItem[] {
  return db
    .query(
      `SELECT media.*, i.position AS position, i.added_at AS added_at
       FROM media_list_item i
       JOIN media ON media.id = i.media_id
       WHERE i.list_id = ?
       ORDER BY i.position ASC`,
    )
    .all(listId) as MediaListItem[]
}

export function getMembers(listId: string): MediaListMember[] {
  return db
    .query(
      `SELECT list_id, actor_id, role, joined_at
       FROM media_list_member
       WHERE list_id = ?
       ORDER BY joined_at ASC`,
    )
    .all(listId) as MediaListMember[]
}

export function isMember(listId: string, actorId: string): boolean {
  const row = db
    .query(`SELECT 1 FROM media_list_member WHERE list_id = ? AND actor_id = ?`)
    .get(listId, actorId)
  return row !== null
}
