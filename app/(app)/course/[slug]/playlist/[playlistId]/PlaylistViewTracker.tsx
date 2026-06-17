'use client'

import { useEffect } from 'react'
import { useRecentlyViewed } from '@/lib/hooks/useRecentlyViewed'
import type { VideoRow } from '@/lib/types'

interface PlaylistViewTrackerProps {
  courseId: string
  courseSlug: string
  courseTitle: string
  courseColor: string
  playlistId: string
  playlistTitle: string
  videos: VideoRow[]
}

/**
 * Invisible client component that fires addView when the playlist page mounts.
 * Also stores the last watched video for the "Last Watched" marker.
 */
export function PlaylistViewTracker({
  courseId,
  courseSlug,
  courseTitle,
  courseColor,
  playlistId,
  playlistTitle,
  videos,
}: PlaylistViewTrackerProps) {
  const { addView } = useRecentlyViewed()

  useEffect(() => {
    // Find the most recently updated incomplete video (the "Continue Here" video)
    const lastWatched = videos
      .filter(v => !v.completed && v.watched_duration_seconds > 0)
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())[0]
      ?? videos.find(v => !v.completed)
      ?? null

    addView({
      courseId,
      courseSlug,
      courseTitle,
      courseColor,
      playlistId,
      playlistTitle,
      videoId: lastWatched?.id ?? null,
      videoTitle: lastWatched?.title ?? null,
    })

    // Store last watched video ID in sessionStorage so VideoTable can highlight it
    if (lastWatched) {
      try {
        sessionStorage.setItem(`last_watched_${playlistId}`, lastWatched.id)
      } catch {}
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playlistId])

  return null
}
