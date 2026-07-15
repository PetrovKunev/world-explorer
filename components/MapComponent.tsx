'use client'

import { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet'
import L from 'leaflet'
import { MapPin, Plus, Info, X, Calendar, Search } from 'lucide-react'
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

interface AddDraft {
  lat: number
  lng: number
  name: string
}

interface MapComponentProps {
  destinations: Destination[]
  selectedDestination: Destination | null
  onSelectDestination: (destination: Destination | null) => void
  onAddDestination: (destination: DestinationInput) => void
  onMoveDestination: (id: string, latitude: number, longitude: number) => void
}

// Първоначално вмества всички дестинации; след това центрира при избор
function MapController({
  selectedDestination,
  destinations,
}: {
  selectedDestination: Destination | null
  destinations: Destination[]
}) {
  const map = useMap()
  const didFitRef = useRef(false)

  useEffect(() => {
    if (didFitRef.current) return
    didFitRef.current = true
    if (destinations.length > 0) {
      const bounds = L.latLngBounds(
        destinations.map((dest) => [dest.latitude, dest.longitude] as [number, number])
      )
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 10 })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (selectedDestination) {
      map.setView([selectedDestination.latitude, selectedDestination.longitude], 13, {
        animate: true,
      })
    }
  }, [selectedDestination, map])

  return null
}

// Улавя кликовете върху картата
function ClickCapture({
  disabled,
  onMapClick,
}: {
  disabled: boolean
  onMapClick: (lat: number, lng: number) => void
}) {
  useMapEvents({
    click: (e) => {
      if (!disabled) {
        onMapClick(e.latlng.lat, e.latlng.lng)
      }
    },
  })
  return null
}

interface GeocodeResult {
  display_name: string
  name?: string
  lat: string
  lon: string
}

// Търсене на място по име чрез OpenStreetMap Nominatim
function GeocodingSearch({
  onSelect,
}: {
  onSelect: (result: { lat: number; lng: number; name: string }) => void
}) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<GeocodeResult[]>([])
  const [open, setOpen] = useState(false)
  const [searching, setSearching] = useState(false)
  const abortRef = useRef<AbortController | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const runSearch = (q: string) => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    setSearching(true)

    fetch(
      `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&accept-language=bg&q=${encodeURIComponent(q)}`,
      { signal: controller.signal }
    )
      .then((res) => (res.ok ? res.json() : []))
      .then((data: GeocodeResult[]) => {
        setResults(data)
        setOpen(true)
        setSearching(false)
      })
      .catch(() => {
        // Прекъсната или неуспешна заявка — не показваме грешка при търсене
        if (!controller.signal.aborted) setSearching(false)
      })
  }

  const handleChange = (value: string) => {
    setQuery(value)
    if (timerRef.current) clearTimeout(timerRef.current)
    if (value.trim().length < 3) {
      setResults([])
      setOpen(false)
      return
    }
    timerRef.current = setTimeout(() => runSearch(value.trim()), 400)
  }

  const clear = () => {
    setQuery('')
    setResults([])
    setOpen(false)
  }

  return (
    <div className="absolute left-14 right-4 top-4 z-[1000] sm:right-auto sm:w-80">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Търсене на място…"
          className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-9 text-sm shadow-lg focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        {query && (
          <button
            onClick={clear}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-gray-400 hover:text-gray-600"
            aria-label="Изчисти търсенето"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {open && (
        <div className="mt-1 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
          {results.length === 0 ? (
            <div className="px-3 py-2 text-sm text-gray-500">
              {searching ? 'Търсене…' : 'Няма намерени резултати'}
            </div>
          ) : (
            results.map((result, index) => (
              <button
                key={`${result.lat}-${result.lon}-${index}`}
                onClick={() => {
                  onSelect({
                    lat: parseFloat(result.lat),
                    lng: parseFloat(result.lon),
                    name: result.name || result.display_name.split(',')[0],
                  })
                  clear()
                }}
                className="block w-full truncate px-3 py-2 text-left text-sm text-gray-700 transition-colors hover:bg-gray-50"
                title={result.display_name}
              >
                {result.display_name}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}

// Диалог за добавяне на дестинация (клик върху картата или резултат от търсене)
function AddDestinationDialog({
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
      visit_date: null,
      notes: null,
      photos: [],
      tags: [],
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
        className="mx-4 w-full max-w-md rounded-lg border bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Plus className="h-5 w-5 text-primary-600" />
            <h3 className="text-lg font-semibold text-gray-900">Нова дестинация</h3>
          </div>
          <button
            onClick={onClose}
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
                  {draft.lat.toFixed(6)}, {draft.lng.toFixed(6)}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end space-x-3 border-t border-gray-200 pt-4">
          <button
            onClick={onClose}
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
  )
}

export default function MapComponent({
  destinations,
  selectedDestination,
  onSelectDestination,
  onAddDestination,
  onMoveDestination,
}: MapComponentProps) {
  const [map, setMap] = useState<L.Map | null>(null)
  const [addDraft, setAddDraft] = useState<AddDraft | null>(null)
  // Картата се зарежда само в браузъра (dynamic, ssr: false) — localStorage е достъпен
  const [showHelp, setShowHelp] = useState(
    () => localStorage.getItem('world-explorer-hide-help') !== '1'
  )

  const dismissHelp = () => {
    setShowHelp(false)
    localStorage.setItem('world-explorer-hide-help', '1')
  }

  const handleGeocodeSelect = (result: { lat: number; lng: number; name: string }) => {
    map?.flyTo([result.lat, result.lng], 12)
    setAddDraft({ lat: result.lat, lng: result.lng, name: result.name })
  }

  return (
    <div className="map-container">
      <MapContainer center={[48.8566, 2.3522]} zoom={5} className="leaflet-container" ref={setMap}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapController selectedDestination={selectedDestination} destinations={destinations} />
        <ClickCapture
          disabled={addDraft !== null}
          onMapClick={(lat, lng) => setAddDraft({ lat, lng, name: '' })}
        />

        {addDraft && <Marker position={[addDraft.lat, addDraft.lng]} icon={tempMarkerIcon} />}

        {destinations.map((destination) => {
          const typeInfo = DESTINATION_TYPES[destination.type] ?? DESTINATION_TYPES.other
          return (
            <Marker
              key={destination.id}
              position={[destination.latitude, destination.longitude]}
              icon={getMarkerIcon(destination.type, destination.visited)}
              draggable
              eventHandlers={{
                click: () => onSelectDestination(destination),
                dragend: (e) => {
                  const position = (e.target as L.Marker).getLatLng()
                  onMoveDestination(destination.id, position.lat, position.lng)
                },
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

      <GeocodingSearch onSelect={handleGeocodeSelect} />

      {addDraft && (
        <AddDestinationDialog
          key={`${addDraft.lat},${addDraft.lng}`}
          draft={addDraft}
          onSubmit={(input) => {
            onAddDestination(input)
            setAddDraft(null)
          }}
          onClose={() => setAddDraft(null)}
        />
      )}

      {/* Кратки инструкции */}
      {showHelp && (
        <>
          <div className="absolute right-4 top-4 hidden max-w-xs rounded-lg border bg-white p-3 shadow-lg sm:block">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-primary-600" />
                <h3 className="text-sm font-semibold text-gray-900">Как се използва</h3>
              </div>
              <button
                onClick={dismissHelp}
                className="rounded p-0.5 text-gray-400 transition-colors hover:text-gray-600"
                aria-label="Скрий инструкциите"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-1 text-xs text-gray-600">
              <p>• Кликнете върху картата или потърсете място по име</p>
              <p>• Кликнете върху маркер за подробности</p>
              <p>• Влачете маркер, за да коригирате местоположението</p>
            </div>
          </div>

          <div className="absolute bottom-4 left-4 right-4 rounded-lg border bg-white p-3 shadow-lg sm:hidden">
            <div className="flex items-center justify-between text-xs text-gray-600">
              <p className="flex-1 text-center">
                Докоснете картата или потърсете място, за да добавите дестинация
              </p>
              <button
                onClick={dismissHelp}
                className="ml-2 rounded p-0.5 text-gray-400"
                aria-label="Скрий инструкциите"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
