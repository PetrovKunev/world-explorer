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
  applicationName: 'World Explorer',
  // iOS няма пълна поддръжка на манифеста — тези мета тагове дават
  // standalone режим и име при „Добави на начален екран“
  appleWebApp: {
    capable: true,
    title: 'World Explorer',
    statusBarStyle: 'default',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#1f2937' },
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="bg" suppressHydrationWarning>
      <body className={inter.className}>
        {/* Прилага темата преди първото рендиране, за да няма светкавица */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('theme');if(t==='dark'||(!t&&matchMedia('(prefers-color-scheme: dark)').matches))document.documentElement.classList.add('dark')}catch(e){}`,
          }}
        />
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
