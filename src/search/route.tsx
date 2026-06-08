import { Hono } from 'hono'
import { SearchPage } from './search-page'
import { searchMedia } from './queries'
import { searchAndIngest } from '../tmdb/ingest'
import type { AppEnv } from '../auth/types'
import type { MediaItem } from '../types'

export const searchRoute = new Hono<AppEnv>()

searchRoute.get('/', async (c) => {
  const q = c.req.query('q')?.trim() ?? ''
  let results: MediaItem[] = []
  if (q) {
    try {
      await searchAndIngest(q)
    } catch (err) {
      console.error('searchAndIngest failed', err)
    }
    results = await searchMedia(q)
  }
  return c.html(<SearchPage query={q} results={results} user={c.get('user')} />)
})
