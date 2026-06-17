import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { FilterStatus, VideoRow } from './types'

// =============================================================================
// TAILWIND CLASS MERGE (shadcn requirement)
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
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '')
}

// =============================================================================
// DURATION UTILITIES
// =============================================================================

export function formatDuration(totalSeconds: number): string {
  if (totalSeconds <= 0) return '0:00'
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  const mm = String(minutes).padStart(2, '0')
  const ss = String(seconds).padStart(2, '0')
  if (hours > 0) return `${hours}:${mm}:${ss}`
  return `${mm}:${ss}`
}

export function formatDurationHuman(totalSeconds: number): string {
  if (totalSeconds <= 0) return '0m'
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  if (hours > 0 && minutes > 0) return `${hours}h ${minutes}m`
  if (hours > 0) return `${hours}h`
  return `${minutes}m`
}

export function parseDuration(input: string): number {
  if (!input || input.trim() === '') return 0
  if (/^\d+$/.test(input.trim())) return parseInt(input.trim(), 10)
  const parts = input.trim().split(':').map(Number)
  if (parts.some(isNaN)) return 0
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]
  if (parts.length === 2) return parts[0] * 60 + parts[1]
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

// =============================================================================
// PLAYBACK SPEED UTILITIES (Phase 2)
// =============================================================================

export const PLAYBACK_SPEEDS = [1.00, 1.25, 1.50, 1.75, 2.00] as const
export type PlaybackSpeed = typeof PLAYBACK_SPEEDS[number]

/**
 * Returns effective duration in seconds after applying playback speed.
 * e.g. 3600s at 1.75x = 2057s
 */
export function effectiveDuration(seconds: number, speed: number): number {
  if (speed <= 0) return seconds
  return Math.round(seconds / speed)
}

/**
 * How many days to finish `remainingSeconds` at `hoursPerDay` pace.
 * Returns ceiling, minimum 1 if there's anything left.
 */
export function calcFinishDays(remainingSeconds: number, hoursPerDay: number): number {
  if (remainingSeconds <= 0 || hoursPerDay <= 0) return 0
  const secondsPerDay = hoursPerDay * 3600
  return Math.ceil(remainingSeconds / secondsPerDay)
}
