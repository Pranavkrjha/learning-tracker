/**
 * Per-request cached getUser helper.
 *
 * React's `cache()` deduplicates calls within a single server request
 * so every service function that calls `getAuthUser()` in the same
 * request shares ONE JWT validation round-trip instead of N separate ones.
 *
 * This is the primary fix for the 10-15 second playlist page load times.
 */
import { cache } from 'react'
import { createClient } from './server'

export const getAuthUser = cache(async () => {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) throw new Error('Unauthorized')
  return user
})
