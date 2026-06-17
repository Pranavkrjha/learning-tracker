/**
 * YouTube Data API v3 — SERVER ONLY
 * Never import this file in client components.
 * Never prefix YOUTUBE_API_KEY with NEXT_PUBLIC_.
 */

const BASE_URL = 'https://www.googleapis.com/youtube/v3'

// ── Helpers ─────────────────────────────────────────────────────────────────

export function isYouTubeConfigured(): boolean {
  return Boolean(process.env.YOUTUBE_API_KEY)
}

export function extractPlaylistId(url: string): string | null {
  const match = url.match(/[?&]list=([a-zA-Z0-9_\-]+)/)
  return match?.[1] ?? null
}

/** ISO 8601 duration → seconds.  PT4M13S → 253 */
export function parseIsoDuration(iso: string): number {
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!m) return 0
  return (parseInt(m[1] || '0') * 3600)
       + (parseInt(m[2] || '0') * 60)
       + parseInt(m[3] || '0')
}

function apiKey(): string {
  const key = process.env.YOUTUBE_API_KEY
  if (!key) throw new Error('YOUTUBE_API_KEY is not set in .env.local')
  return key
}

// ── Types ────────────────────────────────────────────────────────────────────

export interface YouTubePlaylistMeta {
  id: string
  title: string
  description: string
  thumbnailUrl: string | null
}

export interface YouTubeVideoItem {
  videoId: string
  title: string
  position: number
  thumbnailUrl: string | null
  totalDurationSeconds: number
}

// ── Playlist metadata ────────────────────────────────────────────────────────

export async function fetchPlaylistMeta(
  ytPlaylistId: string
): Promise<YouTubePlaylistMeta> {
  const params = new URLSearchParams({
    part: 'snippet',
    id: ytPlaylistId,
    key: apiKey(),
  })

  const res = await fetch(`${BASE_URL}/playlists?${params}`, {
    cache: 'no-store',
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    const msg = (body as any)?.error?.message ?? `HTTP ${res.status}`
    throw new Error(`YouTube API error: ${msg}`)
  }

  const data = await res.json()
  const item = (data.items ?? [])[0]
  if (!item) throw new Error(`No YouTube playlist found for ID: ${ytPlaylistId}`)

  const snippet = item.snippet
  return {
    id: ytPlaylistId,
    title: snippet.title as string,
    description: (snippet.description as string) ?? '',
    thumbnailUrl:
      snippet.thumbnails?.high?.url ??
      snippet.thumbnails?.medium?.url ??
      snippet.thumbnails?.default?.url ??
      null,
  }
}

// ── All video IDs from a playlist (handles pagination) ───────────────────────

async function fetchAllPlaylistItemIds(
  ytPlaylistId: string
): Promise<{ videoId: string; title: string; position: number; thumbnailUrl: string | null }[]> {
  const results: { videoId: string; title: string; position: number; thumbnailUrl: string | null }[] = []
  let pageToken: string | undefined

  do {
    const params = new URLSearchParams({
      part: 'snippet',
      playlistId: ytPlaylistId,
      maxResults: '50',
      key: apiKey(),
      ...(pageToken ? { pageToken } : {}),
    })

    const res = await fetch(`${BASE_URL}/playlistItems?${params}`, {
      cache: 'no-store',
    })

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      const msg = (body as any)?.error?.message ?? `HTTP ${res.status}`
      throw new Error(`YouTube API error: ${msg}`)
    }

    const data = await res.json()

    for (const item of data.items ?? []) {
      const snippet = item.snippet
      const videoId = snippet?.resourceId?.videoId as string | undefined

      // Skip deleted/private videos that YouTube returns as placeholders
      if (!videoId || snippet?.title === 'Deleted video' || snippet?.title === 'Private video') {
        continue
      }

      results.push({
        videoId,
        title: snippet.title as string,
        position: snippet.position as number,
        thumbnailUrl:
          snippet.thumbnails?.medium?.url ??
          snippet.thumbnails?.default?.url ??
          null,
      })
    }

    pageToken = data.nextPageToken
  } while (pageToken)

  return results
}

// ── Video durations in batches of 50 ─────────────────────────────────────────

async function fetchDurations(
  videoIds: string[]
): Promise<Record<string, number>> {
  const durations: Record<string, number> = {}

  for (let i = 0; i < videoIds.length; i += 50) {
    const batch = videoIds.slice(i, i + 50)
    const params = new URLSearchParams({
      part: 'contentDetails',
      id: batch.join(','),
      key: apiKey(),
    })

    const res = await fetch(`${BASE_URL}/videos?${params}`, { cache: 'no-store' })
    if (!res.ok) continue

    const data = await res.json()
    for (const item of data.items ?? []) {
      durations[item.id as string] = parseIsoDuration(
        item.contentDetails?.duration ?? ''
      )
    }
  }

  return durations
}

// ── Main export: fetch full playlist with durations ──────────────────────────

export async function fetchYouTubePlaylist(
  ytPlaylistId: string
): Promise<{ meta: YouTubePlaylistMeta; videos: YouTubeVideoItem[] }> {
  const [meta, items] = await Promise.all([
    fetchPlaylistMeta(ytPlaylistId),
    fetchAllPlaylistItemIds(ytPlaylistId),
  ])

  const durations = await fetchDurations(items.map(i => i.videoId))

  const videos: YouTubeVideoItem[] = items.map(item => ({
    videoId: item.videoId,
    title: item.title,
    position: item.position,
    thumbnailUrl: item.thumbnailUrl,
    totalDurationSeconds: durations[item.videoId] ?? 0,
  }))

  return { meta, videos }
}
