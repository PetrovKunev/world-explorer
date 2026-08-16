// Обратно геокодиране чрез OpenStreetMap Nominatim — връща име на мястото
// и географски данни (държава, град, континент) за дадени координати.
// Работи и в браузъра, и в Node (backfill скрипта).

import { Continent, continentFor } from './continents'

export interface ResolvedLocation {
  name: string
  country: string | null
  country_code: string | null
  city: string | null
  continent: Continent | null
}

interface NominatimReverseResponse {
  name?: string
  display_name?: string
  address?: {
    country?: string
    country_code?: string
    city?: string
    town?: string
    village?: string
    municipality?: string
    county?: string
  }
}

export async function reverseGeocode(
  lat: number,
  lng: number,
  options?: { timeoutMs?: number }
): Promise<ResolvedLocation | null> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), options?.timeoutMs ?? 4000)

  // Nominatim изисква идентифициращ User-Agent; браузърът не позволява
  // да се задава, затова го пращаме само от Node (backfill скрипта)
  const headers: Record<string, string> =
    typeof window === 'undefined'
      ? { 'User-Agent': 'world-explorer (github.com/PetrovKunev/world-explorer)' }
      : {}

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&accept-language=bg&zoom=18&lat=${lat}&lon=${lng}`,
      { signal: controller.signal, headers }
    )
    if (!res.ok) return null
    const data = (await res.json()) as NominatimReverseResponse
    const address = data.address ?? {}
    const countryCode = address.country_code?.toUpperCase() ?? null
    return {
      name: data.name || data.display_name?.split(',')[0] || '',
      country: address.country ?? null,
      country_code: countryCode,
      city:
        address.city || address.town || address.village || address.municipality || null,
      continent: continentFor(countryCode),
    }
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

// Полетата за запис в базата — празен обект, ако геокодирането е неуспешно
export function locationFields(location: ResolvedLocation | null | undefined) {
  if (!location) return {}
  return {
    country: location.country,
    country_code: location.country_code,
    city: location.city,
    continent: location.continent,
  }
}
