'use client'

import { useCallback, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Destination, DestinationInput } from '@/types/destination'

// Празните стойности се нормализират до null — undefined ключовете се
// изпускат от JSON сериализацията и Supabase никога не би изчистил полето
function normalize(input: Partial<DestinationInput>) {
  const data: Record<string, unknown> = { ...input }
  if ('visit_date' in data) data.visit_date = data.visit_date || null
  if ('notes' in data) {
    const notes = typeof data.notes === 'string' ? data.notes.trim() : null
    data.notes = notes || null
  }
  if ('rating' in data) data.rating = data.rating ?? null
  return data
}

export function useDestinations(
  userId: string,
  initialDestinations: Destination[],
  initialError: string | null = null
) {
  const supabase = useMemo(() => createClient(), [])
  const [destinations, setDestinations] = useState<Destination[]>(initialDestinations)
  const [error, setError] = useState<string | null>(initialError)

  const addDestination = useCallback(
    async (input: DestinationInput): Promise<Destination | null> => {
      setError(null)

      const { data, error } = await supabase
        .from('destinations')
        .insert([
          {
            ...normalize(input),
            user_id: userId,
            photos: input.photos ?? [],
            tags: input.tags ?? [],
          },
        ])
        .select()
        .single()

      if (error) {
        setError('Дестинацията не можа да бъде добавена. Опитайте отново.')
        return null
      }

      setDestinations((prev) => [data, ...prev])
      return data
    },
    [supabase, userId]
  )

  const updateDestination = useCallback(
    async (id: string, updates: Partial<DestinationInput>): Promise<Destination | null> => {
      setError(null)

      const { data, error } = await supabase
        .from('destinations')
        .update({ ...normalize(updates), updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single()

      if (error) {
        setError('Промените не можаха да бъдат запазени. Опитайте отново.')
        return null
      }

      setDestinations((prev) => prev.map((dest) => (dest.id === id ? data : dest)))
      return data
    },
    [supabase, userId]
  )

  const deleteDestination = useCallback(
    async (id: string): Promise<boolean> => {
      setError(null)

      const { error } = await supabase
        .from('destinations')
        .delete()
        .eq('id', id)
        .eq('user_id', userId)

      if (error) {
        setError('Дестинацията не можа да бъде изтрита. Опитайте отново.')
        return false
      }

      setDestinations((prev) => prev.filter((dest) => dest.id !== id))
      return true
    },
    [supabase, userId]
  )

  const clearError = useCallback(() => setError(null), [])

  return {
    destinations,
    error,
    clearError,
    addDestination,
    updateDestination,
    deleteDestination,
  }
}
