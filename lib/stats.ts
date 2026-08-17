// Чисти функции за статистиките на таблото. Работят върху вече заредения
// масив от дестинации — без заявки към базата. Географските и времевите
// показатели отчитат само посетените дестинации.

import { Destination, DestinationType, Visit } from '../types/destination'
import { Continent } from './geo/continents'

// Държави членки на ООН — базата за „% от света“
export const WORLD_COUNTRY_COUNT = 193

export interface OverviewStats {
  total: number
  visitedCount: number
  plannedCount: number
  countryCount: number
  continentCount: number
  worldPercent: number
  tripCount: number
  travelDays: number
  averageRating: number | null
  photoCount: number
  tagCount: number
}

// Едно пътуване: отбелязани посещения със застъпващи се или последователни
// дати, обединени в общ период — независимо колко места обхващат
export interface Trip {
  start: string
  end: string
  days: number
  placeCount: number
}

// Продължителност на посещение в дни (включително); единична дата = 1 ден
export function visitDays(visit: Visit): number {
  if (!visit.end || visit.end === visit.start) return 1
  const start = Date.parse(visit.start)
  const end = Date.parse(visit.end)
  if (Number.isNaN(start) || Number.isNaN(end) || end < start) return 1
  return Math.round((end - start) / 86_400_000) + 1
}

function visitedOnly(destinations: Destination[]): Destination[] {
  return destinations.filter((dest) => dest.visited)
}

function allVisits(destinations: Destination[]): Visit[] {
  return visitedOnly(destinations).flatMap((dest) => dest.visits ?? [])
}

const DAY_MS = 86_400_000

const toDateString = (ms: number) => new Date(ms).toISOString().slice(0, 10)

// Извежда пътуванията: посещенията се сортират по начална дата и се
// обединяват, когато периодите им се застъпват или допират (разлика ≤ 1 ден).
// Така екскурзия с 20 отбелязани места е едно пътуване, а дните на път
// не се броят двойно.
export function trips(destinations: Destination[]): Trip[] {
  const ranges = allVisits(destinations)
    .map((visit) => ({
      start: Date.parse(visit.start),
      end: Date.parse(visit.end || visit.start),
    }))
    .filter((range) => !Number.isNaN(range.start) && !Number.isNaN(range.end))
    .map((range) => (range.end < range.start ? { start: range.start, end: range.start } : range))
    .sort((a, b) => a.start - b.start)

  const merged: { start: number; end: number; placeCount: number }[] = []
  for (const range of ranges) {
    const last = merged[merged.length - 1]
    if (last && range.start <= last.end + DAY_MS) {
      last.end = Math.max(last.end, range.end)
      last.placeCount++
    } else {
      merged.push({ ...range, placeCount: 1 })
    }
  }

  return merged.map((trip) => ({
    start: toDateString(trip.start),
    end: toDateString(trip.end),
    days: Math.round((trip.end - trip.start) / DAY_MS) + 1,
    placeCount: trip.placeCount,
  }))
}

export function overviewStats(destinations: Destination[]): OverviewStats {
  const visited = visitedOnly(destinations)
  const countries = new Set<string>()
  const continents = new Set<Continent>()
  for (const dest of visited) {
    if (dest.country_code) countries.add(dest.country_code)
    if (dest.continent) continents.add(dest.continent)
  }

  const allTrips = trips(destinations)
  const rated = destinations.filter((dest) => dest.rating != null)
  const ratingSum = rated.reduce((sum, dest) => sum + (dest.rating ?? 0), 0)
  const tags = new Set(destinations.flatMap((dest) => dest.tags ?? []))

  return {
    total: destinations.length,
    visitedCount: visited.length,
    plannedCount: destinations.length - visited.length,
    countryCount: countries.size,
    continentCount: continents.size,
    worldPercent: Math.round((countries.size / WORLD_COUNTRY_COUNT) * 100),
    tripCount: allTrips.length,
    travelDays: allTrips.reduce((sum, trip) => sum + trip.days, 0),
    averageRating: rated.length > 0 ? Math.round((ratingSum / rated.length) * 10) / 10 : null,
    photoCount: destinations.reduce((sum, dest) => sum + (dest.photos?.length ?? 0), 0),
    tagCount: tags.size,
  }
}

// Пътувания по година (по началната дата на пътуването), с попълнени
// празни години между първата и последната — честна времева ос без дупки
export function tripsByYear(destinations: Destination[]): { year: number; count: number }[] {
  const counts = new Map<number, number>()
  for (const trip of trips(destinations)) {
    const year = Number(trip.start.slice(0, 4))
    if (!Number.isInteger(year)) continue
    counts.set(year, (counts.get(year) ?? 0) + 1)
  }
  if (counts.size === 0) return []

  const years = [...counts.keys()]
  const result: { year: number; count: number }[] = []
  for (let year = Math.min(...years); year <= Math.max(...years); year++) {
    result.push({ year, count: counts.get(year) ?? 0 })
  }
  return result
}

// Пътувания по календарен месец (1–12) на началната дата, за всички години
export function tripsByMonth(destinations: Destination[]): number[] {
  const counts = new Array(12).fill(0)
  for (const trip of trips(destinations)) {
    const month = Number(trip.start.slice(5, 7))
    if (month >= 1 && month <= 12) counts[month - 1]++
  }
  return counts
}

// Разпределение по тип за цялата колекция (вкл. планираните), низходящо
export function typeDistribution(
  destinations: Destination[]
): { type: DestinationType; count: number }[] {
  const counts = new Map<DestinationType, number>()
  for (const dest of destinations) {
    counts.set(dest.type, (counts.get(dest.type) ?? 0) + 1)
  }
  return [...counts.entries()]
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count)
}

// Топ държави по брой посетени места, низходящо
export function topCountries(
  destinations: Destination[],
  limit = 8
): { country: string; country_code: string; count: number }[] {
  const counts = new Map<string, { country: string; count: number }>()
  for (const dest of visitedOnly(destinations)) {
    if (!dest.country_code) continue
    const entry = counts.get(dest.country_code)
    if (entry) {
      entry.count++
    } else {
      counts.set(dest.country_code, { country: dest.country ?? dest.country_code, count: 1 })
    }
  }
  return [...counts.entries()]
    .map(([country_code, { country, count }]) => ({ country, country_code, count }))
    .sort((a, b) => b.count - a.count || a.country.localeCompare(b.country, 'bg'))
    .slice(0, limit)
}

// Разпределение на оценките: брой дестинации с оценка 1…5
export function ratingDistribution(destinations: Destination[]): number[] {
  const counts = new Array(5).fill(0)
  for (const dest of destinations) {
    if (dest.rating != null && dest.rating >= 1 && dest.rating <= 5) {
      counts[dest.rating - 1]++
    }
  }
  return counts
}
