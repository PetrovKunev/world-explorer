'use client'

import { useEffect, useRef } from 'react'
import { useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import { Destination } from '@/types/destination'

// Първоначално вмества всички дестинации; след това центрира при избор
export function MapController({
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
export function ClickCapture({
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
