export interface Destination {
  id: string
  name: string
  latitude: number
  longitude: number
  type: 'city' | 'landmark' | 'restaurant' | 'hotel' | 'museum' | 'park' | 'other'
  visited: boolean
  visitDate?: string
  notes?: string
  rating?: number
  photos?: string[]
  tags?: string[]
  createdAt: string
  updatedAt: string
}

export interface DestinationFormData {
  name: string
  latitude: number
  longitude: number
  type: Destination['type']
  visited: boolean
  visitDate?: string
  notes?: string
  rating?: number
  tags?: string[]
} 