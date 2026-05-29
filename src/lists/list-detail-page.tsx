import { Layout } from '../components/layout'
import type { NavUser } from '../components/layout'
import type { MediaList, MediaListItem, MediaListMember } from './queries'
import { BackLink, Badge, MediaRow } from '../components/ui'

export const ListDetailPage = ({
  list,
  items,
  members,
  canEdit,
  actorId,
  user,
}: {
  list: MediaList
  items: MediaListItem[]
  members: MediaListMember[]
  canEdit: boolean
  actorId: string
  user?: NavUser
}) => (
  <Layout title={`${list.name ?? 'List'} — MovieFinder`} user={user}>
    <BackLink href="/lists">All lists</BackLink>

    <div class="mt-4 flex flex-col gap-3 border-b border-base-300 pb-6 sm:flex-row sm:items-end sm:justify-between">
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
    </div>

    {/* Interactive editor island. Falls back to the SSR list below without JS. */}
    <div
      id="list-editor-root"
      data-list-id={list.list_id}
      data-actor-id={actorId}
      data-can-edit={canEdit ? '1' : '0'}
      class="mt-6"
    />

    <noscript>
      {items.length === 0 ? (
        <p class="mt-6 text-base-content/50">This list is empty.</p>
      ) : (
        <ul class="mt-6 divide-y divide-base-300/70">
          {items.map((m) => (
            <li key={m.id}>
              <MediaRow item={m} href={`/media/${m.id}`} />
            </li>
          ))}
        </ul>
      )}
    </noscript>
  </Layout>
)
