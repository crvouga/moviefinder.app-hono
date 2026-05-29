import { Layout } from '../components/layout'
import type { NavUser } from '../components/layout'
import { PageHeader } from '../components/ui'

export const SearchPage = ({ user }: { user?: NavUser }) => (
  <Layout title="MovieFinder" user={user}>
    <PageHeader
      eyebrow="Discover"
      title="Find something to watch"
      subtitle="Search across millions of movies and TV shows, powered by TMDB."
    />
    <div id="search-root" />
    <noscript>
      <p class="text-sm text-base-content/50">
        JavaScript is required for live search.
      </p>
    </noscript>
  </Layout>
)
