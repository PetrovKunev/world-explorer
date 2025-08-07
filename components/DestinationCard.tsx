'use client'

import { MapPin, Calendar, Star, Edit, Trash2, Navigation } from 'lucide-react'
import { Destination } from '@/types/destination'

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
  onDelete
}: DestinationCardProps) {
  const getTypeIcon = (type: Destination['type']) => {
    switch (type) {
      case 'city':
        return '🏙️'
      case 'landmark':
        return '🗽'
      case 'restaurant':
        return '🍽️'
      case 'hotel':
        return '🏨'
      case 'museum':
        return '🏛️'
      case 'park':
        return '🌳'
      default:
        return '📍'
    }
  }

  const getTypeColor = (type: Destination['type']) => {
    switch (type) {
      case 'city':
        return 'bg-blue-100 text-blue-800'
      case 'landmark':
        return 'bg-purple-100 text-purple-800'
      case 'restaurant':
        return 'bg-orange-100 text-orange-800'
      case 'hotel':
        return 'bg-green-100 text-green-800'
      case 'museum':
        return 'bg-yellow-100 text-yellow-800'
      case 'park':
        return 'bg-emerald-100 text-emerald-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div
      className={`destination-card p-3 sm:p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
        isSelected
          ? 'border-primary-500 bg-primary-50 shadow-md ring-2 ring-primary-200'
          : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
      }`}
      onClick={onSelect}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-base sm:text-lg">{getTypeIcon(destination.type)}</span>
            <h3 className="font-medium text-gray-900 truncate text-sm sm:text-base">{destination.name}</h3>
            <Navigation className="h-3 w-3 text-gray-400 ml-auto" />
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-4 text-xs sm:text-sm text-gray-600 mb-2">
            <div className="flex items-center space-x-1">
              <MapPin className="h-3 w-3" />
              <span className="truncate">
                {destination.latitude.toFixed(4)}, {destination.longitude.toFixed(4)}
              </span>
            </div>
            
            {destination.visit_date && (
              <div className="flex items-center space-x-1">
                <Calendar className="h-3 w-3" />
                <span>{new Date(destination.visit_date).toLocaleDateString()}</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center justify-between">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(destination.type)}`}>
              {destination.type}
            </span>
            
            <div className="flex items-center space-x-1">
              {destination.rating && (
                <div className="flex items-center space-x-1">
                  <Star className="h-3 w-3 text-yellow-500 fill-current" />
                  <span className="text-xs text-gray-600">{destination.rating}</span>
                </div>
              )}
              
              <div className="flex items-center space-x-1 ml-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onEdit()
                  }}
                  className="p-1.5 sm:p-1 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="Edit destination"
                >
                  <Edit className="h-3.5 w-3.5 sm:h-3 sm:w-3" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete()
                  }}
                  className="p-1.5 sm:p-1 text-gray-400 hover:text-red-600 transition-colors"
                  aria-label="Delete destination"
                >
                  <Trash2 className="h-3.5 w-3.5 sm:h-3 sm:w-3" />
                </button>
              </div>
            </div>
          </div>
          
          {destination.notes && (
            <p className="text-xs text-gray-500 mt-2 line-clamp-2">{destination.notes}</p>
          )}
          
          {destination.tags && destination.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {destination.tags.slice(0, 3).map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                >
                  {tag}
                </span>
              ))}
              {destination.tags.length > 3 && (
                <span className="text-xs text-gray-400">+{destination.tags.length - 3}</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 