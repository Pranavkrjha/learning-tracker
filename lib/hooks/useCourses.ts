'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type {
  CourseWithProgress,
  CreateCourseForm,
  CourseFilters,
  FilterStatus,
  CourseRow,
  CourseProgressRow,
} from '@/lib/types'
import { matchesFilterStatus } from '@/lib/utils'

export function useCourses() {
  const [courses, setCourses] = useState<CourseWithProgress[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<CourseFilters>({ search: '', status: 'all' })

  // Stable supabase client ref — created once, not per-render
  const supabaseRef = useRef(createClient())
  const supabase = supabaseRef.current

  const fetchCourses = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Fetch courses + progress in parallel
      const [coursesResult, progressResult] = await Promise.all([
        supabase
          .from('courses')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_archived', false)
          .order('created_at', { ascending: false }),
        supabase
          .from('course_progress')
          .select('*')
          .eq('user_id', user.id),
      ])

      if (coursesResult.error) throw new Error(coursesResult.error.message)

      const typedCourses = (coursesResult.data ?? []) as CourseRow[]

      const progressMap = new Map<string, CourseProgressRow>(
        (progressResult.data ?? []).map((p: CourseProgressRow) => [p.course_id, p])
      )

      setCourses(
        typedCourses.map(c => ({
          ...c,
          progress: progressMap.get(c.id) ?? null,
        }))
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchCourses()
  }, [fetchCourses])

  const createCourse = async (form: CreateCourseForm): Promise<void> => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const baseSlug = form.title
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]+/g, '')

    const { data: existing } = await supabase
      .from('courses')
      .select('slug')
      .eq('user_id', user.id)
      .like('slug', `${baseSlug}%`)

    const existingSlugs = new Set<string>(
      (existing ?? []).map((e: { slug: string }) => e.slug)
    )
    let slug = baseSlug
    let counter = 1
    while (existingSlugs.has(slug)) {
      slug = `${baseSlug}-${counter++}`
    }

    const { error } = await supabase.from('courses').insert({
      user_id: user.id,
      title: form.title,
      slug,
      description: form.description ?? null,
      color: form.color,
    } as any)

    if (error) throw new Error(error.message)
    await fetchCourses()
  }

  const deleteCourse = async (id: string): Promise<void> => {
    const { error } = await supabase.from('courses').delete().eq('id', id)
    if (error) throw new Error(error.message)
    setCourses(prev => prev.filter(c => c.id !== id))
  }

  const toggleFavorite = async (id: string): Promise<void> => {
    const course = courses.find(c => c.id === id)
    if (!course) return
    const newVal = !course.is_favorite
    setCourses(prev => prev.map(c => c.id === id ? { ...c, is_favorite: newVal } : c))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('courses').update({ is_favorite: newVal }).eq('id', id)
  }

  const togglePin = async (id: string): Promise<void> => {
    const course = courses.find(c => c.id === id)
    if (!course) return
    const newVal = !course.is_pinned
    setCourses(prev => prev.map(c => c.id === id ? { ...c, is_pinned: newVal } : c))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('courses').update({ is_pinned: newVal }).eq('id', id)
  }

  const filteredCourses = courses.filter(course => {
    const matchSearch =
      filters.search === '' ||
      course.title.toLowerCase().includes(filters.search.toLowerCase()) ||
      (course.description?.toLowerCase().includes(filters.search.toLowerCase()) ?? false)

    const prog = course.progress
    const matchStatus = matchesFilterStatus(
      filters.status as FilterStatus,
      prog?.completed_videos ?? 0,
      prog?.total_videos ?? 0,
      prog?.progress_percent ?? 0
    )

    return matchSearch && matchStatus
  })

  const totalPlaylists = courses.reduce((s, c) => s + (c.progress?.playlist_count ?? 0), 0)

  return {
    courses,
    filteredCourses,
    loading,
    error,
    filters,
    setFilters,
    totalPlaylists,
    refetch: fetchCourses,
    createCourse,
    deleteCourse,
    toggleFavorite,
    togglePin,
  }
}
