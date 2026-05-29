import { Layout } from '../components/layout'
import type { NavUser } from '../components/layout'
import type { MediaItem } from '../types'
import type { MediaList } from './queries'
import {
  BackLink,
  Card,
  CardBody,
  Button,
  MediaRow,
  EmptyState,
  IconSearch,
  IconPlus,
  IconFilm,
} from '../components/ui'

export const AddItemPage = ({
  list,
  q,
  results,
  user,
}: {
  list: MediaList
  q: string
  results: MediaItem[]
  user?: NavUser
}) => (
  <Layout title="Add a title — MovieFinder" user={user} activePath="/lists">
    <div class="mx-auto w-full max-w-2xl">
      <BackLink href={`/lists/${list.list_id}`}>Back to list</BackLink>
      <h1 class="mt-4 text-3xl font-bold tracking-tight">Add a title</h1>
      <p class="mt-2 text-base-content/60">
        Search for movies and TV shows to add to {list.name ?? 'this list'}.
      </p>

      <form
        method="get"
        action={`/lists/${list.list_id}/items/new`}
        class="mt-6"
      >
        <label class="input flex w-full items-center gap-3">
          <IconSearch class="text-base-content/40" />
          <input
            type="search"
            name="q"
            value={q}
            placeholder="Search movies and TV shows…"
            class="grow"
            autofocus
          />
          <Button type="submit" variant="primary" size="sm">
            Search
          </Button>
        </label>
      </form>

      {q.trim() === '' ? (
        <EmptyState
          class="mt-6"
          icon={<IconSearch />}
          title="Search to add titles"
          description="Type a movie or show name above and press search."
        />
      ) : results.length === 0 ? (
        <EmptyState
          class="mt-6"
          icon={<IconFilm />}
          title="No results"
          description={`Nothing found for "${q}". Try a different search.`}
        />
      ) : (
        <Card class="mt-6">
          <CardBody>
            <ul class="divide-y divide-base-300/70">
              {results.map((m) => (
                <li key={m.id} class="flex items-center gap-2 px-1">
                  <div class="min-w-0 flex-1">
                    <MediaRow item={m} href={`/media/${m.id}`} />
                  </div>
                  <form
                    method="post"
                    action={`/lists/${list.list_id}/items`}
                    class="shrink-0"
                  >
                    <input type="hidden" name="media_id" value={String(m.id)} />
                    <input type="hidden" name="q" value={q} />
                    <Button
                      type="submit"
                      variant="primary"
                      size="sm"
                      aria-label={`Add ${m.title}`}
                    >
                      <IconPlus />
                      Add
                    </Button>
                  </form>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      )}
    </div>
  </Layout>
)
