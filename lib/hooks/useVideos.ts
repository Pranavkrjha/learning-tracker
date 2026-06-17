'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { VideoRow, CreateVideoForm, UpdateVideoForm } from '@/lib/types'

export function useVideos(playlistId: string, initialVideos?: VideoRow[]) {
  const [videos, setVideos] = useState<VideoRow[]>(initialVideos ?? [])
  const [loading, setLoading] = useState(!initialVideos || initialVideos.length === 0)
  const [error, setError] = useState<string | null>(null)
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set())

  // Stable supabase client ref — created once, not per-render
  const supabaseRef = useRef(createClient())
  const supabase = supabaseRef.current

  const fetchVideos = useCallback(async () => {
    if (!playlistId) return
    setLoading(true)
    setError(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .eq('playlist_id', playlistId)
        .eq('user_id', user.id)
        .order('order_index', { ascending: true })

      if (error) throw new Error(error.message)
      setVideos((data ?? []) as VideoRow[])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [playlistId, supabase])

  // Only auto-fetch if we didn't receive initialVideos from the server
  useEffect(() => {
    if (!initialVideos || initialVideos.length === 0) {
      fetchVideos()
    }
  }, [fetchVideos, initialVideos])

  const addVideo = async (form: CreateVideoForm): Promise<void> => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const nextIndex = videos.length
    const { error } = await supabase.from('videos').insert({
      playlist_id: playlistId,
      user_id: user.id,
      title: form.title,
      total_duration_seconds: form.total_duration_seconds,
      order_index: form.order_index ?? nextIndex,
    } as any)
    if (error) throw new Error(error.message)
    await fetchVideos()
  }

  const updateVideo = async (id: string, update: UpdateVideoForm): Promise<void> => {
    setSavingIds(prev => new Set(prev).add(id))
    try {
      setVideos(prev =>
        prev.map(v => v.id === id ? { ...v, ...update } : v)
      )

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('videos')
        .update(update)
        .eq('id', id)

      if (error) {
        await fetchVideos()
        throw new Error(error.message)
      }
    } finally {
      setSavingIds(prev => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }
  }

  const toggleCompleted = async (id: string): Promise<void> => {
    const video = videos.find(v => v.id === id)
    if (!video) return

    const newCompleted = !video.completed
    const update: UpdateVideoForm = {
      completed: newCompleted,
      ...(newCompleted ? { watched_duration_seconds: video.total_duration_seconds } : {}),
    }
    await updateVideo(id, update)
  }

  const toggleRevision = async (id: string): Promise<void> => {
    const video = videos.find(v => v.id === id)
    if (!video) return
    await updateVideo(id, { revision_needed: !video.revision_needed })
  }

  const incrementRevision = async (id: string): Promise<void> => {
    const video = videos.find(v => v.id === id)
    if (!video) return
    const newCount = (video.revision_count ?? 0) + 1
    await updateVideo(id, { revision_count: newCount, revision_needed: newCount > 0 })
  }

  const decrementRevision = async (id: string): Promise<void> => {
    const video = videos.find(v => v.id === id)
    if (!video) return
    const newCount = Math.max(0, (video.revision_count ?? 0) - 1)
    await updateVideo(id, { revision_count: newCount, revision_needed: newCount > 0 })
  }

  const deleteVideo = async (id: string): Promise<void> => {
    const { error } = await supabase.from('videos').delete().eq('id', id)
    if (error) throw new Error(error.message)
    setVideos(prev => prev.filter(v => v.id !== id))
  }

  return {
    videos,
    loading,
    error,
    savingIds,
    refetch: fetchVideos,
    addVideo,
    updateVideo,
    toggleCompleted,
    toggleRevision,
    incrementRevision,
    decrementRevision,
    deleteVideo,
  }
}

