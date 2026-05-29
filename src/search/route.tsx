import { Hono } from 'hono'
import { SearchPage } from './search-page'
import { searchMedia } from './queries'
import { searchAndIngest } from '../tmdb/ingest'
import type { AppEnv } from '../auth/types'

export const searchRoute = new Hono<AppEnv>()

searchRoute.get('/', (c) => c.html(<SearchPage user={c.get('user')} />))

searchRoute.get('/api/search', async (c) => {
  const q = c.req.query('q')?.trim()
  if (!q) return c.json([])

  try {
    await searchAndIngest(q)
  } catch (err) {
    console.error('searchAndIngest failed', err)
  }

  return c.json(searchMedia(q))
})
