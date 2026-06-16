'use client'

import { useState, useRef, useEffect } from 'react'
import { Check, RefreshCw, Loader2, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
  onUpdate: (id: string, data: UpdateVideoForm) => Promise<void>
  onToggleCompleted: (id: string) => Promise<void>
  onToggleRevision: (id: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

export function VideoTableRow({
  video,
  index,
  isSaving,
  onUpdate,
  onToggleCompleted,
  onToggleRevision,
  onDelete,
}: VideoRowProps) {
  const [editingDuration, setEditingDuration] = useState(false)
  const [durationInput, setDurationInput] = useState('')
  const [showNotes, setShowNotes] = useState(false)
  const [notesValue, setNotesValue] = useState(video.notes ?? '')
  const durationRef = useRef<HTMLInputElement>(null)

  const remaining = getRemainingSeconds(video)
  const progress = calculateProgress(video.watched_duration_seconds, video.total_duration_seconds)

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
        // Auto-mark complete if watched = total
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

  return (
    <>
      <tr
        className={cn(
          'group border-b border-border/30 transition-colors',
          video.completed
            ? 'bg-emerald-500/[0.03]'
            : 'hover:bg-secondary/30',
          video.revision_needed && !video.completed && 'bg-amber-500/[0.03]'
        )}
      >
        {/* S.No */}
        <td className="py-3 pl-4 pr-2 text-xs text-muted-foreground w-10 tabular-nums">
          {index + 1}
        </td>

        {/* Video Name */}
        <td className="py-3 px-3 min-w-0">
          <div className="flex items-start gap-2">
            <div className="flex-1 min-w-0">
              <p
                className={cn(
                  'text-sm font-medium leading-snug',
                  video.completed && 'line-through text-muted-foreground'
                )}
                title={video.title}
              >
                {video.title}
              </p>
              {/* Progress mini-bar */}
              {video.total_duration_seconds > 0 && !video.completed && (
                <div className="mt-1.5 flex items-center gap-2">
                  <ProgressBar value={progress} size="sm" className="max-w-[120px]" />
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

        {/* Completed */}
        <td className="py-3 px-3 w-20">
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

        {/* Revision Needed */}
        <td className="py-3 px-3 w-20">
          <div className="flex justify-center">
            <button
              id={`revision-${video.id}`}
              onClick={() => onToggleRevision(video.id)}
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded-md transition-all',
                video.revision_needed
                  ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              )}
              title={video.revision_needed ? 'Remove revision flag' : 'Mark for revision'}
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </div>
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
          <td colSpan={9} className="px-4 py-3">
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
