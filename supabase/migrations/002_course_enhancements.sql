-- =============================================================================
-- Learning Tracker — Course Enhancements + YouTube Import Prep
-- Run this in your Supabase SQL Editor AFTER 001_initial_schema.sql
-- =============================================================================

-- =============================================================================
-- COURSES: Add is_favorite and is_pinned columns
-- =============================================================================
ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_pinned   BOOLEAN NOT NULL DEFAULT false;

-- Indexes for filtering
CREATE INDEX IF NOT EXISTS idx_courses_is_favorite ON public.courses(user_id, is_favorite) WHERE is_favorite = true;
CREATE INDEX IF NOT EXISTS idx_courses_is_pinned   ON public.courses(user_id, is_pinned)   WHERE is_pinned = true;

-- =============================================================================
-- IMPORT JOBS: Track YouTube import progress
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.import_jobs (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  playlist_id    UUID NOT NULL REFERENCES public.playlists(id) ON DELETE CASCADE,
  status         TEXT NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending', 'running', 'done', 'failed')),
  total_videos   INTEGER,
  imported_count INTEGER NOT NULL DEFAULT 0,
  error_message  TEXT,
  started_at     TIMESTAMPTZ,
  finished_at    TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_import_jobs_playlist_id ON public.import_jobs(playlist_id);
CREATE INDEX IF NOT EXISTS idx_import_jobs_user_id     ON public.import_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_import_jobs_status      ON public.import_jobs(status);

ALTER TABLE public.import_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own import jobs"
  ON public.import_jobs FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own import jobs"
  ON public.import_jobs FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own import jobs"
  ON public.import_jobs FOR UPDATE USING (auth.uid() = user_id);
