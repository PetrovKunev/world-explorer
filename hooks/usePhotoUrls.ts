'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { cachedSignedUrl, photoPath, signPhotoPaths } from '@/lib/photos'

// Подписани URL-и за снимки от частния bucket, подравнени с входния
// масив; null, докато URL-ът се зарежда
export function useSignedPhotoUrls(photos: string[]): (string | null)[] {
  const supabase = useMemo(() => createClient(), [])
  const [, setVersion] = useState(0)

  const paths = photos.map(photoPath)
  const key = paths.join('|')

  useEffect(() => {
    const missing = paths.filter((path) => !cachedSignedUrl(path))
    if (missing.length === 0) return
    let cancelled = false
    void signPhotoPaths(supabase, missing).then(() => {
      if (!cancelled) setVersion((version) => version + 1)
    })
    return () => {
      cancelled = true
    }
    // paths се извежда от key — стабилен низ за същото съдържание
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, supabase])

  return paths.map(cachedSignedUrl)
}
