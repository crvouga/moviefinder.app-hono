import { useState, useEffect } from 'hono/jsx/dom'
import type { MediaItem } from '../../types'

interface ListItem extends MediaItem {
  position: number
}

interface Member {
  actor_id: string
  role: string
}

interface ListData {
  items: ListItem[]
  members: Member[]
}

export function ListEditor({
  listId,
  actorId,
}: {
  listId: string
  actorId: string
}) {
  const [items, setItems] = useState<ListItem[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [q, setQ] = useState('')
  const [results, setResults] = useState<MediaItem[]>([])
  const [memberId, setMemberId] = useState('')

  async function refresh() {
    const res = await fetch(`/api/lists/${listId}`)
    if (!res.ok) return
    const data = (await res.json()) as ListData
    setItems(data.items)
    setMembers(data.members)
  }

  useEffect(() => {
    void refresh()
  }, [])

  useEffect(() => {
    if (!q.trim()) {
      setResults([])
      return
    }
    const t = setTimeout(async () => {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`)
      setResults((await res.json()) as MediaItem[])
    }, 250)
    return () => clearTimeout(t)
  }, [q])

  async function addMedia(mediaId: number) {
    await fetch(`/api/lists/${listId}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ media_id: mediaId }),
    })
    setQ('')
    setResults([])
    await refresh()
  }

  async function removeMedia(mediaId: number) {
    await fetch(`/api/lists/${listId}/items/${mediaId}`, { method: 'DELETE' })
    await refresh()
  }

  async function move(index: number, delta: number) {
    const target = index + delta
    if (target < 0 || target >= items.length) return
    const next = [...items]
    const moved = next.splice(index, 1)[0]
    if (!moved) return
    next.splice(target, 0, moved)
    setItems(next)
    await fetch(`/api/lists/${listId}/order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ordered_media_ids: next.map((m) => m.id) }),
    })
    await refresh()
  }

  async function addMember(e: Event) {
    e.preventDefault()
    if (!memberId.trim()) return
    await fetch(`/api/lists/${listId}/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actor_id: memberId.trim(), role: 'editor' }),
    })
    setMemberId('')
    await refresh()
  }

  async function removeMember(id: string) {
    await fetch(`/api/lists/${listId}/members/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    })
    await refresh()
  }

  return (
    <div class="space-y-8">
      <section>
        <h2 class="text-lg font-semibold mb-2">Add a title</h2>
        <input
          type="search"
          value={q}
          onInput={(e) => setQ((e.target as HTMLInputElement).value)}
          placeholder="Search movies and TV shows..."
          class="w-full px-4 py-2 rounded-lg bg-neutral-800 border border-neutral-700 focus:outline-none focus:border-neutral-500"
        />
        {results.length > 0 && (
          <ul class="mt-2 divide-y divide-neutral-800 border border-neutral-800 rounded-lg">
            {results.map((m) => (
              <li
                key={m.id}
                class="flex items-center gap-3 py-2 px-3 hover:bg-neutral-800/50"
              >
                {m.poster_path ? (
                  <img
                    src={`https://image.tmdb.org/t/p/w92${m.poster_path}`}
                    class="w-8 h-12 object-cover rounded shrink-0"
                    alt=""
                  />
                ) : (
                  <div class="w-8 h-12 bg-neutral-700 rounded shrink-0" />
                )}
                <span class="flex-1 text-sm">
                  {m.title}
                  {m.year ? ` (${m.year})` : ''}
                </span>
                <button
                  onClick={() => addMedia(m.id)}
                  class="text-sm px-3 py-1 rounded bg-neutral-100 text-neutral-900 font-medium"
                >
                  Add
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 class="text-lg font-semibold mb-2">Titles</h2>
        {items.length === 0 ? (
          <p class="text-neutral-400 text-sm">No titles yet.</p>
        ) : (
          <ul class="divide-y divide-neutral-800">
            {items.map((m, i) => (
              <li key={m.id} class="flex items-center gap-3 py-3">
                <span class="w-6 text-neutral-500 text-sm tabular-nums">
                  {i + 1}
                </span>
                {m.poster_path ? (
                  <img
                    src={`https://image.tmdb.org/t/p/w92${m.poster_path}`}
                    class="w-10 h-14 object-cover rounded shrink-0"
                    alt=""
                  />
                ) : (
                  <div class="w-10 h-14 bg-neutral-700 rounded shrink-0" />
                )}
                <span class="flex-1 font-medium">{m.title}</span>
                <div class="flex items-center gap-1">
                  <button
                    onClick={() => move(i, -1)}
                    disabled={i === 0}
                    class="px-2 py-1 rounded bg-neutral-800 disabled:opacity-30"
                    aria-label="Move up"
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => move(i, 1)}
                    disabled={i === items.length - 1}
                    class="px-2 py-1 rounded bg-neutral-800 disabled:opacity-30"
                    aria-label="Move down"
                  >
                    ↓
                  </button>
                  <button
                    onClick={() => removeMedia(m.id)}
                    class="px-2 py-1 rounded bg-neutral-800 text-red-400"
                    aria-label="Remove"
                  >
                    ✕
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 class="text-lg font-semibold mb-2">Members</h2>
        <ul class="divide-y divide-neutral-800 mb-3">
          {members.map((mem) => (
            <li
              key={mem.actor_id}
              class="flex items-center justify-between py-2 text-sm"
            >
              <span class="truncate">
                {mem.actor_id === actorId ? 'You' : mem.actor_id}
                <span class="ml-2 text-neutral-500">({mem.role})</span>
              </span>
              {mem.role !== 'owner' && (
                <button
                  onClick={() => removeMember(mem.actor_id)}
                  class="text-red-400"
                >
                  Remove
                </button>
              )}
            </li>
          ))}
        </ul>
        <form onSubmit={addMember} class="flex gap-2">
          <input
            type="text"
            value={memberId}
            onInput={(e) => setMemberId((e.target as HTMLInputElement).value)}
            placeholder="Member id to invite..."
            class="flex-1 px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 focus:outline-none focus:border-neutral-500 text-sm"
          />
          <button
            type="submit"
            class="px-3 py-2 rounded-lg bg-neutral-100 text-neutral-900 font-medium text-sm"
          >
            Invite
          </button>
        </form>
      </section>
    </div>
  )
}
