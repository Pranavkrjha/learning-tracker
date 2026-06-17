export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// =============================================================================
// DATABASE TYPES
// =============================================================================

export interface Database {
  public: {
    Tables: {
      courses: {
        Row: CourseRow
        Insert: CourseInsert
        Update: CourseUpdate
      }
      playlists: {
        Row: PlaylistRow
        Insert: PlaylistInsert
        Update: PlaylistUpdate
      }
      videos: {
        Row: VideoRow
        Insert: VideoInsert
        Update: VideoUpdate
      }
    }
    Views: {
      course_progress: {
        Row: CourseProgressRow
      }
      playlist_progress: {
        Row: PlaylistProgressRow
      }
    }
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}

// =============================================================================
// COURSE
// =============================================================================

export interface CourseRow {
  id: string
  user_id: string
  title: string
  slug: string
  description: string | null
  thumbnail_url: string | null
  color: string
  is_archived: boolean
  is_favorite: boolean
  is_pinned: boolean
  created_at: string
  updated_at: string
}

export interface CourseInsert {
  id?: string
  user_id: string
  title: string
  slug: string
  description?: string | null
  thumbnail_url?: string | null
  color?: string
  is_archived?: boolean
  is_favorite?: boolean
  is_pinned?: boolean
  created_at?: string
  updated_at?: string
}

export interface CourseUpdate {
  title?: string
  slug?: string
  description?: string | null
  thumbnail_url?: string | null
  color?: string
  is_archived?: boolean
  is_favorite?: boolean
  is_pinned?: boolean
  updated_at?: string
}

// =============================================================================
// PLAYLIST
// =============================================================================

export interface PlaylistRow {
  id: string
  course_id: string
  user_id: string
  title: string
  description: string | null
  order_index: number
  youtube_playlist_url: string | null
  created_at: string
  updated_at: string
}

export interface PlaylistInsert {
  id?: string
  course_id: string
  user_id: string
  title: string
  description?: string | null
  order_index?: number
  youtube_playlist_url?: string | null
  created_at?: string
  updated_at?: string
}

export interface PlaylistUpdate {
  title?: string
  description?: string | null
  order_index?: number
  youtube_playlist_url?: string | null
  updated_at?: string
}

// =============================================================================
// VIDEO
// =============================================================================

export interface VideoRow {
  id: string
  playlist_id: string
  user_id: string
  title: string
  order_index: number
  total_duration_seconds: number
  watched_duration_seconds: number
  completed: boolean
  notes: string | null
  revision_needed: boolean
  youtube_video_id: string | null
  thumbnail_url: string | null
  created_at: string
  updated_at: string
}

export interface VideoInsert {
  id?: string
  playlist_id: string
  user_id: string
  title: string
  order_index?: number
  total_duration_seconds?: number
  watched_duration_seconds?: number
  completed?: boolean
  notes?: string | null
  revision_needed?: boolean
  youtube_video_id?: string | null
  thumbnail_url?: string | null
  created_at?: string
  updated_at?: string
}

export interface VideoUpdate {
  title?: string
  order_index?: number
  total_duration_seconds?: number
  watched_duration_seconds?: number
  completed?: boolean
  notes?: string | null
  revision_needed?: boolean
  youtube_video_id?: string | null
  thumbnail_url?: string | null
  updated_at?: string
}

// =============================================================================
// VIEW TYPES
// =============================================================================

export interface CourseProgressRow {
  course_id: string
  user_id: string
  title: string
  slug: string
  playlist_count: number
  total_videos: number
  completed_videos: number
  total_duration_seconds: number
  watched_duration_seconds: number
  progress_percent: number
}

export interface PlaylistProgressRow {
  playlist_id: string
  course_id: string
  user_id: string
  title: string
  total_videos: number
  completed_videos: number
  total_duration_seconds: number
  watched_duration_seconds: number
  progress_percent: number
}

// =============================================================================
// APP-LEVEL EXTENDED TYPES
// =============================================================================

export type Course = CourseRow

export type CourseWithProgress = CourseRow & {
  progress: CourseProgressRow | null
  playlists?: PlaylistWithProgress[]
}

export type Playlist = PlaylistRow

export type PlaylistWithProgress = PlaylistRow & {
  progress: PlaylistProgressRow | null
  videos?: Video[]
}

export type Video = VideoRow

export type VideoWithDerived = VideoRow & {
  remaining_duration_seconds: number
  progress_percent: number
}

// =============================================================================
// FORM TYPES
// =============================================================================

export interface CreateCourseForm {
  title: string
  description?: string
  color: string
}

export interface CreatePlaylistForm {
  title: string
  description?: string
  youtube_playlist_url?: string
}

export interface CreateVideoForm {
  title: string
  total_duration_seconds: number
  order_index?: number
}

export interface UpdateVideoForm {
  watched_duration_seconds?: number
  completed?: boolean
  notes?: string
  revision_needed?: boolean
}

// =============================================================================
// UI TYPES
// =============================================================================

export type FilterStatus = 'all' | 'in_progress' | 'completed' | 'not_started'

export interface CourseFilters {
  search: string
  status: FilterStatus
}

export type ProgressVariant = 'linear' | 'circular'
export type ProgressSize = 'sm' | 'md' | 'lg'
export type ThemeColor = 'indigo' | 'violet' | 'cyan' | 'emerald' | 'rose' | 'amber' | 'sky' | 'pink'
export type ThemeName = 'dark' | 'light' | 'midnight-blue' | 'forest-green'

// =============================================================================
// IMPORT JOB TYPES (YouTube import)
// =============================================================================
export type ImportJobStatus = 'pending' | 'running' | 'done' | 'failed'

export interface ImportJobRow {
  id: string
  user_id: string
  playlist_id: string
  status: ImportJobStatus
  total_videos: number | null
  imported_count: number
  error_message: string | null
  started_at: string | null
  finished_at: string | null
  created_at: string
}

export interface YouTubeVideoImport {
  title: string
  youtube_video_id: string
  thumbnail_url: string | null
  total_duration_seconds: number
  order_index: number
}

export interface ImportResult {
  jobId: string
  status: ImportJobStatus
  imported: number
  total: number
  errors?: string[]
}
