// Builders for Datastar Server-Sent Event frames.
// See https://data-star.dev/reference/sse_events

export type ElementPatchMode =
  | 'outer'
  | 'inner'
  | 'replace'
  | 'prepend'
  | 'append'
  | 'before'
  | 'after'
  | 'remove'

export type PatchElementsOptions = {
  selector?: string
  mode?: ElementPatchMode
  useViewTransition?: boolean
}

const EVENT_TERMINATOR = '\n\n'

/** `datastar-patch-elements` frame. Multi-line HTML is split across `data: elements` lines. */
export function patchElements(
  elements: string,
  options: PatchElementsOptions = {},
): string {
  const lines = ['event: datastar-patch-elements']
  if (options.selector) lines.push(`data: selector ${options.selector}`)
  if (options.mode) lines.push(`data: mode ${options.mode}`)
  if (options.useViewTransition) lines.push('data: useViewTransition true')
  if (elements) {
    for (const line of elements.split('\n')) {
      lines.push(`data: elements ${line}`)
    }
  }
  return lines.join('\n') + EVENT_TERMINATOR
}

/** Remove the elements matching `selector` from the DOM. */
export function removeElements(selector: string): string {
  return patchElements('', { selector, mode: 'remove' })
}

/** `datastar-patch-signals` frame to update client-side signals. */
export function patchSignals(signals: Record<string, unknown>): string {
  return (
    `event: datastar-patch-signals\n` +
    `data: signals ${JSON.stringify(signals)}` +
    EVENT_TERMINATOR
  )
}
