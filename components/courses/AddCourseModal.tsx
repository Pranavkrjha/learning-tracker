'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { COURSE_COLORS } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { CreateCourseForm } from '@/lib/types'

const schema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters').max(100),
  description: z.string().max(500).optional(),
  color: z.string().min(1, 'Please select a color'),
})

type FormValues = z.infer<typeof schema>

interface AddCourseModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: CreateCourseForm) => Promise<void>
}

export function AddCourseModal({ open, onClose, onSubmit }: AddCourseModalProps) {
  const [loading, setLoading] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '',
      description: '',
      color: COURSE_COLORS[0].value,
    },
  })

  const selectedColor = form.watch('color')

  async function handleSubmit(data: FormValues) {
    setLoading(true)
    try {
      await onSubmit(data)
      form.reset()
      onClose()
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Course</DialogTitle>
          <DialogDescription>
            Add a new course to start tracking your learning journey.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 mt-2">
          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="course-title">Course Title *</Label>
            <Input
              id="course-title"
              placeholder="e.g. Complete React Developer Course"
              {...form.register('title')}
              className={form.formState.errors.title ? 'border-destructive' : ''}
            />
            {form.formState.errors.title && (
              <p className="text-xs text-destructive">{form.formState.errors.title.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="course-description">Description</Label>
            <Textarea
              id="course-description"
              placeholder="Optional: What will you learn in this course?"
              rows={3}
              className="resize-none"
              {...form.register('description')}
            />
          </div>

          {/* Color picker */}
          <div className="space-y-2">
            <Label>Accent Color</Label>
            <div className="flex flex-wrap gap-2">
              {COURSE_COLORS.map(color => (
                <button
                  key={color.value}
                  type="button"
                  id={`color-${color.label.toLowerCase()}`}
                  onClick={() => form.setValue('color', color.value)}
                  className={cn(
                    'h-8 w-8 rounded-lg transition-all duration-200',
                    'ring-2 ring-transparent ring-offset-2 ring-offset-background',
                    selectedColor === color.value && 'ring-white scale-110'
                  )}
                  style={{ backgroundColor: color.value }}
                  title={color.label}
                  aria-label={`Select ${color.label} color`}
                />
              ))}
            </div>

            {/* Preview */}
            <div
              className="flex h-10 items-center gap-2.5 rounded-lg px-3 text-white text-sm font-medium"
              style={{ background: `linear-gradient(135deg, ${selectedColor}, ${selectedColor}aa)` }}
            >
              <div className="h-5 w-5 rounded-md bg-white/20 flex items-center justify-center text-[10px] font-bold">
                {form.watch('title')?.[0]?.toUpperCase() ?? 'C'}
              </div>
              <span className="truncate">{form.watch('title') || 'Course Preview'}</span>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              id="submit-course-btn"
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white border-0"
            >
              {loading ? 'Creating...' : 'Create Course'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
