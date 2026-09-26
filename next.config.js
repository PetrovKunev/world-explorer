/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ключът за CARTO tile-овете е нужен в браузъра (картата е клиентска).
  // Vercel не приема NEXT_PUBLIC_ префикс за него, затова стойността от
  // NEXT_CARTO_API_KEY се вгражда в клиентския код при build
  env: {
    NEXT_CARTO_API_KEY: process.env.NEXT_CARTO_API_KEY ?? '',
  },
  images: {
    remotePatterns: [
      // Частният bucket сервира снимките през подписани URL-и
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/sign/**',
      },
    ],
  },
}

module.exports = nextConfig
