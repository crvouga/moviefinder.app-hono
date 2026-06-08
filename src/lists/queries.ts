import { query, queryOne } from '../db'
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
export async function getListsForActor(actorId: string): Promise<MediaList[]> {
  return query<MediaList>(
    `SELECT l.list_id, l.name, l.created_by, l.created_at, l.updated_at, l.item_count
       FROM media_list_member m
       JOIN media_list l ON l.list_id = m.list_id
       WHERE m.actor_id = $1 AND l.deleted_at IS NULL
       ORDER BY l.updated_at DESC`,
    [actorId],
  )
}

export async function getList(listId: string): Promise<MediaList | null> {
  return queryOne<MediaList>(
    `SELECT list_id, name, created_by, created_at, updated_at, item_count
       FROM media_list
       WHERE list_id = $1 AND deleted_at IS NULL`,
    [listId],
  )
}

/** Ordered list items joined to the `media` view for display metadata. */
export async function getListItems(listId: string): Promise<MediaListItem[]> {
  return query<MediaListItem>(
    `SELECT media.*, i.position AS position, i.added_at AS added_at
       FROM media_list_item i
       JOIN media ON media.id = i.media_id
       WHERE i.list_id = $1
       ORDER BY i.position ASC`,
    [listId],
  )
}

export async function getMembers(listId: string): Promise<MediaListMember[]> {
  return query<MediaListMember>(
    `SELECT list_id, actor_id, role, joined_at
       FROM media_list_member
       WHERE list_id = $1
       ORDER BY joined_at ASC`,
    [listId],
  )
}

export async function isMember(
  listId: string,
  actorId: string,
): Promise<boolean> {
  const row = await queryOne(
    `SELECT 1 FROM media_list_member WHERE list_id = $1 AND actor_id = $2`,
    [listId, actorId],
  )
  return row !== null
}
