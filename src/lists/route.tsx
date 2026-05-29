import { Hono } from 'hono'
import { z } from 'zod'
import type { Context } from 'hono'
import type { AppEnv } from '../auth/types'
import { getActorId } from './actor'
import {
  AddMediaInput,
  AddMemberInput,
  ChangeOrderInput,
  CreateListInput,
  RenameListInput,
} from './domain'
import { ListAccessError, ListNotFoundError, handleCommand } from './commands'
import {
  getList,
  getListItems,
  getListsForActor,
  getMembers,
  isMember,
} from './queries'
import { ListsPage } from './lists-page'
import { ListDetailPage } from './list-detail-page'

export const listsRoute = new Hono<AppEnv>()

/** Map domain/validation errors onto HTTP responses. */
function handleError(c: Context<AppEnv>, err: unknown): Response {
  if (err instanceof z.ZodError) {
    return c.json({ error: 'invalid_request', issues: err.issues }, 400)
  }
  if (err instanceof ListNotFoundError) {
    return c.json({ error: 'not_found' }, 404)
  }
  if (err instanceof ListAccessError) {
    return c.json({ error: 'forbidden', message: err.message }, 403)
  }
  console.error('lists route error', err)
  return c.json({ error: 'internal_error' }, 500)
}

// --- SSR pages ---

listsRoute.get('/lists', (c) => {
  const actorId = getActorId(c)
  return c.html(
    <ListsPage lists={getListsForActor(actorId)} user={c.get('user')} />,
  )
})

listsRoute.get('/lists/:id', (c) => {
  const actorId = getActorId(c)
  const listId = c.req.param('id')
  const list = getList(listId)
  if (!list) return c.notFound()

  const canView = isMember(listId, actorId)
  if (!canView) return c.notFound()

  return c.html(
    <ListDetailPage
      list={list}
      items={getListItems(listId)}
      members={getMembers(listId)}
      canEdit={canView}
      actorId={actorId}
      user={c.get('user')}
    />,
  )
})

// --- JSON API ---

listsRoute.get('/api/lists/:id', (c) => {
  const actorId = getActorId(c)
  const listId = c.req.param('id')
  const list = getList(listId)
  if (!list) return c.json({ error: 'not_found' }, 404)
  if (!isMember(listId, actorId)) return c.json({ error: 'forbidden' }, 403)

  return c.json({
    list,
    items: getListItems(listId),
    members: getMembers(listId),
    actor_id: actorId,
    can_edit: true,
  })
})

listsRoute.post('/api/lists', async (c) => {
  try {
    const actorId = getActorId(c)
    const { name } = CreateListInput.parse(await c.req.json())
    const event = handleCommand(actorId, { command_type: 'CreateList', name })
    return c.json({ list_id: event.aggregate_id }, 201)
  } catch (err) {
    return handleError(c, err)
  }
})

listsRoute.post('/api/lists/:id/rename', async (c) => {
  try {
    const actorId = getActorId(c)
    const { name } = RenameListInput.parse(await c.req.json())
    handleCommand(actorId, {
      command_type: 'RenameList',
      list_id: c.req.param('id'),
      name,
    })
    return c.json({ ok: true })
  } catch (err) {
    return handleError(c, err)
  }
})

listsRoute.post('/api/lists/:id/items', async (c) => {
  try {
    const actorId = getActorId(c)
    const { media_id } = AddMediaInput.parse(await c.req.json())
    handleCommand(actorId, {
      command_type: 'AddMedia',
      list_id: c.req.param('id'),
      media_id,
    })
    return c.json({ ok: true }, 201)
  } catch (err) {
    return handleError(c, err)
  }
})

listsRoute.delete('/api/lists/:id/items/:mediaId', (c) => {
  try {
    const actorId = getActorId(c)
    const mediaId = Number(c.req.param('mediaId'))
    if (!Number.isInteger(mediaId))
      return c.json({ error: 'invalid_request' }, 400)
    handleCommand(actorId, {
      command_type: 'RemoveMedia',
      list_id: c.req.param('id'),
      media_id: mediaId,
    })
    return c.json({ ok: true })
  } catch (err) {
    return handleError(c, err)
  }
})

listsRoute.post('/api/lists/:id/order', async (c) => {
  try {
    const actorId = getActorId(c)
    const { ordered_media_ids } = ChangeOrderInput.parse(await c.req.json())
    handleCommand(actorId, {
      command_type: 'ChangeOrder',
      list_id: c.req.param('id'),
      ordered_media_ids,
    })
    return c.json({ ok: true })
  } catch (err) {
    return handleError(c, err)
  }
})

listsRoute.post('/api/lists/:id/members', async (c) => {
  try {
    const actorId = getActorId(c)
    const { actor_id, role } = AddMemberInput.parse(await c.req.json())
    handleCommand(actorId, {
      command_type: 'AddMember',
      list_id: c.req.param('id'),
      actor_id,
      role,
    })
    return c.json({ ok: true }, 201)
  } catch (err) {
    return handleError(c, err)
  }
})

listsRoute.delete('/api/lists/:id/members/:memberId', (c) => {
  try {
    const actorId = getActorId(c)
    handleCommand(actorId, {
      command_type: 'RemoveMember',
      list_id: c.req.param('id'),
      actor_id: c.req.param('memberId'),
    })
    return c.json({ ok: true })
  } catch (err) {
    return handleError(c, err)
  }
})

listsRoute.delete('/api/lists/:id', (c) => {
  try {
    const actorId = getActorId(c)
    handleCommand(actorId, {
      command_type: 'DeleteList',
      list_id: c.req.param('id'),
    })
    return c.json({ ok: true })
  } catch (err) {
    return handleError(c, err)
  }
})
