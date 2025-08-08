'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import Header from '@/components/Header'
import Sidebar from '@/components/Sidebar'
import Auth from '@/components/Auth'
import { useDestinations } from '@/hooks/useDestinations'
import { Destination } from '@/types/database'
import { supabase } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'

// Dynamically import the map component to avoid SSR issues
const MapComponent = dynamic(() => import('@/components/MapComponent'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-gray-100">
      <div className="flex flex-col items-center space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        <div className="text-lg text-gray-600">Loading map...</div>
      </div>
    </div>
  ),
})

export default function Home() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedDestination, setSelectedDestination] = useState<Destination | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const {
    destinations,
    loading: destinationsLoading,
    error: destinationsError,
    addDestination,
    updateDestination,
    deleteDestination,
    refetch
  } = useDestinations(user?.id || undefined)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleAddDestination = async (destination: Omit<Destination, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    const result = await addDestination(destination)
    if (result) {
      setSelectedDestination(result)
    }
  }

  const handleUpdateDestination = async (id: string, updates: Partial<Destination>) => {
    await updateDestination(id, updates)
  }

  const handleDeleteDestination = async (id: string) => {
    const success = await deleteDestination(id)
    if (success && selectedDestination?.id === id) {
      setSelectedDestination(null)
    }
  }

  // Show auth component if not authenticated
  if (!user) {
    return <Auth />
  }

  // Show loading if still loading
  if (loading || destinationsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <div className="text-lg text-gray-600">Loading...</div>
        </div>
      </div>
    )
  }

  // Show error if there's an error
  if (destinationsError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
          <h2 className="text-2xl font-bold mb-4 text-center text-red-600">Error</h2>
          <p className="text-gray-600 mb-4 text-center">{destinationsError}</p>
          <button
            onClick={refetch}
            className="w-full bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <Header 
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        sidebarOpen={sidebarOpen}
        user={user}
      />
      
      <div className="flex flex-1 overflow-hidden relative">
        {/* Mobile overlay for sidebar */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        
        <Sidebar
          destinations={destinations}
          selectedDestination={selectedDestination}
          onSelectDestination={(dest) => {
            setSelectedDestination(dest)
            // Close sidebar on mobile when destination is selected
            if (window.innerWidth < 1024) {
              setSidebarOpen(false)
            }
          }}
          onAddDestination={handleAddDestination}
          onUpdateDestination={handleUpdateDestination}
          onDeleteDestination={handleDeleteDestination}
          isOpen={sidebarOpen}
        />
        
        <div className="flex-1 relative">
          <MapComponent
            destinations={destinations}
            selectedDestination={selectedDestination}
            onSelectDestination={setSelectedDestination}
            onAddDestination={handleAddDestination}
          />
        </div>
      </div>
    </div>
  )
} 