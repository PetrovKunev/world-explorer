'use client'

import { useState } from 'react'
import { Plus, Search, Filter, Edit, Trash2, MapPin, Calendar, Star } from 'lucide-react'
import { Destination, DestinationFormData } from '@/types/destination'
import DestinationForm from './DestinationForm'
import DestinationCard from './DestinationCard'

interface SidebarProps {
  destinations: Destination[]
  selectedDestination: Destination | null
  onSelectDestination: (destination: Destination | null) => void
  onAddDestination: (destination: Destination) => void
  onUpdateDestination: (id: string, updates: Partial<Destination>) => void
  onDeleteDestination: (id: string) => void
  isOpen: boolean
}

export default function Sidebar({
  destinations,
  selectedDestination,
  onSelectDestination,
  onAddDestination,
  onUpdateDestination,
  onDeleteDestination,
  isOpen
}: SidebarProps) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingDestination, setEditingDestination] = useState<Destination | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<string>('all')

  const filteredDestinations = destinations.filter(dest => {
    const matchesSearch = dest.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         dest.notes?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterType === 'all' || dest.type === filterType
    return matchesSearch && matchesFilter
  })

  const handleAddDestination = (formData: DestinationFormData) => {
    const newDestination: Destination = {
      ...formData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      photos: [],
    }
    onAddDestination(newDestination)
    setShowAddForm(false)
  }

  const handleUpdateDestination = (formData: DestinationFormData) => {
    if (editingDestination) {
      onUpdateDestination(editingDestination.id, {
        ...formData,
        updatedAt: new Date().toISOString(),
      })
      setEditingDestination(null)
    }
  }

  const handleDeleteDestination = (id: string) => {
    if (confirm('Are you sure you want to delete this destination?')) {
      onDeleteDestination(id)
    }
  }

  return (
    <div className={`sidebar w-80 flex flex-col border-r border-gray-200 transition-all duration-300 ${
      isOpen ? 'translate-x-0' : '-translate-x-full'
    }`}>
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Destinations</h2>
          <button
            onClick={() => setShowAddForm(true)}
            className="p-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors"
            aria-label="Add destination"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search destinations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">All types</option>
              <option value="city">Cities</option>
              <option value="landmark">Landmarks</option>
              <option value="restaurant">Restaurants</option>
              <option value="hotel">Hotels</option>
              <option value="museum">Museums</option>
              <option value="park">Parks</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {filteredDestinations.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <MapPin className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>No destinations found</p>
            <p className="text-sm">Add your first destination to get started!</p>
          </div>
        ) : (
          filteredDestinations.map((destination) => (
            <DestinationCard
              key={destination.id}
              destination={destination}
              isSelected={selectedDestination?.id === destination.id}
              onSelect={() => onSelectDestination(destination)}
              onEdit={() => setEditingDestination(destination)}
              onDelete={() => handleDeleteDestination(destination.id)}
            />
          ))
        )}
      </div>

      {/* Add/Edit Form Modal */}
      {(showAddForm || editingDestination) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">
              {showAddForm ? 'Add New Destination' : 'Edit Destination'}
            </h3>
            <DestinationForm
              initialData={editingDestination || undefined}
              onSubmit={showAddForm ? handleAddDestination : handleUpdateDestination}
              onCancel={() => {
                setShowAddForm(false)
                setEditingDestination(null)
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
} 