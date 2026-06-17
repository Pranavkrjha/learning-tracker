'use client'

import { useState, useEffect } from 'react'
import { Plus, BookOpen } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { PlaylistCard } from '@/components/playlists/PlaylistCard'
import { AddPlaylistModal } from '@/components/playlists/AddPlaylistModal'
import { EmptyState } from '@/components/shared/EmptyState'
import { createClient } from '@/lib/supabase/client'
import { useRecentlyViewed } from '@/lib/hooks/useRecentlyViewed'
import { toast } from 'sonner'
import type { PlaylistRow, PlaylistWithProgress, CreatePlaylistForm } from '@/lib/types'

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
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(false)

  const { addView } = useRecentlyViewed()

  // Track this course as recently viewed
  useEffect(() => {
    addView({ courseId, courseSlug, title: courseTitle, color: courseColor })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId])

  async function handleAddPlaylist(form: CreatePlaylistForm) {
    setLoading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const nextIndex = playlists.length

      const { data, error } = await supabase
        .from('playlists')
        .insert({
          course_id: courseId,
          user_id: user.id,
          title: form.title,
          description: form.description ?? null,
          order_index: nextIndex,
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
    } finally {
      setLoading(false)
    }
  }

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

  return (
    <>
      {playlists.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No playlists yet"
          description="Add a playlist to organize videos within this course. You can also link a YouTube playlist URL."
          action={
            <Button
              id="add-first-playlist-btn"
              onClick={() => setShowModal(true)}
              className="bg-gradient-to-r from-indigo-500 to-violet-600 text-white border-0"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add First Playlist
            </Button>
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
              />
            ))}
          </div>
          <Button
            id="add-playlist-btn"
            variant="outline"
            onClick={() => setShowModal(true)}
            className="w-full border-dashed border-border/60 hover:border-border text-muted-foreground hover:text-foreground"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Playlist
          </Button>
        </>
      )}

      <AddPlaylistModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleAddPlaylist}
      />
    </>
  )
}
