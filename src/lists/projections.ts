import type { PoolClient } from '@neondatabase/serverless'
import { clientQuery, withTransaction } from '../db'
import { LIST_NAMESPACE, MediaListEvent, type StoredEvent } from './domain'

type Db = PoolClient

/**
 * Fold a single event into the read-model tables (media_list,
 * media_list_item, media_list_member). Each handler is idempotent enough to
 * survive a full replay from an empty projection state.
 */
export async function applyEvent(db: Db, e: StoredEvent): Promise<void> {
  const at = e.created_at
  const p = e.payload

  switch (p.event_type) {
    case 'UserCreatedList': {
      await clientQuery(
        db,
        `INSERT INTO media_list (list_id, name, created_by, created_at, updated_at, deleted_at, item_count)
         VALUES ($1, $2, $3, $4, $5, NULL, 0)
         ON CONFLICT (list_id) DO UPDATE SET name = EXCLUDED.name`,
        [p.list_id, p.name, e.actor_id, at, at],
      )
      await upsertMember(db, p.list_id, e.actor_id, 'owner', at)
      break
    }

    case 'UserRenamedList': {
      await clientQuery(
        db,
        `UPDATE media_list SET name = $1, updated_at = $2 WHERE list_id = $3`,
        [p.name, at, e.aggregate_id],
      )
      break
    }

    case 'UserAddedMedia': {
      const { rows } = await clientQuery(
        db,
        `SELECT COALESCE(MAX(position), -1) + 1 AS pos FROM media_list_item WHERE list_id = $1`,
        [e.aggregate_id],
      )
      const next = rows[0] as { pos: number }
      await clientQuery(
        db,
        `INSERT INTO media_list_item (list_id, media_id, position, added_by, added_at)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (list_id, media_id) DO NOTHING`,
        [e.aggregate_id, p.media_id, next.pos, e.actor_id, at],
      )
      await touchList(db, e.aggregate_id, at)
      break
    }

    case 'UserRemovedMedia': {
      await clientQuery(
        db,
        `DELETE FROM media_list_item WHERE list_id = $1 AND media_id = $2`,
        [e.aggregate_id, p.media_id],
      )
      await compactPositions(db, e.aggregate_id)
      await touchList(db, e.aggregate_id, at)
      break
    }

    case 'UserChangedOrder': {
      for (const [index, mediaId] of p.ordered_media_ids.entries()) {
        await clientQuery(
          db,
          `UPDATE media_list_item SET position = $1 WHERE list_id = $2 AND media_id = $3`,
          [index, e.aggregate_id, mediaId],
        )
      }
      await compactPositions(db, e.aggregate_id)
      await touchList(db, e.aggregate_id, at)
      break
    }

    case 'UserAddedMember': {
      await upsertMember(db, e.aggregate_id, p.actor_id, p.role, at)
      await touchList(db, e.aggregate_id, at)
      break
    }

    case 'UserRemovedMember': {
      await clientQuery(
        db,
        `DELETE FROM media_list_member WHERE list_id = $1 AND actor_id = $2`,
        [e.aggregate_id, p.actor_id],
      )
      await touchList(db, e.aggregate_id, at)
      break
    }

    case 'UserDeletedList': {
      await clientQuery(
        db,
        `UPDATE media_list SET deleted_at = $1, updated_at = $2 WHERE list_id = $3`,
        [at, at, e.aggregate_id],
      )
      break
    }
  }
}

async function upsertMember(
  db: Db,
  listId: string,
  actorId: string,
  role: string,
  at: string,
): Promise<void> {
  await clientQuery(
    db,
    `INSERT INTO media_list_member (list_id, actor_id, role, joined_at)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (list_id, actor_id) DO UPDATE SET role = EXCLUDED.role`,
    [listId, actorId, role, at],
  )
}

/** Renumber positions to a dense 0..n-1 sequence preserving current order. */
async function compactPositions(db: Db, listId: string): Promise<void> {
  const { rows: ids } = await clientQuery(
    db,
    `SELECT media_id FROM media_list_item WHERE list_id = $1 ORDER BY position ASC, media_id ASC`,
    [listId],
  )
  for (const [index, row] of (ids as { media_id: number }[]).entries()) {
    await clientQuery(
      db,
      `UPDATE media_list_item SET position = $1 WHERE list_id = $2 AND media_id = $3`,
      [index, listId, row.media_id],
    )
  }
}

async function touchList(db: Db, listId: string, at: string): Promise<void> {
  const { rows } = await clientQuery(
    db,
    `SELECT COUNT(*) AS c FROM media_list_item WHERE list_id = $1`,
    [listId],
  )
  const count = rows[0] as { c: number }
  await clientQuery(
    db,
    `UPDATE media_list SET item_count = $1, updated_at = $2 WHERE list_id = $3`,
    [count.c, at, listId],
  )
}

interface EventRow {
  id: number
  event_id: string
  namespace: string
  aggregate_id: string
  event_type: string
  payload_json: string
  actor_id: string
  version: number
  created_at: string
}

/**
 * Drop every projection row and re-fold the entire event stream. Because the
 * read models are pure derivations of `events`, this reproduces identical
 * state and is safe to run at any time (e.g. after a schema change).
 */
export async function rebuildProjections(): Promise<void> {
  await withTransaction(async (client) => {
    await clientQuery(client, 'DELETE FROM media_list_item')
    await clientQuery(client, 'DELETE FROM media_list_member')
    await clientQuery(client, 'DELETE FROM media_list')

    const { rows } = await clientQuery(
      client,
      `SELECT * FROM events WHERE namespace = $1 ORDER BY id ASC`,
      [LIST_NAMESPACE],
    )

    for (const row of rows as EventRow[]) {
      const payload = MediaListEvent.parse({
        event_type: row.event_type,
        ...(JSON.parse(row.payload_json) as Record<string, unknown>),
      })
      await applyEvent(client, {
        id: row.id,
        event_id: row.event_id,
        namespace: row.namespace,
        aggregate_id: row.aggregate_id,
        event_type: payload.event_type,
        payload,
        actor_id: row.actor_id,
        version: row.version,
        created_at: row.created_at,
      })
    }
  })
}
