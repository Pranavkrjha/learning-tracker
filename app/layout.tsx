import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { Toaster } from '@/components/ui/sonner'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'LearnTrack — Your Learning Dashboard',
    template: '%s | LearnTrack',
  },
  description:
    'Track your learning progress across courses, playlists, and videos. Stay organized, mark revisions, and measure your growth.',
  keywords: ['learning tracker', 'study tracker', 'video progress', 'course tracker'],
  authors: [{ name: 'LearnTrack' }],
  creator: 'LearnTrack',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    title: 'LearnTrack — Your Learning Dashboard',
    description: 'Track your learning progress across courses, playlists, and videos.',
    siteName: 'LearnTrack',
  },
  robots: {
    index: false,
    follow: false,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <body className="min-h-screen bg-background font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          themes={['dark', 'light', 'midnight-blue', 'forest-green']}
          enableSystem={false}
          disableTransitionOnChange
        >
          {children}
          <Toaster richColors position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  )
}
