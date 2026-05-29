export type MediaType = 'movie' | 'tv'

export interface MediaItem {
  id: number
  tmdb_id: string
  media_type: MediaType
  title: string
  overview: string | null
  poster_path: string | null
  backdrop_path: string | null
  rating: number | null
  vote_count: number | null
  year: number | null
  runtime: number | null
  seasons: number | null
  episodes: number | null
  status: string | null
  fetched_at: string
}
