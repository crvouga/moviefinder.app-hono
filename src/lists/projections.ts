import { db } from '../db'
import { LIST_NAMESPACE, MediaListEvent, type StoredEvent } from './domain'

/**
 * Fold a single event into the read-model tables (media_list,
 * media_list_item, media_list_member). Each handler is idempotent enough to
 * survive a full replay from an empty projection state.
 */
export function applyEvent(e: StoredEvent): void {
  const at = e.created_at
  const p = e.payload

  switch (p.event_type) {
    case 'UserCreatedList': {
      db.query(
        `INSERT INTO media_list (list_id, name, created_by, created_at, updated_at, deleted_at, item_count)
         VALUES (?, ?, ?, ?, ?, NULL, 0)
         ON CONFLICT(list_id) DO UPDATE SET name = excluded.name`,
      ).run(p.list_id, p.name, e.actor_id, at, at)
      // The creator is the owning member.
      upsertMember(p.list_id, e.actor_id, 'owner', at)
      break
    }

    case 'UserRenamedList': {
      db.query(
        `UPDATE media_list SET name = ?, updated_at = ? WHERE list_id = ?`,
      ).run(p.name, at, e.aggregate_id)
      break
    }

    case 'UserAddedMedia': {
      const next = db
        .query(
          `SELECT COALESCE(MAX(position), -1) + 1 AS pos FROM media_list_item WHERE list_id = ?`,
        )
        .get(e.aggregate_id) as { pos: number }
      db.query(
        `INSERT INTO media_list_item (list_id, media_id, position, added_by, added_at)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(list_id, media_id) DO NOTHING`,
      ).run(e.aggregate_id, p.media_id, next.pos, e.actor_id, at)
      touchList(e.aggregate_id, at)
      break
    }

    case 'UserRemovedMedia': {
      db.query(
        `DELETE FROM media_list_item WHERE list_id = ? AND media_id = ?`,
      ).run(e.aggregate_id, p.media_id)
      compactPositions(e.aggregate_id)
      touchList(e.aggregate_id, at)
      break
    }

    case 'UserChangedOrder': {
      p.ordered_media_ids.forEach((mediaId, index) => {
        db.query(
          `UPDATE media_list_item SET position = ? WHERE list_id = ? AND media_id = ?`,
        ).run(index, e.aggregate_id, mediaId)
      })
      // Any items not named in the new order keep a stable order after them.
      compactPositions(e.aggregate_id)
      touchList(e.aggregate_id, at)
      break
    }

    case 'UserAddedMember': {
      upsertMember(e.aggregate_id, p.actor_id, p.role, at)
      touchList(e.aggregate_id, at)
      break
    }

    case 'UserRemovedMember': {
      db.query(
        `DELETE FROM media_list_member WHERE list_id = ? AND actor_id = ?`,
      ).run(e.aggregate_id, p.actor_id)
      touchList(e.aggregate_id, at)
      break
    }

    case 'UserDeletedList': {
      db.query(
        `UPDATE media_list SET deleted_at = ?, updated_at = ? WHERE list_id = ?`,
      ).run(at, at, e.aggregate_id)
      break
    }
  }
}

function upsertMember(
  listId: string,
  actorId: string,
  role: string,
  at: string,
): void {
  db.query(
    `INSERT INTO media_list_member (list_id, actor_id, role, joined_at)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(list_id, actor_id) DO UPDATE SET role = excluded.role`,
  ).run(listId, actorId, role, at)
}

/** Renumber positions to a dense 0..n-1 sequence preserving current order. */
function compactPositions(listId: string): void {
  const ids = db
    .query(
      `SELECT media_id FROM media_list_item WHERE list_id = ? ORDER BY position ASC, media_id ASC`,
    )
    .all(listId) as { media_id: number }[]
  ids.forEach((row, index) => {
    db.query(
      `UPDATE media_list_item SET position = ? WHERE list_id = ? AND media_id = ?`,
    ).run(index, listId, row.media_id)
  })
}

function touchList(listId: string, at: string): void {
  const count = db
    .query(`SELECT COUNT(*) AS c FROM media_list_item WHERE list_id = ?`)
    .get(listId) as { c: number }
  db.query(
    `UPDATE media_list SET item_count = ?, updated_at = ? WHERE list_id = ?`,
  ).run(count.c, at, listId)
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
export function rebuildProjections(): void {
  db.transaction(() => {
    db.run('DELETE FROM media_list_item')
    db.run('DELETE FROM media_list_member')
    db.run('DELETE FROM media_list')

    const rows = db
      .query(`SELECT * FROM events WHERE namespace = ? ORDER BY id ASC`)
      .all(LIST_NAMESPACE) as EventRow[]

    for (const row of rows) {
      const payload = MediaListEvent.parse({
        event_type: row.event_type,
        ...(JSON.parse(row.payload_json) as Record<string, unknown>),
      })
      applyEvent({
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
  })()
}
