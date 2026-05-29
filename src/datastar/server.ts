import type { Context } from 'hono'

/**
 * Read the Datastar signals sent with a request. For GET requests Datastar
 * encodes the signals as JSON in the `datastar` query parameter.
 */
export function readSignals<T = Record<string, unknown>>(c: Context): T {
  try {
    return JSON.parse(c.req.query('datastar') ?? '{}') as T
  } catch {
    return {} as T
  }
}

export type SseEventSource =
  | Generator<string, void, unknown>
  | AsyncGenerator<string, void, unknown>

/**
 * Stream a Datastar SSE response from a generator that yields event frames
 * (built with the helpers in `./events`). Works with sync or async generators.
 */
export function datastarResponse(
  c: Context,
  source: () => SseEventSource,
): Response {
  const encoder = new TextEncoder()
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const event of source()) {
          controller.enqueue(encoder.encode(event))
        }
      } catch (err) {
        controller.error(err)
        return
      }
      controller.close()
    },
  })

  return c.body(stream, 200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  })
}
