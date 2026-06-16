import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight, Clock, Play, CheckCircle, RefreshCw } from 'lucide-react'
import type { Metadata } from 'next'
import { getCourseBySlug } from '@/lib/services/courses'
import { getPlaylistById } from '@/lib/services/playlists'
import { getVideosByPlaylist } from '@/lib/services/videos'
import { VideoTable } from '@/components/videos/VideoTable'
import { ProgressBar } from '@/components/shared/ProgressBar'
import { formatDurationHuman } from '@/lib/utils'

interface Props {
  params: Promise<{ slug: string; playlistId: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { playlistId } = await params
  const playlist = await getPlaylistById(playlistId)
  return {
    title: playlist?.title ?? 'Playlist',
  }
}

export default async function PlaylistPage({ params }: Props) {
  const { slug, playlistId } = await params

  const [course, playlist, videos] = await Promise.all([
    getCourseBySlug(slug),
    getPlaylistById(playlistId),
    getVideosByPlaylist(playlistId),
  ])

  if (!course || !playlist) notFound()

  const progress = playlist.progress
  const percent = progress?.progress_percent ?? 0
  const totalVideos = progress?.total_videos ?? 0
  const completedVideos = progress?.completed_videos ?? 0
  const totalSeconds = progress?.total_duration_seconds ?? 0
  const watchedSeconds = progress?.watched_duration_seconds ?? 0
  const revisionCount = videos.filter(v => v.revision_needed).length

  return (
    <div className="animate-fade-in">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-6 flex-wrap">
        <Link href="/" className="hover:text-foreground transition-colors">
          Courses
        </Link>
        <ChevronRight className="h-3.5 w-3.5 shrink-0" />
        <Link
          href={`/course/${course.slug}`}
          className="hover:text-foreground transition-colors truncate"
        >
          {course.title}
        </Link>
        <ChevronRight className="h-3.5 w-3.5 shrink-0" />
        <span className="text-foreground font-medium truncate">{playlist.title}</span>
      </nav>

      {/* Playlist Header */}
      <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm p-5 mb-6">
        <div
          className="absolute top-0 left-0 right-0 h-0.5"
          style={{ background: `linear-gradient(90deg, ${course.color}, transparent)` }}
        />

        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <div
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: course.color }}
              />
              <Link
                href={`/course/${course.slug}`}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors truncate"
              >
                {course.title}
              </Link>
            </div>
            <h1 className="text-xl font-bold leading-tight mb-1">{playlist.title}</h1>
            {playlist.description && (
              <p className="text-sm text-muted-foreground">{playlist.description}</p>
            )}
          </div>

          {/* Progress section */}
          <div className="shrink-0 sm:min-w-[180px]">
            <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
              <span>{completedVideos}/{totalVideos} completed</span>
              <span className="font-medium">{Math.round(percent)}%</span>
            </div>
            <ProgressBar value={percent} size="md" />
          </div>
        </div>

        {/* Stats row */}
        <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-border/30">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Play className="h-3.5 w-3.5" />
            <span>{totalVideos} Videos</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
            <span className="text-emerald-400">{completedVideos} Done</span>
          </div>
          {revisionCount > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-amber-400">
              <RefreshCw className="h-3.5 w-3.5" />
              <span>{revisionCount} to Revise</span>
            </div>
          )}
          {totalSeconds > 0 && (
            <>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                <span>{formatDurationHuman(totalSeconds)} total</span>
              </div>
              {watchedSeconds > 0 && watchedSeconds < totalSeconds && (
                <div className="text-xs text-muted-foreground">
                  {formatDurationHuman(totalSeconds - watchedSeconds)} remaining
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Video Table */}
      <div className="rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
        <VideoTable playlistId={playlistId} initialVideos={videos} />
      </div>
    </div>
  )
}
