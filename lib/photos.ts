export const PHOTOS_BUCKET = 'photos'
export const MAX_PHOTOS = 6
export const MAX_PHOTO_SIZE_MB = 5

const PUBLIC_PATH_MARKER = `/storage/v1/object/public/${PHOTOS_BUCKET}/`

// Извлича пътя в bucket-а от публичен URL на снимка
export function photoStoragePath(url: string): string | null {
  const index = url.indexOf(PUBLIC_PATH_MARKER)
  if (index === -1) return null
  return decodeURIComponent(url.slice(index + PUBLIC_PATH_MARKER.length))
}
