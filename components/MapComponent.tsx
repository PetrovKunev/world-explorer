'use client'

import { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import { MapPin, Plus, Info, X } from 'lucide-react'
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
  // Primary color is determined by visit status
  const primaryColor = visited ? '#10B981' : '#F97316' // Green for visited, Orange for planned
  
  // Type icons for different destination categories
  const typeIcons = {
    city: '🏙️',
    landmark: '🗿',
    restaurant: '🍽️',
    hotel: '🏨',
    museum: '🏛️',
    park: '🌳',
    other: '📍',
  }

  const icon = typeIcons[type]
  const statusIcon = visited ? '✅' : '🧳'

  return L.divIcon({
    html: `
      <div style="
        background-color: ${primaryColor};
        width: 30px;
        height: 30px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 14px;
        font-weight: bold;
        position: relative;
      ">
        ${icon}
        <div style="
          position: absolute;
          bottom: -2px;
          right: -2px;
          background-color: white;
          border-radius: 50%;
          width: 12px;
          height: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 8px;
        ">
          ${statusIcon}
        </div>
      </div>
    `,
    className: 'destination-marker',
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  })
}

interface MapComponentProps {
  destinations: Destination[]
  selectedDestination: Destination | null
  onSelectDestination: (destination: Destination | null) => void
  onAddDestination: (destination: Omit<Destination, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => void
}

// Component to handle map click events
function MapClickHandler({ onAddDestination }: { onAddDestination: (destination: Omit<Destination, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => void }) {
  const [clickPosition, setClickPosition] = useState<{ lat: number; lng: number } | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newDestinationName, setNewDestinationName] = useState('')
  const [newDestinationType, setNewDestinationType] = useState<Destination['type']>('other')
  const [newDestinationVisited, setNewDestinationVisited] = useState(false)

  useMapEvents({
    click: (e) => {
      console.log('=== MAP CLICK EVENT ===')
      console.log('Original Leaflet coordinates:', e.latlng)
      console.log('Latitude (full precision):', e.latlng.lat.toString())
      console.log('Longitude (full precision):', e.latlng.lng.toString())
      console.log('Latitude decimal places:', e.latlng.lat.toString().split('.')[1]?.length || 0)
      console.log('Longitude decimal places:', e.latlng.lng.toString().split('.')[1]?.length || 0)
      
      const position = { lat: e.latlng.lat, lng: e.latlng.lng }
      console.log('Position object created:', position)
      console.log('Position lat type:', typeof position.lat, 'value:', position.lat.toString())
      console.log('Position lng type:', typeof position.lng, 'value:', position.lng.toString())
      
      setClickPosition(position)
      setShowAddForm(true)
    },
  })

  const handleAddDestination = () => {
    if (clickPosition && newDestinationName.trim()) {
      console.log('=== CREATING DESTINATION ===')
      console.log('Click position from state:', clickPosition)
      console.log('Latitude from state:', clickPosition.lat.toString())
      console.log('Longitude from state:', clickPosition.lng.toString())
      
      const newDestination = {
        name: newDestinationName.trim(),
        latitude: clickPosition.lat,
        longitude: clickPosition.lng,
        type: newDestinationType,
        visited: newDestinationVisited,
        photos: [],
        tags: [],
      }
      console.log('=== DESTINATION OBJECT CREATED ===')
      console.log('Final destination object:', newDestination)
      console.log('Final latitude:', newDestination.latitude.toString())
      console.log('Final longitude:', newDestination.longitude.toString())
      console.log('Latitude type:', typeof newDestination.latitude)
      console.log('Longitude type:', typeof newDestination.longitude)
      
      onAddDestination(newDestination)
      setShowAddForm(false)
      setNewDestinationName('')
      setNewDestinationType('other')
      setNewDestinationVisited(false)
      setClickPosition(null)
    }
  }

  const handleCancel = () => {
    setShowAddForm(false)
    setNewDestinationName('')
    setNewDestinationType('other')
    setNewDestinationVisited(false)
    setClickPosition(null)
  }

  return (
    <>
      {/* Temporary marker for clicked position */}
      {clickPosition && (
        <Marker
          position={[clickPosition.lat, clickPosition.lng]}
          icon={L.divIcon({
            html: `
              <div style="
                background-color: #EF4444;
                width: 20px;
                height: 20px;
                border-radius: 50%;
                border: 2px solid white;
                box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-size: 10px;
                font-weight: bold;
                animation: pulse 2s infinite;
              ">
                +
              </div>
            `,
            className: 'temp-marker',
            iconSize: [20, 20],
            iconAnchor: [10, 10],
          })}
        />
      )}

      {/* Modal dialog for adding destination */}
      {showAddForm && clickPosition && (
        <div 
          className="fixed inset-0 z-[2000] flex items-center justify-center bg-black bg-opacity-50"
          onClick={(e) => e.stopPropagation()}
        >
          <div 
            className="bg-white rounded-lg shadow-xl border p-6 max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Plus className="h-5 w-5 text-primary-600" />
                <h3 className="font-semibold text-gray-900 text-lg">Добави нова дестинация</h3>
              </div>
              <button
                onClick={handleCancel}
                className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="h-5 w-5 text-gray-600" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Име *
                </label>
                <input
                  type="text"
                  value={newDestinationName}
                  onChange={(e) => setNewDestinationName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddDestination()}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Въведете име на дестинацията"
                  autoFocus
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Тип дестинация *
                  </label>
                  <select
                    value={newDestinationType}
                    onChange={(e) => setNewDestinationType(e.target.value as Destination['type'])}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="city">🏙️ Град</option>
                    <option value="landmark">🗿 Забележителност</option>
                    <option value="restaurant">🍽️ Ресторант</option>
                    <option value="hotel">🏨 Хотел</option>
                    <option value="museum">🏛️ Музей</option>
                    <option value="park">🌳 Парк</option>
                    <option value="other">📍 Друго</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Статус *
                  </label>
                  <select
                    value={newDestinationVisited ? 'visited' : 'planned'}
                    onChange={(e) => setNewDestinationVisited(e.target.value === 'visited')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="planned">🧳 За посещение</option>
                    <option value="visited">✅ Посетено</option>
                  </select>
                </div>
              </div>
              
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-sm text-gray-600 mb-2">Координати на местоположението:</div>
                <div className="flex items-center space-x-2 text-gray-800">
                  <MapPin className="h-4 w-4 text-red-500" />
                  <span className="font-mono text-sm">
                    {clickPosition.lat.toFixed(6)}, {clickPosition.lng.toFixed(6)}
                  </span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Тези координати са заключени и няма да се променят
                </div>
              </div>
              
              <div className="flex items-center space-x-3 pt-4">
                <button
                  onClick={handleAddDestination}
                  disabled={!newDestinationName.trim()}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Добави дестинация
                </button>
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Отказ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
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
  const handleMapReady = () => {
    setMapError(null)
  }

  if (mapError) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-100">
        <div className="text-center p-4">
          <div className="text-red-600 mb-2">Map loading error</div>
          <div className="text-sm text-gray-600">{mapError}</div>
          <button 
            onClick={() => setMapError(null)}
            className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm"
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
        whenReady={handleMapReady}
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
        
        {destinations.map((destination) => {
          console.log('=== RENDERING MARKER ===')
          console.log('Destination:', destination.name)
          console.log('Display latitude:', destination.latitude.toString())
          console.log('Display longitude:', destination.longitude.toString())
          console.log('Display coordinates array:', [destination.latitude, destination.longitude])
          return (
            <Marker
              key={destination.id}
              position={[destination.latitude, destination.longitude]}
              icon={createCustomIcon(destination.type, destination.visited)}
              eventHandlers={{
                click: () => onSelectDestination(destination),
              }}
            >
              <Popup>
                <div className="p-2 max-w-xs">
                  <h3 className="font-semibold text-gray-900 mb-1 text-sm">{destination.name}</h3>
                  <div className="text-xs text-gray-600 space-y-1">
                    <div className="flex items-center space-x-1">
                      <MapPin className="h-3 w-3" />
                      <span>{destination.type}</span>
                    </div>
                    {destination.visited && (
                      <div className="flex items-center space-x-1 text-green-600">
                        <span className="text-xs">✓ Visited</span>
                        {destination.visit_date && (
                          <span className="text-xs">
                            on {new Date(destination.visit_date).toLocaleDateString()}
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
          )
        })}
      </MapContainer>
      
      {/* Instructions overlay */}
      <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg border p-3 max-w-xs hidden sm:block">
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
      
      {/* Mobile instructions */}
      <div className="absolute bottom-4 left-4 right-4 sm:hidden bg-white rounded-lg shadow-lg border p-3">
        <div className="text-xs text-gray-600 text-center">
          <p>Tap the map to add destinations • Tap markers for details</p>
        </div>
      </div>
    </div>
  )
} 