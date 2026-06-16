'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { CreatePlaylistForm } from '@/lib/types'

const schema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters').max(100),
  description: z.string().max(500).optional(),
  youtube_playlist_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
})

type FormValues = z.infer<typeof schema>

interface AddPlaylistModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: CreatePlaylistForm) => Promise<void>
}

export function AddPlaylistModal({ open, onClose, onSubmit }: AddPlaylistModalProps) {
  const [loading, setLoading] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: '', description: '', youtube_playlist_url: '' },
  })

  async function handleSubmit(data: FormValues) {
    setLoading(true)
    try {
      await onSubmit({
        title: data.title,
        description: data.description,
        youtube_playlist_url: data.youtube_playlist_url || undefined,
      })
      form.reset()
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Playlist</DialogTitle>
          <DialogDescription>
            Create a new playlist to organize videos within this course.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label htmlFor="playlist-title">Playlist Title *</Label>
            <Input
              id="playlist-title"
              placeholder="e.g. Module 1 — Fundamentals"
              {...form.register('title')}
              className={form.formState.errors.title ? 'border-destructive' : ''}
            />
            {form.formState.errors.title && (
              <p className="text-xs text-destructive">{form.formState.errors.title.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="playlist-description">Description</Label>
            <Textarea
              id="playlist-description"
              placeholder="Optional description..."
              rows={2}
              className="resize-none"
              {...form.register('description')}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="playlist-youtube-url">
              YouTube Playlist URL{' '}
              <span className="text-muted-foreground text-xs">(optional — import later)</span>
            </Label>
            <Input
              id="playlist-youtube-url"
              placeholder="https://www.youtube.com/playlist?list=..."
              {...form.register('youtube_playlist_url')}
              className={form.formState.errors.youtube_playlist_url ? 'border-destructive' : ''}
            />
            {form.formState.errors.youtube_playlist_url && (
              <p className="text-xs text-destructive">
                {form.formState.errors.youtube_playlist_url.message}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              YouTube import will be available soon. Save the URL now for later.
            </p>
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button
              id="submit-playlist-btn"
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white border-0"
            >
              {loading ? 'Adding...' : 'Add Playlist'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
