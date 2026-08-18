'use client'

import Image from 'next/image'
import { useSignedPhotoUrls } from '@/hooks/usePhotoUrls'

interface PhotoThumbProps {
  photo: string
  alt: string
  sizes: string
  className?: string
}

// Снимка от частния bucket — изчаква подписания URL с дискретен placeholder
export default function PhotoThumb({ photo, alt, sizes, className }: PhotoThumbProps) {
  const [url] = useSignedPhotoUrls([photo])
  if (!url) {
    return <div className="h-full w-full animate-pulse bg-gray-200 dark:bg-gray-700" />
  }
  return <Image src={url} alt={alt} fill sizes={sizes} className={className} />
}
