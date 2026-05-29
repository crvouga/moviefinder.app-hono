import { Layout } from '../components/layout'
import type { NavUser } from '../components/layout'
import type { MediaItem } from '../types'
import { BackLink, Badge, MediaPoster, IconStar } from '../components/ui'

function runtimeLabel(m: MediaItem): string | null {
  if (m.media_type === 'movie' && m.runtime) return `${m.runtime} min`
  if (m.media_type === 'tv' && m.seasons) {
    const seasons = `${m.seasons} season${m.seasons === 1 ? '' : 's'}`
    return m.episodes ? `${seasons} · ${m.episodes} episodes` : seasons
  }
  return null
}

export const DetailPage = ({
  media,
  user,
}: {
  media: MediaItem
  user?: NavUser
}) => {
  const runtime = runtimeLabel(media)
  const backdrop = media.backdrop_path
    ? `https://image.tmdb.org/t/p/w1280${media.backdrop_path}`
    : null

  return (
    <Layout title={`${media.title} — MovieFinder`} user={user}>
      <BackLink href="/">Back to search</BackLink>

      <article class="relative mt-4 overflow-hidden rounded-box border border-base-300 bg-base-200/40">
        {backdrop ? (
          <>
            <img
              src={backdrop}
              alt=""
              aria-hidden="true"
              class="absolute inset-0 h-full w-full object-cover object-top opacity-20"
            />
            <div class="absolute inset-0 bg-gradient-to-t from-base-200 via-base-200/85 to-base-200/40" />
          </>
        ) : null}

        <div class="relative flex flex-col gap-6 p-5 sm:flex-row sm:gap-8 sm:p-8">
          <div class="w-40 shrink-0 self-center overflow-hidden rounded-box shadow-2xl ring-1 ring-base-300 sm:w-52 sm:self-start">
            <div class="aspect-[2/3]">
              <MediaPoster item={media} size="w500" />
            </div>
          </div>

          <div class="min-w-0 flex-1">
            <h1 class="text-3xl font-bold tracking-tight sm:text-4xl">
              {media.title}
            </h1>

            <div class="mt-4 flex flex-wrap items-center gap-2">
              <Badge variant="primary">
                {media.media_type === 'tv' ? 'TV Series' : 'Film'}
              </Badge>
              {media.year ? (
                <Badge variant="outline">{media.year}</Badge>
              ) : null}
              {runtime ? <Badge variant="outline">{runtime}</Badge> : null}
              {media.status ? (
                <Badge variant="ghost">{media.status}</Badge>
              ) : null}
              {media.rating ? (
                <span class="inline-flex items-center gap-1 rounded-full bg-amber-400/15 px-2.5 py-1 text-sm font-semibold text-amber-300">
                  <IconStar class="text-[0.9em]" />
                  {media.rating.toFixed(1)}
                  <span class="font-normal text-amber-300/60">
                    ({media.vote_count ?? 0})
                  </span>
                </span>
              ) : null}
            </div>

            {media.overview ? (
              <p class="mt-5 max-w-2xl leading-relaxed text-base-content/80">
                {media.overview}
              </p>
            ) : (
              <p class="mt-5 text-base-content/50">No overview available.</p>
            )}
          </div>
        </div>
      </article>
    </Layout>
  )
}
