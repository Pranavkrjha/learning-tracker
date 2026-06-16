import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

interface StatsCardProps {
  label: string
  value: string | number
  icon: LucideIcon
  iconColor?: string
  trend?: string
  className?: string
}

export function StatsCard({
  label,
  value,
  icon: Icon,
  iconColor = 'text-primary',
  trend,
  className,
}: StatsCardProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl border border-border/50 bg-card/50 p-5',
        'backdrop-blur-sm hover:border-border transition-colors duration-200',
        className
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
            {label}
          </p>
          <p className="text-2xl font-bold tabular-nums text-foreground">{value}</p>
          {trend && (
            <p className="text-xs text-muted-foreground mt-1">{trend}</p>
          )}
        </div>
        <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary/60', iconColor)}>
          <Icon className="h-5 w-5" />
        </div>
      </div>

      {/* Subtle glow accent */}
      <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-primary/5 blur-2xl" />
    </div>
  )
}
