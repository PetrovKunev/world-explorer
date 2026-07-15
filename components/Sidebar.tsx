'use client'

import { useState } from 'react'
import { Plus, Search, Filter, MapPin, X } from 'lucide-react'
import {
  Destination,
  DestinationInput,
  DestinationType,
  DESTINATION_TYPES,
  DESTINATION_TYPE_KEYS,
} from '@/types/destination'
import DestinationForm from './DestinationForm'
import DestinationCard from './DestinationCard'
import ConfirmDialog from './ConfirmDialog'

interface SidebarProps {
  userId: string
  destinations: Destination[]
  selectedDestination: Destination | null
  onSelectDestination: (destination: Destination | null) => void
  onAddDestination: (destination: DestinationInput) => void
  onUpdateDestination: (id: string, updates: Partial<DestinationInput>) => void
  onDeleteDestination: (id: string) => void
  // null = по подразбиране: отворен на десктоп, затворен на мобилен
  isOpen: boolean | null
  onClose: () => void
}

export default function Sidebar({
  userId,
  destinations,
  selectedDestination,
  onSelectDestination,
  onAddDestination,
  onUpdateDestination,
  onDeleteDestination,
  isOpen,
  onClose,
}: SidebarProps) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingDestination, setEditingDestination] = useState<Destination | null>(null)
  const [deletingDestination, setDeletingDestination] = useState<Destination | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<DestinationType | 'all'>('all')

  const filteredDestinations = destinations.filter((dest) => {
    const term = searchTerm.toLowerCase()
    const matchesSearch =
      dest.name.toLowerCase().includes(term) ||
      dest.notes?.toLowerCase().includes(term)
    const matchesFilter = filterType === 'all' || dest.type === filterType
    return matchesSearch && matchesFilter
  })

  const handleAddDestination = (input: DestinationInput) => {
    onAddDestination(input)
    setShowAddForm(false)
  }

  const handleUpdateDestination = (input: DestinationInput) => {
    if (editingDestination) {
      onUpdateDestination(editingDestination.id, input)
      setEditingDestination(null)
    }
  }

  return (
    <div
      className={`sidebar fixed inset-y-0 left-0 z-50 flex w-full max-w-sm flex-col border-r border-gray-200 bg-white transition-transform duration-300 lg:relative lg:w-80 lg:max-w-none dark:border-gray-700 dark:bg-gray-900 ${
        isOpen === null
          ? '-translate-x-full lg:translate-x-0'
          : isOpen
            ? 'translate-x-0'
            : '-translate-x-full lg:hidden'
      }`}
    >
      <div className="border-b border-gray-200 p-3 sm:p-4 dark:border-gray-700">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Дестинации</h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowAddForm(true)}
              className="rounded-lg bg-primary-600 p-2 text-white transition-colors hover:bg-primary-700"
              aria-label="Добави дестинация"
              title="Добави дестинация"
            >
              <Plus className="h-4 w-4" />
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-2 transition-colors hover:bg-gray-100 lg:hidden dark:hover:bg-gray-700"
              aria-label="Затвори списъка"
            >
              <X className="h-4 w-4 text-gray-600 dark:text-gray-300" />
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Търсене на дестинации…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-transparent focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as DestinationType | 'all')}
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            >
              <option value="all">Всички типове</option>
              {DESTINATION_TYPE_KEYS.map((type) => (
                <option key={type} value={type}>
                  {DESTINATION_TYPES[type].emoji} {DESTINATION_TYPES[type].label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-3 sm:p-4">
        {filteredDestinations.length === 0 ? (
          <div className="py-8 text-center text-gray-500 dark:text-gray-400">
            <MapPin className="mx-auto mb-3 h-12 w-12 text-gray-300 dark:text-gray-600" />
            <p>Няма намерени дестинации</p>
            <p className="text-sm">Добавете първата си дестинация, за да започнете!</p>
          </div>
        ) : (
          filteredDestinations.map((destination) => (
            <DestinationCard
              key={destination.id}
              destination={destination}
              isSelected={selectedDestination?.id === destination.id}
              onSelect={() => onSelectDestination(destination)}
              onEdit={() => setEditingDestination(destination)}
              onDelete={() => setDeletingDestination(destination)}
            />
          ))
        )}
      </div>

      {/* Модален прозорец за добавяне/редакция */}
      {(showAddForm || editingDestination) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg bg-white p-4 sm:p-6 dark:bg-gray-800">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold dark:text-gray-100">
                {showAddForm ? 'Нова дестинация' : 'Редактиране на дестинация'}
              </h3>
              <button
                onClick={() => {
                  setShowAddForm(false)
                  setEditingDestination(null)
                }}
                className="rounded-lg p-1 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
                aria-label="Затвори"
              >
                <X className="h-5 w-5 text-gray-600 dark:text-gray-300" />
              </button>
            </div>
            <DestinationForm
              userId={userId}
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

      {/* Потвърждение за изтриване */}
      {deletingDestination && (
        <ConfirmDialog
          title="Изтриване на дестинация"
          message={`Сигурни ли сте, че искате да изтриете „${deletingDestination.name}“?`}
          confirmLabel="Изтрий"
          onConfirm={() => {
            onDeleteDestination(deletingDestination.id)
            setDeletingDestination(null)
          }}
          onCancel={() => setDeletingDestination(null)}
        />
      )}
    </div>
  )
}
