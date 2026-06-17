'use client'

import { Plus, Video } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { VideoTableRow } from './VideoRow'
import { AddVideoModal } from './AddVideoModal'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/shared/EmptyState'
import { Skeleton } from '@/components/ui/skeleton'
import { useVideos } from '@/lib/hooks/useVideos'
import { toast } from 'sonner'
import type { CreateVideoForm } from '@/lib/types'

interface VideoTableProps {
  playlistId: string
  courseSlug: string
  initialVideos?: import('@/lib/types').VideoRow[]
}

export function VideoTable({ playlistId, courseSlug, initialVideos }: VideoTableProps) {
  const {
    videos,
    loading,
    error,
    savingIds,
    addVideo,
    updateVideo,
    toggleCompleted,
    toggleRevision,
    incrementRevision,
    decrementRevision,
    deleteVideo,
  } = useVideos(playlistId, initialVideos)

  const [showAddModal, setShowAddModal] = useState(false)
  const [lastWatchedId, setLastWatchedId] = useState<string | null>(null)
  const lastWatchedRef = useRef<HTMLTableRowElement | null>(null)

  // Read last watched video from sessionStorage (set by PlaylistViewTracker)
  useEffect(() => {
    try {
      const id = sessionStorage.getItem(`last_watched_${playlistId}`)
      if (id) setLastWatchedId(id)
    } catch {}
  }, [playlistId])

  // Scroll to last watched row once videos are loaded
  useEffect(() => {
    if (lastWatchedRef.current && !loading) {
      setTimeout(() => {
        lastWatchedRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 300)
    }
  }, [lastWatchedId, loading])

  const displayVideos = videos.length > 0 ? videos : (initialVideos ?? [])

  async function handleAddVideo(form: CreateVideoForm) {
    try {
      await addVideo(form)
      toast.success('Video added successfully')
    } catch {
      toast.error('Failed to add video')
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteVideo(id)
      toast.success('Video deleted')
    } catch {
      toast.error('Failed to delete video')
    }
  }

  if (loading && displayVideos.length === 0) {
    return (
      <div className="space-y-2 p-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-lg" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8 text-center text-sm text-destructive">
        {error}
      </div>
    )
  }

  return (
    <div>
      {/* Table Header Actions */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Video className="h-4 w-4" />
          <span>{displayVideos.length} {displayVideos.length === 1 ? 'video' : 'videos'}</span>
        </div>
        <Button
          id="add-video-btn"
          size="sm"
          onClick={() => setShowAddModal(true)}
          className="h-8 gap-1.5 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white border-0 text-xs"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Video
        </Button>
      </div>

      {displayVideos.length === 0 ? (
        <EmptyState
          icon={Video}
          title="No videos yet"
          description="Add your first video to start tracking progress in this playlist."
          action={
            <Button
              id="add-first-video-btn"
              onClick={() => setShowAddModal(true)}
              className="bg-gradient-to-r from-indigo-500 to-violet-600 text-white border-0"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add First Video
            </Button>
          }
        />
      ) : (
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border/50 bg-secondary/20">
                {/* # — narrow index column */}
                <th className="py-2.5 pl-4 pr-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide w-8">
                  #
                </th>
                {/* Video title + thumbnail — always visible, expands to fill space */}
                <th className="py-2.5 px-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                  Video
                </th>
                {/* Total duration — hidden on mobile */}
                <th className="py-2.5 px-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide w-20 hidden sm:table-cell">
                  Total
                </th>
                {/* Watched duration — hidden on mobile/tablet */}
                <th className="py-2.5 px-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide w-28 hidden md:table-cell">
                  Watched
                </th>
                {/* Remaining — hidden on mobile/tablet */}
                <th className="py-2.5 px-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide w-20 hidden lg:table-cell">
                  Left
                </th>
                {/* Done — always visible */}
                <th className="py-2.5 px-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide w-12 text-center">
                  Done
                </th>
                {/* Notes — always visible (was xl:only) */}
                <th className="py-2.5 px-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide w-16 text-center">
                  Notes
                </th>
                {/* Revisions — always visible */}
                <th className="py-2.5 px-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide w-24 text-center">
                  Revs
                </th>
                {/* Focus Mode — always visible, icon-only on mobile */}
                <th className="py-2.5 px-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide w-14 text-center">
                  Focus
                </th>
                {/* Delete — invisible header, always present */}
                <th className="py-2.5 pl-1 pr-3 w-8" />
              </tr>
            </thead>
            <tbody>
              {displayVideos.map((video, idx) => (
                <VideoTableRow
                  key={video.id}
                  video={video}
                  index={idx}
                  isSaving={savingIds.has(video.id)}
                  isLastWatched={video.id === lastWatchedId}
                  rowRef={video.id === lastWatchedId ? lastWatchedRef : undefined}
                  courseSlug={courseSlug}
                  playlistId={playlistId}
                  onUpdate={updateVideo}
                  onToggleCompleted={toggleCompleted}
                  onToggleRevision={toggleRevision}
                  onIncrementRevision={incrementRevision}
                  onDecrementRevision={decrementRevision}
                  onDelete={handleDelete}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AddVideoModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddVideo}
      />
    </div>
  )
}
