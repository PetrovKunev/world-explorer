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
      <div className="text-lg text-gray-600">Loading map...</div>
    </div>
  ),
})

export default function Home() {
  const [destinations, setDestinations] = useState<Destination[]>([])
  const [selectedDestination, setSelectedDestination] = useState<Destination | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)

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
    <div className="h-screen flex flex-col">
      <Header 
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        sidebarOpen={sidebarOpen}
      />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          destinations={destinations}
          selectedDestination={selectedDestination}
          onSelectDestination={setSelectedDestination}
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