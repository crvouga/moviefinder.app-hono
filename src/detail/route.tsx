import { Hono } from 'hono'
import { DetailPage } from './detail-page'
import { getMediaById } from './queries'
import { fetchDetailAndIngest } from '../tmdb/ingest'

export const detailRoute = new Hono()

function isMinimal(media: { runtime: number | null; seasons: number | null; status: string | null }) {
  return media.runtime === null && media.seasons === null && media.status === null
}

detailRoute.get('/media/:id', async (c) => {
  const id = Number(c.req.param('id'))
  if (!Number.isInteger(id)) return c.notFound()

  let media = getMediaById(id)
  if (!media) return c.notFound()

  // Lazy-enrich: search results only carry minimal data, so pull the full record.
  if (isMinimal(media)) {
    try {
      await fetchDetailAndIngest(media.media_type, media.tmdb_id)
      media = getMediaById(id) ?? media
    } catch (err) {
      console.error('fetchDetailAndIngest failed', err)
    }
  }

  return c.html(<DetailPage media={media} />)
})
