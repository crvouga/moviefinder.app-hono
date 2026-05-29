import type { Child } from 'hono/jsx'
import { Layout } from '../components/layout'
import type { NavUser } from '../components/layout'
import type { MediaList, MediaListItem, MediaListMember } from './queries'
import {
  BackLink,
  Badge,
  Button,
  Card,
  CardBody,
  EmptyState,
  MediaRow,
  IconPlus,
  IconClose,
  IconChevronUp,
  IconChevronDown,
  IconFilm,
} from '../components/ui'

/** A tiny single-control form used for the micro-action exceptions. */
function MicroForm({
  action,
  children,
  class: cls,
}: {
  action: string
  children?: Child
  class?: string
}) {
  return (
    <form method="post" action={action} class={cls}>
      {children}
    </form>
  )
}

export const ListDetailPage = ({
  list,
  items,
  members,
  isOwner,
  actorId,
  user,
}: {
  list: MediaList
  items: MediaListItem[]
  members: MediaListMember[]
  isOwner: boolean
  actorId: string
  user?: NavUser
}) => (
  <Layout
    title={`${list.name ?? 'List'} — MovieFinder`}
    user={user}
    activePath="/lists"
  >
    <BackLink href="/lists">All lists</BackLink>

    <div class="mt-4 flex flex-col gap-4 border-b border-base-300 pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div class="min-w-0">
        <h1 class="text-3xl font-bold tracking-tight sm:text-4xl">
          {list.name ?? 'Untitled list'}
        </h1>
        <div class="mt-3 flex flex-wrap items-center gap-2">
          <Badge variant="ghost">
            {list.item_count} {list.item_count === 1 ? 'title' : 'titles'}
          </Badge>
          <Badge variant="ghost">
            {members.length} {members.length === 1 ? 'member' : 'members'}
          </Badge>
        </div>
      </div>
      <div class="flex shrink-0 flex-wrap items-center gap-2">
        <Button href={`/lists/${list.list_id}/items/new`} variant="primary">
          <IconPlus />
          Add title
        </Button>
        <Button href={`/lists/${list.list_id}/rename`} variant="ghost">
          Rename
        </Button>
        {isOwner ? (
          <Button
            href={`/lists/${list.list_id}/delete`}
            variant="ghost"
            class="text-error"
          >
            Delete
          </Button>
        ) : null}
      </div>
    </div>

    <section class="mt-6 space-y-6">
      <Card>
        <CardBody>
          <h2 class="flex items-center gap-2 text-lg font-semibold">
            Titles
            <Badge variant="ghost" size="sm">
              {items.length}
            </Badge>
          </h2>
          {items.length === 0 ? (
            <EmptyState
              class="mt-3"
              icon={<IconFilm />}
              title="No titles yet"
              description="Add movies and shows to this list."
              action={
                <Button
                  href={`/lists/${list.list_id}/items/new`}
                  variant="primary"
                >
                  <IconPlus />
                  Add title
                </Button>
              }
            />
          ) : (
            <ul class="mt-3 divide-y divide-base-300/70">
              {items.map((m, i) => (
                <li key={m.id} class="flex items-center gap-2 py-1">
                  <span class="w-6 shrink-0 text-center text-sm tabular-nums text-base-content/40">
                    {i + 1}
                  </span>
                  <div class="min-w-0 flex-1">
                    <MediaRow item={m} href={`/media/${m.id}`} />
                  </div>
                  <div class="flex shrink-0 items-center gap-1">
                    <MicroForm
                      action={`/lists/${list.list_id}/items/${m.id}/move`}
                    >
                      <input type="hidden" name="dir" value="up" />
                      <Button
                        type="submit"
                        variant="ghost"
                        size="sm"
                        square
                        disabled={i === 0}
                        aria-label="Move up"
                      >
                        <IconChevronUp />
                      </Button>
                    </MicroForm>
                    <MicroForm
                      action={`/lists/${list.list_id}/items/${m.id}/move`}
                    >
                      <input type="hidden" name="dir" value="down" />
                      <Button
                        type="submit"
                        variant="ghost"
                        size="sm"
                        square
                        disabled={i === items.length - 1}
                        aria-label="Move down"
                      >
                        <IconChevronDown />
                      </Button>
                    </MicroForm>
                    <MicroForm
                      action={`/lists/${list.list_id}/items/${m.id}/remove`}
                    >
                      <Button
                        type="submit"
                        variant="ghost"
                        size="sm"
                        square
                        class="text-error"
                        aria-label="Remove"
                      >
                        <IconClose />
                      </Button>
                    </MicroForm>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <div class="flex items-center justify-between gap-3">
            <h2 class="text-lg font-semibold">Members</h2>
            {isOwner ? (
              <Button
                href={`/lists/${list.list_id}/members/new`}
                variant="secondary"
                size="sm"
              >
                <IconPlus />
                Invite
              </Button>
            ) : null}
          </div>
          <ul class="mt-3 divide-y divide-base-300/70">
            {members.map((mem) => (
              <li
                key={mem.actor_id}
                class="flex items-center justify-between gap-3 py-2.5"
              >
                <span class="flex min-w-0 items-center gap-2">
                  <span class="truncate text-sm font-medium">
                    {mem.actor_id === actorId ? 'You' : mem.actor_id}
                  </span>
                  <Badge
                    variant={mem.role === 'owner' ? 'primary' : 'ghost'}
                    size="sm"
                  >
                    {mem.role}
                  </Badge>
                </span>
                {isOwner && mem.role !== 'owner' ? (
                  <MicroForm
                    action={`/lists/${list.list_id}/members/${encodeURIComponent(
                      mem.actor_id,
                    )}/remove`}
                  >
                    <Button
                      type="submit"
                      variant="ghost"
                      size="sm"
                      class="text-error"
                    >
                      Remove
                    </Button>
                  </MicroForm>
                ) : null}
              </li>
            ))}
          </ul>
        </CardBody>
      </Card>
    </section>
  </Layout>
)
