'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { cachedSignedUrl, displaySignedUrl, photoPath, signPhotoPaths } from '@/lib/photos'

// Подписани URL-и за снимки от частния bucket, подравнени с входния
// масив; null, докато URL-ът се зарежда. Effect-ът зависи от списъка на
// липсващите URL-и, така че изтеклите се преподписват при следващия
// render, а при неуспех (мрежа/Storage) опитва отново след 5 секунди.
export function useSignedPhotoUrls(photos: string[]): (string | null)[] {
  const supabase = useMemo(() => createClient(), [])
  const [, setVersion] = useState(0)

  const paths = photos.map(photoPath)
  const missingKey = paths.filter((path) => !cachedSignedUrl(path)).join('|')

  useEffect(() => {
    if (!missingKey) return
    let cancelled = false
    let retryTimer: ReturnType<typeof setTimeout> | null = null

    const attempt = () => {
      void signPhotoPaths(supabase, missingKey.split('|')).then(() => {
        if (cancelled) return
        if (missingKey.split('|').some((path) => !cachedSignedUrl(path))) {
          retryTimer = setTimeout(attempt, 5000)
        } else {
          setVersion((version) => version + 1)
        }
      })
    }
    attempt()

    return () => {
      cancelled = true
      if (retryTimer) clearTimeout(retryTimer)
    }
  }, [missingKey, supabase])

  // Показваме и „застаряващ“, но още валиден URL, докато тече подновяването
  return paths.map((path) => cachedSignedUrl(path) ?? displaySignedUrl(path))
}
