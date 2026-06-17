'use server'

/**
 * YouTube Playlist Import — Server Action (STUB)
 *
 * This Server Action is ready to implement.
 * It will become functional once YOUTUBE_API_KEY is added to .env.local
 * and the fetchYouTubePlaylist function in lib/services/youtube.ts is wired up.
 *
 * See implementation_plan.md for the full design.
 */

import { createClient } from '@/lib/supabase/server'
import { extractPlaylistId, isYouTubeConfigured } from '@/lib/services/youtube'
import type { ImportResult } from '@/lib/types'

export async function importYouTubePlaylist(
  playlistId: string,
  youtubeUrl: string
): Promise<ImportResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Validate URL
  const ytPlaylistId = extractPlaylistId(youtubeUrl)
  if (!ytPlaylistId) throw new Error('Invalid YouTube playlist URL')

  // Gate on API key
  if (!isYouTubeConfigured()) {
    throw new Error(
      'YouTube import is not yet enabled. Please add YOUTUBE_API_KEY to .env.local.'
    )
  }

  // TODO: Implement full import flow here.
  // 1. Create import_jobs row with status 'running'
  // 2. Call fetchYouTubePlaylist(ytPlaylistId)
  // 3. Bulk insert videos into DB
  // 4. Update import_jobs status to 'done' or 'failed'

  throw new Error('YouTube import is not yet implemented.')
}
