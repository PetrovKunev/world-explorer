// Чисти функции за статистиките на таблото. Работят върху вече заредения
// масив от дестинации — без заявки към базата. Географските и времевите
// показатели отчитат само посетените дестинации.

import { Destination, DestinationType, Visit } from '../types/destination'
import { Continent, CONTINENT_COUNTRY_COUNTS, CONTINENTS } from './geo/continents'

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
  countryCodes: string[]
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

const DAY_MS = 86_400_000

const toDateString = (ms: number) => new Date(ms).toISOString().slice(0, 10)

// Извежда пътуванията: посещенията се сортират по начална дата и се
// обединяват, когато периодите им се застъпват или допират (разлика ≤ 1 ден).
// Така екскурзия с 20 отбелязани места е едно пътуване, а дните на път
// не се броят двойно.
export function trips(destinations: Destination[]): Trip[] {
  const ranges = visitedOnly(destinations)
    .flatMap((dest) =>
      (dest.visits ?? []).map((visit) => ({
        start: Date.parse(visit.start),
        end: Date.parse(visit.end || visit.start),
        destId: dest.id,
        countryCode: dest.country_code,
      }))
    )
    .filter((range) => !Number.isNaN(range.start) && !Number.isNaN(range.end))
    .map((range) => (range.end < range.start ? { ...range, end: range.start } : range))
    .sort((a, b) => a.start - b.start)

  const merged: {
    start: number
    end: number
    destIds: Set<string>
    countries: Set<string>
  }[] = []
  for (const range of ranges) {
    const last = merged[merged.length - 1]
    if (last && range.start <= last.end + DAY_MS) {
      last.end = Math.max(last.end, range.end)
      last.destIds.add(range.destId)
      if (range.countryCode) last.countries.add(range.countryCode)
    } else {
      merged.push({
        start: range.start,
        end: range.end,
        destIds: new Set([range.destId]),
        countries: new Set(range.countryCode ? [range.countryCode] : []),
      })
    }
  }

  return merged.map((trip) => ({
    start: toDateString(trip.start),
    end: toDateString(trip.end),
    days: Math.round((trip.end - trip.start) / DAY_MS) + 1,
    placeCount: trip.destIds.size,
    countryCodes: [...trip.countries],
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

// Справка по държави за цялата колекция (вкл. планираните места)
export interface CountryRow {
  country: string
  country_code: string
  places: number
  visitedCount: number
  plannedCount: number
  averageRating: number | null
}

export function countrySummary(destinations: Destination[]): CountryRow[] {
  const rows = new Map<
    string,
    { country: string; places: number; visitedCount: number; ratingSum: number; ratedCount: number }
  >()
  for (const dest of destinations) {
    if (!dest.country_code) continue
    let row = rows.get(dest.country_code)
    if (!row) {
      row = { country: dest.country ?? dest.country_code, places: 0, visitedCount: 0, ratingSum: 0, ratedCount: 0 }
      rows.set(dest.country_code, row)
    }
    row.places++
    if (dest.visited) row.visitedCount++
    if (dest.rating != null) {
      row.ratingSum += dest.rating
      row.ratedCount++
    }
  }
  return [...rows.entries()]
    .map(([country_code, row]) => ({
      country: row.country,
      country_code,
      places: row.places,
      visitedCount: row.visitedCount,
      plannedCount: row.places - row.visitedCount,
      averageRating:
        row.ratedCount > 0 ? Math.round((row.ratingSum / row.ratedCount) * 10) / 10 : null,
    }))
    .sort(
      (a, b) =>
        b.visitedCount - a.visitedCount ||
        b.places - a.places ||
        a.country.localeCompare(b.country, 'bg')
    )
}

// Напредък по континенти: посетени държави спрямо всички в континента.
// Антарктида се показва само ако има посещение там.
export function continentProgress(
  destinations: Destination[]
): { continent: Continent; visitedCountries: number; totalCountries: number }[] {
  const byContinent = new Map<Continent, Set<string>>()
  for (const dest of visitedOnly(destinations)) {
    if (!dest.continent || !dest.country_code) continue
    const set = byContinent.get(dest.continent) ?? new Set<string>()
    set.add(dest.country_code)
    byContinent.set(dest.continent, set)
  }
  return (Object.keys(CONTINENTS) as Continent[])
    .map((continent) => ({
      continent,
      visitedCountries: byContinent.get(continent)?.size ?? 0,
      totalCountries: CONTINENT_COUNTRY_COUNTS[continent],
    }))
    .filter((entry) => entry.continent !== 'antarctica' || entry.visitedCountries > 0)
    .sort((a, b) => b.visitedCountries - a.visitedCountries)
}

// Рекорди

export function longestTrip(destinations: Destination[]): Trip | null {
  return trips(destinations).reduce<Trip | null>(
    (longest, trip) => (longest && longest.days >= trip.days ? longest : trip),
    null
  )
}

// Годината с най-много пътувания; при равенство печели по-новата
export function mostActiveYear(
  destinations: Destination[]
): { year: number; count: number } | null {
  let best: { year: number; count: number } | null = null
  for (const entry of tripsByYear(destinations)) {
    if (entry.count > 0 && (!best || entry.count >= best.count)) best = entry
  }
  return best
}

// Крайни точки на картата сред посетените места
export function extremePoints(destinations: Destination[]): {
  north: Destination
  south: Destination
  east: Destination
  west: Destination
} | null {
  const visited = visitedOnly(destinations)
  if (visited.length === 0) return null
  const pick = (better: (a: Destination, b: Destination) => boolean) =>
    visited.reduce((best, dest) => (better(dest, best) ? dest : best))
  return {
    north: pick((a, b) => a.latitude > b.latitude),
    south: pick((a, b) => a.latitude < b.latitude),
    east: pick((a, b) => a.longitude > b.longitude),
    west: pick((a, b) => a.longitude < b.longitude),
  }
}

// Топ най-високо оценени посетени места
export function topRatedPlaces(destinations: Destination[], limit = 5): Destination[] {
  return visitedOnly(destinations)
    .filter((dest) => dest.rating != null)
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0) || a.name.localeCompare(b.name, 'bg'))
    .slice(0, limit)
}
