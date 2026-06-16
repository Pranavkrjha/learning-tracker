import Link from 'next/link'
import { BookOpen, Clock, Play, MoreVertical, Trash2 } from 'lucide-react'
import { CircularProgress, ProgressBar } from '@/components/shared/ProgressBar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatDurationHuman, generateInitials, truncate } from '@/lib/utils'
import type { CourseWithProgress } from '@/lib/types'
import { cn } from '@/lib/utils'

interface CourseCardProps {
  course: CourseWithProgress
  onDelete?: (id: string) => void
  style?: React.CSSProperties
}

export function CourseCard({ course, onDelete, style }: CourseCardProps) {
  const progress = course.progress
  const percent = progress?.progress_percent ?? 0
  const totalVideos = progress?.total_videos ?? 0
  const completedVideos = progress?.completed_videos ?? 0
  const playlistCount = progress?.playlist_count ?? 0
  const watchedSeconds = progress?.watched_duration_seconds ?? 0

  const isCompleted = totalVideos > 0 && completedVideos === totalVideos
  const isNotStarted = percent === 0 && totalVideos > 0

  return (
    <div
      className={cn(
        'group relative flex flex-col rounded-2xl border border-border/50 bg-card/50',
        'backdrop-blur-sm overflow-hidden transition-all duration-300',
        'hover:border-border hover:shadow-xl hover:shadow-black/10 hover:-translate-y-1',
        'animate-fade-in-up'
      )}
      style={style}
    >
      {/* Color accent bar */}
      <div
        className="h-1.5 w-full"
        style={{ background: `linear-gradient(90deg, ${course.color}, ${course.color}88)` }}
      />

      {/* Card Header */}
      <div className="flex items-start gap-4 p-5 pb-3">
        {/* Course Icon */}
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white font-bold text-sm shadow-lg"
          style={{
            background: `linear-gradient(135deg, ${course.color}, ${course.color}aa)`,
            boxShadow: `0 4px 16px ${course.color}30`,
          }}
        >
          {generateInitials(course.title)}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            {isCompleted && (
              <Badge variant="default" className="h-5 text-[10px] bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                ✓ Done
              </Badge>
            )}
            {isNotStarted && (
              <Badge variant="outline" className="h-5 text-[10px] text-muted-foreground">
                Not started
              </Badge>
            )}
          </div>
          <Link href={`/course/${course.slug}`} className="block">
            <h2 className="text-base font-semibold leading-snug line-clamp-2 group-hover:text-primary transition-colors">
              {course.title}
            </h2>
          </Link>
          {course.description && (
            <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
              {truncate(course.description, 80)}
            </p>
          )}
        </div>

        {/* Overflow menu */}
        {onDelete && (
          <DropdownMenu>
            <DropdownMenuTrigger render={
              <Button
                id={`course-menu-${course.id}`}
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreVertical className="h-3.5 w-3.5" />
              </Button>
            } />
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => { window.location.href = `/course/${course.slug}` }}
                className="flex items-center gap-2 cursor-pointer"
              >
                <Play className="h-3.5 w-3.5" /> Open Course
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={() => onDelete(course.id)}
                className="cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5 mr-2" />
                Delete Course
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-3 px-5 py-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <BookOpen className="h-3 w-3" />
          {playlistCount} {playlistCount === 1 ? 'playlist' : 'playlists'}
        </span>
        <span className="text-border">•</span>
        <span className="flex items-center gap-1">
          <Play className="h-3 w-3" />
          {completedVideos}/{totalVideos} videos
        </span>
        {watchedSeconds > 0 && (
          <>
            <span className="text-border">•</span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDurationHuman(watchedSeconds)} watched
            </span>
          </>
        )}
      </div>

      {/* Progress */}
      <div className="px-5 pb-5 mt-auto pt-2">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-muted-foreground">Progress</span>
          <span className="text-xs font-semibold tabular-nums">{Math.round(percent)}%</span>
        </div>
        <ProgressBar value={percent} size="sm" />
      </div>

      {/* Hover CTA overlay */}
      <Link
        href={`/course/${course.slug}`}
        className="absolute inset-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        aria-label={`Open ${course.title}`}
      />
    </div>
  )
}
