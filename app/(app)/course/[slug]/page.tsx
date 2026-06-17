import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight, BookOpen, Play, Clock } from 'lucide-react'
import type { Metadata } from 'next'
import { getCourseBySlug } from '@/lib/services/courses'
import { getPlaylistsByCourse } from '@/lib/services/playlists'
import { CircularProgress } from '@/components/shared/ProgressBar'
import { AddPlaylistSection } from './AddPlaylistSection'
import { formatDurationHuman } from '@/lib/utils'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const course = await getCourseBySlug(slug)
  return {
    title: course?.title ?? 'Course Not Found',
    description: course?.description ?? undefined,
  }
}

export default async function CoursePage({ params }: Props) {
  const { slug } = await params
  const course = await getCourseBySlug(slug)

  if (!course) notFound()

  const playlists = await getPlaylistsByCourse(course.id)

  const progress = course.progress
  const percent = progress?.progress_percent ?? 0
  const totalVideos = progress?.total_videos ?? 0
  const completedVideos = progress?.completed_videos ?? 0
  const watchedSeconds = progress?.watched_duration_seconds ?? 0
  const totalSeconds = progress?.total_duration_seconds ?? 0
  const playlistCount = progress?.playlist_count ?? 0

  return (
    <div className="animate-fade-in">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-6">
        <Link href="/" className="hover:text-foreground transition-colors">
          Courses
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground font-medium truncate">{course.title}</span>
      </nav>

      {/* Course Header */}
      <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm p-6 mb-8">
        <div
          className="absolute inset-0 opacity-5"
          style={{
            background: `radial-gradient(ellipse at top right, ${course.color}, transparent 70%)`,
          }}
        />
        <div
          className="absolute top-0 left-0 right-0 h-1"
          style={{ background: `linear-gradient(90deg, ${course.color}, ${course.color}44)` }}
        />

        <div className="relative flex flex-col sm:flex-row items-start gap-6">
          <div className="shrink-0">
            <CircularProgress value={percent} size={96} strokeWidth={7} showLabel color={course.color} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: course.color }}
              />
              <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                Course
              </span>
            </div>
            <h1 className="text-2xl font-bold leading-tight mb-2">{course.title}</h1>
            {course.description && (
              <p className="text-muted-foreground text-sm mb-4 max-w-xl">{course.description}</p>
            )}

            <div className="flex flex-wrap items-center gap-3 text-sm">
              <div className="flex items-center gap-1.5 rounded-lg bg-secondary/60 px-3 py-1.5 text-xs font-medium">
                <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
                {playlistCount} {playlistCount === 1 ? 'Playlist' : 'Playlists'}
              </div>
              <div className="flex items-center gap-1.5 rounded-lg bg-secondary/60 px-3 py-1.5 text-xs font-medium">
                <Play className="h-3.5 w-3.5 text-muted-foreground" />
                {completedVideos}/{totalVideos} Videos
              </div>
              {totalSeconds > 0 && (
                <div className="flex items-center gap-1.5 rounded-lg bg-secondary/60 px-3 py-1.5 text-xs font-medium">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  {formatDurationHuman(watchedSeconds)} / {formatDurationHuman(totalSeconds)}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Playlists Section — Import button is rendered inside AddPlaylistSection */}
      <div>
        <h2 className="text-lg font-semibold mb-1">Playlists</h2>
        <AddPlaylistSection
          courseId={course.id}
          courseSlug={course.slug}
          initialPlaylists={playlists}
          courseTitle={course.title}
          courseColor={course.color}
        />
      </div>
    </div>
  )
}
