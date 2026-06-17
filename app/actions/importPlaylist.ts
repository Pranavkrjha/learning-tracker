'use server'

import { createClient } from '@/lib/supabase/server'
import {
  extractPlaylistId,
  fetchYouTubePlaylist,
  isYouTubeConfigured,
} from '@/lib/services/youtube'

// ── Types ────────────────────────────────────────────────────────────────────

export interface ImportProgress {
  total: number
  imported: number
  updated: number
  skipped: number
}

export interface ImportYouTubeResult {
  playlistId: string          // our DB playlist ID (existing or newly created)
  playlistTitle: string
  total: number
  imported: number            // new videos added
  updated: number             // existing video metadata refreshed
  skipped: number             // videos that had no changes needed
  thumbnailUrl: string | null
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Import or sync a YouTube playlist into the app.
 *
 * Two modes:
 *  a) existingPlaylistId provided  → sync into that playlist
 *  b) existingPlaylistId = null    → create a new playlist under courseId
 *
 * Sync behaviour:
 *  - New videos (no matching youtube_video_id) → inserted
 *  - Existing videos → title + thumbnail + duration updated
 *  - watched_duration, notes, completed, revision_needed are NEVER overwritten
 */
export async function importYouTubePlaylist(opts: {
  youtubeUrl: string
  courseId: string
  existingPlaylistId: string | null
}): Promise<ImportYouTubeResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  if (!isYouTubeConfigured()) {
    throw new Error('YOUTUBE_API_KEY is not set. Add it to .env.local.')
  }

  // 1. Validate and extract YouTube playlist ID
  const ytPlaylistId = extractPlaylistId(opts.youtubeUrl)
  if (!ytPlaylistId) throw new Error('Invalid YouTube playlist URL. Make sure it contains ?list=...')

  // 2. Fetch all data from YouTube
  const { meta, videos } = await fetchYouTubePlaylist(ytPlaylistId)

  // 3. Resolve our DB playlist (create or use existing)
  let dbPlaylistId: string

  if (opts.existingPlaylistId) {
    dbPlaylistId = opts.existingPlaylistId

    // Update playlist metadata (title, url)
    await (supabase as any)
      .from('playlists')
      .update({
        title: meta.title,
        youtube_playlist_url: opts.youtubeUrl,
      })
      .eq('id', dbPlaylistId)
      .eq('user_id', user.id)

  } else {
    // Create new playlist
    const { data: existingPlaylists } = await supabase
      .from('playlists')
      .select('order_index')
      .eq('course_id', opts.courseId)
      .order('order_index', { ascending: false })
      .limit(1)

    const nextIndex =
      (existingPlaylists?.[0] as any)?.order_index != null
        ? ((existingPlaylists![0] as any).order_index as number) + 1
        : 0

    const { data: newPlaylist, error: plErr } = await supabase
      .from('playlists')
      .insert({
        course_id: opts.courseId,
        user_id: user.id,
        title: meta.title,
        description: meta.description || null,
        order_index: nextIndex,
        youtube_playlist_url: opts.youtubeUrl,
      } as any)
      .select('id')
      .single()

    if (plErr || !newPlaylist) {
      throw new Error(`Failed to create playlist: ${plErr?.message ?? 'unknown error'}`)
    }

    dbPlaylistId = (newPlaylist as any).id as string
  }

  // 4. Load existing videos for this playlist (for sync comparison)
  const { data: existingVideos } = await supabase
    .from('videos')
    .select('id, youtube_video_id, title, thumbnail_url, total_duration_seconds, order_index')
    .eq('playlist_id', dbPlaylistId)
    .eq('user_id', user.id)

  const existingMap = new Map<string, { id: string; title: string; thumbnail_url: string | null; total_duration_seconds: number; order_index: number }>(
    (existingVideos ?? []).map((v: any) => [v.youtube_video_id as string, v])
  )

  // 5. Insert new videos / update changed metadata
  let imported = 0
  let updated = 0
  let skipped = 0

  for (const video of videos) {
    const existing = existingMap.get(video.videoId)

    if (!existing) {
      // NEW video — insert it
      const { error } = await supabase.from('videos').insert({
        playlist_id: dbPlaylistId,
        user_id: user.id,
        title: video.title,
        youtube_video_id: video.videoId,
        thumbnail_url: video.thumbnailUrl,
        total_duration_seconds: video.totalDurationSeconds,
        order_index: video.position,
      } as any)

      if (!error) imported++
    } else {
      // EXISTING video — check if metadata needs updating
      const needsUpdate =
        existing.title !== video.title ||
        existing.thumbnail_url !== video.thumbnailUrl ||
        existing.total_duration_seconds !== video.totalDurationSeconds ||
        existing.order_index !== video.position

      if (needsUpdate) {
        await (supabase as any)
          .from('videos')
          .update({
            title: video.title,
            thumbnail_url: video.thumbnailUrl,
            total_duration_seconds: video.totalDurationSeconds,
            order_index: video.position,
            // NOTE: watched_duration, notes, completed, revision_needed are intentionally NOT updated
          })
          .eq('id', existing.id)
          .eq('user_id', user.id)

        updated++
      } else {
        skipped++
      }
    }
  }

  return {
    playlistId: dbPlaylistId,
    playlistTitle: meta.title,
    total: videos.length,
    imported,
    updated,
    skipped,
    thumbnailUrl: meta.thumbnailUrl,
  }
}
