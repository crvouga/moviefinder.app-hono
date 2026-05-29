import { Layout } from '../components/layout'
import type { NavUser } from '../components/layout'
import type { MediaItem } from '../types'
import {
  PageHeader,
  Button,
  MediaCard,
  EmptyState,
  IconSearch,
  IconFilm,
} from '../components/ui'

export const SearchPage = ({
  query,
  results,
  user,
}: {
  query: string
  results: MediaItem[]
  user?: NavUser
}) => (
  <Layout title="MovieFinder" user={user} activePath="/">
    <PageHeader
      eyebrow="Discover"
      title="Find something to watch"
      subtitle="Search across millions of movies and TV shows, powered by TMDB."
    />

    <form method="get" action="/" class="mb-8">
      <label class="input flex w-full items-center gap-3">
        <IconSearch class="text-base-content/40" />
        <input
          type="search"
          name="q"
          value={query}
          placeholder="Search movies and TV shows…"
          class="grow"
          autofocus
        />
        <Button type="submit" variant="primary" size="sm">
          Search
        </Button>
      </label>
    </form>

    {query.trim() === '' ? (
      <EmptyState
        icon={<IconSearch />}
        title="Search to discover titles"
        description="Type a movie or show name above and press search."
      />
    ) : results.length === 0 ? (
      <EmptyState
        icon={<IconFilm />}
        title="No results"
        description={`Nothing found for "${query}". Try a different search.`}
      />
    ) : (
      <ul class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {results.map((m) => (
          <li key={m.id}>
            <MediaCard item={m} />
          </li>
        ))}
      </ul>
    )}
  </Layout>
)
