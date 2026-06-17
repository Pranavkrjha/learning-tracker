'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { Palette, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

const THEMES = [
  {
    id: 'dark',
    label: 'Dark',
    description: 'Default deep dark',
    swatch: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    bg: '#0d1117',
  },
  {
    id: 'light',
    label: 'Light',
    description: 'Clean and bright',
    swatch: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    bg: '#f8fafc',
  },
  {
    id: 'midnight-blue',
    label: 'Midnight Blue',
    description: 'Deep navy focus',
    swatch: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
    bg: '#04070f',
  },
  {
    id: 'forest-green',
    label: 'Forest Green',
    description: 'Earthy calm',
    swatch: 'linear-gradient(135deg, #10b981, #06b6d4)',
    bg: '#040d09',
  },
] as const

export function ThemeSelector() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  const current = THEMES.find(t => t.id === theme) ?? THEMES[0]

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg">
        <Palette className="h-4 w-4" />
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={
        <Button
          id="theme-selector-btn"
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-lg text-muted-foreground hover:text-foreground"
          title={`Theme: ${current.label}`}
        >
          <div
            className="h-4 w-4 rounded-full ring-1 ring-border/60"
            style={{ background: current.swatch }}
          />
        </Button>
      } />
      <DropdownMenuContent align="end" className="w-52 p-1.5">
        <div className="px-2 py-1.5 mb-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Theme
          </p>
        </div>
        {THEMES.map(t => (
          <DropdownMenuItem
            key={t.id}
            onClick={() => setTheme(t.id)}
            className={cn(
              'flex items-center gap-3 rounded-lg px-2 py-2 cursor-pointer',
              theme === t.id && 'bg-accent'
            )}
          >
            {/* Preview swatch */}
            <div
              className="relative h-8 w-8 shrink-0 rounded-lg ring-1 ring-border/60 overflow-hidden"
              style={{ backgroundColor: t.bg }}
            >
              <div
                className="absolute inset-0 opacity-80"
                style={{
                  background: t.swatch,
                  mask: 'radial-gradient(circle at 70% 30%, black 30%, transparent 70%)',
                  WebkitMask: 'radial-gradient(circle at 70% 30%, black 30%, transparent 70%)',
                }}
              />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{t.label}</p>
              <p className="text-xs text-muted-foreground">{t.description}</p>
            </div>

            {theme === t.id && (
              <Check className="h-3.5 w-3.5 shrink-0 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
