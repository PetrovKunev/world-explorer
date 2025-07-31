'use client'

import { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import { MapPin, Plus, Info } from 'lucide-react'
import { Destination } from '@/types/destination'

// Fix for default markers in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

// Custom marker icons for different destination types
const createCustomIcon = (type: Destination['type'], visited: boolean) => {
  const colors = {
    city: '#3B82F6',
    landmark: '#8B5CF6',
    restaurant: '#F97316',
    hotel: '#10B981',
    museum: '#EAB308',
    park: '#059669',
    other: '#6B7280',
  }

  const color = colors[type]
  const opacity = visited ? 1 : 0.7

  return L.divIcon({
    html: `
      <div style="
        background-color: ${color};
        width: 24px;
        height: 24px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        opacity: ${opacity};
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 12px;
        font-weight: bold;
      ">
        ${visited ? '✓' : '📍'}
      </div>
    `,
    className: 'destination-marker',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  })
}

interface MapComponentProps {
  destinations: Destination[]
  selectedDestination: Destination | null
  onSelectDestination: (destination: Destination | null) => void
  onAddDestination: (destination: Destination) => void
}

// Component to handle map click events
function MapClickHandler({ onAddDestination }: { onAddDestination: (destination: Destination) => void }) {
  const [clickPosition, setClickPosition] = useState<{ lat: number; lng: number } | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newDestinationName, setNewDestinationName] = useState('')

  useMapEvents({
    click: (e) => {
      setClickPosition({ lat: e.latlng.lat, lng: e.latlng.lng })
      setShowAddForm(true)
    },
  })

  const handleAddDestination = () => {
    if (clickPosition && newDestinationName.trim()) {
      const newDestination: Destination = {
        id: Date.now().toString(),
        name: newDestinationName.trim(),
        latitude: clickPosition.lat,
        longitude: clickPosition.lng,
        type: 'other',
        visited: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        photos: [],
      }
      onAddDestination(newDestination)
      setShowAddForm(false)
      setNewDestinationName('')
      setClickPosition(null)
    }
  }

  if (!showAddForm || !clickPosition) return null

  return (
    <div className="absolute top-4 left-4 z-[1000] bg-white rounded-lg shadow-lg border p-4 max-w-sm">
      <div className="flex items-center space-x-2 mb-3">
        <Plus className="h-5 w-5 text-primary-600" />
        <h3 className="font-semibold text-gray-900">Add New Destination</h3>
      </div>
      
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Name *
          </label>
          <input
            type="text"
            value={newDestinationName}
            onChange={(e) => setNewDestinationName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddDestination()}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Enter destination name"
            autoFocus
          />
        </div>
        
        <div className="text-sm text-gray-600">
          <div className="flex items-center space-x-1">
            <MapPin className="h-4 w-4" />
            <span>
              {clickPosition.lat.toFixed(4)}, {clickPosition.lng.toFixed(4)}
            </span>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={handleAddDestination}
            disabled={!newDestinationName.trim()}
            className="px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add
          </button>
          <button
            onClick={() => {
              setShowAddForm(false)
              setNewDestinationName('')
              setClickPosition(null)
            }}
            className="px-3 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

export default function MapComponent({
  destinations,
  selectedDestination,
  onSelectDestination,
  onAddDestination,
}: MapComponentProps) {
  const mapRef = useRef<L.Map | null>(null)
  const [mapError, setMapError] = useState<string | null>(null)

  // Center map on selected destination
  useEffect(() => {
    if (selectedDestination && mapRef.current) {
      mapRef.current.setView(
        [selectedDestination.latitude, selectedDestination.longitude],
        13
      )
    }
  }, [selectedDestination])

  // Handle map initialization errors
  const handleMapReady = (map: L.Map) => {
    mapRef.current = map
    setMapError(null)
  }

  if (mapError) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-100">
        <div className="text-center">
          <div className="text-red-600 mb-2">Map loading error</div>
          <div className="text-sm text-gray-600">{mapError}</div>
          <button 
            onClick={() => setMapError(null)}
            className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="map-container">
      <MapContainer
        center={[48.8566, 2.3522]} // Paris as default center
        zoom={5}
        className="leaflet-container"
        ref={handleMapReady}
        whenCreated={handleMapReady}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          eventHandlers={{
            loading: () => setMapError(null),
            tileerror: () => setMapError('Failed to load map tiles'),
          }}
        />
        
        <MapClickHandler onAddDestination={onAddDestination} />
        
        {destinations.map((destination) => (
          <Marker
            key={destination.id}
            position={[destination.latitude, destination.longitude]}
            icon={createCustomIcon(destination.type, destination.visited)}
            eventHandlers={{
              click: () => onSelectDestination(destination),
            }}
          >
            <Popup>
              <div className="p-2">
                <h3 className="font-semibold text-gray-900 mb-1">{destination.name}</h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <div className="flex items-center space-x-1">
                    <MapPin className="h-3 w-3" />
                    <span>{destination.type}</span>
                  </div>
                  {destination.visited && (
                    <div className="flex items-center space-x-1 text-green-600">
                      <span className="text-xs">✓ Visited</span>
                      {destination.visitDate && (
                        <span className="text-xs">
                          on {new Date(destination.visitDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  )}
                  {destination.rating && (
                    <div className="flex items-center space-x-1">
                      <span className="text-yellow-500">★</span>
                      <span className="text-xs">{destination.rating}/5</span>
                    </div>
                  )}
                  {destination.notes && (
                    <div className="flex items-start space-x-1">
                      <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
                      <p className="text-xs line-clamp-2">{destination.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      
      {/* Instructions overlay */}
      <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg border p-3 max-w-xs">
        <div className="flex items-center space-x-2 mb-2">
          <MapPin className="h-4 w-4 text-primary-600" />
          <h3 className="font-semibold text-sm text-gray-900">How to use</h3>
        </div>
        <div className="text-xs text-gray-600 space-y-1">
          <p>• Click anywhere on the map to add a destination</p>
          <p>• Click markers to view details</p>
          <p>• Use the sidebar to manage destinations</p>
        </div>
      </div>
    </div>
  )
} 