'use client'

import Link from 'next/link'
import { Clock, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useRecentlyViewed } from '@/lib/hooks/useRecentlyViewed'
import { useEffect, useState } from 'react'

export function RecentlyViewedSection() {
  const { items } = useRecentlyViewed()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  if (!mounted || items.length === 0) return null

  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <Clock className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Recently Viewed
        </h2>
      </div>

      <div className="flex flex-wrap gap-2">
        {items.slice(0, 6).map(item => {
          const href = `/course/${item.courseSlug}/playlist/${item.playlistId}`
          return (
            <Link
              key={`${item.playlistId}-${item.viewedAt}`}
              href={href}
              className={cn(
                'flex flex-col gap-1 rounded-xl border border-border/50 bg-card/50 px-3 py-2.5',
                'text-sm transition-all hover:border-border hover:bg-card/80',
                'hover:shadow-md hover:-translate-y-0.5',
                // Always show 2 per row on any screen width, up to 220px on larger screens
                'min-w-[148px] max-w-[calc(50%-4px)] sm:max-w-[220px] flex-1'
              )}
            >
              {/* Course name */}
              <div className="flex items-center gap-1.5">
                <div
                  className="h-2 w-2 rounded-full shrink-0"
                  style={{ backgroundColor: item.courseColor }}
                />
                <span className="text-[11px] text-muted-foreground truncate font-medium">
                  {item.courseTitle}
                </span>
              </div>

              {/* Playlist name */}
              <div className="flex items-center gap-1 text-xs font-semibold text-foreground/80 truncate">
                <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground" />
                <span className="truncate">{item.playlistTitle}</span>
              </div>

              {/* Video name if available */}
              {item.videoTitle && (
                <div className="flex items-center gap-1 text-[11px] text-muted-foreground truncate">
                  <ChevronRight className="h-3 w-3 shrink-0 opacity-50" />
                  <span className="truncate">{item.videoTitle}</span>
                </div>
              )}
            </Link>
          )
        })}
      </div>
    </section>
  )
}
