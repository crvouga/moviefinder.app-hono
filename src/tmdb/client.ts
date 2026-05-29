const TMDB_BASE = 'https://api.themoviedb.org/3'

export function getAccessToken(): string {
  const token = process.env.TMDB_API_READ_ACCESS_TOKEN
  if (!token) {
    throw new Error('TMDB_API_READ_ACCESS_TOKEN is not set (provide it via Doppler)')
  }
  return token
}

// Raw TMDB API boundary: responses are untyped on purpose and stored as-is.
export async function tmdbFetch(path: string, params: Record<string, string> = {}): Promise<any> {
  const token = getAccessToken()
  const url = new URL(`${TMDB_BASE}${path}`)
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value)
  }
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  })
  if (!res.ok) {
    throw new Error(`TMDB request failed: ${res.status} ${res.statusText}`)
  }
  return res.json()
}
