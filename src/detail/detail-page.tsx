import { Layout } from '../components/layout'
import type { MediaItem } from '../types'

function runtimeLabel(m: MediaItem): string | null {
  if (m.media_type === 'movie' && m.runtime) return `${m.runtime} min`
  if (m.media_type === 'tv' && m.seasons) {
    const seasons = `${m.seasons} season${m.seasons === 1 ? '' : 's'}`
    return m.episodes ? `${seasons} · ${m.episodes} episodes` : seasons
  }
  return null
}

export const DetailPage = ({ media }: { media: MediaItem }) => {
  const meta = [
    media.media_type === 'tv' ? 'TV Series' : 'Film',
    media.year ? String(media.year) : null,
    runtimeLabel(media),
    media.status,
    media.rating ? `★ ${media.rating.toFixed(1)} (${media.vote_count ?? 0})` : null,
  ].filter(Boolean)

  return (
    <Layout title={media.title}>
      <a href="/" class="text-sm text-neutral-400 hover:text-neutral-100 transition-colors">
        ← Back to search
      </a>
      <div class="mt-6 flex flex-col sm:flex-row gap-6">
        {media.poster_path ? (
          <img
            src={`https://image.tmdb.org/t/p/w342${media.poster_path}`}
            class="w-48 rounded-xl flex-shrink-0"
            alt={media.title}
          />
        ) : (
          <div class="w-48 h-72 bg-neutral-800 rounded-xl flex-shrink-0" />
        )}
        <div>
          <h1 class="text-3xl font-semibold tracking-tight">{media.title}</h1>
          <p class="mt-2 text-neutral-400">{meta.join(' · ')}</p>
          {media.overview && <p class="mt-4 leading-relaxed text-neutral-200">{media.overview}</p>}
        </div>
      </div>
    </Layout>
  )
}
