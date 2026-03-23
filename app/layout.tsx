import type { Metadata } from 'next'
import { Geist, Sora } from 'next/font/google'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const soraDisplay = Sora({
  variable: '--font-display',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'ListingOS - Real Estate Marketing Platform',
  description: 'Generate all your listing marketing content in one click.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${soraDisplay.variable} h-full`}>
      <body className="min-h-full antialiased">{children}</body>
    </html>
  )
}
