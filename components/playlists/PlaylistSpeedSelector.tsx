'use client'

import { useState, useTransition } from 'react'
import { Gauge } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { PLAYBACK_SPEEDS } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface PlaylistSpeedSelectorProps {
  playlistId: string
  initialSpeed: number
}

export function PlaylistSpeedSelector({ playlistId, initialSpeed }: PlaylistSpeedSelectorProps) {
  const [speed, setSpeed] = useState(initialSpeed || 1.00)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  async function handleSpeedChange(newSpeed: number) {
    if (newSpeed === speed) return
    const prev = speed
    setSpeed(newSpeed) // optimistic

    startTransition(async () => {
      try {
        const supabase = createClient()
        const { error } = await (supabase as any)
          .from('playlists')
          .update({ playback_speed: newSpeed })
          .eq('id', playlistId)

        if (error) throw new Error(error.message)
        router.refresh() // re-run server components to recompute effective durations
      } catch {
        setSpeed(prev) // rollback
        toast.error('Failed to save playback speed')
      }
    })
  }

  return (
    // Outer container: the Gauge icon + label, then scrollable pill row
    <div className="flex items-center gap-2 min-w-0">
      <div className="flex items-center gap-1 shrink-0 text-xs text-muted-foreground">
        <Gauge className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Speed:</span>
      </div>
      {/*
        On mobile: overflow-x-auto lets the speed buttons scroll horizontally
        within the available width rather than wrapping onto a new line.
      */}
      <div className="flex items-center gap-1 overflow-x-auto scrollbar-none pb-0.5">
        {PLAYBACK_SPEEDS.map((s) => (
          <button
            key={s}
            id={`speed-${String(s).replace('.', '_')}`}
            type="button"
            onClick={() => handleSpeedChange(s)}
            disabled={isPending}
            className={cn(
              'h-7 px-2 rounded text-xs font-medium transition-all shrink-0',
              speed === s
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary border border-transparent hover:border-border/50'
            )}
          >
            {s.toFixed(2)}x
          </button>
        ))}
      </div>
    </div>
  )
}
