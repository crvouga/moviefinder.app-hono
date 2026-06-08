import { Hono } from 'hono'
import { z } from 'zod'
import type { Context } from 'hono'
import type { AppEnv } from '../auth/types'
import { getActorId } from './actor'
import { ListAccessError, ListNotFoundError, handleCommand } from './commands'
import {
  getList,
  getListItems,
  getListsForActor,
  getMembers,
  isMember,
} from './queries'
import { searchMedia } from '../search/queries'
import { searchAndIngest } from '../tmdb/ingest'
import { ListsPage } from './lists-page'
import { ListDetailPage } from './list-detail-page'
import { CreateListPage } from './create-list-page'
import { AddItemPage } from './add-item-page'
import { AddMemberPage } from './add-member-page'
import { RenameListPage } from './rename-list-page'
import { DeleteListPage } from './delete-list-page'
import type { MediaItem } from '../types'

export const listsRoute = new Hono<AppEnv>()

/** First validation issue message, for surfacing on a form page. */
function firstIssue(err: z.ZodError): string {
  return err.issues[0]?.message ?? 'Invalid input'
}

/** The current actor's role on a list, or null if they are not a member. */
async function roleOf(listId: string, actorId: string): Promise<string | null> {
  const members = await getMembers(listId)
  const member = members.find((m) => m.actor_id === actorId)
  return member?.role ?? null
}

/** Load a list the actor may view, or respond with 404. */
async function requireViewableList(c: Context<AppEnv>) {
  const actorId = getActorId(c)
  const listId = c.req.param('id')
  if (!listId) return null
  const list = await getList(listId)
  if (!list || !(await isMember(listId, actorId))) return null
  return { actorId, listId, list }
}

// --- Lists index + create ---

listsRoute.get('/lists', async (c) => {
  const actorId = getActorId(c)
  return c.html(
    <ListsPage lists={await getListsForActor(actorId)} user={c.get('user')} />,
  )
})

listsRoute.get('/lists/new', (c) =>
  c.html(<CreateListPage user={c.get('user')} />),
)

listsRoute.post('/lists', async (c) => {
  const actorId = getActorId(c)
  const body = await c.req.parseBody()
  const name = String(body.name ?? '').trim()
  const parsed = z.object({ name: z.string().min(1).max(200) }).safeParse({
    name,
  })
  if (!parsed.success) {
    return c.html(
      <CreateListPage user={c.get('user')} error={firstIssue(parsed.error)} />,
      400,
    )
  }
  const event = await handleCommand(actorId, {
    command_type: 'CreateList',
    name: parsed.data.name,
  })
  return c.redirect(`/lists/${event.aggregate_id}`)
})

// --- Single list (resource view) ---

listsRoute.get('/lists/:id', async (c) => {
  const ctx = await requireViewableList(c)
  if (!ctx) return c.notFound()
  return c.html(
    <ListDetailPage
      list={ctx.list}
      items={await getListItems(ctx.listId)}
      members={await getMembers(ctx.listId)}
      isOwner={(await roleOf(ctx.listId, ctx.actorId)) === 'owner'}
      actorId={ctx.actorId}
      user={c.get('user')}
    />,
  )
})

// --- Add title (search + add) ---

listsRoute.get('/lists/:id/items/new', async (c) => {
  const ctx = await requireViewableList(c)
  if (!ctx) return c.notFound()
  const q = c.req.query('q')?.trim() ?? ''
  let results: MediaItem[] = []
  if (q) {
    try {
      await searchAndIngest(q)
    } catch (err) {
      console.error('searchAndIngest failed', err)
    }
    results = await searchMedia(q)
  }
  return c.html(
    <AddItemPage
      list={ctx.list}
      q={q}
      results={results}
      user={c.get('user')}
    />,
  )
})

listsRoute.post('/lists/:id/items', async (c) => {
  const ctx = await requireViewableList(c)
  if (!ctx) return c.notFound()
  const body = await c.req.parseBody()
  const mediaId = Number(body.media_id)
  const q = String(body.q ?? '').trim()
  const back = q
    ? `/lists/${ctx.listId}/items/new?q=${encodeURIComponent(q)}`
    : `/lists/${ctx.listId}/items/new`
  if (Number.isInteger(mediaId) && mediaId > 0) {
    try {
      await handleCommand(ctx.actorId, {
        command_type: 'AddMedia',
        list_id: ctx.listId,
        media_id: mediaId,
      })
    } catch (err) {
      if (!(err instanceof ListAccessError)) throw err
    }
  }
  return c.redirect(back)
})

listsRoute.post('/lists/:id/items/:mediaId/remove', async (c) => {
  const ctx = await requireViewableList(c)
  if (!ctx) return c.notFound()
  const mediaId = Number(c.req.param('mediaId'))
  if (Number.isInteger(mediaId) && mediaId > 0) {
    try {
      await handleCommand(ctx.actorId, {
        command_type: 'RemoveMedia',
        list_id: ctx.listId,
        media_id: mediaId,
      })
    } catch (err) {
      if (!(err instanceof ListAccessError)) throw err
    }
  }
  return c.redirect(`/lists/${ctx.listId}`)
})

listsRoute.post('/lists/:id/items/:mediaId/move', async (c) => {
  const ctx = await requireViewableList(c)
  if (!ctx) return c.notFound()
  const mediaId = Number(c.req.param('mediaId'))
  const body = await c.req.parseBody()
  const dir = String(body.dir ?? '')
  const items = await getListItems(ctx.listId)
  const index = items.findIndex((m) => m.id === mediaId)
  const target = dir === 'up' ? index - 1 : index + 1
  if (index !== -1 && target >= 0 && target < items.length) {
    const next = [...items]
    const [moved] = next.splice(index, 1)
    if (moved) {
      next.splice(target, 0, moved)
      try {
        await handleCommand(ctx.actorId, {
          command_type: 'ChangeOrder',
          list_id: ctx.listId,
          ordered_media_ids: next.map((m) => m.id),
        })
      } catch (err) {
        if (!(err instanceof ListAccessError)) throw err
      }
    }
  }
  return c.redirect(`/lists/${ctx.listId}`)
})

// --- Members ---

listsRoute.get('/lists/:id/members/new', async (c) => {
  const ctx = await requireViewableList(c)
  if (!ctx) return c.notFound()
  return c.html(<AddMemberPage list={ctx.list} user={c.get('user')} />)
})

listsRoute.post('/lists/:id/members', async (c) => {
  const ctx = await requireViewableList(c)
  if (!ctx) return c.notFound()
  const body = await c.req.parseBody()
  const actor = String(body.actor_id ?? '').trim()
  if (!actor) {
    return c.html(
      <AddMemberPage
        list={ctx.list}
        user={c.get('user')}
        error="Enter a member id to invite."
      />,
      400,
    )
  }
  try {
    await handleCommand(ctx.actorId, {
      command_type: 'AddMember',
      list_id: ctx.listId,
      actor_id: actor,
      role: 'editor',
    })
  } catch (err) {
    if (err instanceof ListAccessError) {
      return c.html(
        <AddMemberPage
          list={ctx.list}
          user={c.get('user')}
          error={err.message}
        />,
        403,
      )
    }
    throw err
  }
  return c.redirect(`/lists/${ctx.listId}`)
})

listsRoute.post('/lists/:id/members/:memberId/remove', async (c) => {
  const ctx = await requireViewableList(c)
  if (!ctx) return c.notFound()
  const memberId = c.req.param('memberId') ?? ''
  try {
    await handleCommand(ctx.actorId, {
      command_type: 'RemoveMember',
      list_id: ctx.listId,
      actor_id: memberId,
    })
  } catch (err) {
    if (!(err instanceof ListAccessError)) throw err
  }
  return c.redirect(`/lists/${ctx.listId}`)
})

// --- Rename ---

listsRoute.get('/lists/:id/rename', async (c) => {
  const ctx = await requireViewableList(c)
  if (!ctx) return c.notFound()
  return c.html(<RenameListPage list={ctx.list} user={c.get('user')} />)
})

listsRoute.post('/lists/:id/rename', async (c) => {
  const ctx = await requireViewableList(c)
  if (!ctx) return c.notFound()
  const body = await c.req.parseBody()
  const name = String(body.name ?? '').trim()
  const parsed = z.object({ name: z.string().min(1).max(200) }).safeParse({
    name,
  })
  if (!parsed.success) {
    return c.html(
      <RenameListPage
        list={ctx.list}
        user={c.get('user')}
        error={firstIssue(parsed.error)}
      />,
      400,
    )
  }
  try {
    await handleCommand(ctx.actorId, {
      command_type: 'RenameList',
      list_id: ctx.listId,
      name: parsed.data.name,
    })
  } catch (err) {
    if (err instanceof ListAccessError) {
      return c.html(
        <RenameListPage
          list={ctx.list}
          user={c.get('user')}
          error={err.message}
        />,
        403,
      )
    }
    throw err
  }
  return c.redirect(`/lists/${ctx.listId}`)
})

// --- Delete ---

listsRoute.get('/lists/:id/delete', async (c) => {
  const ctx = await requireViewableList(c)
  if (!ctx) return c.notFound()
  return c.html(<DeleteListPage list={ctx.list} user={c.get('user')} />)
})

listsRoute.post('/lists/:id/delete', async (c) => {
  const ctx = await requireViewableList(c)
  if (!ctx) return c.notFound()
  try {
    await handleCommand(ctx.actorId, {
      command_type: 'DeleteList',
      list_id: ctx.listId,
    })
  } catch (err) {
    if (err instanceof ListAccessError || err instanceof ListNotFoundError) {
      return c.redirect(`/lists/${ctx.listId}`)
    }
    throw err
  }
  return c.redirect('/lists')
})
