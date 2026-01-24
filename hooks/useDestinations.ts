import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Destination } from '@/types/destination'

export function useDestinations(userId?: string) {
  const [destinations, setDestinations] = useState<Destination[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch destinations from Supabase
  const fetchDestinations = async () => {
    try {
      setLoading(true)
      setError(null)

      if (!userId) {
        setDestinations([])
        setLoading(false)
        return
      }
      
      const { data, error } = await supabase
        .from('destinations')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        setError(error.message)
      } else {
        setDestinations(data || [])
      }
    } catch (err) {
      setError('Failed to fetch destinations')
    } finally {
      setLoading(false)
    }
  }

  // Add new destination
  const addDestination = async (destination: Omit<Destination, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    try {
      setError(null)

      if (!userId) {
        setError('User not authenticated')
        return null
      }

      // Prepare destination data for database insertion
      const destinationData = {
        ...destination,
        user_id: userId,
        photos: destination.photos || [],
        tags: destination.tags || [],
        // Convert empty string to undefined for visit_date to avoid database errors
        visit_date: destination.visit_date && destination.visit_date !== '' ? destination.visit_date : undefined,
        // Convert empty string to undefined for notes to avoid database errors
        notes: destination.notes && destination.notes !== '' ? destination.notes : undefined,
      }

      const { data, error } = await supabase
        .from('destinations')
        .insert([destinationData])
        .select()
        .single()

      if (error) {
        setError(error.message)
        return null
      }

      setDestinations(prev => [data, ...prev])
      return data
    } catch (err) {
      setError('Failed to add destination')
      return null
    }
  }

  // Update destination
  const updateDestination = async (id: string, updates: Partial<Destination>) => {
    try {
      setError(null)

      if (!userId) {
        setError('User not authenticated')
        return null
      }

      // Prepare updates data for database update
      const updateData = {
        ...updates,
        updated_at: new Date().toISOString(),
        // Convert empty string to undefined for visit_date to avoid database errors
        visit_date: updates.visit_date && updates.visit_date !== '' ? updates.visit_date : undefined,
        // Convert empty string to undefined for notes to avoid database errors
        notes: updates.notes && updates.notes !== '' ? updates.notes : undefined,
      }

      const { data, error } = await supabase
        .from('destinations')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single()

      if (error) {
        setError(error.message)
        return null
      }

      setDestinations(prev => 
        prev.map(dest => dest.id === id ? data : dest)
      )
      return data
    } catch (err) {
      setError('Failed to update destination')
      return null
    }
  }

  // Delete destination
  const deleteDestination = async (id: string) => {
    try {
      setError(null)

      if (!userId) {
        setError('User not authenticated')
        return false
      }

      const { error } = await supabase
        .from('destinations')
        .delete()
        .eq('id', id)
        .eq('user_id', userId)

      if (error) {
        setError(error.message)
        return false
      }

      setDestinations(prev => prev.filter(dest => dest.id !== id))
      return true
    } catch (err) {
      setError('Failed to delete destination')
      return false
    }
  }

  // Load destinations when userId changes
  useEffect(() => {
    fetchDestinations()
  }, [userId])

  return {
    destinations,
    loading,
    error,
    addDestination,
    updateDestination,
    deleteDestination,
    refetch: fetchDestinations
  }
} 