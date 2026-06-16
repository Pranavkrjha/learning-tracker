'use client'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { FilterStatus } from '@/lib/types'

const STATUS_OPTIONS: { label: string; value: FilterStatus }[] = [
  { label: 'All', value: 'all' },
  { label: 'Not Started', value: 'not_started' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Completed', value: 'completed' },
]

interface FilterBarProps {
  status: FilterStatus
  onStatusChange: (status: FilterStatus) => void
  className?: string
}

export function FilterBar({ status, onStatusChange, className }: FilterBarProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-1 p-1 rounded-lg bg-secondary/40 border border-border/40',
        className
      )}
      role="group"
      aria-label="Filter courses by status"
    >
      {STATUS_OPTIONS.map(option => (
        <Button
          key={option.value}
          id={`filter-${option.value}`}
          variant="ghost"
          size="sm"
          onClick={() => onStatusChange(option.value)}
          className={cn(
            'h-7 px-3 text-xs font-medium rounded-md transition-all',
            status === option.value
              ? 'bg-background text-foreground shadow-sm border border-border/50'
              : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
          )}
        >
          {option.label}
        </Button>
      ))}
    </div>
  )
}
