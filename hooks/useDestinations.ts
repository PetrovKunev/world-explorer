'use client'

import { useCallback, useMemo, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/Toaster'
import { PHOTOS_BUCKET, photoPath } from '@/lib/photos'
import { locationFields, reverseGeocode } from '@/lib/geo/geocode'
import { Destination, DestinationInput } from '@/types/destination'

// Празните стойности се нормализират до null — undefined ключовете се
// изпускат от JSON сериализацията и Supabase никога не би изчистил полето
function normalize(input: Partial<DestinationInput>) {
  const data: Record<string, unknown> = { ...input }
  if ('visits' in data) data.visits = data.visits ?? []
  if ('notes' in data) {
    const notes = typeof data.notes === 'string' ? data.notes.trim() : null
    data.notes = notes || null
  }
  if ('rating' in data) data.rating = data.rating ?? null
  return data
}

// Гео колоните съществуват едва след миграция 001 — при unknown-column
// грешка повтаряме заявката без тях, вместо целият запис да се проваля
const LOCATION_COLUMNS = ['country', 'country_code', 'city', 'continent'] as const

function isMissingColumnError(error: { code?: string | null }): boolean {
  return error.code === 'PGRST204' || error.code === '42703'
}

function withoutLocationColumns(payload: Record<string, unknown>): Record<string, unknown> {
  const copy = { ...payload }
  for (const column of LOCATION_COLUMNS) delete copy[column]
  return copy
}

export function useDestinations(userId: string, initialDestinations: Destination[]) {
  const supabase = useMemo(() => createClient(), [])
  const showToast = useToast()
  const [destinations, setDestinations] = useState<Destination[]>(initialDestinations)
  // Записите за една дестинация се нареждат последователно — иначе две
  // бързи влачения могат да стигнат до базата в разменен ред (геокодирането
  // отнема променливо време) и изоставената позиция да „победи“
  const updateQueueRef = useRef(new Map<string, Promise<Destination | null>>())

  const addDestination = useCallback(
    async (input: DestinationInput): Promise<Destination | null> => {
      // Географските данни се попълват автоматично, ако не са подадени
      const location =
        input.country_code == null
          ? locationFields(await reverseGeocode(input.latitude, input.longitude))
          : {}

      const payload = {
        ...normalize(input),
        ...location,
        user_id: userId,
        photos: input.photos ?? [],
        tags: input.tags ?? [],
      }

      let { data, error } = await supabase
        .from('destinations')
        .insert([payload])
        .select()
        .single()

      if (error && isMissingColumnError(error)) {
        ;({ data, error } = await supabase
          .from('destinations')
          .insert([withoutLocationColumns(payload)])
          .select()
          .single())
      }

      if (error) {
        showToast('error', 'Дестинацията не можа да бъде добавена. Опитайте отново.')
        return null
      }

      setDestinations((prev) => [data, ...prev])
      showToast('success', `„${data.name}“ е добавена`)
      return data
    },
    [supabase, userId, showToast]
  )

  const updateDestination = useCallback(
    async (id: string, updates: Partial<DestinationInput>): Promise<Destination | null> => {
      // Оптимистично обновяване — при грешка връщаме предишното състояние
      let snapshot: Destination[] = []
      setDestinations((prev) => {
        snapshot = prev
        const patch = normalize(updates) as Partial<Destination>
        return prev.map((dest) => (dest.id === id ? { ...dest, ...patch } : dest))
      })

      const previous = updateQueueRef.current.get(id) ?? Promise.resolve(null)
      const run = previous.then(async (): Promise<Destination | null> => {
        // При нови координати (или липсващи гео данни) опресняваме държавата
        // и града — оптимистичното състояние вече е приложено, така че
        // геокодирането не бави интерфейса
        let location = {}
        const current = snapshot.find((dest) => dest.id === id)
        if (current && ('latitude' in updates || 'longitude' in updates)) {
          const latitude = updates.latitude ?? current.latitude
          const longitude = updates.longitude ?? current.longitude
          const moved = latitude !== current.latitude || longitude !== current.longitude
          if (moved || current.country_code == null) {
            const resolved = await reverseGeocode(latitude, longitude)
            // При неуспех изчистваме гео полетата: по-добре „неизвестно“ от
            // грешна стара държава, а следващата редакция ще опита отново
            // (country_code == null включва геокодирането пак)
            location = resolved
              ? locationFields(resolved)
              : { country: null, country_code: null, city: null, continent: null }
          }
        }

        const payload = {
          ...normalize(updates),
          ...location,
          updated_at: new Date().toISOString(),
        }

        let { data, error } = await supabase
          .from('destinations')
          .update(payload)
          .eq('id', id)
          .eq('user_id', userId)
          .select()
          .single()

        if (error && isMissingColumnError(error)) {
          ;({ data, error } = await supabase
            .from('destinations')
            .update(withoutLocationColumns(payload))
            .eq('id', id)
            .eq('user_id', userId)
            .select()
            .single())
        }

        if (error) {
          setDestinations(snapshot)
          showToast('error', 'Промените не можаха да бъдат запазени. Опитайте отново.')
          return null
        }

        setDestinations((prev) => prev.map((dest) => (dest.id === id ? data : dest)))
        showToast('success', 'Промените са запазени')
        return data
      })

      updateQueueRef.current.set(id, run.catch(() => null))
      return run
    },
    [supabase, userId, showToast]
  )

  const deleteDestination = useCallback(
    async (id: string): Promise<boolean> => {
      // Оптимистично изтриване — при грешка връщаме предишното състояние
      let snapshot: Destination[] = []
      setDestinations((prev) => {
        snapshot = prev
        return prev.filter((dest) => dest.id !== id)
      })

      const { error } = await supabase
        .from('destinations')
        .delete()
        .eq('id', id)
        .eq('user_id', userId)

      if (error) {
        setDestinations(snapshot)
        showToast('error', 'Дестинацията не можа да бъде изтрита. Опитайте отново.')
        return false
      }

      // Изчистваме снимките на дестинацията от Storage (best effort)
      const removed = snapshot.find((dest) => dest.id === id)
      const photoPaths = (removed?.photos ?? []).map(photoPath)
      if (photoPaths.length > 0) {
        void supabase.storage.from(PHOTOS_BUCKET).remove(photoPaths)
      }

      showToast('success', 'Дестинацията е изтрита')
      return true
    },
    [supabase, userId, showToast]
  )

  return {
    destinations,
    addDestination,
    updateDestination,
    deleteDestination,
  }
}
