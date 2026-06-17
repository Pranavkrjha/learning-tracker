import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getCourseBySlug } from '@/lib/services/courses'
import { getPlaylistById } from '@/lib/services/playlists'
import { getVideosByPlaylist, getVideoById } from '@/lib/services/videos'
import { WatchWorkspace } from './WatchWorkspace'

interface Props {
  params: Promise<{ slug: string; playlistId: string; videoId: string }>
  searchParams: Promise<{ t?: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { videoId } = await params
  const video = await getVideoById(videoId)
  return {
    title: video?.title ? `Watch: ${video.title}` : 'Focus Mode',
  }
}

export default async function WatchPage({ params, searchParams }: Props) {
  const { slug, playlistId, videoId } = await params
  const { t } = await searchParams

  // Parse ?t= resume param — safe parse, default 0
  const resumeAt = t ? Math.max(0, parseInt(t, 10) || 0) : 0

  // Parallel data fetching — reuse cached getCourseBySlug
  const [course, playlist, video, allVideos] = await Promise.all([
    getCourseBySlug(slug),
    getPlaylistById(playlistId),
    getVideoById(videoId),
    getVideosByPlaylist(playlistId),
  ])

  if (!course || !playlist || !video) notFound()

  // Verify this video actually belongs to this playlist (security check)
  if (video.playlist_id !== playlistId) notFound()

  const playbackSpeed = (playlist as any).playback_speed ?? 1.0

  return (
    <WatchWorkspace
      course={course}
      playlist={playlist}
      video={video}
      allVideos={allVideos}
      resumeAt={resumeAt}
      playbackSpeed={playbackSpeed}
    />
  )
}
