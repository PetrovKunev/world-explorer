import type { MetadataRoute } from 'next'

// PWA манифест — при „Добави на начален екран“ приложението се отваря
// самостоятелно (без браузър UI) и с логото като икона
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'World Explorer',
    short_name: 'World Explorer',
    description:
      'Интерактивна карта за проследяване на вашите дестинации в Европа и по света.',
    lang: 'bg',
    start_url: '/',
    display: 'standalone',
    background_color: '#fffcfa',
    theme_color: '#ffffff',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      {
        src: '/icon-512-maskable.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
