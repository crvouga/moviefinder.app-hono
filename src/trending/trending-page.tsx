import { Layout } from '../components/layout'
import type { NavUser } from '../components/layout'
import type { MediaItem } from '../types'
import { PageHeader, MediaCard, EmptyState, IconFilm } from '../components/ui'

export const TrendingPage = ({
  items,
  user,
}: {
  items: MediaItem[]
  user?: NavUser
}) => (
  <Layout title="Trending — MovieFinder" user={user}>
    <PageHeader
      eyebrow="This week"
      title="Trending now"
      subtitle="The most popular movies and shows people are watching right now."
    />
    {items.length === 0 ? (
      <EmptyState
        icon={<IconFilm />}
        title="No trending titles yet"
        description="Set TMDB_API_READ_ACCESS_TOKEN and reload to populate this week's trending titles."
      />
    ) : (
      <ul class="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {items.map((m) => (
          <li key={m.id}>
            <MediaCard item={m} />
          </li>
        ))}
      </ul>
    )}
  </Layout>
)
