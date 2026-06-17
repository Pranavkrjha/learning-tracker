'use client'

import { useState, useEffect } from 'react'
import { Plus, BookOpen } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { PlaylistCard } from '@/components/playlists/PlaylistCard'
import { AddPlaylistModal } from '@/components/playlists/AddPlaylistModal'
import { ImportYouTubeModal } from '@/components/playlists/ImportYouTubeModal'
import { EmptyState } from '@/components/shared/EmptyState'
import { createClient } from '@/lib/supabase/client'
import { useRecentlyViewed } from '@/lib/hooks/useRecentlyViewed'
import { toast } from 'sonner'
import type { PlaylistRow, PlaylistWithProgress, CreatePlaylistForm } from '@/lib/types'

// Inline YouTube icon
function YouTubeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  )
}

interface Props {
  courseId: string
  courseSlug: string
  courseTitle: string
  courseColor: string
  initialPlaylists: PlaylistWithProgress[]
}

export function AddPlaylistSection({
  courseId,
  courseSlug,
  courseTitle,
  courseColor,
  initialPlaylists,
}: Props) {
  const router = useRouter()
  const [playlists, setPlaylists] = useState(initialPlaylists)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)

  /** For "Import YouTube" clicked from PlaylistCard CTA on a specific playlist */
  const [importTargetPlaylist, setImportTargetPlaylist] = useState<{
    id: string
    url: string
  } | null>(null)

  const { addView } = useRecentlyViewed()

  // Track this course as recently viewed (with placeholder playlist info — updated when a playlist is opened)
  useEffect(() => {
    // Only store the course-level entry; playlist-level entries are added from the playlist page
    addView({
      courseId,
      courseSlug,
      courseTitle,
      courseColor,
      playlistId: playlists[0]?.id ?? courseId,
      playlistTitle: playlists[0]?.title ?? 'No playlists yet',
      videoId: null,
      videoTitle: null,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId])

  // ── Add playlist (manual) ──────────────────────────────────────────────────
  async function handleAddPlaylist(form: CreatePlaylistForm) {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('playlists')
        .insert({
          course_id: courseId,
          user_id: user.id,
          title: form.title,
          description: form.description ?? null,
          order_index: playlists.length,
          youtube_playlist_url: form.youtube_playlist_url ?? null,
        } as any)
        .select()
        .single()

      if (error) throw new Error(error.message)

      const newPlaylist = data as PlaylistRow
      setPlaylists(prev => [...prev, { ...newPlaylist, progress: null }])
      toast.success('Playlist added!')
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add playlist')
      throw err // re-throw so modal stays open on error
    }
  }

  // ── Delete playlist ────────────────────────────────────────────────────────
  async function handleDeletePlaylist(id: string) {
    try {
      const supabase = createClient()
      const { error } = await supabase.from('playlists').delete().eq('id', id)
      if (error) throw new Error(error.message)
      setPlaylists(prev => prev.filter(p => p.id !== id))
      toast.success('Playlist deleted')
    } catch {
      toast.error('Failed to delete playlist')
    }
  }

  // ── After successful import/sync ──────────────────────────────────────────
  function handleImportSuccess() {
    router.refresh()
    toast.success('YouTube playlist imported!')
  }

  // ── Open import modal from PlaylistCard's "Import Now" CTA ───────────────
  function handleImportFromCard(playlistId: string, ytUrl: string) {
    setImportTargetPlaylist({ id: playlistId, url: ytUrl })
    setShowImportModal(true)
  }

  // ── Close import modal ────────────────────────────────────────────────────
  function handleImportClose() {
    setShowImportModal(false)
    setImportTargetPlaylist(null)
  }

  return (
    <>
      {/* Header row with "Import YouTube" button */}
      <div className="flex items-center justify-between mb-4">
        <span /> {/* spacer — header is on the parent */}
        <button
          id="import-youtube-btn"
          type="button"
          onClick={() => { setImportTargetPlaylist(null); setShowImportModal(true) }}
          className="flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/20 transition-colors cursor-pointer"
        >
          <YouTubeIcon className="h-3.5 w-3.5" />
          Import YouTube
        </button>
      </div>

      {playlists.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No playlists yet"
          description="Add a playlist manually or import directly from a YouTube playlist URL."
          action={
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                id="add-first-playlist-btn"
                onClick={() => setShowAddModal(true)}
                className="bg-gradient-to-r from-indigo-500 to-violet-600 text-white border-0"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Playlist
              </Button>
              <Button
                id="import-first-playlist-btn"
                variant="outline"
                onClick={() => { setImportTargetPlaylist(null); setShowImportModal(true) }}
                className="border-red-500/30 text-red-400 hover:bg-red-500/10"
              >
                <YouTubeIcon className="h-4 w-4 mr-2" />
                Import from YouTube
              </Button>
            </div>
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4 stagger-children">
            {playlists.map((playlist) => (
              <PlaylistCard
                key={playlist.id}
                playlist={playlist}
                courseSlug={courseSlug}
                onDelete={handleDeletePlaylist}
                onImportYouTube={handleImportFromCard}
              />
            ))}
          </div>
          <Button
            id="add-playlist-btn"
            variant="outline"
            onClick={() => setShowAddModal(true)}
            className="w-full border-dashed border-border/60 hover:border-border text-muted-foreground hover:text-foreground"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Playlist
          </Button>
        </>
      )}

      {/* Modals */}
      <AddPlaylistModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddPlaylist}
      />

      <ImportYouTubeModal
        open={showImportModal}
        onClose={handleImportClose}
        onSuccess={handleImportSuccess}
        courseId={courseId}
        existingPlaylistId={importTargetPlaylist?.id ?? null}
        initialUrl={importTargetPlaylist?.url ?? ''}
      />
    </>
  )
}
