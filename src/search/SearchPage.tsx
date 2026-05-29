import { Layout } from '../components/Layout'

export const SearchPage = () => (
  <Layout title="MediaFinder">
    <h1 class="text-3xl font-semibold tracking-tight mb-2">Find something to watch</h1>
    <p class="text-neutral-400 mb-6">Search across movies and TV shows from TMDB.</p>
    <div id="search-root" />
    <noscript>
      <p class="text-neutral-500 text-sm">JavaScript is required for live search.</p>
    </noscript>
  </Layout>
)
