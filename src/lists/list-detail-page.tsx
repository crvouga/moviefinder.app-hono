import { Layout } from '../components/layout'
import type { NavUser } from '../components/layout'
import type { MediaList, MediaListItem, MediaListMember } from './queries'

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
  <Layout title={`${list.name ?? 'List'} — MediaFinder`} user={user}>
    <a
      href="/lists"
      class="text-sm text-neutral-400 hover:text-neutral-100 transition-colors"
    >
      ← All lists
    </a>

    <h1 class="mt-4 text-3xl font-semibold tracking-tight">
      {list.name ?? 'Untitled list'}
    </h1>
    <p class="mt-1 text-sm text-neutral-400">
      {list.item_count} {list.item_count === 1 ? 'title' : 'titles'} ·{' '}
      {members.length} {members.length === 1 ? 'member' : 'members'}
    </p>

    {/* Interactive editor island. Falls back to the SSR list below without JS. */}
    <div
      id="list-editor-root"
      data-list-id={list.list_id}
      data-actor-id={actorId}
      data-can-edit={canEdit ? '1' : '0'}
      class="mt-6"
    />

    <noscript>
      <ul class="mt-6 divide-y divide-neutral-800">
        {items.map((m) => (
          <li key={m.id} class="flex items-center gap-4 py-3">
            {m.poster_path ? (
              <img
                src={`https://image.tmdb.org/t/p/w92${m.poster_path}`}
                class="w-10 h-14 object-cover rounded shrink-0"
                alt=""
              />
            ) : (
              <div class="w-10 h-14 bg-neutral-700 rounded shrink-0" />
            )}
            <span class="font-medium">{m.title}</span>
          </li>
        ))}
      </ul>
    </noscript>
  </Layout>
)
