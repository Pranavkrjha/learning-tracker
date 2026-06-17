'use client'

import { useCallback, useEffect, useState } from 'react'

const KEY = 'learntrack_recently_viewed_v2'
const MAX = 10

export interface RecentlyViewedItem {
  courseId: string
  courseSlug: string
  courseTitle: string
  courseColor: string
  playlistId: string
  playlistTitle: string
  videoId: string | null
  videoTitle: string | null
  viewedAt: number
}

export function useRecentlyViewed() {
  const [items, setItems] = useState<RecentlyViewedItem[]>([])

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY)
      if (raw) setItems(JSON.parse(raw) as RecentlyViewedItem[])
    } catch {
      // ignore parse errors
    }
  }, [])

  const addView = useCallback((item: Omit<RecentlyViewedItem, 'viewedAt'>) => {
    setItems(prev => {
      // Deduplicate by playlistId (not courseId) so different playlists in the same
      // course each get their own entry
      const filtered = prev.filter(i => i.playlistId !== item.playlistId)
      const next = [{ ...item, viewedAt: Date.now() }, ...filtered].slice(0, MAX)
      try { localStorage.setItem(KEY, JSON.stringify(next)) } catch {}
      return next
    })
  }, [])

  const clear = useCallback(() => {
    setItems([])
    try { localStorage.removeItem(KEY) } catch {}
  }, [])

  return { items, addView, clear }
}
