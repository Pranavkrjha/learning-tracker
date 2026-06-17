'use client'

import { useState } from 'react'
import { Plus, GraduationCap, BookOpen, Play, Clock, Percent, Pin, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StatsCard } from '@/components/shared/StatsCard'
import { CourseCard } from '@/components/courses/CourseCard'
import { SearchBar } from '@/components/shared/SearchBar'
import { FilterBar } from '@/components/shared/FilterBar'
import { EmptyState } from '@/components/shared/EmptyState'
import { AddCourseModal } from '@/components/courses/AddCourseModal'
import { Skeleton } from '@/components/ui/skeleton'
import { useCourses } from '@/lib/hooks/useCourses'
import { RecentlyViewedSection } from '@/components/dashboard/RecentlyViewedSection'
import { formatDurationHuman } from '@/lib/utils'
import { toast } from 'sonner'
import type { CreateCourseForm } from '@/lib/types'

// Continue Learning is loaded lazily — only shown if data exists
import dynamic from 'next/dynamic'
const ContinueLearningBannerAsync = dynamic(
  () => import('@/components/dashboard/ContinueLearningFetcher').then(m => m.ContinueLearningFetcher),
  { ssr: false }
)

function CourseCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border/50 bg-card/50 overflow-hidden">
      <div className="h-1 animate-shimmer rounded-none" />
      <div className="p-4 pb-2 flex items-start gap-3">
        <Skeleton className="h-11 w-11 rounded-full shrink-0" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <div className="px-4 py-1.5 flex gap-3">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-20" />
      </div>
      <div className="px-4 pb-4 pt-1 space-y-1">
        <Skeleton className="h-1.5 w-full rounded-full" />
        <Skeleton className="h-3 w-20 ml-auto" />
      </div>
    </div>
  )
}

export default function HomePage() {
  const {
    courses,
    filteredCourses,
    loading,
    error,
    filters,
    setFilters,
    totalPlaylists,
    createCourse,
    deleteCourse,
    toggleFavorite,
    togglePin,
  } = useCourses()

  const [showAddModal, setShowAddModal] = useState(false)

  // Derived global stats
  const totalVideos    = courses.reduce((s, c) => s + (c.progress?.total_videos ?? 0), 0)
  const completedVids  = courses.reduce((s, c) => s + (c.progress?.completed_videos ?? 0), 0)
  const totalSeconds   = courses.reduce((s, c) => s + (c.progress?.total_duration_seconds ?? 0), 0)
  const watchedSeconds = courses.reduce((s, c) => s + (c.progress?.watched_duration_seconds ?? 0), 0)
  const overallPct     = totalSeconds > 0 ? Math.round((watchedSeconds / totalSeconds) * 100) : 0

  // Split pinned vs unpinned
  const pinnedCourses   = filteredCourses.filter(c => c.is_pinned)
  const unpinnedCourses = filteredCourses.filter(c => !c.is_pinned)

  async function handleAddCourse(form: CreateCourseForm) {
    try {
      await createCourse(form)
      toast.success('Course created!')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create course')
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteCourse(id)
      toast.success('Course deleted')
    } catch {
      toast.error('Failed to delete course')
    }
  }

  const stats = [
    {
      label: 'Courses',
      value: courses.length,
      icon: GraduationCap,
      iconColor: 'text-indigo-400',
    },
    {
      label: 'Playlists',
      value: totalPlaylists,
      icon: BookOpen,
      iconColor: 'text-violet-400',
    },
    {
      label: 'Videos',
      value: totalVideos,
      icon: Play,
      iconColor: 'text-sky-400',
    },
    {
      label: 'Hours Tracked',
      value: formatDurationHuman(watchedSeconds),
      icon: Clock,
      iconColor: 'text-cyan-400',
    },
    {
      label: 'Completion',
      value: `${overallPct}%`,
      icon: Percent,
      iconColor: overallPct >= 75 ? 'text-emerald-400' : overallPct >= 40 ? 'text-blue-400' : 'text-slate-400',
      trend: `${completedVids}/${totalVideos} videos done`,
    },
  ]

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            My Courses
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Track your learning progress across all courses
          </p>
        </div>
        <Button
          id="add-course-btn"
          onClick={() => setShowAddModal(true)}
          className="shrink-0 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white border-0 shadow-lg shadow-indigo-500/20"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Course
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {stats.map(s => (
          <StatsCard
            key={s.label}
            label={s.label}
            value={s.value}
            icon={s.icon}
            iconColor={s.iconColor}
            trend={s.trend}
          />
        ))}
      </div>

      {/* Continue Learning — renders its own section only when data exists */}
      {!loading && courses.length > 0 && <ContinueLearningBannerAsync />}

      {/* Recently Viewed — client-side from localStorage */}
      <RecentlyViewedSection />

      {/* Favourites section */}
      {courses.some(c => c.is_favorite) && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Favorites
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 stagger-children">
            {courses.filter(c => c.is_favorite).map((course, i) => (
              <CourseCard
                key={course.id}
                course={course}
                onDelete={handleDelete}
                onToggleFavorite={toggleFavorite}
                onTogglePin={togglePin}
                style={{ animationDelay: `${i * 50}ms` }}
              />
            ))}
          </div>
        </section>
      )}

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <SearchBar
          value={filters.search}
          onChange={search => setFilters(f => ({ ...f, search }))}
          placeholder="Search courses…"
          className="flex-1"
        />
        <FilterBar
          status={filters.status}
          onStatusChange={status => setFilters(f => ({ ...f, status }))}
        />
      </div>

      {/* Course Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <CourseCardSkeleton key={i} />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center text-sm text-destructive">
          {error}
        </div>
      ) : filteredCourses.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title={courses.length === 0 ? 'No courses yet' : 'No courses match your search'}
          description={
            courses.length === 0
              ? 'Create your first course to start tracking your learning journey.'
              : "Try adjusting your search or filter to find what you're looking for."
          }
          action={
            courses.length === 0 ? (
              <Button
                id="add-first-course-btn"
                onClick={() => setShowAddModal(true)}
                className="bg-gradient-to-r from-indigo-500 to-violet-600 text-white border-0"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create First Course
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          {/* Pinned Courses */}
          {pinnedCourses.length > 0 && (
            <div className="mb-2">
              <div className="flex items-center gap-2 mb-3">
                <Pin className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Pinned</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 stagger-children">
                {pinnedCourses.map((course, i) => (
                  <CourseCard
                    key={course.id}
                    course={course}
                    onDelete={handleDelete}
                    onToggleFavorite={toggleFavorite}
                    onTogglePin={togglePin}
                    style={{ animationDelay: `${i * 50}ms` }}
                  />
                ))}
              </div>
              {unpinnedCourses.length > 0 && <div className="mt-6 mb-3 border-t border-border/30" />}
            </div>
          )}

          {/* All (unpinned) courses */}
          {unpinnedCourses.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 stagger-children">
              {unpinnedCourses.map((course, i) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  onDelete={handleDelete}
                  onToggleFavorite={toggleFavorite}
                  onTogglePin={togglePin}
                  style={{ animationDelay: `${i * 50}ms` }}
                />
              ))}
            </div>
          )}
        </>
      )}

      <AddCourseModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddCourse}
      />
    </div>
  )
}
