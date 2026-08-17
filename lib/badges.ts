// Значки и постижения — изчисляват се от колекцията, без запис в базата.
// Всяка значка има напредък (current/target), за да се вижда колко остава.

import { Destination, DESTINATION_TYPE_KEYS } from '../types/destination'
import { overviewStats, trips } from './stats'

export interface Badge {
  id: string
  emoji: string
  label: string
  description: string
  earned: boolean
  progress: { current: number; target: number }
}

// Сезон по началния месец на пътуването: 0 зима, 1 пролет, 2 лято, 3 есен
function seasonOf(month: number): number {
  if (month === 12 || month <= 2) return 0
  if (month <= 5) return 1
  if (month <= 8) return 2
  return 3
}

export function badges(destinations: Destination[]): Badge[] {
  const stats = overviewStats(destinations)
  const allTrips = trips(destinations)
  const visited = destinations.filter((dest) => dest.visited)

  const visitedTypes = new Set(visited.map((dest) => dest.type))
  const seasons = new Set(
    allTrips
      .map((trip) => Number(trip.start.slice(5, 7)))
      .filter((month) => month >= 1 && month <= 12)
      .map(seasonOf)
  )
  const longestDays = allTrips.reduce((max, trip) => Math.max(max, trip.days), 0)

  const make = (
    id: string,
    emoji: string,
    label: string,
    description: string,
    current: number,
    target: number
  ): Badge => ({
    id,
    emoji,
    label,
    description,
    earned: current >= target,
    progress: { current: Math.min(current, target), target },
  })

  return [
    make('first-visit', '👣', 'Първи стъпки', 'Първото посетено място', stats.visitedCount, 1),
    make('places-50', '🗺️', 'Колекционер', '50 посетени места', stats.visitedCount, 50),
    make('countries-10', '🌍', '10 държави', 'Посетени 10 държави', stats.countryCount, 10),
    make('countries-25', '🌐', '25 държави', 'Посетени 25 държави', stats.countryCount, 25),
    make(
      'intercontinental',
      '✈️',
      'Междуконтиненталец',
      'Посещения на два континента',
      stats.continentCount,
      2
    ),
    make(
      'all-types',
      '🎯',
      'Всички типове',
      'Посетено място от всеки тип',
      visitedTypes.size,
      DESTINATION_TYPE_KEYS.length
    ),
    make('long-trip', '🧳', 'Дълъг път', 'Пътуване от поне 14 дни', longestDays, 14),
    make('all-seasons', '🍂', 'Всеки сезон', 'Пътуване през всеки сезон', seasons.size, 4),
    make('photos-50', '📸', 'Фотоалбум', '50 качени снимки', stats.photoCount, 50),
  ]
}
