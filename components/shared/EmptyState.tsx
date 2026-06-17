import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: React.ReactNode
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  size = 'md',
}: EmptyStateProps) {
  const iconSize = { sm: 'h-8 w-8', md: 'h-10 w-10', lg: 'h-12 w-12' }
  const wrapSize = { sm: 'h-14 w-14', md: 'h-20 w-20', lg: 'h-24 w-24' }
  const py = { sm: 'py-10', md: 'py-16', lg: 'py-20' }

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center px-6',
        py[size],
        className
      )}
    >
      {/* Icon with layered glow rings */}
      <div className="relative mb-5">
        <div className={cn(
          'absolute inset-0 rounded-2xl bg-primary/5 blur-xl scale-150'
        )} />
        <div className={cn(
          'relative flex items-center justify-center rounded-2xl',
          'bg-gradient-to-br from-secondary to-secondary/40',
          'border border-border/50',
          wrapSize[size]
        )}>
          <Icon className={cn(iconSize[size], 'text-muted-foreground')} />
        </div>
      </div>

      <h3 className="text-base font-semibold text-foreground mb-1.5">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-xs leading-relaxed mb-6">
        {description}
      </p>
      {action}
    </div>
  )
}
