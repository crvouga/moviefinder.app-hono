import { z } from 'zod'

/** The aggregate namespace for every collaborative-list event. */
export const LIST_NAMESPACE = 'media_list'

export const MemberRole = z.enum(['owner', 'editor'])
export type MemberRole = z.infer<typeof MemberRole>

/**
 * Domain events for the collaborative-list aggregate, modelled as a tagged
 * (discriminated) union keyed on `event_type`. Each variant carries only the
 * payload fields it needs; the envelope columns (aggregate_id, actor_id,
 * version, created_at) live on the `events` table, not in the payload.
 */
export const MediaListEvent = z.discriminatedUnion('event_type', [
  z.object({
    event_type: z.literal('UserCreatedList'),
    list_id: z.string().min(1),
    name: z.string().min(1).max(200),
  }),
  z.object({
    event_type: z.literal('UserRenamedList'),
    name: z.string().min(1).max(200),
  }),
  z.object({
    event_type: z.literal('UserAddedMedia'),
    media_id: z.number().int().positive(),
  }),
  z.object({
    event_type: z.literal('UserRemovedMedia'),
    media_id: z.number().int().positive(),
  }),
  z.object({
    event_type: z.literal('UserChangedOrder'),
    ordered_media_ids: z.array(z.number().int().positive()),
  }),
  z.object({
    event_type: z.literal('UserAddedMember'),
    actor_id: z.string().min(1),
    role: MemberRole,
  }),
  z.object({
    event_type: z.literal('UserRemovedMember'),
    actor_id: z.string().min(1),
  }),
  z.object({
    event_type: z.literal('UserDeletedList'),
  }),
])
export type MediaListEvent = z.infer<typeof MediaListEvent>
export type MediaListEventType = MediaListEvent['event_type']

/** A persisted event row: the validated payload plus its envelope metadata. */
export interface StoredEvent {
  id: number
  event_id: string
  namespace: string
  aggregate_id: string
  event_type: MediaListEventType
  payload: MediaListEvent
  actor_id: string
  version: number
  created_at: string
}

/**
 * Commands for the collaborative-list aggregate, modelled as a tagged
 * (discriminated) union keyed on `command_type` -- the write-side mirror of
 * `MediaListEvent`. A command expresses an *intent* to change state; the
 * command handler authorizes it and emits the resulting event(s). The acting
 * identity (`actorId`) is passed alongside the command, not embedded in it.
 */
export const MediaListCommand = z.discriminatedUnion('command_type', [
  z.object({
    command_type: z.literal('CreateList'),
    name: z.string().min(1).max(200),
  }),
  z.object({
    command_type: z.literal('RenameList'),
    list_id: z.string().min(1),
    name: z.string().min(1).max(200),
  }),
  z.object({
    command_type: z.literal('AddMedia'),
    list_id: z.string().min(1),
    media_id: z.number().int().positive(),
  }),
  z.object({
    command_type: z.literal('RemoveMedia'),
    list_id: z.string().min(1),
    media_id: z.number().int().positive(),
  }),
  z.object({
    command_type: z.literal('ChangeOrder'),
    list_id: z.string().min(1),
    ordered_media_ids: z.array(z.number().int().positive()),
  }),
  z.object({
    command_type: z.literal('AddMember'),
    list_id: z.string().min(1),
    actor_id: z.string().min(1),
    role: MemberRole.default('editor'),
  }),
  z.object({
    command_type: z.literal('RemoveMember'),
    list_id: z.string().min(1),
    actor_id: z.string().min(1),
  }),
  z.object({
    command_type: z.literal('DeleteList'),
    list_id: z.string().min(1),
  }),
])
export type MediaListCommand = z.infer<typeof MediaListCommand>
export type MediaListCommandType = MediaListCommand['command_type']

// --- Command inputs (validated at the HTTP boundary) ---

export const CreateListInput = z.object({
  name: z.string().min(1).max(200),
})
export type CreateListInput = z.infer<typeof CreateListInput>

export const RenameListInput = z.object({
  name: z.string().min(1).max(200),
})
export type RenameListInput = z.infer<typeof RenameListInput>

export const AddMediaInput = z.object({
  media_id: z.coerce.number().int().positive(),
})
export type AddMediaInput = z.infer<typeof AddMediaInput>

export const ChangeOrderInput = z.object({
  ordered_media_ids: z.array(z.coerce.number().int().positive()),
})
export type ChangeOrderInput = z.infer<typeof ChangeOrderInput>

export const AddMemberInput = z.object({
  actor_id: z.string().min(1),
  role: MemberRole.default('editor'),
})
export type AddMemberInput = z.infer<typeof AddMemberInput>
