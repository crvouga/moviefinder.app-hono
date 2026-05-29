import { Layout } from '../components/layout'
import type { MediaItem } from '../types'

export const TrendingPage = ({ items }: { items: MediaItem[] }) => (
  <Layout title="Trending — MediaFinder">
    <h1 class="text-3xl font-semibold tracking-tight mb-6">Trending this week</h1>
    {items.length === 0 ? (
      <p class="text-neutral-400">No trending titles yet. Set TMDB_API_READ_ACCESS_TOKEN and reload.</p>
    ) : (
      <ul class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
        {items.map((m) => (
          <li key={m.id}>
            <a href={`/media/${m.id}`} class="block group">
              {m.poster_path ? (
                <img
                  src={`https://image.tmdb.org/t/p/w342${m.poster_path}`}
                  class="w-full rounded-lg group-hover:opacity-80 transition-opacity"
                  alt={m.title}
                />
              ) : (
                <div class="w-full aspect-2/3 bg-neutral-800 rounded-lg" />
              )}
              <div class="mt-2 text-sm font-medium truncate">{m.title}</div>
              <div class="text-xs text-neutral-400">
                {m.media_type === 'tv' ? 'TV' : 'Film'}
                {m.year ? ` · ${m.year}` : ''}
                {m.rating ? ` · ★ ${m.rating.toFixed(1)}` : ''}
              </div>
            </a>
          </li>
        ))}
      </ul>
    )}
  </Layout>
)
