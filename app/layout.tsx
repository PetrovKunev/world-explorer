import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import 'leaflet/dist/leaflet.css'
import Footer from '@/components/Footer'

const inter = Inter({ subsets: ['latin', 'cyrillic'] })

export const metadata: Metadata = {
  title: 'World Explorer — интерактивна карта на пътуванията',
  description:
    'Интерактивна карта за проследяване на вашите дестинации в Европа и по света.',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="bg">
      <body className={inter.className}>
        {/* React 19 повдига link елемента в <head> — по-бърза първа заявка към tile сървъра */}
        <link rel="preconnect" href="https://tile.openstreetmap.org" />
        <div className="flex h-dvh flex-col">
          <main className="flex-1 overflow-hidden">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  )
}
