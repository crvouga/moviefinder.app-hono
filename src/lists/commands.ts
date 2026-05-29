import { db } from '../db'
import { appendEvent } from './events'
import { MediaListCommand, type MemberRole, type StoredEvent } from './domain'

/** Thrown when an actor is not allowed to perform a command on a list. */
export class ListAccessError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ListAccessError'
  }
}

/** Thrown when a command targets a list that does not exist (or was deleted). */
export class ListNotFoundError extends Error {
  constructor(message = 'List not found') {
    super(message)
    this.name = 'ListNotFoundError'
  }
}

interface ListState {
  created_by: string
  deleted_at: string | null
}

function loadList(listId: string): ListState {
  const row = db
    .query(`SELECT created_by, deleted_at FROM media_list WHERE list_id = ?`)
    .get(listId) as ListState | null
  if (!row || row.deleted_at) throw new ListNotFoundError()
  return row
}

function memberRole(listId: string, actorId: string): MemberRole | null {
  const row = db
    .query(
      `SELECT role FROM media_list_member WHERE list_id = ? AND actor_id = ?`,
    )
    .get(listId, actorId) as { role: MemberRole } | null
  return row?.role ?? null
}

/** Any member (owner or editor) may modify the list contents. */
function assertCanEdit(listId: string, actorId: string): void {
  loadList(listId)
  if (!memberRole(listId, actorId)) {
    throw new ListAccessError('You are not a member of this list')
  }
}

/** Only the owner may delete the list or manage its membership. */
function assertOwner(listId: string, actorId: string): void {
  loadList(listId)
  if (memberRole(listId, actorId) !== 'owner') {
    throw new ListAccessError('Only the owner can perform this action')
  }
}

/**
 * Single entry point for the write side. Validates the command message,
 * authorizes the actor for that intent, and appends the resulting event. Each
 * `case` is the handler for one command type, mapping an intent (imperative)
 * onto a fact (past-tense event).
 */
export function handleCommand(
  actorId: string,
  input: MediaListCommand,
): StoredEvent {
  const command = MediaListCommand.parse(input)

  switch (command.command_type) {
    case 'CreateList': {
      const listId = crypto.randomUUID()
      return appendEvent({
        aggregateId: listId,
        actorId,
        event: {
          event_type: 'UserCreatedList',
          list_id: listId,
          name: command.name,
        },
      })
    }

    case 'RenameList': {
      assertCanEdit(command.list_id, actorId)
      return appendEvent({
        aggregateId: command.list_id,
        actorId,
        event: { event_type: 'UserRenamedList', name: command.name },
      })
    }

    case 'AddMedia': {
      assertCanEdit(command.list_id, actorId)
      return appendEvent({
        aggregateId: command.list_id,
        actorId,
        event: { event_type: 'UserAddedMedia', media_id: command.media_id },
      })
    }

    case 'RemoveMedia': {
      assertCanEdit(command.list_id, actorId)
      return appendEvent({
        aggregateId: command.list_id,
        actorId,
        event: { event_type: 'UserRemovedMedia', media_id: command.media_id },
      })
    }

    case 'ChangeOrder': {
      assertCanEdit(command.list_id, actorId)
      return appendEvent({
        aggregateId: command.list_id,
        actorId,
        event: {
          event_type: 'UserChangedOrder',
          ordered_media_ids: command.ordered_media_ids,
        },
      })
    }

    case 'AddMember': {
      assertOwner(command.list_id, actorId)
      return appendEvent({
        aggregateId: command.list_id,
        actorId,
        event: {
          event_type: 'UserAddedMember',
          actor_id: command.actor_id,
          role: command.role,
        },
      })
    }

    case 'RemoveMember': {
      assertOwner(command.list_id, actorId)
      return appendEvent({
        aggregateId: command.list_id,
        actorId,
        event: { event_type: 'UserRemovedMember', actor_id: command.actor_id },
      })
    }

    case 'DeleteList': {
      assertOwner(command.list_id, actorId)
      return appendEvent({
        aggregateId: command.list_id,
        actorId,
        event: { event_type: 'UserDeletedList' },
      })
    }
  }
}
