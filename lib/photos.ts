import type { SupabaseClient } from '@supabase/supabase-js'

export const PHOTOS_BUCKET = 'photos'
export const MAX_PHOTOS = 6
export const MAX_PHOTO_SIZE_MB = 5

const PUBLIC_PATH_MARKER = `/storage/v1/object/public/${PHOTOS_BUCKET}/`

// Извлича пътя в bucket-а от публичен URL (старият формат на запис)
export function photoStoragePath(url: string): string | null {
  const index = url.indexOf(PUBLIC_PATH_MARKER)
  if (index === -1) return null
  return decodeURIComponent(url.slice(index + PUBLIC_PATH_MARKER.length))
}

// Нормализира запис от photos[]: старите записи са публични URL-и,
// новите — директно пътища в bucket-а
export function photoPath(value: string): string {
  return photoStoragePath(value) ?? value
}

// Bucket-ът е частен — снимките се показват през подписани URL-и.
// Кешът е за целия таб; подновяваме 5 минути преди изтичане
const SIGN_TTL_SECONDS = 3600
const signedUrlCache = new Map<string, { url: string; expiresAt: number }>()

export function cachedSignedUrl(path: string): string | null {
  const entry = signedUrlCache.get(path)
  return entry && entry.expiresAt > Date.now() ? entry.url : null
}

export async function signPhotoPaths(supabase: SupabaseClient, paths: string[]): Promise<void> {
  const missing = [...new Set(paths)].filter((path) => !cachedSignedUrl(path))
  if (missing.length === 0) return

  const { data } = await supabase.storage
    .from(PHOTOS_BUCKET)
    .createSignedUrls(missing, SIGN_TTL_SECONDS)

  const expiresAt = Date.now() + (SIGN_TTL_SECONDS - 300) * 1000
  for (const item of data ?? []) {
    if (item.signedUrl && item.path) {
      signedUrlCache.set(item.path, { url: item.signedUrl, expiresAt })
    }
  }
}
