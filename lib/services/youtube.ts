/**
 * YouTube Data API v3 service — SERVER ONLY
 * This file is intentionally kept as a stub until the YouTube API key is configured.
 *
 * Do NOT import this in client components.
 * Do NOT prefix YOUTUBE_API_KEY with NEXT_PUBLIC_.
 */

const BASE_URL = 'https://www.googleapis.com/youtube/v3'

// ── Extract playlist ID from any YouTube URL ────────────────────────────────
export function extractPlaylistId(url: string): string | null {
  const match = url.match(/[?&]list=([a-zA-Z0-9_\-]+)/)
  return match?.[1] ?? null
}

// ── Parse ISO 8601 duration → seconds (PT4M13S → 253) ─────────────────────
export function parseIsoDuration(iso: string): number {
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!m) return 0
  return (parseInt(m[1] || '0') * 3600)
       + (parseInt(m[2] || '0') * 60)
       + parseInt(m[3] || '0')
}

// ── Validate that a YouTube API key is configured ──────────────────────────
export function isYouTubeConfigured(): boolean {
  return Boolean(process.env.YOUTUBE_API_KEY)
}

// TODO: Implement when YOUTUBE_API_KEY is added to .env.local
// See implementation_plan.md for full design

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function fetchYouTubePlaylist(_youtubePlaylistId: string): Promise<never[]> {
  throw new Error(
    'YouTube import is not yet implemented. Add YOUTUBE_API_KEY to .env.local to enable.'
  )
}
