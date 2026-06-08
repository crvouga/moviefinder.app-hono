import { clientQuery, query, withTransaction } from '../db'
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
export async function appendEvent(
  input: AppendEventInput,
): Promise<StoredEvent> {
  const event = MediaListEvent.parse(input.event)

  const { event_type, ...payload } = event
  const eventId = crypto.randomUUID()

  return withTransaction(async (client) => {
    const { rows: versionRows } = await clientQuery(
      client,
      `SELECT COALESCE(MAX(version), 0) AS v FROM events WHERE aggregate_id = $1`,
      [input.aggregateId],
    )
    const version = (versionRows[0] as { v: number }).v + 1

    const { rows: insertedRows } = await clientQuery(
      client,
      `INSERT INTO events
           (event_id, namespace, aggregate_id, event_type, payload_json, actor_id, version)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id, created_at`,
      [
        eventId,
        LIST_NAMESPACE,
        input.aggregateId,
        event_type,
        JSON.stringify(payload),
        input.actorId,
        version,
      ],
    )
    const inserted = insertedRows[0] as { id: number; created_at: string }

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

    await applyEvent(client, stored)
    return stored
  })
}

/** Replay the full ordered stream for one aggregate. */
export async function readEvents(aggregateId: string): Promise<StoredEvent[]> {
  const rows = await query<EventRow>(
    `SELECT * FROM events
       WHERE aggregate_id = $1 AND namespace = $2
       ORDER BY version ASC`,
    [aggregateId, LIST_NAMESPACE],
  )
  return rows.map(toStored)
}

/** Every list event in global insertion order, used for projection rebuilds. */
export async function readAllEvents(): Promise<StoredEvent[]> {
  const rows = await query<EventRow>(
    `SELECT * FROM events WHERE namespace = $1 ORDER BY id ASC`,
    [LIST_NAMESPACE],
  )
  return rows.map(toStored)
}
