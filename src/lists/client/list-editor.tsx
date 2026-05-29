import { useState, useEffect } from 'hono/jsx/dom'
import type { MediaItem } from '../../types'
import {
  Card,
  CardBody,
  Button,
  TextInput,
  Badge,
  MediaRow,
  EmptyState,
  IconSearch,
  IconPlus,
  IconClose,
  IconChevronUp,
  IconChevronDown,
  IconFilm,
} from '../../components/ui'

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
    <div class="space-y-6">
      <Card>
        <CardBody>
          <h2 class="text-lg font-semibold">Add a title</h2>
          <label class="input mt-3 flex w-full items-center gap-3">
            <IconSearch class="text-base-content/40" />
            <input
              type="search"
              value={q}
              onInput={(e) => setQ((e.target as HTMLInputElement).value)}
              placeholder="Search movies and TV shows…"
              class="grow"
            />
          </label>
          {results.length > 0 ? (
            <ul class="mt-3 divide-y divide-base-300/70 overflow-hidden rounded-box border border-base-300">
              {results.map((m) => (
                <li key={m.id} class="px-1">
                  <MediaRow
                    item={m}
                    trailing={
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => addMedia(m.id)}
                        aria-label={`Add ${m.title}`}
                      >
                        <IconPlus />
                        Add
                      </Button>
                    }
                  />
                </li>
              ))}
            </ul>
          ) : null}
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <h2 class="flex items-center gap-2 text-lg font-semibold">
            Titles
            <Badge variant="ghost" size="sm">
              {items.length}
            </Badge>
          </h2>
          {items.length === 0 ? (
            <EmptyState
              class="mt-3"
              icon={<IconFilm />}
              title="No titles yet"
              description="Search above to add movies and shows to this list."
            />
          ) : (
            <ul class="mt-3 divide-y divide-base-300/70">
              {items.map((m, i) => (
                <li key={m.id} class="flex items-center gap-2 py-1">
                  <span class="w-6 shrink-0 text-center text-sm tabular-nums text-base-content/40">
                    {i + 1}
                  </span>
                  <div class="min-w-0 flex-1">
                    <MediaRow item={m} href={`/media/${m.id}`} />
                  </div>
                  <div class="flex shrink-0 items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      square
                      onClick={() => move(i, -1)}
                      disabled={i === 0}
                      aria-label="Move up"
                    >
                      <IconChevronUp />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      square
                      onClick={() => move(i, 1)}
                      disabled={i === items.length - 1}
                      aria-label="Move down"
                    >
                      <IconChevronDown />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      square
                      class="text-error"
                      onClick={() => removeMedia(m.id)}
                      aria-label="Remove"
                    >
                      <IconClose />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <h2 class="text-lg font-semibold">Members</h2>
          <ul class="mt-3 divide-y divide-base-300/70">
            {members.map((mem) => (
              <li
                key={mem.actor_id}
                class="flex items-center justify-between gap-3 py-2.5"
              >
                <span class="flex min-w-0 items-center gap-2">
                  <span class="truncate text-sm font-medium">
                    {mem.actor_id === actorId ? 'You' : mem.actor_id}
                  </span>
                  <Badge
                    variant={mem.role === 'owner' ? 'primary' : 'ghost'}
                    size="sm"
                  >
                    {mem.role}
                  </Badge>
                </span>
                {mem.role !== 'owner' ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    class="text-error"
                    onClick={() => removeMember(mem.actor_id)}
                  >
                    Remove
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
          <form
            onSubmit={addMember}
            class="mt-4 flex flex-col gap-2 sm:flex-row"
          >
            <TextInput
              type="text"
              size="sm"
              value={memberId}
              onInput={(e) => setMemberId((e.target as HTMLInputElement).value)}
              placeholder="Member id to invite…"
              aria-label="Member id to invite"
            />
            <Button
              type="submit"
              variant="secondary"
              size="sm"
              disabled={!memberId.trim()}
              class="shrink-0"
            >
              Invite
            </Button>
          </form>
        </CardBody>
      </Card>
    </div>
  )
}
