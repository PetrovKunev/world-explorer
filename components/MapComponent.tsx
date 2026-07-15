'use client'

import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet'
import L from 'leaflet'
import { MapPin, Plus, Info, X, Calendar } from 'lucide-react'
import {
  Destination,
  DestinationInput,
  DestinationType,
  DESTINATION_TYPES,
  DESTINATION_TYPE_KEYS,
} from '@/types/destination'

// Иконите се кешират по тип и статус — иначе всеки render създава
// нови L.DivIcon обекти и Leaflet пресъздава маркерите
const iconCache = new Map<string, L.DivIcon>()

function getMarkerIcon(type: DestinationType, visited: boolean): L.DivIcon {
  const key = `${type}-${visited}`
  const cached = iconCache.get(key)
  if (cached) return cached

  const primaryColor = visited ? '#10B981' : '#F97316'
  const emoji = DESTINATION_TYPES[type]?.emoji ?? DESTINATION_TYPES.other.emoji
  const statusEmoji = visited ? '✅' : '🧳'

  const icon = L.divIcon({
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
        font-size: 14px;
        position: relative;
      ">
        ${emoji}
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
          ${statusEmoji}
        </div>
      </div>
    `,
    className: 'destination-marker',
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  })

  iconCache.set(key, icon)
  return icon
}

const tempMarkerIcon = L.divIcon({
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
    ">
      +
    </div>
  `,
  className: 'temp-marker',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
})

interface MapComponentProps {
  destinations: Destination[]
  selectedDestination: Destination | null
  onSelectDestination: (destination: Destination | null) => void
  onAddDestination: (destination: DestinationInput) => void
}

// Центрира картата върху избраната дестинация
function MapController({ selectedDestination }: { selectedDestination: Destination | null }) {
  const map = useMap()

  useEffect(() => {
    if (selectedDestination) {
      map.setView([selectedDestination.latitude, selectedDestination.longitude], 13, {
        animate: true,
      })
    }
  }, [selectedDestination, map])

  return null
}

// Обработва клик върху картата и показва диалог за добавяне
function MapClickHandler({
  onAddDestination,
}: {
  onAddDestination: (destination: DestinationInput) => void
}) {
  const [clickPosition, setClickPosition] = useState<{ lat: number; lng: number } | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [name, setName] = useState('')
  const [type, setType] = useState<DestinationType>('other')
  const [visited, setVisited] = useState(false)

  useMapEvents({
    click: (e) => {
      // Не реагираме на кликове, докато диалогът е отворен
      if (showAddForm) return

      setClickPosition({ lat: e.latlng.lat, lng: e.latlng.lng })
      setShowAddForm(true)
      setName('')
      setType('other')
      setVisited(false)
    },
  })

  const closeForm = () => {
    setShowAddForm(false)
    setClickPosition(null)
    setName('')
    setType('other')
    setVisited(false)
  }

  const handleSubmit = () => {
    if (!name.trim() || !clickPosition) return

    onAddDestination({
      name: name.trim(),
      latitude: clickPosition.lat,
      longitude: clickPosition.lng,
      type,
      visited,
      rating: null,
      visit_date: null,
      notes: null,
      photos: [],
      tags: [],
    })

    closeForm()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    e.stopPropagation()
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSubmit()
    }
    if (e.key === 'Escape') {
      e.preventDefault()
      closeForm()
    }
  }

  return (
    <>
      {clickPosition && <Marker position={[clickPosition.lat, clickPosition.lng]} icon={tempMarkerIcon} />}

      {showAddForm && clickPosition && (
        <div
          className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/50"
          onClick={(e) => {
            e.stopPropagation()
            closeForm()
          }}
        >
          <div
            className="mx-4 w-full max-w-md rounded-lg border bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Plus className="h-5 w-5 text-primary-600" />
                <h3 className="text-lg font-semibold text-gray-900">Нова дестинация</h3>
              </div>
              <button
                onClick={closeForm}
                className="rounded-lg p-1 transition-colors hover:bg-gray-100"
                aria-label="Затвори"
              >
                <X className="h-5 w-5 text-gray-600" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Име <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Въведете име на дестинацията"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-primary-500"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Тип</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value as DestinationType)}
                      className="w-full appearance-none rounded-lg border border-gray-300 py-2 pl-10 pr-3 focus:border-transparent focus:ring-2 focus:ring-primary-500"
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
                  <label className="mb-1 block text-sm font-medium text-gray-700">Статус</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <select
                      value={visited ? 'visited' : 'planned'}
                      onChange={(e) => setVisited(e.target.value === 'visited')}
                      className="w-full appearance-none rounded-lg border border-gray-300 py-2 pl-10 pr-3 focus:border-transparent focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="planned">🧳 За посещение</option>
                      <option value="visited">✅ Посетена</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="rounded-lg bg-gray-50 p-3">
                <div className="flex items-start space-x-2">
                  <MapPin className="mt-0.5 h-4 w-4 text-gray-500" />
                  <div className="text-sm">
                    <p className="font-medium text-gray-700">Координати:</p>
                    <p className="mt-1 font-mono text-xs text-gray-600">
                      {clickPosition.lat.toFixed(6)}, {clickPosition.lng.toFixed(6)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end space-x-3 border-t border-gray-200 pt-4">
              <button
                onClick={closeForm}
                className="rounded-lg bg-gray-100 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-200"
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
  return (
    <div className="map-container">
      <MapContainer center={[48.8566, 2.3522]} zoom={5} className="leaflet-container">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapController selectedDestination={selectedDestination} />
        <MapClickHandler onAddDestination={onAddDestination} />

        {destinations.map((destination) => {
          const typeInfo = DESTINATION_TYPES[destination.type] ?? DESTINATION_TYPES.other
          return (
            <Marker
              key={destination.id}
              position={[destination.latitude, destination.longitude]}
              icon={getMarkerIcon(destination.type, destination.visited)}
              eventHandlers={{
                click: () => onSelectDestination(destination),
              }}
            >
              <Popup>
                <div className="max-w-xs p-2">
                  <h3 className="mb-1 text-sm font-semibold text-gray-900">{destination.name}</h3>
                  <div className="space-y-1 text-xs text-gray-600">
                    <div className="flex items-center space-x-1">
                      <MapPin className="h-3 w-3" />
                      <span>{typeInfo.label}</span>
                    </div>
                    {destination.visited && (
                      <div className="flex items-center space-x-1 text-green-600">
                        <span>✓ Посетена</span>
                        {destination.visit_date && (
                          <span>
                            на {new Date(destination.visit_date).toLocaleDateString('bg-BG')}
                          </span>
                        )}
                      </div>
                    )}
                    {destination.rating && (
                      <div className="flex items-center space-x-1">
                        <span className="text-yellow-500">★</span>
                        <span>{destination.rating}/5</span>
                      </div>
                    )}
                    {destination.notes && (
                      <div className="flex items-start space-x-1">
                        <Info className="mt-0.5 h-3 w-3 shrink-0" />
                        <p className="line-clamp-2">{destination.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>

      {/* Кратки инструкции (десктоп) */}
      <div className="absolute right-4 top-4 hidden max-w-xs rounded-lg border bg-white p-3 shadow-lg sm:block">
        <div className="mb-2 flex items-center space-x-2">
          <MapPin className="h-4 w-4 text-primary-600" />
          <h3 className="text-sm font-semibold text-gray-900">Как се използва</h3>
        </div>
        <div className="space-y-1 text-xs text-gray-600">
          <p>• Кликнете върху картата, за да добавите дестинация</p>
          <p>• Кликнете върху маркер за подробности</p>
          <p>• Управлявайте дестинациите от списъка вляво</p>
        </div>
      </div>

      {/* Кратки инструкции (мобилни) */}
      <div className="absolute bottom-4 left-4 right-4 rounded-lg border bg-white p-3 shadow-lg sm:hidden">
        <div className="text-center text-xs text-gray-600">
          <p>Докоснете картата, за да добавите дестинация • Докоснете маркер за подробности</p>
        </div>
      </div>
    </div>
  )
}
