import { useState } from 'hono/jsx/dom'

export function CreateListForm() {
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: Event) {
    e.preventDefault()
    if (!name.trim() || busy) return
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      })
      if (!res.ok) throw new Error(`Request failed (${res.status})`)
      const { list_id } = (await res.json()) as { list_id: string }
      window.location.href = `/lists/${list_id}`
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} class="flex gap-2">
      <input
        type="text"
        value={name}
        onInput={(e) => setName((e.target as HTMLInputElement).value)}
        placeholder="New list name..."
        class="flex-1 px-4 py-2 rounded-lg bg-neutral-800 border border-neutral-700 focus:outline-none focus:border-neutral-500"
      />
      <button
        type="submit"
        disabled={busy || !name.trim()}
        class="px-4 py-2 rounded-lg bg-neutral-100 text-neutral-900 font-medium disabled:opacity-50"
      >
        {busy ? 'Creating...' : 'Create list'}
      </button>
      {error && <span class="text-sm text-red-400 self-center">{error}</span>}
    </form>
  )
}
