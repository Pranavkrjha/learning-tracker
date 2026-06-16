'use client'

import { useMemo } from 'react'
import type { VideoRow } from '@/lib/types'
import { calculateProgress } from '@/lib/utils'

export function useProgress(videos: VideoRow[]) {
  return useMemo(() => {
    const totalVideos = videos.length
    const completedVideos = videos.filter(v => v.completed).length
    const revisionVideos = videos.filter(v => v.revision_needed).length
    const totalSeconds = videos.reduce((sum, v) => sum + v.total_duration_seconds, 0)
    const watchedSeconds = videos.reduce((sum, v) => sum + v.watched_duration_seconds, 0)
    const remainingSeconds = Math.max(0, totalSeconds - watchedSeconds)
    const progressPercent = calculateProgress(watchedSeconds, totalSeconds)
    const completionPercent = totalVideos > 0
      ? Math.round((completedVideos / totalVideos) * 100)
      : 0

    return {
      totalVideos,
      completedVideos,
      revisionVideos,
      totalSeconds,
      watchedSeconds,
      remainingSeconds,
      progressPercent,
      completionPercent,
    }
  }, [videos])
}
