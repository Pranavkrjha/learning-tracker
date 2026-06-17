import { createClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/supabase/getUser'

export interface ContinueLearningData {
  videoId: string
  videoTitle: string
  watchedSeconds: number
  totalSeconds: number
  /** Exact playback position for resume — distinct from watchedSeconds */
  lastPositionSeconds: number
  progressPercent: number
  remainingSeconds: number
  playlistId: string
  playlistTitle: string
  courseId: string
  courseTitle: string
  courseSlug: string
  courseColor: string
  thumbnailUrl: string | null
}

/**
 * Find the most recently updated incomplete video across all courses.
 * Uses a single JOIN query — no N+1 problem.
 */
export async function getContinueLearning(): Promise<ContinueLearningData | null> {
  const supabase = await createClient()
  const user = await getAuthUser()

  // Single query joining videos → playlists → courses
  // Finds the most recently touched incomplete video
  const { data, error } = await (supabase as any)
    .from('videos')
    .select(`
      id,
      title,
      watched_duration_seconds,
      last_position_seconds,
      total_duration_seconds,
      thumbnail_url,
      updated_at,
      playlists!inner (
        id,
        title,
        course_id,
        courses!inner (
          id,
          title,
          slug,
          color
        )
      )
    `)
    .eq('user_id', user.id)
    .eq('completed', false)
    .gt('watched_duration_seconds', 0)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error || !data) {
    return null
  }

  const playlist = Array.isArray(data.playlists) ? data.playlists[0] : data.playlists
  const course = Array.isArray(playlist?.courses) ? playlist.courses[0] : playlist?.courses

  if (!playlist || !course) return null

  const watched = data.watched_duration_seconds ?? 0
  const total = data.total_duration_seconds ?? 0
  const lastPos = data.last_position_seconds ?? 0
  const remaining = Math.max(0, total - watched)
  const percent = total > 0 ? Math.round((watched / total) * 100) : 0

  return {
    videoId: data.id,
    videoTitle: data.title,
    watchedSeconds: watched,
    totalSeconds: total,
    lastPositionSeconds: lastPos,
    progressPercent: percent,
    remainingSeconds: remaining,
    playlistId: playlist.id,
    playlistTitle: playlist.title,
    courseId: course.id,
    courseTitle: course.title,
    courseSlug: course.slug,
    courseColor: course.color,
    thumbnailUrl: data.thumbnail_url ?? null,
  }
}
