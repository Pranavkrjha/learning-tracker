-- =============================================================================
-- Learning Tracker — Focus Mode (Phase 3)
-- Run AFTER 003_learning_enhancements.sql
-- =============================================================================

-- Add last_position_seconds to videos for exact resume positioning.
-- This is separate from watched_duration_seconds (which tracks cumulative watched time).
-- last_position_seconds = exact timestamp in the video where the user stopped.
ALTER TABLE public.videos
  ADD COLUMN IF NOT EXISTS last_position_seconds INTEGER NOT NULL DEFAULT 0;

-- Index to support Continue Learning query ordering by updated_at (already exists via trigger)
-- No additional index needed — the existing updated_at index covers getContinueLearning().
