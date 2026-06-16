import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { FilterStatus, VideoRow } from './types'

// =============================================================================
// TAILWIND CLASS MERGE
// =============================================================================
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// =============================================================================
// SLUG UTILITIES
// =============================================================================
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')       // Replace spaces with -
    .replace(/[^\w-]+/g, '')    // Remove all non-word chars
    .replace(/--+/g, '-')       // Replace multiple - with single -
    .replace(/^-+/, '')         // Trim - from start
    .replace(/-+$/, '')         // Trim - from end
}

// =============================================================================
// DURATION UTILITIES
// =============================================================================

/**
 * Formats total seconds into "HH:MM:SS" or "MM:SS" string
 */
export function formatDuration(totalSeconds: number): string {
  if (totalSeconds <= 0) return '0:00'

  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  const mm = String(minutes).padStart(2, '0')
  const ss = String(seconds).padStart(2, '0')

  if (hours > 0) {
    return `${hours}:${mm}:${ss}`
  }
  return `${mm}:${ss}`
}

/**
 * Formats seconds into a human-readable string like "2h 34m" or "45m"
 */
export function formatDurationHuman(totalSeconds: number): string {
  if (totalSeconds <= 0) return '0m'

  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)

  if (hours > 0 && minutes > 0) return `${hours}h ${minutes}m`
  if (hours > 0) return `${hours}h`
  return `${minutes}m`
}

/**
 * Parses "HH:MM:SS" or "MM:SS" or plain seconds string to total seconds
 */
export function parseDuration(input: string): number {
  if (!input || input.trim() === '') return 0

  // Plain number = seconds
  if (/^\d+$/.test(input.trim())) {
    return parseInt(input.trim(), 10)
  }

  const parts = input.trim().split(':').map(Number)

  if (parts.some(isNaN)) return 0

  if (parts.length === 3) {
    // HH:MM:SS
    return parts[0] * 3600 + parts[1] * 60 + parts[2]
  }
  if (parts.length === 2) {
    // MM:SS
    return parts[0] * 60 + parts[1]
  }

  return 0
}

// =============================================================================
// PROGRESS UTILITIES
// =============================================================================

export function calculateProgress(watched: number, total: number): number {
  if (total <= 0) return 0
  return Math.min(100, Math.round((watched / total) * 100))
}

export function getRemainingSeconds(video: VideoRow): number {
  return Math.max(0, video.total_duration_seconds - video.watched_duration_seconds)
}

/**
 * Returns a Tailwind color class based on progress percentage
 */
export function getProgressColor(percent: number): string {
  if (percent >= 100) return 'text-emerald-400'
  if (percent >= 75) return 'text-cyan-400'
  if (percent >= 50) return 'text-blue-400'
  if (percent >= 25) return 'text-yellow-400'
  return 'text-slate-400'
}

export function getProgressBarColor(percent: number): string {
  if (percent >= 100) return 'bg-emerald-500'
  if (percent >= 75) return 'bg-cyan-500'
  if (percent >= 50) return 'bg-blue-500'
  if (percent >= 25) return 'bg-yellow-500'
  return 'bg-slate-500'
}

// =============================================================================
// FILTER UTILITIES
// =============================================================================

export function matchesFilterStatus(
  status: FilterStatus,
  completedVideos: number,
  totalVideos: number,
  progressPercent: number
): boolean {
  switch (status) {
    case 'completed':
      return totalVideos > 0 && completedVideos === totalVideos
    case 'in_progress':
      return progressPercent > 0 && progressPercent < 100
    case 'not_started':
      return progressPercent === 0
    case 'all':
    default:
      return true
  }
}

// =============================================================================
// COLOR PALETTE
// =============================================================================

export const COURSE_COLORS = [
  { label: 'Indigo', value: '#6366f1' },
  { label: 'Violet', value: '#8b5cf6' },
  { label: 'Cyan', value: '#06b6d4' },
  { label: 'Emerald', value: '#10b981' },
  { label: 'Rose', value: '#f43f5e' },
  { label: 'Amber', value: '#f59e0b' },
  { label: 'Sky', value: '#0ea5e9' },
  { label: 'Pink', value: '#ec4899' },
  { label: 'Orange', value: '#f97316' },
  { label: 'Teal', value: '#14b8a6' },
] as const

// =============================================================================
// DATE UTILITIES
// =============================================================================

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`
  if (days < 365) return `${Math.floor(days / 30)} months ago`
  return `${Math.floor(days / 365)} years ago`
}

// =============================================================================
// STRING UTILITIES
// =============================================================================

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str
  return str.slice(0, maxLength - 3) + '...'
}

export function generateInitials(title: string): string {
  return title
    .split(' ')
    .slice(0, 2)
    .map(word => word[0]?.toUpperCase() ?? '')
    .join('')
}
