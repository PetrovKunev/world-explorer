'use client'

import { useState } from 'react'
import { MapPin, Plus, X, Calendar } from 'lucide-react'
import {
  DestinationInput,
  DestinationType,
  DESTINATION_TYPES,
  DESTINATION_TYPE_KEYS,
} from '@/types/destination'
import { locationFields, ResolvedLocation } from '@/lib/geo/geocode'

export interface AddDraft {
  lat: number
  lng: number
  name: string
  // Гео данни от вече направено обратно геокодиране (GPS потока) —
  // спестяват повторна заявка при записа
  location?: ResolvedLocation
}

// Диалог за добавяне на дестинация (клик върху картата или резултат от търсене)
export default function AddDestinationDialog({
  draft,
  onSubmit,
  onClose,
}: {
  draft: AddDraft
  onSubmit: (input: DestinationInput) => void
  onClose: () => void
}) {
  const [name, setName] = useState(draft.name)
  const [type, setType] = useState<DestinationType>('other')
  const [visited, setVisited] = useState(false)

  const handleSubmit = () => {
    if (!name.trim()) return

    onSubmit({
      name: name.trim(),
      latitude: draft.lat,
      longitude: draft.lng,
      type,
      visited,
      rating: null,
      visits: [],
      notes: null,
      photos: [],
      tags: [],
      ...locationFields(draft.location),
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    e.stopPropagation()
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSubmit()
    }
    if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
    }
  }

  return (
    <div
      className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/50"
      onClick={(e) => {
        e.stopPropagation()
        onClose()
      }}
    >
      <div
        className="mx-4 w-full max-w-md rounded-lg border bg-white p-6 shadow-xl dark:border-gray-700 dark:bg-gray-800"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Plus className="h-5 w-5 text-primary-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Нова дестинация</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
            aria-label="Затвори"
          >
            <X className="h-5 w-5 text-gray-600 dark:text-gray-300" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Име <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Въведете име на дестинацията"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Тип</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as DestinationType)}
                  className="w-full appearance-none rounded-lg border border-gray-300 py-2 pl-10 pr-3 focus:border-transparent focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                >
                  {DESTINATION_TYPE_KEYS.map((key) => (
                    <option key={key} value={key}>
                      {DESTINATION_TYPES[key].emoji} {DESTINATION_TYPES[key].label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Статус</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <select
                  value={visited ? 'visited' : 'planned'}
                  onChange={(e) => setVisited(e.target.value === 'visited')}
                  className="w-full appearance-none rounded-lg border border-gray-300 py-2 pl-10 pr-3 focus:border-transparent focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                >
                  <option value="planned">🧳 За посещение</option>
                  <option value="visited">✅ Посетена</option>
                </select>
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-700/50">
            <div className="flex items-start space-x-2">
              <MapPin className="mt-0.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
              <div className="text-sm">
                <p className="font-medium text-gray-700 dark:text-gray-300">Координати:</p>
                <p className="mt-1 font-mono text-xs text-gray-600 dark:text-gray-400">
                  {draft.lat.toFixed(6)}, {draft.lng.toFixed(6)}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end space-x-3 border-t border-gray-200 pt-4 dark:border-gray-700">
          <button
            onClick={onClose}
            className="rounded-lg bg-gray-100 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
          >
            Отказ
          </button>
          <button
            onClick={handleSubmit}
            disabled={!name.trim()}
            className="rounded-lg bg-primary-600 px-4 py-2 text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Добави
          </button>
        </div>
      </div>
    </div>
  )
}
