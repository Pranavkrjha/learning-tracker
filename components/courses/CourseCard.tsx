'use client'

import { useRouter } from 'next/navigation'
import { BookOpen, Clock, Play, MoreVertical, Trash2, Star, Pin } from 'lucide-react'
import { CircularProgress, ProgressBar } from '@/components/shared/ProgressBar'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatDurationHuman, formatRelativeDate, truncate } from '@/lib/utils'
import type { CourseWithProgress } from '@/lib/types'
import { cn } from '@/lib/utils'

interface CourseCardProps {
  course: CourseWithProgress
  onDelete?: (id: string) => void
  onToggleFavorite?: (id: string) => void
  onTogglePin?: (id: string) => void
  style?: React.CSSProperties
}

export function CourseCard({
  course,
  onDelete,
  onToggleFavorite,
  onTogglePin,
  style,
}: CourseCardProps) {
  const router = useRouter()

  const progress = course.progress
  const percent = progress?.progress_percent ?? 0
  const totalVideos = progress?.total_videos ?? 0
  const completedVideos = progress?.completed_videos ?? 0
  const playlistCount = progress?.playlist_count ?? 0
  const totalSeconds = progress?.total_duration_seconds ?? 0

  const isCompleted = totalVideos > 0 && completedVideos === totalVideos

  // Navigate to course — only called when the card background is clicked
  function handleCardClick() {
    router.push(`/course/${course.slug}`)
  }

  // Stop click from bubbling up to the card's onClick (prevents navigation)
  function stopNav(e: React.MouseEvent) {
    e.stopPropagation()
  }

  return (
    <div
      role="article"
      tabIndex={0}
      aria-label={`Course: ${course.title}`}
      onClick={handleCardClick}
      onKeyDown={(e) => e.key === 'Enter' && handleCardClick()}
      className={cn(
        'group relative flex flex-col rounded-2xl border border-border/50 bg-card/50',
        'backdrop-blur-sm overflow-hidden transition-all duration-300 cursor-pointer',
        'hover:border-border hover:shadow-xl hover:shadow-black/10 hover:-translate-y-0.5',
        'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
        'animate-fade-in-up',
        course.is_pinned && 'ring-1 ring-primary/30'
      )}
      style={style}
    >
      {/* Color accent bar */}
      <div
        className="h-1 w-full shrink-0"
        style={{ background: `linear-gradient(90deg, ${course.color}, ${course.color}55)` }}
      />

      {/* Card Header */}
      <div className="flex items-start gap-3 p-4 pb-2">
        {/* Circular progress icon */}
        <div className="shrink-0 mt-0.5">
          <CircularProgress
            value={percent}
            size={44}
            strokeWidth={4}
            color={course.color}
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
            {course.is_pinned && (
              <Badge className="h-4 px-1.5 text-[9px] bg-primary/15 text-primary border-primary/25 gap-0.5">
                <Pin className="h-2.5 w-2.5" /> Pinned
              </Badge>
            )}
            {isCompleted && (
              <Badge className="h-4 px-1.5 text-[9px] bg-emerald-500/15 text-emerald-400 border-emerald-500/25">
                ✓ Done
              </Badge>
            )}
          </div>

          {/* Title — navigates with the card, no stopPropagation needed */}
          <p
            className="text-sm font-semibold leading-snug line-clamp-2 group-hover:text-primary transition-colors"
          >
            {course.title}
          </p>

          {course.description && (
            <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
              {truncate(course.description, 70)}
            </p>
          )}
        </div>

        {/* ─── Action buttons — each calls stopNav to prevent card navigation ─── */}
        <div
          className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={stopNav}
        >
          {/* Star / Favourite */}
          {onToggleFavorite && (
            <button
              id={`star-course-${course.id}`}
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onToggleFavorite(course.id)
              }}
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded-md transition-colors',
                course.is_favorite
                  ? 'text-amber-400 hover:text-amber-300'
                  : 'text-muted-foreground hover:text-amber-400 hover:bg-secondary'
              )}
              title={course.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Star className={cn('h-3.5 w-3.5', course.is_favorite && 'fill-current')} />
            </button>
          )}

          {/* Three-dot menu */}
          {onDelete && (
            <DropdownMenu>
              <DropdownMenuTrigger render={
                <button
                  id={`course-menu-${course.id}`}
                  type="button"
                  onClick={stopNav}
                  className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                >
                  <MoreVertical className="h-3.5 w-3.5" />
                </button>
              } />
              <DropdownMenuContent align="end" onClick={stopNav}>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation()
                    router.push(`/course/${course.slug}`)
                  }}
                  className="cursor-pointer"
                >
                  <Play className="h-3.5 w-3.5 mr-2" /> Open Course
                </DropdownMenuItem>
                {onTogglePin && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation()
                      onTogglePin(course.id)
                    }}
                    className="cursor-pointer"
                  >
                    <Pin className="h-3.5 w-3.5 mr-2" />
                    {course.is_pinned ? 'Unpin' : 'Pin to top'}
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete(course.id)
                  }}
                  className="cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-2" />
                  Delete Course
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-x-3 gap-y-1 px-4 py-1.5 flex-wrap text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <BookOpen className="h-3 w-3" />
          {playlistCount} {playlistCount === 1 ? 'playlist' : 'playlists'}
        </span>
        <span className="flex items-center gap-1">
          <Play className="h-3 w-3" />
          {completedVideos}/{totalVideos} videos
        </span>
        {totalSeconds > 0 && (
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatDurationHuman(totalSeconds)}
          </span>
        )}
      </div>

      {/* Progress bar + % */}
      <div className="px-4 pb-3 pt-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[11px] text-muted-foreground">Progress</span>
          <span className="text-[11px] font-semibold tabular-nums">{Math.round(percent)}%</span>
        </div>
        <ProgressBar value={percent} size="sm" />
        <p className="text-[10px] text-muted-foreground mt-1.5 text-right">
          Updated {formatRelativeDate(course.updated_at)}
        </p>
      </div>
    </div>
  )
}
