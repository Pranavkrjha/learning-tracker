'use client'

import { useRouter } from 'next/navigation'
import { Play, Clock, MoreVertical, Trash2, RefreshCw } from 'lucide-react'
import { ProgressBar } from '@/components/shared/ProgressBar'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatDurationHuman } from '@/lib/utils'
import type { PlaylistWithProgress } from '@/lib/types'
import { cn } from '@/lib/utils'

function YouTubeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  )
}

interface PlaylistCardProps {
  playlist: PlaylistWithProgress
  courseSlug: string
  onDelete?: (id: string) => void
  /** Called when user clicks "Import" on the YouTube CTA or from the menu */
  onImportYouTube?: (playlistId: string, ytUrl: string) => void
  className?: string
}

export function PlaylistCard({
  playlist,
  courseSlug,
  onDelete,
  onImportYouTube,
  className,
}: PlaylistCardProps) {
  const router = useRouter()

  const progress = playlist.progress
  const percent = progress?.progress_percent ?? 0
  const totalVideos = progress?.total_videos ?? 0
  const completedVideos = progress?.completed_videos ?? 0
  const totalSeconds = progress?.total_duration_seconds ?? 0
  const isCompleted = totalVideos > 0 && completedVideos === totalVideos
  const hasYouTubeUrl = Boolean(playlist.youtube_playlist_url)
  const isEmptyYouTube = hasYouTubeUrl && totalVideos === 0

  function handleCardClick() {
    router.push(`/course/${courseSlug}/playlist/${playlist.id}`)
  }

  function stopNav(e: React.MouseEvent) {
    e.stopPropagation()
  }

  function handleImport(e: React.MouseEvent) {
    e.stopPropagation()
    if (playlist.youtube_playlist_url && onImportYouTube) {
      onImportYouTube(playlist.id, playlist.youtube_playlist_url)
    }
  }

  return (
    <div
      role="article"
      tabIndex={0}
      aria-label={`Playlist: ${playlist.title}`}
      onClick={handleCardClick}
      onKeyDown={(e) => e.key === 'Enter' && handleCardClick()}
      className={cn(
        'group relative flex flex-col gap-3 rounded-xl border border-border/50 bg-card/40 p-4',
        'backdrop-blur-sm transition-all duration-200 cursor-pointer',
        'hover:border-border hover:bg-card/60 hover:shadow-lg hover:shadow-black/5',
        'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
        className
      )}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary/60 text-muted-foreground group-hover:text-primary transition-colors">
          {hasYouTubeUrl
            ? <YouTubeIcon className="h-4 w-4 text-red-400 group-hover:text-red-400" />
            : <Play className="h-4 w-4" />
          }
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            {isCompleted && (
              <Badge className="h-4 text-[10px] bg-emerald-500/15 text-emerald-400 border-emerald-500/25">
                ✓ Done
              </Badge>
            )}
            {hasYouTubeUrl && (
              <Badge variant="outline" className="h-4 text-[10px] gap-1 border-red-500/30 text-red-400">
                <YouTubeIcon className="h-2.5 w-2.5" /> YouTube
              </Badge>
            )}
          </div>
          <p className="font-semibold text-sm leading-snug line-clamp-2 group-hover:text-primary transition-colors">
            {playlist.title}
          </p>
          {playlist.description && (
            <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
              {playlist.description}
            </p>
          )}
        </div>

        {/* Three-dot menu */}
        {onDelete && (
          <div onClick={stopNav}>
            <DropdownMenu>
              <DropdownMenuTrigger render={
                <button
                  id={`playlist-menu-${playlist.id}`}
                  type="button"
                  onClick={stopNav}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:bg-secondary hover:text-foreground"
                >
                  <MoreVertical className="h-3.5 w-3.5" />
                </button>
              } />
              <DropdownMenuContent align="end" onClick={stopNav}>
                <DropdownMenuItem
                  onClick={(e) => { e.stopPropagation(); router.push(`/course/${courseSlug}/playlist/${playlist.id}`) }}
                  className="cursor-pointer"
                >
                  <Play className="h-3.5 w-3.5 mr-2" /> Open Playlist
                </DropdownMenuItem>
                {hasYouTubeUrl && onImportYouTube && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={(e) => { e.stopPropagation(); onImportYouTube(playlist.id, playlist.youtube_playlist_url!) }}
                      className="cursor-pointer"
                    >
                      <RefreshCw className="h-3.5 w-3.5 mr-2" /> Sync from YouTube
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onClick={(e) => { e.stopPropagation(); onDelete(playlist.id) }}
                  className="cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-2" />
                  Delete Playlist
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span>{completedVideos}/{totalVideos} videos</span>
        {totalSeconds > 0 && (
          <>
            <span className="text-border">•</span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDurationHuman(totalSeconds)}
            </span>
          </>
        )}
        <span className="text-border">•</span>
        <span className="font-medium text-foreground/70">{Math.round(percent)}%</span>
      </div>

      {/* Import CTA — only for YouTube-linked playlists with no videos yet */}
      {isEmptyYouTube && onImportYouTube && (
        <button
          type="button"
          onClick={handleImport}
          id={`import-cta-${playlist.id}`}
          className="flex items-center gap-2 rounded-lg bg-red-500/8 border border-red-500/20 px-3 py-2 w-full text-left hover:bg-red-500/15 transition-colors"
        >
          <YouTubeIcon className="h-3.5 w-3.5 text-red-400 shrink-0" />
          <span className="text-xs text-red-400 flex-1">YouTube linked — click to import videos</span>
          <RefreshCw className="h-3 w-3 text-red-400 shrink-0" />
        </button>
      )}

      {/* Progress bar */}
      <ProgressBar value={percent} size="sm" />
    </div>
  )
}
