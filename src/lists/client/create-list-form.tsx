import { useState } from 'hono/jsx/dom'
import { Button, TextInput, Alert, IconPlus } from '../../components/ui'

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
    <div class="space-y-3">
      <form onSubmit={submit} class="flex flex-col gap-2 sm:flex-row">
        <TextInput
          type="text"
          value={name}
          onInput={(e) => setName((e.target as HTMLInputElement).value)}
          placeholder="New list name…"
          aria-label="New list name"
        />
        <Button
          type="submit"
          variant="primary"
          loading={busy}
          disabled={!name.trim()}
          class="shrink-0"
        >
          {!busy ? <IconPlus /> : null}
          {busy ? 'Creating…' : 'Create list'}
        </Button>
      </form>
      {error ? <Alert variant="error">{error}</Alert> : null}
    </div>
  )
}
