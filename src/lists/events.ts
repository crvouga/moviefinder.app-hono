import { db } from '../db'
import { LIST_NAMESPACE, MediaListEvent, type StoredEvent } from './domain'
import { applyEvent } from './projections'

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

function toStored(row: EventRow): StoredEvent {
  const payload = MediaListEvent.parse({
    event_type: row.event_type,
    ...(JSON.parse(row.payload_json) as Record<string, unknown>),
  })
  return {
    id: row.id,
    event_id: row.event_id,
    namespace: row.namespace,
    aggregate_id: row.aggregate_id,
    event_type: payload.event_type,
    payload,
    actor_id: row.actor_id,
    version: row.version,
    created_at: row.created_at,
  }
}

export interface AppendEventInput {
  aggregateId: string
  actorId: string
  event: MediaListEvent
}

/**
 * Validate, persist, and project a single domain event. The version is the
 * next per-aggregate sequence number; the unique (aggregate_id, version) index
 * guards against concurrent writers. Persisting the row and folding it into the
 * projections happen in one transaction so reads never observe a half-applied
 * event.
 */
export function appendEvent(input: AppendEventInput): StoredEvent {
  const event = MediaListEvent.parse(input.event)

  // The discriminant lives in a dedicated column; the rest becomes the payload.
  const { event_type, ...payload } = event
  const eventId = crypto.randomUUID()

  const tx = db.transaction(() => {
    const row = db
      .query(
        `SELECT COALESCE(MAX(version), 0) AS v FROM events WHERE aggregate_id = ?`,
      )
      .get(input.aggregateId) as { v: number }
    const version = row.v + 1

    const inserted = db
      .query(
        `INSERT INTO events
           (event_id, namespace, aggregate_id, event_type, payload_json, actor_id, version)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         RETURNING id, created_at`,
      )
      .get(
        eventId,
        LIST_NAMESPACE,
        input.aggregateId,
        event_type,
        JSON.stringify(payload),
        input.actorId,
        version,
      ) as { id: number; created_at: string }

    const stored: StoredEvent = {
      id: inserted.id,
      event_id: eventId,
      namespace: LIST_NAMESPACE,
      aggregate_id: input.aggregateId,
      event_type,
      payload: event,
      actor_id: input.actorId,
      version,
      created_at: inserted.created_at,
    }

    applyEvent(stored)
    return stored
  })

  return tx()
}

/** Replay the full ordered stream for one aggregate. */
export function readEvents(aggregateId: string): StoredEvent[] {
  const rows = db
    .query(
      `SELECT * FROM events
       WHERE aggregate_id = ? AND namespace = ?
       ORDER BY version ASC`,
    )
    .all(aggregateId, LIST_NAMESPACE) as EventRow[]
  return rows.map(toStored)
}

/** Every list event in global insertion order, used for projection rebuilds. */
export function readAllEvents(): StoredEvent[] {
  const rows = db
    .query(`SELECT * FROM events WHERE namespace = ? ORDER BY id ASC`)
    .all(LIST_NAMESPACE) as EventRow[]
  return rows.map(toStored)
}
