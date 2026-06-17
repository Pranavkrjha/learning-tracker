import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/supabase/getUser'
import type {
  PlaylistRow,
  PlaylistInsert,
  PlaylistUpdate,
  PlaylistWithProgress,
  CreatePlaylistForm,
  PlaylistProgressRow,
} from '@/lib/types'

// =============================================================================
// GET PLAYLISTS FOR A COURSE (with progress) — parallelized
// =============================================================================
export async function getPlaylistsByCourse(courseId: string): Promise<PlaylistWithProgress[]> {
  const supabase = await createClient()
  const user = await getAuthUser()

  const { data: playlists, error } = await supabase
    .from('playlists')
    .select('*')
    .eq('course_id', courseId)
    .eq('user_id', user.id)
    .order('order_index', { ascending: true })

  if (error) throw new Error(error.message)
  if (!playlists || playlists.length === 0) return []

  const typedPlaylists = playlists as PlaylistRow[]

  const { data: progress } = await supabase
    .from('playlist_progress')
    .select('*')
    .in('playlist_id', typedPlaylists.map(p => p.id))

  const progressMap = new Map<string, PlaylistProgressRow>(
    (progress ?? []).map((p: PlaylistProgressRow) => [p.playlist_id, p])
  )

  return typedPlaylists.map(playlist => ({
    ...playlist,
    progress: progressMap.get(playlist.id) ?? null,
  }))
}

// =============================================================================
// GET SINGLE PLAYLIST BY ID — cached per request + parallelized
// Using React cache() so generateMetadata and page() share the same fetch
// =============================================================================
export const getPlaylistById = cache(async (id: string): Promise<PlaylistWithProgress | null> => {
  const supabase = await createClient()
  const user = await getAuthUser()

  // Fetch playlist + progress in parallel
  const [playlistResult, progressResult] = await Promise.all([
    supabase
      .from('playlists')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .maybeSingle(),
    supabase
      .from('playlist_progress')
      .select('*')
      .eq('playlist_id', id)
      .maybeSingle(),
  ])

  if (playlistResult.error || !playlistResult.data) return null

  return {
    ...(playlistResult.data as PlaylistRow),
    progress: (progressResult.data as PlaylistProgressRow | null),
  }
})

// =============================================================================
// CREATE PLAYLIST
// =============================================================================
export async function createPlaylist(
  courseId: string,
  form: CreatePlaylistForm
): Promise<PlaylistRow> {
  const supabase = await createClient()
  const user = await getAuthUser()

  const { data: existing } = await supabase
    .from('playlists')
    .select('order_index')
    .eq('course_id', courseId)
    .order('order_index', { ascending: false })
    .limit(1)

  const nextIndex = existing && existing.length > 0
    ? ((existing[0] as { order_index: number }).order_index ?? -1) + 1
    : 0

  const payload: PlaylistInsert = {
    course_id: courseId,
    user_id: user.id,
    title: form.title,
    description: form.description ?? null,
    order_index: nextIndex,
    youtube_playlist_url: form.youtube_playlist_url ?? null,
  }

  const { data, error } = await supabase
    .from('playlists')
    .insert(payload as any)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as PlaylistRow
}

// =============================================================================
// UPDATE PLAYLIST
// =============================================================================
export async function updatePlaylist(id: string, update: PlaylistUpdate): Promise<PlaylistRow> {
  const supabase = await createClient()
  const user = await getAuthUser()

  const { data, error } = await supabase
    .from('playlists')
    // @ts-ignore -- supabase type inference
    .update(update as any)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as PlaylistRow
}

// =============================================================================
// DELETE PLAYLIST
// =============================================================================
export async function deletePlaylist(id: string): Promise<void> {
  const supabase = await createClient()
  const user = await getAuthUser()

  const { error } = await supabase
    .from('playlists')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) throw new Error(error.message)
}
