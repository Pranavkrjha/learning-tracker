import { cn, getProgressBarColor } from '@/lib/utils'

interface ProgressBarProps {
  value: number // 0-100
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  className?: string
  colorMode?: 'auto' | 'brand'
  animated?: boolean
}

export function ProgressBar({
  value,
  size = 'md',
  showLabel = false,
  className,
  colorMode = 'auto',
  animated = true,
}: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value))

  const heightMap = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  }

  const barColor =
    colorMode === 'brand'
      ? 'bg-gradient-to-r from-indigo-500 to-violet-600'
      : clamped >= 100
        ? 'bg-emerald-500'
        : clamped >= 75
          ? 'bg-cyan-500'
          : clamped >= 50
            ? 'bg-blue-500'
            : clamped >= 25
              ? 'bg-yellow-500'
              : 'bg-slate-500'

  return (
    <div className={cn('w-full', className)}>
      {showLabel && (
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-muted-foreground">Progress</span>
          <span className="text-xs font-medium tabular-nums">{clamped}%</span>
        </div>
      )}
      <div
        className={cn(
          'w-full rounded-full bg-secondary overflow-hidden',
          heightMap[size]
        )}
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={cn(
            'h-full rounded-full transition-all duration-700 ease-out',
            barColor,
            animated && 'transition-[width]'
          )}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  )
}

// =============================================================================
// CIRCULAR PROGRESS
// =============================================================================

interface CircularProgressProps {
  value: number // 0-100
  size?: number // px
  strokeWidth?: number
  showLabel?: boolean
  color?: string // optional override (e.g. course.color)
  className?: string
}

export function CircularProgress({
  value,
  size = 80,
  strokeWidth = 6,
  showLabel = true,
  color,
  className,
}: CircularProgressProps) {
  const clamped = Math.min(100, Math.max(0, value))
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (clamped / 100) * circumference

  const strokeColor = color ?? (
    clamped >= 100
      ? '#10b981' // emerald
      : clamped >= 75
        ? '#06b6d4' // cyan
        : clamped >= 50
          ? '#3b82f6' // blue
          : clamped >= 25
            ? '#eab308' // yellow
            : '#6366f1' // indigo
  )

  return (
    <div
      className={cn('relative inline-flex items-center justify-center', className)}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-secondary"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700 ease-out"
        />
      </svg>
      {showLabel && (
        <span className="absolute text-xs font-bold tabular-nums">
          {clamped}%
        </span>
      )}
    </div>
  )
}
