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
import type { CreateVideoForm } from '@/lib/types'
import { parseDuration } from '@/lib/utils'

const schema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  duration: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

interface AddVideoModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: CreateVideoForm) => Promise<void>
}

export function AddVideoModal({ open, onClose, onSubmit }: AddVideoModalProps) {
  const [loading, setLoading] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: '', duration: '' },
  })

  async function handleSubmit(data: FormValues) {
    setLoading(true)
    try {
      await onSubmit({
        title: data.title,
        total_duration_seconds: parseDuration(data.duration ?? ''),
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
          <DialogTitle>Add Video</DialogTitle>
          <DialogDescription>
            Add a video to this playlist to track your progress.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label htmlFor="video-title">Video Title *</Label>
            <Input
              id="video-title"
              placeholder="e.g. Introduction to React Hooks"
              {...form.register('title')}
              className={form.formState.errors.title ? 'border-destructive' : ''}
            />
            {form.formState.errors.title && (
              <p className="text-xs text-destructive">{form.formState.errors.title.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="video-duration">
              Total Duration{' '}
              <span className="text-muted-foreground text-xs">(HH:MM:SS or MM:SS)</span>
            </Label>
            <Input
              id="video-duration"
              placeholder="e.g. 12:34 or 1:05:20"
              {...form.register('duration')}
            />
            <p className="text-xs text-muted-foreground">
              You can also enter plain seconds (e.g. 754)
            </p>
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button
              id="submit-video-btn"
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white border-0"
            >
              {loading ? 'Adding...' : 'Add Video'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
