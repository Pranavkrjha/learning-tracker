'use client'

import Link from 'next/link'
import { Play, Clock, ChevronRight } from 'lucide-react'
import { ProgressBar } from '@/components/shared/ProgressBar'
import { formatDurationHuman } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { ContinueLearningData } from '@/lib/services/continueLearning'

interface ContinueLearningBannerProps {
  data: ContinueLearningData
}

export function ContinueLearningBanner({ data }: ContinueLearningBannerProps) {
  const href = `/course/${data.courseSlug}/playlist/${data.playlistId}`

  return (
    <Link href={href} className="block group">
      <div
        className={cn(
          'relative overflow-hidden rounded-2xl border border-border/50 bg-card/60 backdrop-blur-sm p-5',
          'hover:border-border hover:shadow-xl hover:shadow-black/10 transition-all duration-300',
          'hover:-translate-y-0.5'
        )}
      >
        {/* Color accent line */}
        <div
          className="absolute top-0 left-0 right-0 h-0.5"
          style={{ background: `linear-gradient(90deg, ${data.courseColor}, ${data.courseColor}44)` }}
        />

        {/* Subtle background glow */}
        <div
          className="absolute top-0 right-0 h-32 w-32 rounded-full blur-3xl opacity-10 -translate-y-1/2 translate-x-1/4"
          style={{ backgroundColor: data.courseColor }}
        />

        <div className="relative flex flex-col sm:flex-row sm:items-center gap-4">
          {/* Thumbnail or play icon */}
          <div className="shrink-0">
            {data.thumbnailUrl ? (
              <div className="relative w-24 h-[54px] rounded-lg overflow-hidden ring-1 ring-border/50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={data.thumbnailUrl}
                  alt={data.videoTitle}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div
                    className="h-8 w-8 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: data.courseColor }}
                  >
                    <Play className="h-4 w-4 text-white fill-white ml-0.5" />
                  </div>
                </div>
              </div>
            ) : (
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${data.courseColor}22` }}
              >
                <Play
                  className="h-5 w-5 fill-current ml-0.5"
                  style={{ color: data.courseColor }}
                />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            {/* Breadcrumb */}
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1 flex-wrap">
              <span
                className="font-medium"
                style={{ color: data.courseColor }}
              >
                {data.courseTitle}
              </span>
              <ChevronRight className="h-3 w-3 shrink-0" />
              <span className="truncate">{data.playlistTitle}</span>
            </div>

            {/* Video title */}
            <p className="text-sm font-semibold leading-snug line-clamp-1 mb-2 group-hover:text-primary transition-colors">
              {data.videoTitle}
            </p>

            {/* Progress */}
            <div className="flex items-center gap-3">
              <div className="flex-1 max-w-[200px]">
                <ProgressBar value={data.progressPercent} size="sm" />
              </div>
              <span className="text-xs text-muted-foreground tabular-nums shrink-0">
                {data.progressPercent}%
              </span>
              {data.remainingSeconds > 0 && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                  <Clock className="h-3 w-3" />
                  {formatDurationHuman(data.remainingSeconds)} left
                </span>
              )}
            </div>
          </div>

          {/* CTA */}
          <div className="shrink-0">
            <div
              className={cn(
                'flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold text-white',
                'transition-all duration-200 group-hover:shadow-lg group-hover:scale-[1.02]'
              )}
              style={{
                background: `linear-gradient(135deg, ${data.courseColor}, ${data.courseColor}cc)`,
                boxShadow: `0 4px 14px ${data.courseColor}40`,
              }}
            >
              <Play className="h-3.5 w-3.5 fill-white" />
              Continue
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}

export function ContinueLearningCompleted() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-emerald-500/5 backdrop-blur-sm p-5">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-emerald-500/15 flex items-center justify-center text-xl">
          🎉
        </div>
        <div>
          <p className="text-sm font-semibold text-emerald-400">All learning completed!</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            You've finished all your videos. Add a new course to keep learning.
          </p>
        </div>
      </div>
    </div>
  )
}
