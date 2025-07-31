'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import Header from '@/components/Header'
import Sidebar from '@/components/Sidebar'
import { Destination } from '@/types/destination'

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
  const [destinations, setDestinations] = useState<Destination[]>([])
  const [selectedDestination, setSelectedDestination] = useState<Destination | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false) // Default to closed on mobile

  // Load destinations from localStorage on component mount
  useEffect(() => {
    const savedDestinations = localStorage.getItem('destinations')
    if (savedDestinations) {
      setDestinations(JSON.parse(savedDestinations))
    }
  }, [])

  // Save destinations to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('destinations', JSON.stringify(destinations))
  }, [destinations])

  const addDestination = (destination: Destination) => {
    setDestinations(prev => [...prev, destination])
  }

  const updateDestination = (id: string, updates: Partial<Destination>) => {
    setDestinations(prev => 
      prev.map(dest => dest.id === id ? { ...dest, ...updates } : dest)
    )
  }

  const deleteDestination = (id: string) => {
    setDestinations(prev => prev.filter(dest => dest.id !== id))
    if (selectedDestination?.id === id) {
      setSelectedDestination(null)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <Header 
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        sidebarOpen={sidebarOpen}
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
          onAddDestination={addDestination}
          onUpdateDestination={updateDestination}
          onDeleteDestination={deleteDestination}
          isOpen={sidebarOpen}
        />
        
        <div className="flex-1 relative">
          <MapComponent
            destinations={destinations}
            selectedDestination={selectedDestination}
            onSelectDestination={setSelectedDestination}
            onAddDestination={addDestination}
          />
        </div>
      </div>
    </div>
  )
} 