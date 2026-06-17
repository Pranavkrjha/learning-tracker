'use client'

import { useState, useRef, useEffect } from 'react'
import { Loader2, Trash2, ChevronDown, ChevronUp, ExternalLink, Minus, Plus, PlayCircle } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ProgressBar } from '@/components/shared/ProgressBar'
import {
  formatDuration,
  parseDuration,
  calculateProgress,
  getRemainingSeconds,
  cn,
} from '@/lib/utils'
import type { VideoRow, UpdateVideoForm } from '@/lib/types'

interface VideoRowProps {
  video: VideoRow
  index: number
  isSaving: boolean
  isLastWatched?: boolean
  rowRef?: React.Ref<HTMLTableRowElement>
  onUpdate: (id: string, data: UpdateVideoForm) => Promise<void>
  onToggleCompleted: (id: string) => Promise<void>
  onToggleRevision: (id: string) => Promise<void>
  onIncrementRevision: (id: string) => Promise<void>
  onDecrementRevision: (id: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

export function VideoTableRow({
  video,
  index,
  isSaving,
  isLastWatched = false,
  rowRef,
  onUpdate,
  onToggleCompleted,
  onIncrementRevision,
  onDecrementRevision,
  onDelete,
}: VideoRowProps) {
  const [editingDuration, setEditingDuration] = useState(false)
  const [durationInput, setDurationInput] = useState('')
  const [showNotes, setShowNotes] = useState(false)
  const [notesValue, setNotesValue] = useState(video.notes ?? '')
  const durationRef = useRef<HTMLInputElement>(null)

  const remaining = getRemainingSeconds(video)
  const progress = calculateProgress(video.watched_duration_seconds, video.total_duration_seconds)
  const revCount = video.revision_count ?? 0

  useEffect(() => {
    if (editingDuration && durationRef.current) {
      durationRef.current.focus()
      durationRef.current.select()
    }
  }, [editingDuration])

  function startEditingDuration() {
    setDurationInput(formatDuration(video.watched_duration_seconds))
    setEditingDuration(true)
  }

  async function commitDuration() {
    const seconds = parseDuration(durationInput)
    const clamped = Math.min(seconds, video.total_duration_seconds)
    setEditingDuration(false)
    if (clamped !== video.watched_duration_seconds) {
      await onUpdate(video.id, {
        watched_duration_seconds: clamped,
        ...(clamped >= video.total_duration_seconds && video.total_duration_seconds > 0
          ? { completed: true }
          : {}),
      })
    }
  }

  async function saveNotes() {
    if (notesValue !== (video.notes ?? '')) {
      await onUpdate(video.id, { notes: notesValue })
    }
  }

  function openInYouTube() {
    if (video.youtube_video_id) {
      window.open(`https://www.youtube.com/watch?v=${video.youtube_video_id}`, '_blank', 'noopener,noreferrer')
    }
  }

  return (
    <>
      <tr
        ref={rowRef as React.Ref<HTMLTableRowElement>}
        className={cn(
          'group border-b border-border/30 transition-colors',
          video.completed
            ? 'bg-emerald-500/[0.03]'
            : 'hover:bg-secondary/30',
          revCount > 0 && !video.completed && 'bg-amber-500/[0.03]',
          isLastWatched && !video.completed && 'bg-primary/[0.04] ring-1 ring-inset ring-primary/20'
        )}
      >
        {/* S.No */}
        <td className="py-3 pl-4 pr-2 text-xs text-muted-foreground w-10 tabular-nums">
          {isLastWatched && !video.completed
            ? <PlayCircle className="h-3.5 w-3.5 text-primary" />
            : index + 1
          }
        </td>

        {/* Video Name + Thumbnail */}
        <td className="py-2 px-3 min-w-0">
          <div className="flex items-center gap-3">
            {/* Thumbnail */}
            {video.thumbnail_url ? (
              <div
                className={cn(
                  'relative shrink-0 rounded overflow-hidden cursor-pointer',
                  'w-16 h-9 sm:w-20 sm:h-[45px]',
                  'ring-1 ring-border/50 hover:ring-primary/50 transition-all'
                )}
                onClick={video.youtube_video_id ? openInYouTube : undefined}
                title={video.youtube_video_id ? 'Watch on YouTube' : undefined}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={video.thumbnail_url}
                  alt={video.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                {video.youtube_video_id && (
                  <div className="absolute inset-0 bg-black/30 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="h-5 w-5 bg-red-600 rounded-full flex items-center justify-center">
                      <svg viewBox="0 0 24 24" fill="white" className="h-2.5 w-2.5 ml-0.5">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    </div>
                  </div>
                )}
              </div>
            ) : video.youtube_video_id ? (
              /* Placeholder when no thumbnail but has YouTube ID */
              <div
                className="shrink-0 w-16 h-9 sm:w-20 sm:h-[45px] rounded bg-secondary/60 ring-1 ring-border/50 flex items-center justify-center cursor-pointer hover:bg-secondary transition-colors"
                onClick={openInYouTube}
                title="Watch on YouTube"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 text-red-400">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </div>
            ) : null}

            {/* Title + mini progress bar */}
            <div className="flex-1 min-w-0">
              <p
                className={cn(
                  'text-sm font-medium leading-snug line-clamp-2',
                  video.completed && 'line-through text-muted-foreground'
                )}
                title={video.title}
              >
                {video.title}
              </p>
              {isLastWatched && !video.completed && (
                <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-semibold text-primary bg-primary/10 border border-primary/20 rounded px-1.5 py-0.5">
                  <PlayCircle className="h-2.5 w-2.5" />
                  Continue Here
                </span>
              )}
              {video.total_duration_seconds > 0 && !video.completed && (
                <div className="mt-1 flex items-center gap-2">
                  <ProgressBar value={progress} size="sm" className="max-w-[100px]" />
                  <span className="text-[10px] text-muted-foreground tabular-nums">{progress}%</span>
                </div>
              )}
            </div>
          </div>
        </td>

        {/* Total Duration */}
        <td className="py-3 px-3 text-sm tabular-nums text-muted-foreground w-28 hidden sm:table-cell">
          {video.total_duration_seconds > 0
            ? formatDuration(video.total_duration_seconds)
            : <span className="text-border">—</span>}
        </td>

        {/* Watched Duration */}
        <td className="py-3 px-3 w-32 hidden md:table-cell">
          {editingDuration ? (
            <Input
              ref={durationRef}
              value={durationInput}
              onChange={(e) => setDurationInput(e.target.value)}
              onBlur={commitDuration}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitDuration()
                if (e.key === 'Escape') setEditingDuration(false)
              }}
              className="h-7 px-2 py-0 text-xs w-full"
              placeholder="MM:SS"
            />
          ) : (
            <button
              onClick={startEditingDuration}
              className="text-sm tabular-nums hover:text-primary transition-colors cursor-pointer rounded px-1 -ml-1 py-0.5"
              title="Click to edit watched duration"
            >
              {video.watched_duration_seconds > 0
                ? formatDuration(video.watched_duration_seconds)
                : <span className="text-border text-xs">click to set</span>}
            </button>
          )}
        </td>

        {/* Remaining */}
        <td className="py-3 px-3 text-sm tabular-nums hidden lg:table-cell w-28">
          {video.total_duration_seconds > 0 ? (
            <span className={remaining === 0 ? 'text-emerald-400' : 'text-muted-foreground'}>
              {remaining === 0 ? '—' : formatDuration(remaining)}
            </span>
          ) : (
            <span className="text-border">—</span>
          )}
        </td>

        {/* Completed checkbox */}
        <td className="py-3 px-3 w-16">
          <div className="flex justify-center">
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : (
              <Checkbox
                id={`completed-${video.id}`}
                checked={video.completed}
                onCheckedChange={() => onToggleCompleted(video.id)}
                className={cn(
                  video.completed
                    ? 'border-emerald-500 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500'
                    : ''
                )}
              />
            )}
          </div>
        </td>

        {/* Notes toggle */}
        <td className="py-3 px-3 hidden xl:table-cell">
          <button
            onClick={() => setShowNotes(!showNotes)}
            className={cn(
              'flex items-center gap-1 text-xs rounded px-1.5 py-0.5 transition-colors',
              video.notes
                ? 'text-primary hover:bg-primary/10'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
            )}
          >
            {video.notes ? '📝 View' : 'Add note'}
            {showNotes
              ? <ChevronUp className="h-3 w-3" />
              : <ChevronDown className="h-3 w-3" />}
          </button>
        </td>

        {/* Revision Counter [-][n][+] */}
        <td className="py-3 px-3 w-28">
          <div className="flex items-center justify-center gap-1">
            <button
              id={`revise-dec-${video.id}`}
              type="button"
              onClick={() => onDecrementRevision(video.id)}
              disabled={revCount === 0 || isSaving}
              className={cn(
                'flex h-6 w-6 items-center justify-center rounded border transition-colors text-xs',
                revCount === 0
                  ? 'border-border/30 text-border cursor-not-allowed'
                  : 'border-border/50 text-muted-foreground hover:border-amber-500/50 hover:text-amber-400 hover:bg-amber-500/10'
              )}
              title="Decrease revision count"
            >
              <Minus className="h-3 w-3" />
            </button>
            <span
              className={cn(
                'w-7 text-center text-sm font-semibold tabular-nums',
                revCount > 0 ? 'text-amber-400' : 'text-muted-foreground/40'
              )}
            >
              {revCount}
            </span>
            <button
              id={`revise-inc-${video.id}`}
              type="button"
              onClick={() => onIncrementRevision(video.id)}
              disabled={isSaving}
              className="flex h-6 w-6 items-center justify-center rounded border border-border/50 text-muted-foreground hover:border-amber-500/50 hover:text-amber-400 hover:bg-amber-500/10 transition-colors text-xs"
              title="Increase revision count"
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>
        </td>

        {/* Watch on YouTube */}
        <td className="py-3 px-3 w-16 text-center hidden sm:table-cell">
          {video.youtube_video_id ? (
            <button
              id={`watch-${video.id}`}
              type="button"
              onClick={openInYouTube}
              className="inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] font-medium text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 transition-colors"
              title="Watch on YouTube"
            >
              <ExternalLink className="h-3 w-3" />
              Watch
            </button>
          ) : (
            <span className="text-border text-xs">—</span>
          )}
        </td>

        {/* Delete */}
        <td className="py-3 pl-2 pr-4 w-10">
          <Button
            id={`delete-video-${video.id}`}
            variant="ghost"
            size="icon"
            className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
            onClick={() => onDelete(video.id)}
            title="Delete video"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </td>
      </tr>

      {/* Notes expansion row */}
      {showNotes && (
        <tr className="border-b border-border/30 bg-secondary/20">
          <td colSpan={10} className="px-4 py-3">
            <div className="space-y-2">
              <Textarea
                value={notesValue}
                onChange={(e) => setNotesValue(e.target.value)}
                onBlur={saveNotes}
                placeholder="Add your notes here..."
                rows={3}
                className="text-sm resize-none bg-background/50"
              />
              <p className="text-xs text-muted-foreground">Notes auto-save on blur</p>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}
