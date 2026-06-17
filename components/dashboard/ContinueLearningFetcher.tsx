'use client'

import { useEffect, useState } from 'react'
import { Play } from 'lucide-react'
import { ContinueLearningBanner } from './ContinueLearningBanner'
import type { ContinueLearningData } from '@/lib/services/continueLearning'
import { Skeleton } from '@/components/ui/skeleton'

type State =
  | { status: 'loading' }
  | { status: 'done'; data: ContinueLearningData | null }

export function ContinueLearningFetcher() {
  const [state, setState] = useState<State>({ status: 'loading' })

  useEffect(() => {
    const controller = new AbortController()

    fetch('/api/continue-learning', { signal: controller.signal })
      .then(async r => {
        if (!r.ok) return null
        const text = await r.text()
        if (!text || text === 'null') return null
        return JSON.parse(text) as ContinueLearningData
      })
      .then(data => setState({ status: 'done', data }))
      .catch(err => {
        // AbortError means the component unmounted — ignore it
        if (err?.name !== 'AbortError') {
          setState({ status: 'done', data: null })
        }
      })

    return () => controller.abort()
  }, [])

  // While fetching: show the section header + a skeleton placeholder
  if (state.status === 'loading') {
    return (
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Play className="h-4 w-4 text-primary fill-primary" />
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Continue Learning
          </h2>
        </div>
        <Skeleton className="h-24 w-full rounded-2xl" />
      </section>
    )
  }

  // No in-progress video — render nothing (collapse entire section)
  if (!state.data) return null

  // Has data — show section + banner
  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <Play className="h-4 w-4 text-primary fill-primary" />
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Continue Learning
        </h2>
      </div>
      <ContinueLearningBanner data={state.data} />
    </section>
  )
}
