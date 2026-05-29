import type { Child } from 'hono/jsx'
import type { MediaItem } from '../../types'
import { IconFilm, IconStar } from './icon'

const TMDB_IMAGE = 'https://image.tmdb.org/t/p'

type PosterSize = 'w92' | 'w185' | 'w342' | 'w500'

export function posterUrl(
  path: string | null | undefined,
  size: PosterSize = 'w342',
): string | null {
  return path ? `${TMDB_IMAGE}/${size}${path}` : null
}

export function mediaMeta(item: MediaItem): string {
  const parts: string[] = [item.media_type === 'tv' ? 'TV Series' : 'Film']
  if (item.year) parts.push(String(item.year))
  return parts.join(' · ')
}

export function MediaPoster({
  item,
  size = 'w342',
  class: cls,
}: {
  item: Pick<MediaItem, 'poster_path' | 'title'>
  size?: PosterSize
  class?: string
}) {
  const url = posterUrl(item.poster_path, size)
  if (url) {
    return (
      <img
        src={url}
        alt={item.title}
        loading="lazy"
        class={`h-full w-full object-cover ${cls ?? ''}`.trim()}
      />
    )
  }
  return (
    <div
      class={`flex h-full w-full items-center justify-center bg-base-300 text-base-content/25 ${cls ?? ''}`.trim()}
    >
      <IconFilm class="text-3xl" />
    </div>
  )
}

function RatingBadge({ rating }: { rating: number }) {
  return (
    <span class="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-black/70 px-2 py-0.5 text-xs font-semibold text-amber-300 backdrop-blur-sm">
      <IconStar class="text-[0.85em]" />
      {rating.toFixed(1)}
    </span>
  )
}

export function MediaCard({ item }: { item: MediaItem }) {
  return (
    <a href={`/media/${item.id}`} class="group block focus:outline-none">
      <div class="relative aspect-[2/3] overflow-hidden rounded-box bg-base-300 shadow-sm ring-1 ring-base-300 transition duration-200 group-hover:shadow-xl group-hover:ring-primary group-focus-visible:ring-2 group-focus-visible:ring-primary">
        <MediaPoster
          item={item}
          size="w342"
          class="transition duration-300 group-hover:scale-105"
        />
        {item.rating ? <RatingBadge rating={item.rating} /> : null}
      </div>
      <div class="mt-2.5 px-0.5">
        <div class="truncate text-sm font-semibold leading-tight">
          {item.title}
        </div>
        <div class="mt-0.5 text-xs text-base-content/55">{mediaMeta(item)}</div>
      </div>
    </a>
  )
}

export function MediaRow({
  item,
  href,
  trailing,
}: {
  item: MediaItem
  href?: string
  trailing?: Child
}) {
  const inner = (
    <>
      <div class="h-16 w-11 shrink-0 overflow-hidden rounded-md bg-base-300 shadow-sm">
        <MediaPoster item={item} size="w185" />
      </div>
      <div class="min-w-0 flex-1">
        <div class="truncate font-medium leading-tight">{item.title}</div>
        <div class="mt-0.5 truncate text-sm text-base-content/55">
          {mediaMeta(item)}
          {item.rating ? ` · ★ ${item.rating.toFixed(1)}` : ''}
        </div>
      </div>
      {trailing ? <div class="shrink-0">{trailing}</div> : null}
    </>
  )

  if (href) {
    return (
      <a
        href={href}
        class="flex items-center gap-3 rounded-box px-2 py-2 transition-colors hover:bg-base-300/60"
      >
        {inner}
      </a>
    )
  }

  return (
    <div class="flex items-center gap-3 rounded-box px-2 py-2">{inner}</div>
  )
}
