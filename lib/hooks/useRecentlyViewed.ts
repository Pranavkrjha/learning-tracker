'use client'

import { useCallback, useEffect, useState } from 'react'

const KEY = 'learntrack_recently_viewed'
const MAX = 5

export interface RecentlyViewedItem {
  courseId: string
  courseSlug: string
  title: string
  color: string
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
      const filtered = prev.filter(i => i.courseId !== item.courseId)
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
