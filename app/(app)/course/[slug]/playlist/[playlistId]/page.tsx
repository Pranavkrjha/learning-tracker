import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  ChevronRight, Clock, Play, CheckCircle, RefreshCw,
  Zap, CalendarDays, BarChart2, ListVideo,
} from 'lucide-react'
import type { Metadata } from 'next'
import { getCourseBySlug } from '@/lib/services/courses'
import { getPlaylistById } from '@/lib/services/playlists'
import { getVideosByPlaylist } from '@/lib/services/videos'
import { VideoTable } from '@/components/videos/VideoTable'
import { ProgressBar } from '@/components/shared/ProgressBar'
import { PlaylistSpeedSelector } from '@/components/playlists/PlaylistSpeedSelector'
import { PlaylistViewTracker } from './PlaylistViewTracker'
import {
  formatDurationHuman,
  effectiveDuration,
  calcFinishDays,
} from '@/lib/utils'

interface Props {
  params: Promise<{ slug: string; playlistId: string }>
}

// generateMetadata reuses the same getCourseBySlug call as the page body
// because getCourseBySlug is wrapped in React cache()
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { playlistId } = await params
  const playlist = await getPlaylistById(playlistId)
  return {
    title: playlist?.title ?? 'Playlist',
  }
}

export default async function PlaylistPage({ params }: Props) {
  const { slug, playlistId } = await params

  // All three fetches run in parallel
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
  const rawRemainingSeconds = Math.max(0, totalSeconds - watchedSeconds)

  // ── Part E: Enhanced Analytics (computed from video rows, no extra queries) ──
  const remainingVideos = totalVideos - completedVideos
  const avgVideoLength = totalVideos > 0 ? Math.round(totalSeconds / totalVideos) : 0

  // ── Part F: Speed-based projections ──
  const speed = (playlist as any).playback_speed ?? 1.00
  const effectiveRemainingSeconds = effectiveDuration(rawRemainingSeconds, speed)

  const at1h = calcFinishDays(effectiveRemainingSeconds, 1)
  const at2h = calcFinishDays(effectiveRemainingSeconds, 2)
  const at3h = calcFinishDays(effectiveRemainingSeconds, 3)
  const at4h = calcFinishDays(effectiveRemainingSeconds, 4)

  // Revision stats from video rows
  const totalRevisionCount = videos.reduce((sum, v) => sum + ((v as any).revision_count ?? 0), 0)
  const revisionVideos = videos.filter(v => ((v as any).revision_count ?? 0) > 0).length

  return (
    <div className="animate-fade-in">
      {/* Track this playlist visit (client-side, invisible) */}
      <PlaylistViewTracker
        courseId={course.id}
        courseSlug={course.slug}
        courseTitle={course.title}
        courseColor={course.color}
        playlistId={playlist.id}
        playlistTitle={playlist.title}
        videos={videos}
      />

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
      <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm p-5 mb-5">
        <div
          className="absolute top-0 left-0 right-0 h-0.5"
          style={{ background: `linear-gradient(90deg, ${course.color}, transparent)` }}
        />

        {/* Title row */}
        <div className="flex flex-col sm:flex-row sm:items-start gap-4 mb-4">
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

          {/* Progress */}
          <div className="shrink-0 sm:min-w-[200px]">
            <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
              <span>{completedVideos}/{totalVideos} completed</span>
              <span className="font-medium">{Math.round(percent)}%</span>
            </div>
            <ProgressBar value={percent} size="md" />
          </div>
        </div>

        {/* Part E: Enhanced Analytics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-4 border-t border-border/30">
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wide flex items-center gap-1">
              <ListVideo className="h-3 w-3" /> Total Videos
            </span>
            <span className="text-sm font-bold">{totalVideos}</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wide flex items-center gap-1">
              <CheckCircle className="h-3 w-3 text-emerald-400" />
              <span className="text-emerald-400">Completed</span>
            </span>
            <span className="text-sm font-bold text-emerald-400">{completedVideos}</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wide flex items-center gap-1">
              <Play className="h-3 w-3" /> Remaining
            </span>
            <span className="text-sm font-bold">{remainingVideos}</span>
          </div>
          {totalSeconds > 0 && (
            <>
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                  <Clock className="h-3 w-3" /> Total Duration
                </span>
                <span className="text-sm font-bold">{formatDurationHuman(totalSeconds)}</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                  <BarChart2 className="h-3 w-3" /> Avg Length
                </span>
                <span className="text-sm font-bold">{formatDurationHuman(avgVideoLength)}</span>
              </div>
            </>
          )}
        </div>

        {/* Secondary stats row */}
        <div className="flex flex-wrap gap-3 mt-3">
          {watchedSeconds > 0 && (
            <div className="text-xs text-muted-foreground">
              {formatDurationHuman(watchedSeconds)} watched
            </div>
          )}
          {rawRemainingSeconds > 0 && (
            <div className="text-xs text-muted-foreground">
              {formatDurationHuman(rawRemainingSeconds)} remaining
            </div>
          )}
          {revisionVideos > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-amber-400">
              <RefreshCw className="h-3.5 w-3.5" />
              <span>{revisionVideos} videos to revise ({totalRevisionCount} total revisions)</span>
            </div>
          )}
        </div>
      </div>

      {/* Part F: Speed + Completion Projections Panel */}
      {rawRemainingSeconds > 0 && (
        <div className="rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm p-4 mb-5">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            {/* Speed selector */}
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Playback Speed
              </span>
              <PlaylistSpeedSelector
                playlistId={playlist.id}
                initialSpeed={speed}
              />
            </div>

            <div className="hidden sm:block w-px h-12 bg-border/50" />

            {/* Duration breakdown */}
            <div className="flex flex-wrap gap-4 flex-1">
              {/* Effective remaining */}
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5 flex items-center gap-1">
                  <Zap className="h-2.5 w-2.5 text-yellow-400" />
                  Effective at {speed.toFixed(2)}x
                </p>
                <p className="text-sm font-bold tabular-nums text-yellow-400">
                  {formatDurationHuman(effectiveRemainingSeconds)}
                </p>
              </div>

              {/* Divider */}
              <div className="hidden sm:block w-px bg-border/50" />

              {/* Finish estimates — Part F: 4 speeds */}
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1.5 flex items-center gap-1">
                  <CalendarDays className="h-2.5 w-2.5" />
                  Finish Estimate
                </p>
                <div className="flex items-center gap-3">
                  {[
                    { label: '1h/day', days: at1h, color: 'text-slate-400' },
                    { label: '2h/day', days: at2h, color: 'text-blue-400' },
                    { label: '3h/day', days: at3h, color: 'text-primary' },
                    { label: '4h/day', days: at4h, color: 'text-cyan-400' },
                  ].map(({ label, days, color }) => (
                    <div key={label} className="text-center">
                      <p className="text-[10px] text-muted-foreground">{label}</p>
                      <p className={`text-sm font-bold tabular-nums ${color}`}>
                        {days === 0 ? '—' : `${days}d`}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Video Table */}
      <div className="rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
        <VideoTable playlistId={playlistId} initialVideos={videos} />
      </div>
    </div>
  )
}
