'use client'

import { useState } from 'react'
import { Loader2, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { importYouTubePlaylist, type ImportYouTubeResult } from '@/app/actions/importPlaylist'
import { cn } from '@/lib/utils'

function YouTubeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  )
}

interface Props {
  open: boolean
  onClose: () => void
  /** Called with the new/synced playlist's id and title on success */
  onSuccess: (playlistId: string, playlistTitle: string) => void
  courseId: string
  /** If provided, sync into this playlist instead of creating a new one */
  existingPlaylistId?: string | null
  /** Pre-fill the URL field (e.g. from a linked playlist) */
  initialUrl?: string
}

type Phase = 'input' | 'loading' | 'success' | 'error'

export function ImportYouTubeModal({
  open,
  onClose,
  onSuccess,
  courseId,
  existingPlaylistId = null,
  initialUrl = '',
}: Props) {
  const [url, setUrl] = useState(initialUrl)
  const [phase, setPhase] = useState<Phase>('input')
  const [result, setResult] = useState<ImportYouTubeResult | null>(null)
  const [errorMsg, setErrorMsg] = useState('')

  function reset() {
    setUrl(initialUrl)
    setPhase('input')
    setResult(null)
    setErrorMsg('')
  }

  function handleClose() {
    if (phase === 'loading') return
    reset()
    onClose()
  }

  async function handleImport() {
    if (!url.trim()) return
    setPhase('loading')
    setErrorMsg('')

    try {
      const res = await importYouTubePlaylist({
        youtubeUrl: url.trim(),
        courseId,
        existingPlaylistId,
      })
      setResult(res)
      setPhase('success')
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Import failed')
      setPhase('error')
    }
  }

  function handleSuccessClose() {
    const id = result?.playlistId ?? ''
    const title = result?.playlistTitle ?? ''
    reset()
    onClose()
    onSuccess(id, title)
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose() }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <YouTubeIcon className="h-5 w-5 text-red-500" />
            Import YouTube Playlist
          </DialogTitle>
          <DialogDescription>
            {existingPlaylistId
              ? 'Sync videos from YouTube into this playlist. Your progress will be preserved.'
              : 'Paste a YouTube playlist URL to create a new playlist with all its videos.'}
          </DialogDescription>
        </DialogHeader>

        {/* ── Input Phase ─────────────────────────────────────────────────── */}
        {phase === 'input' && (
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="yt-url">YouTube Playlist URL</Label>
              <Input
                id="yt-url"
                type="url"
                placeholder="https://www.youtube.com/playlist?list=..."
                value={url}
                onChange={e => setUrl(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleImport()}
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                Must contain <code className="bg-secondary px-1 rounded text-xs">?list=</code> parameter
              </p>
            </div>

            <div className="rounded-lg border border-border/50 bg-secondary/30 p-3 space-y-1">
              <p className="text-xs font-medium text-foreground">What gets imported:</p>
              <ul className="text-xs text-muted-foreground space-y-0.5 list-disc list-inside">
                <li>Playlist title</li>
                <li>All public videos (title, duration, thumbnail)</li>
                <li>Playlist order / position</li>
              </ul>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={handleClose}>Cancel</Button>
              <Button
                id="start-import-btn"
                onClick={handleImport}
                disabled={!url.trim()}
                className="bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white border-0"
              >
                Import
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* ── Loading Phase ───────────────────────────────────────────────── */}
        {phase === 'loading' && (
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="relative">
              <div className="h-16 w-16 rounded-full border-4 border-red-500/20 flex items-center justify-center">
                <YouTubeIcon className="h-8 w-8 text-red-500" />
              </div>
              <Loader2 className="absolute -inset-1 h-[68px] w-[68px] animate-spin text-red-500/50" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium">Fetching playlist from YouTube…</p>
              <p className="text-xs text-muted-foreground mt-1">
                This may take a moment for large playlists
              </p>
            </div>
          </div>
        )}

        {/* ── Success Phase ───────────────────────────────────────────────── */}
        {phase === 'success' && result && (
          <div className="space-y-4 pt-2">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold">{result.playlistTitle}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Import complete
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <StatPill label="New Videos" value={result.imported} color="emerald" />
              <StatPill label="Updated"    value={result.updated}  color="sky" />
              <StatPill label="Unchanged"  value={result.skipped}  color="slate" />
            </div>

            {result.imported === 0 && result.updated === 0 && (
              <p className="text-xs text-center text-muted-foreground">
                Playlist was already up to date — no changes made.
              </p>
            )}

            <Button
              id="import-done-btn"
              className="w-full"
              onClick={handleSuccessClose}
            >
              View Playlist
            </Button>
          </div>
        )}

        {/* ── Error Phase ─────────────────────────────────────────────────── */}
        {phase === 'error' && (
          <div className="space-y-4 pt-2">
            <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
              <AlertCircle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-destructive">Import Failed</p>
                <p className="text-xs text-muted-foreground mt-1">{errorMsg}</p>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={handleClose}>Cancel</Button>
              <Button
                id="retry-import-btn"
                onClick={() => setPhase('input')}
                variant="outline"
              >
                Try Again
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

// Small stat pill for the success view
function StatPill({
  label,
  value,
  color,
}: {
  label: string
  value: number
  color: 'emerald' | 'sky' | 'slate'
}) {
  const colors = {
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    sky:     'bg-sky-500/10 text-sky-400 border-sky-500/20',
    slate:   'bg-secondary text-muted-foreground border-border/50',
  }
  return (
    <div className={cn('rounded-lg border px-3 py-2 text-center', colors[color])}>
      <p className="text-xl font-bold tabular-nums">{value}</p>
      <p className="text-[11px] mt-0.5">{label}</p>
    </div>
  )
}
