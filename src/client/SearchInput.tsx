import { useState, useEffect } from 'hono/jsx/dom'
import type { MediaItem } from '../types'

export function SearchInput() {
  const [q, setQ] = useState('')
  const [results, setResults] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!q.trim()) {
      setResults([])
      return
    }
    setLoading(true)
    const t = setTimeout(async () => {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`)
      setResults((await res.json()) as MediaItem[])
      setLoading(false)
    }, 250)
    return () => clearTimeout(t)
  }, [q])

  return (
    <div>
      <input
        type="search"
        value={q}
        onInput={(e) => setQ((e.target as HTMLInputElement).value)}
        placeholder="Search movies and TV shows..."
        class="w-full px-4 py-3 rounded-xl bg-neutral-800 border border-neutral-700 focus:outline-none focus:border-neutral-500 text-lg"
        autofocus
      />
      {loading && <p class="mt-4 text-neutral-500 text-sm">Searching...</p>}
      {results.length > 0 && (
        <ul class="mt-4 divide-y divide-neutral-800">
          {results.map((m) => (
            <li key={m.id}>
              <a
                href={`/media/${m.id}`}
                class="flex items-center gap-4 py-3 hover:bg-neutral-800/50 rounded-lg px-2 transition-colors"
              >
                {m.poster_path ? (
                  <img
                    src={`https://image.tmdb.org/t/p/w92${m.poster_path}`}
                    class="w-10 h-14 object-cover rounded flex-shrink-0"
                    alt=""
                  />
                ) : (
                  <div class="w-10 h-14 bg-neutral-700 rounded flex-shrink-0" />
                )}
                <div>
                  <div class="font-medium">{m.title}</div>
                  <div class="text-sm text-neutral-400">
                    {m.media_type === 'tv' ? 'TV Series' : 'Film'}
                    {m.year ? ` · ${m.year}` : ''}
                    {m.rating ? ` · ★ ${m.rating.toFixed(1)}` : ''}
                  </div>
                </div>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
