'use client'

import { MapPin, Calendar, Star, Pencil, Trash2 } from 'lucide-react'
import { Destination, DESTINATION_TYPES } from '@/types/destination'

interface DestinationCardProps {
  destination: Destination
  isSelected: boolean
  onSelect: () => void
  onEdit: () => void
  onDelete: () => void
}

export default function DestinationCard({
  destination,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
}: DestinationCardProps) {
  const typeInfo = DESTINATION_TYPES[destination.type] ?? DESTINATION_TYPES.other

  return (
    <div
      className={`destination-card cursor-pointer rounded-lg border p-3 transition-all duration-200 sm:p-4 ${
        isSelected
          ? 'border-primary-500 bg-primary-50 shadow-md ring-2 ring-primary-200'
          : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
      }`}
      onClick={onSelect}
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex items-center space-x-2">
            <span className="text-base sm:text-lg">{typeInfo.emoji}</span>
            <h3 className="truncate text-sm font-medium text-gray-900 sm:text-base">
              {destination.name}
            </h3>
          </div>

          <div className="mb-2 flex flex-col space-y-1 text-xs text-gray-600 sm:flex-row sm:items-center sm:space-x-4 sm:space-y-0 sm:text-sm">
            <div className="flex items-center space-x-1">
              <MapPin className="h-3 w-3" />
              <span className="truncate">
                {destination.latitude.toFixed(4)}, {destination.longitude.toFixed(4)}
              </span>
            </div>

            {destination.visit_date && (
              <div className="flex items-center space-x-1">
                <Calendar className="h-3 w-3" />
                <span>{new Date(destination.visit_date).toLocaleDateString('bg-BG')}</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <span
              className={`rounded-full px-2 py-1 text-xs font-medium ${typeInfo.badgeClass}`}
            >
              {typeInfo.label}
            </span>

            <div className="flex items-center space-x-1">
              {destination.rating && (
                <div className="flex items-center space-x-1">
                  <Star className="h-3 w-3 fill-current text-yellow-500" />
                  <span className="text-xs text-gray-600">{destination.rating}</span>
                </div>
              )}

              <div className="ml-2 flex items-center space-x-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onEdit()
                  }}
                  className="p-1.5 text-gray-400 transition-colors hover:text-gray-600 sm:p-1"
                  aria-label="Редактирай дестинацията"
                >
                  <Pencil className="h-3.5 w-3.5 sm:h-3 sm:w-3" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete()
                  }}
                  className="p-1.5 text-gray-400 transition-colors hover:text-red-600 sm:p-1"
                  aria-label="Изтрий дестинацията"
                >
                  <Trash2 className="h-3.5 w-3.5 sm:h-3 sm:w-3" />
                </button>
              </div>
            </div>
          </div>

          {destination.notes && (
            <p className="mt-2 line-clamp-2 text-xs text-gray-500">{destination.notes}</p>
          )}

          {destination.tags && destination.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {destination.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600"
                >
                  {tag}
                </span>
              ))}
              {destination.tags.length > 3 && (
                <span className="text-xs text-gray-400">
                  +{destination.tags.length - 3}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
