'use client'

/**
 * WatchWorkspace — Phase 3 Focus Mode
 *
 * Client component: owns the YouTube IFrame API lifecycle,
 * playlist sidebar, resume logic, and progress sync.
 *
 * Layout (desktop): 2/3 player+notes | 1/3 sidebar
 * Layout (mobile): stacked — player sticky top, then sidebar (collapsible), then notes
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ChevronRight, ChevronLeft, ChevronDown, ChevronUp,
  CheckCircle, Play, Clock, ListVideo, ArrowLeft,
} from 'lucide-react'
import { cn, formatDuration, formatDurationHuman, calculateProgress } from '@/lib/utils'
import { ProgressBar } from '@/components/shared/ProgressBar'
import { useWatchProgress, resolveResumePosition } from '@/lib/hooks/useWatchProgress'
import type { VideoRow, PlaylistRow, CourseRow } from '@/lib/types'

// ── YouTube IFrame API type (loaded globally) ─────────────────────────────
declare global {
  interface Window {
    YT: {
      Player: new (
        el: string | HTMLElement,
        opts: YTPlayerOptions
      ) => YTPlayer
      PlayerState: {
        ENDED: number
        PLAYING: number
        PAUSED: number
        BUFFERING: number
        CUED: number
      }
    }
    onYouTubeIframeAPIReady: () => void
  }
}

interface YTPlayerOptions {
  videoId: string
  playerVars?: Record<string, string | number>
  events?: {
    onReady?: (e: { target: YTPlayer }) => void
    onStateChange?: (e: { data: number }) => void
  }
}

interface YTPlayer {
  getCurrentTime(): number
  getDuration(): number
  seekTo(seconds: number, allowSeekAhead: boolean): void
  playVideo(): void
  pauseVideo(): void
  setPlaybackRate(rate: number): void
  destroy(): void
}

// ── Props ─────────────────────────────────────────────────────────────────
interface WatchWorkspaceProps {
  course: CourseRow
  playlist: PlaylistRow & { progress?: unknown }
  video: VideoRow
  allVideos: VideoRow[]
  /** Resume timestamp from ?t= query param (seconds) */
  resumeAt: number
  /** Playback speed stored per playlist */
  playbackSpeed: number
}

export function WatchWorkspace({
  course,
  playlist,
  video,
  allVideos,
  resumeAt,
  playbackSpeed,
}: WatchWorkspaceProps) {
  const router = useRouter()
  const playerRef = useRef<YTPlayer | null>(null)
  const playerContainerRef = useRef<HTMLDivElement>(null)
  const [isPlayerReady, setIsPlayerReady] = useState(false)
  const [isCompleted, setIsCompleted] = useState(video.completed)
  const [showSidebar, setShowSidebar] = useState(false) // mobile collapsed by default
  const hasResumed = useRef(false)

  // ── Progress tracking hook ─────────────────────────────────────────────
  const { onTimeUpdate, onPause, onEnded } = useWatchProgress({
    videoId: video.id,
    totalDurationSeconds: video.total_duration_seconds,
    initialWatchedSeconds: video.watched_duration_seconds,
    onCompleted: () => setIsCompleted(true),
  })

  // ── Determine resume position ──────────────────────────────────────────
  // Resolves the best resume position by comparing localStorage.updatedAt
  // against Supabase video.updated_at. Newest write wins.
  // This prevents an old device from overwriting more recent cloud progress.
  const getResumePosition = useCallback((): number => {
    return resolveResumePosition({
      urlParam: resumeAt,
      videoId: video.id,
      dbPosition: video.last_position_seconds ?? 0,
      dbUpdatedAt: video.updated_at,
    })
  }, [resumeAt, video.id, video.last_position_seconds, video.updated_at])

  // ── YouTube IFrame API initialization ──────────────────────────────────
  useEffect(() => {
    if (!video.youtube_video_id) return

    function initPlayer() {
      if (!playerContainerRef.current) return

      playerRef.current = new window.YT.Player(playerContainerRef.current, {
        videoId: video.youtube_video_id!,
        playerVars: {
          autoplay: 1,
          rel: 0,          // No related videos from other channels
          modestbranding: 1,
          iv_load_policy: 3, // No annotations
          cc_load_policy: 0,
          enablejsapi: 1,
          origin: window.location.origin,
        },
        events: {
          onReady: (e) => {
            setIsPlayerReady(true)
            // Set playback speed from playlist setting
            e.target.setPlaybackRate(playbackSpeed)
            // Resume at saved position (one-shot)
            if (!hasResumed.current) {
              const pos = getResumePosition()
              if (pos > 5) { // Skip seek for positions < 5s (practically the start)
                e.target.seekTo(pos, true)
              }
              hasResumed.current = true
            }
          },
          onStateChange: (e) => {
            const state = window.YT.PlayerState
            const player = playerRef.current
            if (!player) return

            if (e.data === state.PAUSED) {
              onPause(player.getCurrentTime())
            } else if (e.data === state.ENDED) {
              onEnded(player.getDuration())
            } else if (e.data === state.PLAYING) {
              // Time update polling — every 3 seconds while playing
              // We use a local interval so we don't re-render the component
              startTimeUpdatePolling()
            }
          },
        },
      })
    }

    // Load the YouTube IFrame API script (idempotent — only loads once globally)
    if (window.YT && window.YT.Player) {
      initPlayer()
    } else {
      window.onYouTubeIframeAPIReady = initPlayer
      if (!document.getElementById('yt-iframe-api')) {
        const script = document.createElement('script')
        script.id = 'yt-iframe-api'
        script.src = 'https://www.youtube.com/iframe_api'
        script.async = true
        document.head.appendChild(script)
      }
    }

    return () => {
      stopTimeUpdatePolling()
      playerRef.current?.destroy()
      playerRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [video.youtube_video_id])

  // ── Time update polling (while playing) ──────────────────────────────────
  // Polls every 3 seconds — only to update onTimeUpdate ref, no re-render
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)

  function startTimeUpdatePolling() {
    stopTimeUpdatePolling()
    pollingRef.current = setInterval(() => {
      const t = playerRef.current?.getCurrentTime() ?? 0
      if (t > 0) onTimeUpdate(t)
    }, 3_000)
  }

  function stopTimeUpdatePolling() {
    if (pollingRef.current) {
      clearInterval(pollingRef.current)
      pollingRef.current = null
    }
  }

  // ── Navigation helpers ────────────────────────────────────────────────
  const currentIndex = allVideos.findIndex(v => v.id === video.id)
  const prevVideo = currentIndex > 0 ? allVideos[currentIndex - 1] : null
  const nextVideo = currentIndex < allVideos.length - 1 ? allVideos[currentIndex + 1] : null
  const watchUrl = (v: VideoRow) =>
    `/course/${course.slug}/playlist/${playlist.id}/watch/${v.id}`

  // ── Render ────────────────────────────────────────────────────────────
  const progressPct = calculateProgress(video.watched_duration_seconds, video.total_duration_seconds)

  return (
    <div className="animate-fade-in">
      {/* ── Breadcrumb ─────────────────────────────────────────────── */}
      <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-4 flex-wrap">
        <Link href="/" className="hover:text-foreground transition-colors">
          Courses
        </Link>
        <ChevronRight className="h-3 w-3 shrink-0" />
        <Link href={`/course/${course.slug}`} className="hover:text-foreground transition-colors truncate">
          {course.title}
        </Link>
        <ChevronRight className="h-3 w-3 shrink-0" />
        <Link
          href={`/course/${course.slug}/playlist/${playlist.id}`}
          className="hover:text-foreground transition-colors truncate"
        >
          {playlist.title}
        </Link>
        <ChevronRight className="h-3 w-3 shrink-0" />
        <span className="text-foreground font-medium truncate">{video.title}</span>
      </nav>

      {/* ── Main workspace grid ────────────────────────────────────── */}
      {/*
        Desktop:  lg:grid-cols-3  — player+info takes 2 cols, sidebar takes 1 col
        Mobile:   single column — player sticky top, sidebar in accordion below
      */}
      <div className="lg:grid lg:grid-cols-3 lg:gap-5 space-y-4 lg:space-y-0">

        {/* ══ LEFT: Player + Video Info + Notes Placeholder ══════════ */}
        <div className="lg:col-span-2 flex flex-col gap-4">

          {/* ── Player (sticky on mobile) ──────────────────────────── */}
          <div className="sticky top-0 z-30 lg:static lg:z-auto">
            {video.youtube_video_id ? (
              <div
                className="relative w-full rounded-xl overflow-hidden bg-black shadow-2xl"
                style={{ aspectRatio: '16 / 9' }}
              >
                {/* Color accent line matching course */}
                <div
                  className="absolute top-0 left-0 right-0 h-0.5 z-10"
                  style={{ background: `linear-gradient(90deg, ${course.color}, transparent)` }}
                />
                {/* The IFrame API mounts here — div replaced by iframe */}
                <div ref={playerContainerRef} className="w-full h-full" />
                {/* Loading state — shown until player is ready */}
                {!isPlayerReady && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-20">
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-10 w-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                      <p className="text-xs text-muted-foreground">Loading player…</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* No YouTube ID — show placeholder */
              <div
                className="w-full rounded-xl bg-card/50 border border-border/50 flex items-center justify-center"
                style={{ aspectRatio: '16 / 9' }}
              >
                <div className="text-center space-y-2">
                  <Play className="h-12 w-12 text-muted-foreground/30 mx-auto" />
                  <p className="text-sm text-muted-foreground">No YouTube video linked</p>
                  <Link
                    href={`/course/${course.slug}/playlist/${playlist.id}`}
                    className="text-xs text-primary hover:underline"
                  >
                    ← Back to playlist
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* ── Video Info ─────────────────────────────────────────── */}
          <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-4">
            {/* Title + completion badge */}
            <div className="flex items-start gap-3 mb-3">
              <div className="flex-1 min-w-0">
                <h1 className="text-base font-semibold leading-snug mb-0.5">
                  {video.title}
                </h1>
                <p className="text-xs text-muted-foreground">
                  Video {currentIndex + 1} of {allVideos.length}
                  {video.total_duration_seconds > 0 && (
                    <> · {formatDurationHuman(video.total_duration_seconds)}</>
                  )}
                </p>
              </div>
              {isCompleted && (
                <div className="shrink-0 flex items-center gap-1.5 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2.5 py-1">
                  <CheckCircle className="h-3.5 w-3.5" />
                  Done
                </div>
              )}
            </div>

            {/* Progress bar */}
            {video.total_duration_seconds > 0 && !isCompleted && (
              <div className="mb-3">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>{formatDuration(video.watched_duration_seconds)} watched</span>
                  <span>{progressPct}%</span>
                </div>
                <ProgressBar value={progressPct} size="sm" />
              </div>
            )}

            {/* Prev / Next navigation */}
            <div className="flex items-center gap-2 pt-1">
              {prevVideo ? (
                <Link
                  href={watchUrl(prevVideo)}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors rounded-lg border border-border/50 hover:border-border px-3 py-1.5 bg-secondary/30"
                >
                  <ChevronLeft className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate max-w-[120px]">{prevVideo.title}</span>
                </Link>
              ) : (
                <div />
              )}
              {nextVideo && (
                <Link
                  href={watchUrl(nextVideo)}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors rounded-lg border border-border/50 hover:border-border px-3 py-1.5 bg-secondary/30 ml-auto"
                >
                  <span className="truncate max-w-[120px]">{nextVideo.title}</span>
                  <ChevronRight className="h-3.5 w-3.5 shrink-0" />
                </Link>
              )}
            </div>
          </div>

          {/* ── Mobile-only: Sidebar toggle ────────────────────────── */}
          <button
            className="lg:hidden flex items-center justify-between w-full rounded-xl border border-border/50 bg-card/50 px-4 py-3 text-sm font-medium text-left"
            onClick={() => setShowSidebar(p => !p)}
          >
            <div className="flex items-center gap-2">
              <ListVideo className="h-4 w-4 text-muted-foreground" />
              <span>Playlist Queue ({allVideos.length} videos)</span>
            </div>
            {showSidebar
              ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
              : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </button>

          {/* ── Mobile sidebar (revealed on toggle) ─────────────────── */}
          {showSidebar && (
            <div className="lg:hidden rounded-xl border border-border/50 bg-card/50 overflow-hidden">
              <PlaylistQueue
                allVideos={allVideos}
                currentVideoId={video.id}
                courseSlug={course.slug}
                playlistId={playlist.id}
              />
            </div>
          )}

          {/* ── Notes placeholder (Phase 4) ─────────────────────────── */}
          <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium text-muted-foreground">Notes</span>
              <span className="text-[10px] bg-secondary text-muted-foreground rounded-full px-2 py-0.5">
                Phase 4
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Timestamped notes will be available in the next update.
            </p>
          </div>
        </div>

        {/* ══ RIGHT: Playlist Sidebar (desktop only) ═════════════════ */}
        <div className="hidden lg:flex flex-col gap-3">
          {/* Sidebar header */}
          <div className="flex items-center gap-2 px-1">
            <ListVideo className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Queue
            </h2>
            <span className="text-xs text-muted-foreground ml-auto">
              {allVideos.filter(v => v.completed).length}/{allVideos.length}
            </span>
          </div>

          {/* Scrollable queue */}
          <div className="rounded-xl border border-border/50 bg-card/50 overflow-hidden">
            <PlaylistQueue
              allVideos={allVideos}
              currentVideoId={video.id}
              courseSlug={course.slug}
              playlistId={playlist.id}
            />
          </div>

          {/* Back to playlist link */}
          <Link
            href={`/course/${course.slug}/playlist/${playlist.id}`}
            className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors px-1"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to playlist overview
          </Link>
        </div>
      </div>
    </div>
  )
}

// ── PlaylistQueue ─────────────────────────────────────────────────────────
// Lightweight sidebar queue — shows each video with completion state.
// Clicking navigates to that video's watch page.

interface PlaylistQueueProps {
  allVideos: VideoRow[]
  currentVideoId: string
  courseSlug: string
  playlistId: string
}

function PlaylistQueue({ allVideos, currentVideoId, courseSlug, playlistId }: PlaylistQueueProps) {
  return (
    <div className="overflow-y-auto max-h-[calc(100vh-200px)] lg:max-h-[70vh] scrollbar-thin divide-y divide-border/30">
      {allVideos.map((v, idx) => {
        const isCurrent = v.id === currentVideoId
        const progress = calculateProgress(v.watched_duration_seconds, v.total_duration_seconds)

        return (
          <Link
            key={v.id}
            href={`/course/${courseSlug}/playlist/${playlistId}/watch/${v.id}`}
            className={cn(
              'flex items-start gap-3 px-3 py-2.5 transition-colors',
              isCurrent
                ? 'bg-primary/10 border-l-2 border-primary'
                : 'hover:bg-secondary/40 border-l-2 border-transparent',
              v.completed && !isCurrent && 'opacity-60'
            )}
          >
            {/* Index / icon */}
            <div className="shrink-0 mt-0.5 w-5 text-center">
              {v.completed ? (
                <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
              ) : isCurrent ? (
                <Play className="h-3.5 w-3.5 text-primary fill-primary" />
              ) : (
                <span className="text-[11px] text-muted-foreground tabular-nums">{idx + 1}</span>
              )}
            </div>

            {/* Thumbnail (small) */}
            {v.thumbnail_url && (
              <div className="shrink-0 w-12 h-7 rounded overflow-hidden ring-1 ring-border/40">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={v.thumbnail_url}
                  alt=""
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            )}

            {/* Title + duration */}
            <div className="flex-1 min-w-0">
              <p className={cn(
                'text-xs leading-snug line-clamp-2',
                isCurrent ? 'font-semibold text-foreground' : 'text-muted-foreground',
                v.completed && 'line-through'
              )}>
                {v.title}
              </p>
              {v.total_duration_seconds > 0 && (
                <div className="flex items-center gap-1.5 mt-0.5">
                  {!v.completed && progress > 0 && (
                    <div className="flex-1 max-w-[60px]">
                      <ProgressBar value={progress} size="sm" animated={false} />
                    </div>
                  )}
                  <span className="text-[10px] text-muted-foreground tabular-nums flex items-center gap-0.5">
                    <Clock className="h-2.5 w-2.5" />
                    {formatDurationHuman(v.total_duration_seconds)}
                  </span>
                </div>
              )}
            </div>
          </Link>
        )
      })}
    </div>
  )
}
