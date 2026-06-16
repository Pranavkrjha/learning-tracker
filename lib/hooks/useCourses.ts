'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { CourseWithProgress, CreateCourseForm, CourseFilters, FilterStatus, CourseRow, CourseProgressRow } from '@/lib/types'
import { matchesFilterStatus } from '@/lib/utils'

export function useCourses() {
  const [courses, setCourses] = useState<CourseWithProgress[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<CourseFilters>({ search: '', status: 'all' })

  const supabase = createClient()

  const fetchCourses = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: rawCourses, error: courseErr } = await supabase
        .from('courses')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_archived', false)
        .order('created_at', { ascending: false })

      if (courseErr) throw new Error(courseErr.message)

      const typedCourses = (rawCourses ?? []) as CourseRow[]

      const { data: progress } = await supabase
        .from('course_progress')
        .select('*')
        .eq('user_id', user.id)

      const progressMap = new Map<string, CourseProgressRow>(
        (progress ?? []).map((p: CourseProgressRow) => [p.course_id, p])
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
  }, [])

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
    await fetchCourses()
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

  return {
    courses,
    filteredCourses,
    loading,
    error,
    filters,
    setFilters,
    refetch: fetchCourses,
    createCourse,
    deleteCourse,
  }
}
