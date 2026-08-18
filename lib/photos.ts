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
// Кешът е за целия таб. Подновяваме 5 минути преди изтичане, но пазим
// стария URL до реалния му край — така при преподписване няма мигане
const SIGN_TTL_SECONDS = 3600
const RENEW_MARGIN_SECONDS = 300
const signedUrlCache = new Map<string, { url: string; renewAt: number; expiresAt: number }>()

// null означава „трябва (пре)подписване“
export function cachedSignedUrl(path: string): string | null {
  const entry = signedUrlCache.get(path)
  return entry && entry.renewAt > Date.now() ? entry.url : null
}

// Още валиден за показване URL, дори когато вече подлежи на подновяване
export function displaySignedUrl(path: string): string | null {
  const entry = signedUrlCache.get(path)
  return entry && entry.expiresAt > Date.now() ? entry.url : null
}

export async function signPhotoPaths(supabase: SupabaseClient, paths: string[]): Promise<void> {
  const missing = [...new Set(paths)].filter((path) => !cachedSignedUrl(path))
  if (missing.length === 0) return

  const { data } = await supabase.storage
    .from(PHOTOS_BUCKET)
    .createSignedUrls(missing, SIGN_TTL_SECONDS)

  const now = Date.now()
  for (const item of data ?? []) {
    if (item.signedUrl && item.path) {
      signedUrlCache.set(item.path, {
        url: item.signedUrl,
        renewAt: now + (SIGN_TTL_SECONDS - RENEW_MARGIN_SECONDS) * 1000,
        expiresAt: now + SIGN_TTL_SECONDS * 1000,
      })
    }
  }
}
