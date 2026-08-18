'use client'

import { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Circle, useMapEvents, useMap } from 'react-leaflet'
import MarkerClusterGroup from 'react-leaflet-markercluster'
import L from 'leaflet'
import { MapPin, Plus, Info, X, Calendar, Search, LocateFixed, Loader2, Navigation } from 'lucide-react'
import Image from 'next/image'
import 'react-leaflet-markercluster/styles'
import {
  Destination,
  DestinationInput,
  DestinationType,
  DESTINATION_TYPES,
  DESTINATION_TYPE_KEYS,
  formatVisit,
  latestVisit,
} from '@/types/destination'
import { useToast } from '@/components/Toaster'
import { locationFields, ResolvedLocation, reverseGeocode } from '@/lib/geo/geocode'

// Пинчета като „забодени в коркова карта“: лъскава глава с отблясък,
// метална игла и сянка при върха. Върхът на иглата е гео-точката.
// Дублираните SVG дефиниции с еднакво id са безопасни — сочат едно и също.
const PIN_COLORS = {
  visited: { light: '#8df0c0', base: '#10b981', dark: '#047857' },
  planned: { light: '#ffcf9e', base: '#f97316', dark: '#b45309' },
  draft: { light: '#fca5a5', base: '#ef4444', dark: '#b91c1c' },
} as const

function pushpinSvg(colorKey: keyof typeof PIN_COLORS, tilt: number): string {
  const color = PIN_COLORS[colorKey]
  return `
    <svg width="38" height="48" viewBox="0 0 38 48" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="wx-pin-${colorKey}" cx="35%" cy="30%" r="75%">
          <stop offset="0%" stop-color="${color.light}"/>
          <stop offset="55%" stop-color="${color.base}"/>
          <stop offset="100%" stop-color="${color.dark}"/>
        </radialGradient>
        <linearGradient id="wx-pin-needle" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#e5e7eb"/>
          <stop offset="50%" stop-color="#9ca3af"/>
          <stop offset="100%" stop-color="#4b5563"/>
        </linearGradient>
      </defs>
      <ellipse cx="19" cy="44" rx="5.5" ry="2" fill="rgba(40,20,0,0.3)"/>
      <g transform="rotate(${tilt} 19 44)">
        <polygon points="17.8,21 20.2,21 19,44" fill="url(#wx-pin-needle)"/>
        <ellipse cx="19" cy="20.5" rx="3.5" ry="1.5" fill="#374151"/>
        <circle cx="19" cy="12" r="9.5" fill="url(#wx-pin-${colorKey})"/>
        <ellipse cx="15.5" cy="8" rx="3.2" ry="2.2" fill="rgba(255,255,255,0.55)"
          transform="rotate(-25 15.5 8)"/>
      </g>
    </svg>
  `
}

// Иконите се кешират по статус и наклон — иначе всеки render създава
// нови L.DivIcon обекти и Leaflet пресъздава маркерите
const iconCache = new Map<string, L.DivIcon>()

function getMarkerIcon(visited: boolean, tilt: number): L.DivIcon {
  const colorKey = visited ? 'visited' : 'planned'
  const key = `${colorKey}-${tilt}`
  const cached = iconCache.get(key)
  if (cached) return cached

  const icon = L.divIcon({
    html: pushpinSvg(colorKey, tilt),
    className: 'destination-marker',
    iconSize: [38, 48],
    iconAnchor: [19, 44],
  })

  iconCache.set(key, icon)
  return icon
}

// Лек детерминиран наклон (−16°…16°) от id-то — като истински пинчета,
// но стабилен между render-ите
function pinTilt(id: string): number {
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) | 0
  }
  return (Math.abs(hash) % 33) - 16
}

const tempMarkerIcon = L.divIcon({
  html: pushpinSvg('draft', 0),
  className: 'temp-marker',
  iconSize: [38, 48],
  iconAnchor: [19, 44],
})

// Клъстер: „бележка с число, забодена с мини пинче“
function clusterIcon(cluster: { getChildCount(): number }): L.DivIcon {
  const count = cluster.getChildCount()
  return L.divIcon({
    html: `
      <svg width="48" height="44" viewBox="0 0 48 44" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="wx-cluster-pin" cx="35%" cy="30%" r="75%">
            <stop offset="0%" stop-color="#ffcf9e"/>
            <stop offset="55%" stop-color="#f97316"/>
            <stop offset="100%" stop-color="#b45309"/>
          </radialGradient>
        </defs>
        <g transform="rotate(-4 24 26)">
          <rect x="6" y="13" width="36" height="26" rx="4" fill="#fdf6e3"
            stroke="rgba(120,90,50,0.45)"/>
          <text x="24" y="31" text-anchor="middle"
            font-family="system-ui, sans-serif" font-size="13" font-weight="700"
            fill="#3d2d1a">${count}</text>
        </g>
        <ellipse cx="24" cy="15" rx="3" ry="1.2" fill="rgba(40,20,0,0.25)"/>
        <circle cx="24" cy="10" r="5.5" fill="url(#wx-cluster-pin)"/>
        <ellipse cx="22" cy="8" rx="1.8" ry="1.3" fill="rgba(255,255,255,0.55)"/>
      </svg>
    `,
    className: 'cluster-note',
    iconSize: [48, 44],
    iconAnchor: [24, 26],
  })
}

// Син пулсиращ маркер за текущото местоположение на потребителя
const userLocationIcon = L.divIcon({
  html: `
    <div style="position: relative; width: 18px; height: 18px;">
      <div class="user-location-pulse" style="
        position: absolute;
        inset: -8px;
        border-radius: 50%;
        background-color: rgba(59, 130, 246, 0.3);
      "></div>
      <div style="
        position: absolute;
        inset: 0;
        background-color: #3B82F6;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      "></div>
    </div>
  `,
  className: 'user-location-marker',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
})

interface UserPosition {
  lat: number
  lng: number
  accuracy: number
}

// Разстояние по права линия (Leaflet използва хаверсинова формула)
function distanceToDestination(from: UserPosition, dest: Destination): number {
  return L.latLng(from.lat, from.lng).distanceTo([dest.latitude, dest.longitude])
}

function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} м`
  return `${(meters / 1000).toLocaleString('bg-BG', { maximumFractionDigits: 1 })} км`
}

interface AddDraft {
  lat: number
  lng: number
  name: string
  // Гео данни от вече направено обратно геокодиране (GPS потока) —
  // спестяват повторна заявка при записа
  location?: ResolvedLocation
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

    // През /api/geocode — правилен User-Agent към Nominatim + кеш
    fetch(`/api/geocode?q=${encodeURIComponent(q)}`, { signal: controller.signal })
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
          className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-9 text-sm shadow-lg focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400"
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
        <div className="mt-1 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
          {results.length === 0 ? (
            <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
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
                className="block w-full truncate px-3 py-2 text-left text-sm text-gray-700 transition-colors hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-700"
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

export default function MapComponent({
  destinations,
  selectedDestination,
  onSelectDestination,
  onAddDestination,
  onMoveDestination,
}: MapComponentProps) {
  const [map, setMap] = useState<L.Map | null>(null)
  const [addDraft, setAddDraft] = useState<AddDraft | null>(null)
  const [userPosition, setUserPosition] = useState<UserPosition | null>(null)
  const [locating, setLocating] = useState(false)
  const [following, setFollowing] = useState(false)
  const [resolvingName, setResolvingName] = useState(false)
  const watchIdRef = useRef<number | null>(null)
  // При ръчно местене на картата спираме автоматичното центриране,
  // но следенето (маркерът) продължава да се обновява
  const autoPanRef = useRef(true)
  const hadFixRef = useRef(false)
  const showToast = useToast()
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

  const geolocationReady = () => {
    if (!('geolocation' in navigator)) {
      showToast('error', 'Браузърът не поддържа определяне на местоположение.')
      return false
    }
    // Geolocation API работи само в защитен контекст (HTTPS или localhost)
    if (!window.isSecureContext) {
      showToast('error', 'Определянето на местоположение изисква HTTPS връзка.')
      return false
    }
    return true
  }

  const geoErrorMessage = (error: GeolocationPositionError) => {
    const messages: Record<number, string> = {
      [error.PERMISSION_DENIED]:
        'Достъпът до местоположението е отказан. Разрешете го от настройките на браузъра.',
      [error.POSITION_UNAVAILABLE]: 'Местоположението не може да бъде определено.',
      [error.TIMEOUT]: 'Определянето на местоположението отне твърде дълго. Опитайте отново.',
    }
    return messages[error.code] ?? 'Грешка при определяне на местоположението.'
  }

  const handleLocate = () => {
    // При активно следене бутонът само центрира картата отново върху вас
    if (following && userPosition) {
      autoPanRef.current = true
      map?.flyTo([userPosition.lat, userPosition.lng], Math.max(map.getZoom(), 15))
      return
    }
    if (!geolocationReady()) return

    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords
        setUserPosition({ lat: latitude, lng: longitude, accuracy })
        setLocating(false)
        map?.flyTo([latitude, longitude], Math.max(map.getZoom(), 15))
      },
      (error) => {
        setLocating(false)
        showToast('error', geoErrorMessage(error))
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    )
  }

  const stopFollowing = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
    setFollowing(false)
  }

  const toggleFollow = () => {
    if (following) {
      stopFollowing()
      return
    }
    if (!geolocationReady()) return

    autoPanRef.current = true
    hadFixRef.current = false
    setFollowing(true)
    // Без timeout — при watchPosition изтичането би вдигало грешка
    // на всеки интервал без ново местоположение (напр. на закрито)
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords
        setUserPosition({ lat: latitude, lng: longitude, accuracy })
        if (!map) return
        if (!hadFixRef.current) {
          hadFixRef.current = true
          map.flyTo([latitude, longitude], Math.max(map.getZoom(), 15))
        } else if (autoPanRef.current) {
          map.panTo([latitude, longitude])
        }
      },
      (error) => {
        showToast('error', geoErrorMessage(error))
        // Без разрешение следенето не може да продължи
        if (error.code === error.PERMISSION_DENIED) {
          stopFollowing()
        }
      },
      { enableHighAccuracy: true, maximumAge: 0 }
    )
  }

  // Ръчното влачене на картата изключва автоматичното центриране
  useEffect(() => {
    if (!map || !following) return
    const onDragStart = () => {
      autoPanRef.current = false
    }
    map.on('dragstart', onDragStart)
    return () => {
      map.off('dragstart', onDragStart)
    }
  }, [map, following])

  // Спираме следенето при затваряне на компонента
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
      }
    }
  }, [])

  // Опит за автоматично име на мястото чрез обратно геокодиране (Nominatim).
  // При неуспех оставяме празно име — потребителят го въвежда ръчно
  const markUserLocation = async () => {
    if (!userPosition) return
    const { lat, lng } = userPosition
    setResolvingName(true)
    const location = await reverseGeocode(lat, lng)
    setResolvingName(false)
    map?.closePopup()
    setAddDraft({ lat, lng, name: location?.name ?? '', location: location ?? undefined })
  }

  return (
    <div className="map-container">
      <MapContainer center={[48.8566, 2.3522]} zoom={5} className="leaflet-container" ref={setMap}>
        {/* CARTO Voyager и в двете теми — в тъмната само леко приглушена (CSS) */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          subdomains="abcd"
        />

        <MapController selectedDestination={selectedDestination} destinations={destinations} />
        <ClickCapture
          disabled={addDraft !== null}
          onMapClick={(lat, lng) => setAddDraft({ lat, lng, name: '' })}
        />

        {addDraft && <Marker position={[addDraft.lat, addDraft.lng]} icon={tempMarkerIcon} />}

        {userPosition && (
          <>
            <Circle
              center={[userPosition.lat, userPosition.lng]}
              radius={userPosition.accuracy}
              pathOptions={{ color: '#3B82F6', weight: 1, fillColor: '#3B82F6', fillOpacity: 0.1 }}
            />
            <Marker position={[userPosition.lat, userPosition.lng]} icon={userLocationIcon}>
              <Popup>
                <div className="p-2 text-center">
                  <p className="mb-1 text-sm font-semibold text-gray-900 dark:text-gray-100">
                    Вие сте тук
                  </p>
                  <p className="mb-2 font-mono text-xs text-gray-600 dark:text-gray-400">
                    {userPosition.lat.toFixed(6)}, {userPosition.lng.toFixed(6)}
                    <br />
                    точност ±{Math.round(userPosition.accuracy)} м
                  </p>
                  <button
                    onClick={markUserLocation}
                    disabled={resolvingName}
                    className="inline-flex items-center space-x-1 rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-primary-700 disabled:cursor-wait disabled:opacity-70"
                  >
                    {resolvingName ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Plus className="h-3 w-3" />
                    )}
                    <span>{resolvingName ? 'Търсене на име…' : 'Отбележи това място'}</span>
                  </button>
                </div>
              </Popup>
            </Marker>
          </>
        )}

        {/* Близките маркери се групират в клъстери */}
        <MarkerClusterGroup
          chunkedLoading
          showCoverageOnHover={false}
          maxClusterRadius={60}
          iconCreateFunction={clusterIcon}
        >
        {destinations.map((destination) => {
          const typeInfo = DESTINATION_TYPES[destination.type] ?? DESTINATION_TYPES.other
          const lastVisit = latestVisit(destination.visits)
          return (
            <Marker
              key={destination.id}
              position={[destination.latitude, destination.longitude]}
              icon={getMarkerIcon(destination.visited, pinTilt(destination.id))}
              title={`${destination.name} · ${typeInfo.label} · ${destination.visited ? 'посетена' : 'планирана'}`}
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
                  {destination.photos.length > 0 && (
                    <div className="relative mb-2 h-24 w-52 overflow-hidden rounded">
                      <Image
                        src={destination.photos[0]}
                        alt={destination.name}
                        fill
                        sizes="208px"
                        className="object-cover"
                      />
                    </div>
                  )}
                  <h3 className="mb-1 text-sm font-semibold text-gray-900 dark:text-gray-100">{destination.name}</h3>
                  <div className="space-y-1 text-xs text-gray-600 dark:text-gray-300">
                    <div className="flex items-center space-x-1">
                      <MapPin className="h-3 w-3" />
                      <span>{typeInfo.label}</span>
                    </div>
                    {userPosition && (
                      <div className="flex items-center space-x-1">
                        <Navigation className="h-3 w-3" />
                        <span>
                          {formatDistance(distanceToDestination(userPosition, destination))} от вас
                        </span>
                      </div>
                    )}
                    {destination.visited && (
                      <div className="flex items-center space-x-1 text-green-600">
                        <span>✓ Посетена</span>
                        {lastVisit && (
                          <span>
                            {lastVisit.end ? '' : 'на '}
                            {formatVisit(lastVisit)}
                            {destination.visits.length > 1 &&
                              ` (+${destination.visits.length - 1})`}
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
        </MarkerClusterGroup>
      </MapContainer>

      <GeocodingSearch onSelect={handleGeocodeSelect} />

      <div className="absolute bottom-20 right-4 z-[1000] flex flex-col space-y-2 sm:bottom-10">
        <button
          onClick={handleLocate}
          disabled={locating}
          className="rounded-lg border border-gray-300 bg-white p-2.5 text-gray-700 shadow-lg transition-colors hover:bg-gray-50 disabled:cursor-wait dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
          title="Моето местоположение"
          aria-label="Моето местоположение"
        >
          {locating ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <LocateFixed className="h-5 w-5" />
          )}
        </button>

        <button
          onClick={toggleFollow}
          className={`rounded-lg border p-2.5 shadow-lg transition-colors ${
            following
              ? 'border-primary-600 bg-primary-600 text-white hover:bg-primary-700'
              : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700'
          }`}
          title={following ? 'Спри следенето' : 'Следвай ме'}
          aria-label={following ? 'Спри следенето' : 'Следвай ме'}
          aria-pressed={following}
        >
          <Navigation className={`h-5 w-5 ${following ? 'animate-pulse' : ''}`} />
        </button>
      </div>

      {/* Разстояние до избраната дестинация — вижда се и при избор от списъка */}
      {userPosition && selectedDestination && (
        <div className="absolute bottom-20 left-4 z-[1000] flex max-w-[60%] items-center space-x-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700 shadow-lg sm:bottom-4 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200">
          <Navigation className="h-3.5 w-3.5 shrink-0 text-primary-600" />
          <span className="truncate">
            <span className="font-medium">{selectedDestination.name}</span> —{' '}
            {formatDistance(distanceToDestination(userPosition, selectedDestination))} от вас
          </span>
        </div>
      )}

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
          <div className="absolute right-4 top-4 hidden max-w-xs rounded-lg border bg-white p-3 shadow-lg sm:block dark:border-gray-700 dark:bg-gray-800">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-primary-600" />
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Как се използва</h3>
              </div>
              <button
                onClick={dismissHelp}
                className="rounded p-0.5 text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-200"
                aria-label="Скрий инструкциите"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-1 text-xs text-gray-600 dark:text-gray-300">
              <p>• Кликнете върху картата или потърсете място по име</p>
              <p>• Кликнете върху маркер за подробности</p>
              <p>• Влачете маркер, за да коригирате местоположението</p>
              <p>• Използвайте бутона за GPS, за да отбележите къде се намирате</p>
            </div>
          </div>

          <div className="absolute bottom-4 left-4 right-4 rounded-lg border bg-white p-3 shadow-lg sm:hidden dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-300">
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
