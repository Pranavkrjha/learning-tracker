'use client'

/**
 * useWatchProgress — Phase 3 Focus Mode
 *
 * Free-tier-safe progress tracking strategy:
 *
 * Write to localStorage every 5 seconds (crash recovery).
 * Write to Supabase only on:
 *   - pause
 *   - video end
 *   - visibilitychange (tab hidden / device sleep)
 *   - interval every 60 seconds
 *
 * NEVER write every second — that exhausts Supabase free tier.
 *
 * Cross-device resume safety:
 * localStorage stores { pos, updatedAt } — not just a raw number.
 * On load, the timestamp is compared against Supabase updated_at.
 * The NEWEST write wins. This prevents an old laptop from overwriting
 * recent phone progress.
 */

import { useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

// Mark complete when user has watched ≥ 90% of total duration
const COMPLETION_THRESHOLD = 0.90

// localStorage key format
const lsKey = (videoId: string) => `watch_pos_${videoId}`

/** Shape stored in localStorage — includes timestamp for cross-device conflict resolution */
interface LocalProgressEntry {
  pos: number
  updatedAt: number // ms since epoch (Date.now())
}

/**
 * Read saved position from localStorage.
 * Returns { pos, updatedAt } or null if nothing is saved / unreadable.
 */
export function readLocalProgressEntry(videoId: string): LocalProgressEntry | null {
  try {
    const raw = localStorage.getItem(lsKey(videoId))
    if (!raw) return null
    const parsed = JSON.parse(raw) as unknown
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      typeof (parsed as LocalProgressEntry).pos === 'number' &&
      typeof (parsed as LocalProgressEntry).updatedAt === 'number'
    ) {
      return parsed as LocalProgressEntry
    }
    // Legacy fallback: raw number stored by earlier builds
    const legacy = parseInt(raw, 10)
    if (!isNaN(legacy) && legacy > 0) {
      return { pos: legacy, updatedAt: 0 } // updatedAt=0 ensures DB wins on cross-device
    }
    return null
  } catch {
    return null
  }
}

/**
 * Determine the best resume position given localStorage and Supabase data.
 *
 * Rules:
 *   1. If ?t= URL param is present, always use it (explicit intent from user or banner click).
 *   2. Compare localStorage.updatedAt vs Supabase video.updated_at.
 *   3. Whichever is newer wins.
 *   4. Tie/equal → prefer Supabase (it's the authoritative source).
 *
 * This prevents an old laptop from overwriting progress from a phone.
 */
export function resolveResumePosition(opts: {
  urlParam: number       // from ?t= query param; 0 means absent
  videoId: string
  dbPosition: number     // video.last_position_seconds from Supabase
  dbUpdatedAt: string    // video.updated_at ISO string from Supabase
}): number {
  const { urlParam, videoId, dbPosition, dbUpdatedAt } = opts

  // Explicit URL param always wins (e.g. Continue Learning banner deep-link)
  if (urlParam > 0) return urlParam

  const local = readLocalProgressEntry(videoId)

  // No localStorage entry — use DB
  if (!local || local.pos <= 0) return dbPosition

  // Compare timestamps: newer wins
  const dbTs = dbUpdatedAt ? new Date(dbUpdatedAt).getTime() : 0
  const localNewer = local.updatedAt > dbTs

  return localNewer ? local.pos : dbPosition
}

/** @deprecated Use resolveResumePosition instead — kept for backward compat */
export function readLocalPosition(videoId: string): number {
  return readLocalProgressEntry(videoId)?.pos ?? 0
}

interface UseWatchProgressOptions {
  videoId: string
  totalDurationSeconds: number
  /** Initial watched_duration_seconds from DB (used to seed the watched accumulator) */
  initialWatchedSeconds: number
  /** Called when the video is marked complete (UI can react) */
  onCompleted?: () => void
}

interface WatchProgressReturn {
  /** Call this every time the player fires a time update (e.g. onStateChange idle loop) */
  onTimeUpdate: (currentSeconds: number) => void
  /** Call on player pause */
  onPause: (currentSeconds: number) => void
  /** Call on player end */
  onEnded: (currentSeconds: number) => void
}

export function useWatchProgress({
  videoId,
  totalDurationSeconds,
  initialWatchedSeconds,
  onCompleted,
}: UseWatchProgressOptions): WatchProgressReturn {
  // Mutable refs — avoid re-renders on every time update
  const currentPositionRef = useRef<number>(0)
  const watchedSecondsRef = useRef<number>(initialWatchedSeconds)
  const isCompletedRef = useRef<boolean>(false)
  const lastDbSyncRef = useRef<number>(Date.now())
  const syncInProgressRef = useRef<boolean>(false)

  // ── Persist to Supabase (debounced, batched) ──────────────────────────────
  const syncToDb = useCallback(async (position: number, forceComplete = false) => {
    if (syncInProgressRef.current) return
    syncInProgressRef.current = true

    try {
      const supabase = createClient()

      // Derive watched duration: take the max of accumulated and current position
      // (handles seeking backward gracefully)
      const watched = Math.max(watchedSecondsRef.current, position)
      watchedSecondsRef.current = watched

      const shouldComplete = forceComplete ||
        (totalDurationSeconds > 0 && watched / totalDurationSeconds >= COMPLETION_THRESHOLD)

      const update: Record<string, unknown> = {
        last_position_seconds: Math.floor(position),
        watched_duration_seconds: Math.floor(watched),
        updated_at: new Date().toISOString(),
      }

      if (shouldComplete && !isCompletedRef.current) {
        update.completed = true
        // On completion, watched = total
        if (totalDurationSeconds > 0) {
          update.watched_duration_seconds = totalDurationSeconds
          update.last_position_seconds = 0 // reset so next play starts fresh
        }
        isCompletedRef.current = true
        onCompleted?.()
      }

      await (supabase as any)
        .from('videos')
        .update(update)
        .eq('id', videoId)

      lastDbSyncRef.current = Date.now()
    } catch {
      // Silent — we have localStorage as fallback
    } finally {
      syncInProgressRef.current = false
    }
  }, [videoId, totalDurationSeconds, onCompleted])

  // ── Write to localStorage every 5 seconds (crash buffer) ─────────────────
  // Stores { pos, updatedAt } so cross-device conflict resolution can pick the
  // newest write instead of blindly preferring localStorage over Supabase.
  const syncToLocal = useCallback((position: number) => {
    try {
      const entry: LocalProgressEntry = {
        pos: Math.floor(position),
        updatedAt: Date.now(),
      }
      localStorage.setItem(lsKey(videoId), JSON.stringify(entry))
    } catch {
      // localStorage not available (private browsing etc.) — not critical
    }
  }, [videoId])

  // ── Clear localStorage on completion ─────────────────────────────────────
  const clearLocal = useCallback(() => {
    try {
      localStorage.removeItem(lsKey(videoId))
    } catch { /* ignore */ }
  }, [videoId])

  // ── 60-second interval sync ───────────────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      if (currentPositionRef.current > 0) {
        void syncToDb(currentPositionRef.current)
      }
    }, 60_000)

    return () => clearInterval(interval)
  }, [syncToDb])

  // ── 5-second localStorage sync ────────────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      if (currentPositionRef.current > 0) {
        syncToLocal(currentPositionRef.current)
      }
    }, 5_000)

    return () => clearInterval(interval)
  }, [syncToLocal])

  // ── visibilitychange — critical for mobile browsers ───────────────────────
  // Mobile browsers (iOS Safari, Android Chrome) kill tabs without firing
  // beforeunload. visibilitychange is the reliable cross-platform hook.
  useEffect(() => {
    function handleVisibilityChange() {
      if (document.visibilityState === 'hidden' && currentPositionRef.current > 0) {
        // Write to localStorage immediately as extra safety
        syncToLocal(currentPositionRef.current)
        void syncToDb(currentPositionRef.current)
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [syncToDb, syncToLocal])

  // ── Cleanup on unmount ────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      // Final sync when navigating away
      if (currentPositionRef.current > 0) {
        syncToLocal(currentPositionRef.current)
        void syncToDb(currentPositionRef.current)
      }
    }
  }, [syncToDb, syncToLocal])

  // ── Public API ────────────────────────────────────────────────────────────

  const onTimeUpdate = useCallback((currentSeconds: number) => {
    currentPositionRef.current = currentSeconds
    // Accumulate watched time (only moves forward, never backward from seeking)
    if (currentSeconds > watchedSecondsRef.current) {
      watchedSecondsRef.current = currentSeconds
    }
  }, [])

  const onPause = useCallback((currentSeconds: number) => {
    currentPositionRef.current = currentSeconds
    syncToLocal(currentSeconds)
    void syncToDb(currentSeconds)
  }, [syncToDb, syncToLocal])

  const onEnded = useCallback((currentSeconds: number) => {
    currentPositionRef.current = currentSeconds
    clearLocal() // clear — next play should start fresh
    void syncToDb(currentSeconds, true) // force completion
  }, [syncToDb, clearLocal])

  return { onTimeUpdate, onPause, onEnded }
}
