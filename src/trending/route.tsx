import { Hono } from 'hono'
import { TrendingPage } from './TrendingPage'
import { getTrending } from './queries'
import { fetchTrendingAndIngest } from '../tmdb/ingest'

export const trendingRoute = new Hono()

trendingRoute.get('/trending', async (c) => {
  try {
    await fetchTrendingAndIngest()
  } catch (err) {
    console.error('fetchTrendingAndIngest failed', err)
  }

  return c.html(<TrendingPage items={getTrending()} />)
})
