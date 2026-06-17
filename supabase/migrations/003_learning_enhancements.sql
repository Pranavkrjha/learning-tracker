-- =============================================================================
-- Learning Tracker — Learning Experience Enhancements
-- Phase 1 + Phase 2
-- Run AFTER 001_initial_schema.sql and 002_course_enhancements.sql
-- =============================================================================

-- =============================================================================
-- VIDEOS: revision_count (replaces revision_needed boolean logic)
-- We keep revision_needed for backward compat but add revision_count
-- =============================================================================
ALTER TABLE public.videos
  ADD COLUMN IF NOT EXISTS revision_count INTEGER NOT NULL DEFAULT 0
    CHECK (revision_count >= 0);

-- Back-fill: any video already marked revision_needed gets count = 1
UPDATE public.videos
SET revision_count = 1
WHERE revision_needed = true AND revision_count = 0;

CREATE INDEX IF NOT EXISTS idx_videos_revision_count
  ON public.videos(revision_count)
  WHERE revision_count > 0;

-- =============================================================================
-- PLAYLISTS: playback_speed per playlist
-- Supported: 1.00, 1.25, 1.50, 1.75, 2.00
-- =============================================================================
ALTER TABLE public.playlists
  ADD COLUMN IF NOT EXISTS playback_speed NUMERIC(4,2) NOT NULL DEFAULT 1.00
    CHECK (playback_speed IN (1.00, 1.25, 1.50, 1.75, 2.00));

CREATE INDEX IF NOT EXISTS idx_playlists_playback_speed
  ON public.playlists(playback_speed)
  WHERE playback_speed != 1.00;
