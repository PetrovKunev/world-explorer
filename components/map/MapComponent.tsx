'use client'

import { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet'
import MarkerClusterGroup from 'react-leaflet-markercluster'
import L from 'leaflet'
import { MapPin, Plus, Info, X, LocateFixed, Loader2, Navigation } from 'lucide-react'
import 'react-leaflet-markercluster/styles'
import {
  Destination,
  DestinationInput,
  DESTINATION_TYPES,
  formatVisit,
  latestVisit,
} from '@/types/destination'
import { useToast } from '@/components/Toaster'
import PhotoThumb from '@/components/PhotoThumb'
import { reverseGeocode } from '@/lib/geo/geocode'
import { clusterIcon, getMarkerIcon, pinTilt, tempMarkerIcon, userLocationIcon } from './icons'
import { MapController, ClickCapture } from './MapController'
import GeocodingSearch from './GeocodingSearch'
import AddDestinationDialog, { AddDraft } from './AddDestinationDialog'

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

interface MapComponentProps {
  destinations: Destination[]
  selectedDestination: Destination | null
  onSelectDestination: (destination: Destination | null) => void
  onAddDestination: (destination: DestinationInput) => void
  onMoveDestination: (id: string, latitude: number, longitude: number) => void
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
                      <PhotoThumb
                        photo={destination.photos[0]}
                        alt={destination.name}
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
