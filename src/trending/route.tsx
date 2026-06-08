import { Hono } from 'hono'
import { TrendingPage, TrendingCards } from './trending-page'
import { getTrending, PAGE_SIZE } from './queries'
import { fetchTrendingAndIngest } from '../tmdb/ingest'
import type { AppEnv } from '../auth/types'
import {
  datastarResponse,
  readSignals,
  patchElements,
  patchSignals,
  removeElements,
} from '../datastar'

export const trendingRoute = new Hono<AppEnv>()

trendingRoute.get('/trending', async (c) => {
  try {
    await fetchTrendingAndIngest()
  } catch (err) {
    console.error('fetchTrendingAndIngest failed', err)
  }

  return c.html(
    <TrendingPage items={await getTrending()} user={c.get('user')} />,
  )
})

trendingRoute.get('/trending/more', async (c) => {
  const { trendingOffset } = readSignals<{ trendingOffset?: number }>(c)
  const offset = Number(trendingOffset) || 0
  const next = await getTrending(PAGE_SIZE, offset)

  return datastarResponse(c, async function* () {
    if (next.length > 0) {
      const html = (<TrendingCards items={next} />).toString()
      yield patchElements(html, { selector: '#trending-grid', mode: 'append' })
      yield patchSignals({ trendingOffset: offset + next.length })
    }

    if (next.length < PAGE_SIZE) {
      yield removeElements('#trending-sentinel')
    }
  })
})
