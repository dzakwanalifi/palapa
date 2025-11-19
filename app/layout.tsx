import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'PALAPA - Budaya GO',
  description: 'Teman virtualmu untuk berwisata di seluruh Indonesia 🇮🇩',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id">
      <body className="antialiased bg-white" suppressHydrationWarning>
        {children}
      </body>
    </html>
  )
}