-- =============================================================================
-- Learning Tracker — Initial Schema
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor > New Query)
-- =============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- COURSES TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.courses (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  slug          TEXT NOT NULL,
  description   TEXT,
  thumbnail_url TEXT,
  color         TEXT NOT NULL DEFAULT '#6366f1',
  is_archived   BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, slug)
);

-- =============================================================================
-- PLAYLISTS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.playlists (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id            UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  user_id              UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title                TEXT NOT NULL,
  description          TEXT,
  order_index          INTEGER NOT NULL DEFAULT 0,
  youtube_playlist_url TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- VIDEOS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.videos (
  id                       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  playlist_id              UUID NOT NULL REFERENCES public.playlists(id) ON DELETE CASCADE,
  user_id                  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title                    TEXT NOT NULL,
  order_index              INTEGER NOT NULL DEFAULT 0,
  total_duration_seconds   INTEGER NOT NULL DEFAULT 0,
  watched_duration_seconds INTEGER NOT NULL DEFAULT 0,
  completed                BOOLEAN NOT NULL DEFAULT false,
  notes                    TEXT,
  revision_needed          BOOLEAN NOT NULL DEFAULT false,
  youtube_video_id         TEXT,
  thumbnail_url            TEXT,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- UPDATED_AT TRIGGER
-- =============================================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER courses_updated_at
  BEFORE UPDATE ON public.courses
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER playlists_updated_at
  BEFORE UPDATE ON public.playlists
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER videos_updated_at
  BEFORE UPDATE ON public.videos
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =============================================================================
-- INDEXES
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_courses_user_id ON public.courses(user_id);
CREATE INDEX IF NOT EXISTS idx_courses_slug ON public.courses(slug);
CREATE INDEX IF NOT EXISTS idx_playlists_course_id ON public.playlists(course_id);
CREATE INDEX IF NOT EXISTS idx_playlists_user_id ON public.playlists(user_id);
CREATE INDEX IF NOT EXISTS idx_videos_playlist_id ON public.videos(playlist_id);
CREATE INDEX IF NOT EXISTS idx_videos_user_id ON public.videos(user_id);
CREATE INDEX IF NOT EXISTS idx_videos_completed ON public.videos(completed);
CREATE INDEX IF NOT EXISTS idx_videos_revision_needed ON public.videos(revision_needed);

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;

-- COURSES policies
CREATE POLICY "Users can view their own courses"
  ON public.courses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own courses"
  ON public.courses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own courses"
  ON public.courses FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own courses"
  ON public.courses FOR DELETE
  USING (auth.uid() = user_id);

-- PLAYLISTS policies
CREATE POLICY "Users can view their own playlists"
  ON public.playlists FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own playlists"
  ON public.playlists FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own playlists"
  ON public.playlists FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own playlists"
  ON public.playlists FOR DELETE
  USING (auth.uid() = user_id);

-- VIDEOS policies
CREATE POLICY "Users can view their own videos"
  ON public.videos FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own videos"
  ON public.videos FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own videos"
  ON public.videos FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own videos"
  ON public.videos FOR DELETE
  USING (auth.uid() = user_id);

-- =============================================================================
-- VIEWS (for convenience)
-- =============================================================================

-- Course progress summary view
CREATE OR REPLACE VIEW public.course_progress AS
SELECT
  c.id AS course_id,
  c.user_id,
  c.title,
  c.slug,
  COUNT(DISTINCT p.id) AS playlist_count,
  COUNT(v.id) AS total_videos,
  COUNT(v.id) FILTER (WHERE v.completed = true) AS completed_videos,
  COALESCE(SUM(v.total_duration_seconds), 0) AS total_duration_seconds,
  COALESCE(SUM(v.watched_duration_seconds), 0) AS watched_duration_seconds,
  CASE
    WHEN COALESCE(SUM(v.total_duration_seconds), 0) = 0 THEN 0
    ELSE ROUND(
      (COALESCE(SUM(v.watched_duration_seconds), 0)::NUMERIC /
       COALESCE(SUM(v.total_duration_seconds), 1)::NUMERIC) * 100, 2
    )
  END AS progress_percent
FROM public.courses c
LEFT JOIN public.playlists p ON p.course_id = c.id
LEFT JOIN public.videos v ON v.playlist_id = p.id
GROUP BY c.id, c.user_id, c.title, c.slug;

-- Playlist progress summary view
CREATE OR REPLACE VIEW public.playlist_progress AS
SELECT
  p.id AS playlist_id,
  p.course_id,
  p.user_id,
  p.title,
  COUNT(v.id) AS total_videos,
  COUNT(v.id) FILTER (WHERE v.completed = true) AS completed_videos,
  COALESCE(SUM(v.total_duration_seconds), 0) AS total_duration_seconds,
  COALESCE(SUM(v.watched_duration_seconds), 0) AS watched_duration_seconds,
  CASE
    WHEN COALESCE(SUM(v.total_duration_seconds), 0) = 0 THEN 0
    ELSE ROUND(
      (COALESCE(SUM(v.watched_duration_seconds), 0)::NUMERIC /
       COALESCE(SUM(v.total_duration_seconds), 1)::NUMERIC) * 100, 2
    )
  END AS progress_percent
FROM public.playlists p
LEFT JOIN public.videos v ON v.playlist_id = p.id
GROUP BY p.id, p.course_id, p.user_id, p.title;
