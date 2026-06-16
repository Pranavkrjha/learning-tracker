import { createClient } from '@/lib/supabase/server'
import { slugify } from '@/lib/utils'
import type { CourseRow, CourseInsert, CourseUpdate, CourseWithProgress, CreateCourseForm, CourseProgressRow } from '@/lib/types'

// =============================================================================
// GET ALL COURSES (with progress)
// =============================================================================
export async function getCourses(): Promise<CourseWithProgress[]> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: courses, error: coursesError } = await supabase
    .from('courses')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_archived', false)
    .order('created_at', { ascending: false })

  if (coursesError) throw new Error(coursesError.message)
  if (!courses) return []

  const { data: progress } = await supabase
    .from('course_progress')
    .select('*')
    .eq('user_id', user.id)

  const progressMap = new Map<string, CourseProgressRow>(
    (progress ?? []).map((p: CourseProgressRow) => [p.course_id, p])
  )

  return (courses as CourseRow[]).map(course => ({
    ...course,
    progress: progressMap.get(course.id) ?? null,
  }))
}

// =============================================================================
// GET SINGLE COURSE BY SLUG
// =============================================================================
export async function getCourseBySlug(slug: string): Promise<CourseWithProgress | null> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: course, error } = await supabase
    .from('courses')
    .select('*')
    .eq('slug', slug)
    .eq('user_id', user.id)
    .maybeSingle()

  if (error || !course) return null

  const { data: progress } = await supabase
    .from('course_progress')
    .select('*')
    .eq('course_id', (course as CourseRow).id)
    .maybeSingle()

  return { ...(course as CourseRow), progress: (progress as CourseProgressRow | null) }
}

// =============================================================================
// CREATE COURSE
// =============================================================================
export async function createCourse(form: CreateCourseForm): Promise<CourseRow> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const baseSlug = slugify(form.title)

  const { data: existing } = await supabase
    .from('courses')
    .select('slug')
    .eq('user_id', user.id)
    .like('slug', `${baseSlug}%`)

  const existingSlugs = new Set<string>((existing ?? []).map((e: { slug: string }) => e.slug))
  let slug = baseSlug
  let counter = 1
  while (existingSlugs.has(slug)) {
    slug = `${baseSlug}-${counter++}`
  }

  const payload: CourseInsert = {
    user_id: user.id,
    title: form.title,
    slug,
    description: form.description ?? null,
    color: form.color,
  }

  const { data, error } = await supabase
    .from('courses')
    .insert(payload as any)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as CourseRow
}

// =============================================================================
// UPDATE COURSE
// =============================================================================
export async function updateCourse(id: string, update: CourseUpdate): Promise<CourseRow> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data, error } = await supabase
    .from('courses')
    // @ts-ignore -- supabase type inference
    .update(update as any)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as CourseRow
}

// =============================================================================
// DELETE COURSE
// =============================================================================
export async function deleteCourse(id: string): Promise<void> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('courses')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) throw new Error(error.message)
}

// =============================================================================
// GET GLOBAL STATS
// =============================================================================
export async function getGlobalStats() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: progress } = await supabase
    .from('course_progress')
    .select('*')
    .eq('user_id', user.id)

  const rows = (progress ?? []) as CourseProgressRow[]
  const totalCourses = rows.length
  const totalVideos = rows.reduce((sum, p) => sum + p.total_videos, 0)
  const completedVideos = rows.reduce((sum, p) => sum + p.completed_videos, 0)
  const totalSeconds = rows.reduce((sum, p) => sum + p.total_duration_seconds, 0)
  const watchedSeconds = rows.reduce((sum, p) => sum + p.watched_duration_seconds, 0)

  return {
    totalCourses,
    totalVideos,
    completedVideos,
    totalSeconds,
    watchedSeconds,
    overallProgressPercent: totalSeconds > 0
      ? Math.round((watchedSeconds / totalSeconds) * 100)
      : 0,
  }
}
