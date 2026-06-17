import { createClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/supabase/getUser'
import type { VideoRow, CreateVideoForm, UpdateVideoForm } from '@/lib/types'

export async function getVideosByPlaylist(playlistId: string): Promise<VideoRow[]> {
  const supabase = await createClient()
  const user = await getAuthUser()

  const { data, error } = await supabase
    .from('videos')
    .select('*')
    .eq('playlist_id', playlistId)
    .eq('user_id', user.id)
    .order('order_index', { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []) as VideoRow[]
}

export async function getVideoById(id: string): Promise<VideoRow | null> {
  const supabase = await createClient()
  const user = await getAuthUser()

  const { data, error } = await supabase
    .from('videos').select('*').eq('id', id).eq('user_id', user.id).maybeSingle()

  if (error || !data) return null
  return data as VideoRow
}

export async function createVideo(playlistId: string, form: CreateVideoForm): Promise<VideoRow> {
  const supabase = await createClient()
  const user = await getAuthUser()

  const { data: existing } = await supabase
    .from('videos').select('order_index').eq('playlist_id', playlistId)
    .order('order_index', { ascending: false }).limit(1)

  const nextIndex = existing && existing.length > 0
    ? ((existing[0] as { order_index: number }).order_index ?? -1) + 1
    : 0

  const { data, error } = await supabase
    .from('videos')
    .insert({
      playlist_id: playlistId,
      user_id: user.id,
      title: form.title,
      total_duration_seconds: form.total_duration_seconds,
      order_index: form.order_index ?? nextIndex,
    } as any)
    .select().single()

  if (error) throw new Error(error.message)
  return data as VideoRow
}

export async function updateVideo(id: string, update: UpdateVideoForm): Promise<VideoRow> {
  const supabase = await createClient()
  const user = await getAuthUser()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('videos').update(update).eq('id', id).eq('user_id', user.id).select().single()

  if (error) throw new Error(error.message)
  return data as VideoRow
}

export async function toggleVideoCompleted(id: string, completed: boolean): Promise<VideoRow> {
  const supabase = await createClient()
  const user = await getAuthUser()

  const { data: video } = await supabase
    .from('videos').select('total_duration_seconds').eq('id', id).maybeSingle()
  const typedVideo = video as { total_duration_seconds: number } | null

  const updatePayload: Record<string, unknown> = { completed }
  if (completed && typedVideo) {
    updatePayload.watched_duration_seconds = typedVideo.total_duration_seconds
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('videos').update(updatePayload).eq('id', id).eq('user_id', user.id).select().single()

  if (error) throw new Error(error.message)
  return data as VideoRow
}

export async function toggleRevisionNeeded(id: string, needed: boolean): Promise<VideoRow> {
  const supabase = await createClient()
  const user = await getAuthUser()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('videos').update({ revision_needed: needed }).eq('id', id).eq('user_id', user.id)
    .select().single()

  if (error) throw new Error(error.message)
  return data as VideoRow
}

export async function deleteVideo(id: string): Promise<void> {
  const supabase = await createClient()
  const user = await getAuthUser()

  const { error } = await supabase.from('videos').delete().eq('id', id).eq('user_id', user.id)
  if (error) throw new Error(error.message)
}

export async function reorderVideos(updates: { id: string; order_index: number }[]): Promise<void> {
  const supabase = await createClient()
  const user = await getAuthUser()

  await Promise.all(
    updates.map(({ id, order_index }) =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase as any).from('videos').update({ order_index }).eq('id', id).eq('user_id', user.id)
    )
  )
}
