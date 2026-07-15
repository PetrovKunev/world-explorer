'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { X, MapPin } from 'lucide-react'
import Header from '@/components/Header'
import Sidebar from '@/components/Sidebar'
import { ToastProvider } from '@/components/Toaster'
import { useDestinations } from '@/hooks/useDestinations'
import { Destination, DestinationInput } from '@/types/destination'

// Leaflet работи само в браузъра — зареждаме картата без SSR
const MapComponent = dynamic(() => import('@/components/MapComponent'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full animate-pulse items-center justify-center bg-gray-200">
      <div className="flex flex-col items-center space-y-3 text-gray-500">
        <MapPin className="h-8 w-8" />
        <div className="text-sm">Зареждане на картата…</div>
      </div>
    </div>
  ),
})

interface AppShellProps {
  user: { id: string; email: string }
  initialDestinations: Destination[]
  initialError: string | null
}

export default function AppShell(props: AppShellProps) {
  return (
    <ToastProvider>
      <AppShellInner {...props} />
    </ToastProvider>
  )
}

function AppShellInner({ user, initialDestinations, initialError }: AppShellProps) {
  const [selectedDestination, setSelectedDestination] = useState<Destination | null>(null)
  const [loadError, setLoadError] = useState(initialError)
  // null = по подразбиране (отворен на десктоп, затворен на мобилен — само CSS)
  const [sidebarOpen, setSidebarOpen] = useState<boolean | null>(null)

  const toggleSidebar = () => {
    setSidebarOpen((prev) => {
      const isOpen = prev ?? window.matchMedia('(min-width: 1024px)').matches
      return !isOpen
    })
  }

  const { destinations, addDestination, updateDestination, deleteDestination } =
    useDestinations(user.id, initialDestinations)

  const handleAddDestination = async (input: DestinationInput) => {
    const created = await addDestination(input)
    if (created) {
      setSelectedDestination(created)
    }
  }

  const handleMoveDestination = (id: string, latitude: number, longitude: number) => {
    updateDestination(id, { latitude, longitude })
  }

  const handleDeleteDestination = async (id: string) => {
    const deleted = await deleteDestination(id)
    if (deleted && selectedDestination?.id === id) {
      setSelectedDestination(null)
    }
  }

  return (
    <div className="flex h-full flex-col">
      <Header onToggleSidebar={toggleSidebar} userEmail={user.email} />

      {loadError && (
        <div className="flex items-center justify-between border-b border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          <span>{loadError}</span>
          <button
            onClick={() => setLoadError(null)}
            className="rounded p-1 transition-colors hover:bg-red-100"
            aria-label="Затвори съобщението"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="relative flex flex-1 overflow-hidden">
        {/* Затъмняване зад списъка на мобилни устройства */}
        {sidebarOpen === true && (
          <div
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <Sidebar
          destinations={destinations}
          selectedDestination={selectedDestination}
          onSelectDestination={(dest) => {
            setSelectedDestination(dest)
            // На мобилни затваряме списъка след избор
            if (window.innerWidth < 1024) {
              setSidebarOpen(false)
            }
          }}
          onAddDestination={handleAddDestination}
          onUpdateDestination={updateDestination}
          onDeleteDestination={handleDeleteDestination}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        <div className="relative flex-1">
          <MapComponent
            destinations={destinations}
            selectedDestination={selectedDestination}
            onSelectDestination={setSelectedDestination}
            onAddDestination={handleAddDestination}
            onMoveDestination={handleMoveDestination}
          />
        </div>
      </div>
    </div>
  )
}
