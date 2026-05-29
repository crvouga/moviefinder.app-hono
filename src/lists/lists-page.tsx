import { Layout } from '../components/layout'
import type { NavUser } from '../components/layout'
import type { MediaList } from './queries'

export const ListsPage = ({
  lists,
  user,
}: {
  lists: MediaList[]
  user?: NavUser
}) => (
  <Layout title="Your lists — MediaFinder" user={user}>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-3xl font-semibold tracking-tight">Your lists</h1>
    </div>

    <div id="create-list-root" class="mb-8" />

    {lists.length === 0 ? (
      <p class="text-neutral-400">
        You don't have any lists yet. Create one above to start collecting
        movies and shows.
      </p>
    ) : (
      <ul class="divide-y divide-neutral-800">
        {lists.map((l) => (
          <li key={l.list_id}>
            <a
              href={`/lists/${l.list_id}`}
              class="flex items-center justify-between py-4 px-2 hover:bg-neutral-800/50 rounded-lg transition-colors"
            >
              <span class="font-medium">{l.name ?? 'Untitled list'}</span>
              <span class="text-sm text-neutral-400">
                {l.item_count} {l.item_count === 1 ? 'title' : 'titles'}
              </span>
            </a>
          </li>
        ))}
      </ul>
    )}

    <noscript>
      <p class="text-neutral-500 text-sm mt-4">
        JavaScript is required to create and edit lists.
      </p>
    </noscript>
  </Layout>
)
