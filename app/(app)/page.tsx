'use client'

import { useState } from 'react'
import { Plus, BookOpen, Clock, CheckCircle, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CourseCard } from '@/components/courses/CourseCard'
import { AddCourseModal } from '@/components/courses/AddCourseModal'
import { SearchBar } from '@/components/shared/SearchBar'
import { FilterBar } from '@/components/shared/FilterBar'
import { StatsCard } from '@/components/shared/StatsCard'
import { EmptyState } from '@/components/shared/EmptyState'
import { Skeleton } from '@/components/ui/skeleton'
import { useCourses } from '@/lib/hooks/useCourses'
import { formatDurationHuman } from '@/lib/utils'
import { toast } from 'sonner'
import type { CreateCourseForm, FilterStatus } from '@/lib/types'

export default function HomePage() {
  const {
    courses,
    filteredCourses,
    loading,
    filters,
    setFilters,
    createCourse,
    deleteCourse,
  } = useCourses()

  const [showAddModal, setShowAddModal] = useState(false)

  // Compute stats
  const totalCourses = courses.length
  const totalVideos = courses.reduce((s, c) => s + (c.progress?.total_videos ?? 0), 0)
  const completedVideos = courses.reduce((s, c) => s + (c.progress?.completed_videos ?? 0), 0)
  const watchedSeconds = courses.reduce((s, c) => s + (c.progress?.watched_duration_seconds ?? 0), 0)

  async function handleCreateCourse(data: CreateCourseForm) {
    try {
      await createCourse(data)
      toast.success('Course created!')
    } catch {
      toast.error('Failed to create course')
    }
  }

  async function handleDeleteCourse(id: string) {
    try {
      await deleteCourse(id)
      toast.success('Course deleted')
    } catch {
      toast.error('Failed to delete course')
    }
  }

  return (
    <>
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              My Learning Dashboard
            </h1>
            <p className="text-muted-foreground mt-1.5">
              Track your progress across all courses and playlists.
            </p>
          </div>
          <Button
            id="add-course-btn"
            onClick={() => setShowAddModal(true)}
            className="shrink-0 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white border-0 shadow-lg shadow-indigo-500/20"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Course
          </Button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6">
          <StatsCard
            label="Total Courses"
            value={totalCourses}
            icon={BookOpen}
            iconColor="text-indigo-400"
          />
          <StatsCard
            label="Videos Completed"
            value={`${completedVideos}/${totalVideos}`}
            icon={CheckCircle}
            iconColor="text-emerald-400"
          />
          <StatsCard
            label="Time Watched"
            value={formatDurationHuman(watchedSeconds)}
            icon={Clock}
            iconColor="text-cyan-400"
          />
          <StatsCard
            label="Overall Progress"
            value={
              totalVideos > 0
                ? `${Math.round((completedVideos / totalVideos) * 100)}%`
                : '0%'
            }
            icon={TrendingUp}
            iconColor="text-violet-400"
          />
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <SearchBar
          id="course-search"
          value={filters.search}
          onChange={(v) => setFilters(prev => ({ ...prev, search: v }))}
          placeholder="Search courses..."
          className="flex-1"
        />
        <FilterBar
          status={filters.status as FilterStatus}
          onStatusChange={(s) => setFilters(prev => ({ ...prev, status: s }))}
        />
      </div>

      {/* Course Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-border/50 overflow-hidden">
              <Skeleton className="h-1.5 w-full" />
              <div className="p-5 space-y-3">
                <div className="flex gap-3">
                  <Skeleton className="h-12 w-12 rounded-xl shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-2 w-full rounded-full" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredCourses.length === 0 ? (
        filters.search || filters.status !== 'all' ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-sm">
              No courses match your filters.{' '}
              <button
                className="text-primary hover:underline"
                onClick={() => setFilters({ search: '', status: 'all' })}
              >
                Clear filters
              </button>
            </p>
          </div>
        ) : (
          <EmptyState
            icon={BookOpen}
            title="No courses yet"
            description="Create your first course to start tracking your learning journey."
            action={
              <Button
                id="add-first-course-btn"
                onClick={() => setShowAddModal(true)}
                className="bg-gradient-to-r from-indigo-500 to-violet-600 text-white border-0"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create First Course
              </Button>
            }
          />
        )
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 stagger-children">
          {filteredCourses.map((course, i) => (
            <CourseCard
              key={course.id}
              course={course}
              onDelete={handleDeleteCourse}
              style={{ animationDelay: `${i * 60}ms` }}
            />
          ))}
        </div>
      )}

      <AddCourseModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleCreateCourse}
      />
    </>
  )
}
