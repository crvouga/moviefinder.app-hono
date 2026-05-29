import { useState, useEffect } from 'hono/jsx/dom'
import type { MediaItem } from '../../types'
import {
  MediaRow,
  LoadingRow,
  EmptyState,
  IconSearch,
} from '../../components/ui'

export function SearchInput() {
  const [q, setQ] = useState('')
  const [results, setResults] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  useEffect(() => {
    if (!q.trim()) {
      setResults([])
      setSearched(false)
      return
    }
    setLoading(true)
    const t = setTimeout(async () => {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`)
      setResults((await res.json()) as MediaItem[])
      setLoading(false)
      setSearched(true)
    }, 250)
    return () => clearTimeout(t)
  }, [q])

  return (
    <div>
      <label class="input input-lg flex w-full items-center gap-3">
        <IconSearch class="text-base-content/40" />
        <input
          type="search"
          value={q}
          onInput={(e) => setQ((e.target as HTMLInputElement).value)}
          placeholder="Search movies and TV shows..."
          class="grow"
          autofocus
        />
      </label>

      {loading ? <LoadingRow label="Searching…" /> : null}

      {!loading && results.length > 0 ? (
        <ul class="mt-4 divide-y divide-base-300/70">
          {results.map((m) => (
            <li key={m.id}>
              <MediaRow item={m} href={`/media/${m.id}`} />
            </li>
          ))}
        </ul>
      ) : null}

      {!loading && searched && results.length === 0 ? (
        <div class="mt-6">
          <EmptyState
            icon={<IconSearch />}
            title="No matches found"
            description={`We couldn't find anything for "${q.trim()}". Try a different title or spelling.`}
          />
        </div>
      ) : null}
    </div>
  )
}
