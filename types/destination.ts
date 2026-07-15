export type DestinationType =
  | 'city'
  | 'landmark'
  | 'restaurant'
  | 'hotel'
  | 'museum'
  | 'park'
  | 'other'

export interface Destination {
  id: string
  user_id: string
  name: string
  latitude: number
  longitude: number
  type: DestinationType
  visited: boolean
  visit_date: string | null
  notes: string | null
  rating: number | null
  photos: string[]
  tags: string[]
  created_at: string
  updated_at: string
}

// Данни при създаване/редакция — без полетата, които базата генерира
export type DestinationInput = Omit<
  Destination,
  'id' | 'user_id' | 'created_at' | 'updated_at'
>

export const DESTINATION_TYPES: Record<
  DestinationType,
  { label: string; emoji: string; badgeClass: string }
> = {
  city: {
    label: 'Град',
    emoji: '🏙️',
    badgeClass: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  },
  landmark: {
    label: 'Забележителност',
    emoji: '🗿',
    badgeClass: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  },
  restaurant: {
    label: 'Ресторант',
    emoji: '🍽️',
    badgeClass: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  },
  hotel: {
    label: 'Хотел',
    emoji: '🏨',
    badgeClass: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  },
  museum: {
    label: 'Музей',
    emoji: '🏛️',
    badgeClass: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  },
  park: {
    label: 'Парк',
    emoji: '🌳',
    badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
  },
  other: {
    label: 'Друго',
    emoji: '📍',
    badgeClass: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
  },
}

export const DESTINATION_TYPE_KEYS = Object.keys(DESTINATION_TYPES) as DestinationType[]
