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
        console.log('No authenticated userId provided')
        setDestinations([])
        setLoading(false)
        return
      }

      console.log('🔍 Fetching destinations for user:', userId)
      
      const { data, error } = await supabase
        .from('destinations')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching destinations:', error)
        setError(error.message)
      } else {
        console.log('✅ Destinations found:', data?.length || 0)
        setDestinations(data || [])
      }
    } catch (err) {
      console.error('Error in fetchDestinations:', err)
      setError('Failed to fetch destinations')
    } finally {
      setLoading(false)
    }
  }

  // Add new destination
  const addDestination = async (destination: Omit<Destination, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    try {
      setError(null)

      console.log('=== ADDING TO DATABASE ===')
      console.log('Received destination object:', destination)
      console.log('Latitude (received):', destination.latitude.toString())
      console.log('Longitude (received):', destination.longitude.toString())
      console.log('Latitude decimal places:', destination.latitude.toString().split('.')[1]?.length || 0)
      console.log('Longitude decimal places:', destination.longitude.toString().split('.')[1]?.length || 0)
      console.log('Latitude type:', typeof destination.latitude)
      console.log('Longitude type:', typeof destination.longitude)

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
        // Convert empty string to null for visit_date to avoid database errors
        visit_date: destination.visit_date && destination.visit_date !== '' ? destination.visit_date : null,
        // Convert empty string to null for notes to avoid database errors
        notes: destination.notes && destination.notes !== '' ? destination.notes : null,
      }

      const { data, error } = await supabase
        .from('destinations')
        .insert([destinationData])
        .select()
        .single()

      if (error) {
        console.error('Error adding destination:', error)
        setError(error.message)
        return null
      }

      console.log('=== SAVED TO DATABASE ===')
      console.log('Destination saved to database:', data)
      console.log('Saved latitude:', data.latitude.toString())
      console.log('Saved longitude:', data.longitude.toString())
      console.log('Saved latitude decimal places:', data.latitude.toString().split('.')[1]?.length || 0)
      console.log('Saved longitude decimal places:', data.longitude.toString().split('.')[1]?.length || 0)
      console.log('Saved latitude type:', typeof data.latitude)
      console.log('Saved longitude type:', typeof data.longitude)

      setDestinations(prev => [data, ...prev])
      return data
    } catch (err) {
      console.error('Error in addDestination:', err)
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
        // Convert empty string to null for visit_date to avoid database errors
        visit_date: updates.visit_date && updates.visit_date !== '' ? updates.visit_date : null,
        // Convert empty string to null for notes to avoid database errors
        notes: updates.notes && updates.notes !== '' ? updates.notes : null,
      }

      const { data, error } = await supabase
        .from('destinations')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single()

      if (error) {
        console.error('Error updating destination:', error)
        setError(error.message)
        return null
      }

      setDestinations(prev => 
        prev.map(dest => dest.id === id ? data : dest)
      )
      return data
    } catch (err) {
      console.error('Error in updateDestination:', err)
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
        console.error('Error deleting destination:', error)
        setError(error.message)
        return false
      }

      setDestinations(prev => prev.filter(dest => dest.id !== id))
      return true
    } catch (err) {
      console.error('Error in deleteDestination:', err)
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