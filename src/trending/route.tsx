import { Hono } from 'hono'
import { TrendingPage } from './trending-page'
import { getTrending } from './queries'
import { fetchTrendingAndIngest } from '../tmdb/ingest'
import type { AppEnv } from '../auth/types'

export const trendingRoute = new Hono<AppEnv>()

trendingRoute.get('/trending', async (c) => {
  try {
    await fetchTrendingAndIngest()
  } catch (err) {
    console.error('fetchTrendingAndIngest failed', err)
  }

  return c.html(<TrendingPage items={getTrending()} user={c.get('user')} />)
})
