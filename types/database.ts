export interface Destination {
  id: string
  user_id: string
  name: string
  latitude: number
  longitude: number
  type: 'city' | 'landmark' | 'restaurant' | 'hotel' | 'museum' | 'park' | 'other'
  visited: boolean
  visit_date?: string
  notes?: string
  rating?: number
  photos: string[]
  tags: string[]
  created_at: string
  updated_at: string
}

export interface DestinationFormData {
  name: string
  latitude: number
  longitude: number
  type: Destination['type']
  visited: boolean
  visit_date?: string
  notes?: string
  rating?: number
  tags?: string[]
} 