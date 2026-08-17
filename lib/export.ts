// Експорт и импорт на колекцията — застраховка срещу заключване на данните.
// Чисти функции низ ↔ данни; изтеглянето/качването е в компонентите.

import { Destination, DestinationInput, DESTINATION_TYPE_KEYS, Visit } from '../types/destination'

// Полетата, които имат смисъл извън приложението (без id/user_id/timestamps)
function exportRecord(dest: Destination) {
  return {
    name: dest.name,
    latitude: dest.latitude,
    longitude: dest.longitude,
    type: dest.type,
    visited: dest.visited,
    visits: dest.visits ?? [],
    notes: dest.notes,
    rating: dest.rating,
    tags: dest.tags ?? [],
    photos: dest.photos ?? [],
    country: dest.country,
    country_code: dest.country_code,
    city: dest.city,
    continent: dest.continent,
  }
}

export function toJSON(destinations: Destination[]): string {
  return JSON.stringify(destinations.map(exportRecord), null, 2)
}

function csvCell(value: unknown): string {
  const text = value == null ? '' : String(value)
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

// Посещенията са „start/end“, няколко посещения се разделят с „|“
function visitsCell(visits: Visit[]): string {
  return visits
    .map((visit) => (visit.end && visit.end !== visit.start ? `${visit.start}/${visit.end}` : visit.start))
    .join('|')
}

export function toCSV(destinations: Destination[]): string {
  const header = [
    'name', 'latitude', 'longitude', 'type', 'visited', 'visits', 'notes',
    'rating', 'tags', 'country', 'country_code', 'city', 'continent',
  ]
  const rows = destinations.map((dest) =>
    [
      dest.name,
      dest.latitude,
      dest.longitude,
      dest.type,
      dest.visited ? 'да' : 'не',
      visitsCell(dest.visits ?? []),
      dest.notes,
      dest.rating,
      (dest.tags ?? []).join('|'),
      dest.country,
      dest.country_code,
      dest.city,
      dest.continent,
    ]
      .map(csvCell)
      .join(',')
  )
  return [header.join(','), ...rows].join('\r\n')
}

export function toGeoJSON(destinations: Destination[]): string {
  return JSON.stringify(
    {
      type: 'FeatureCollection',
      features: destinations.map((dest) => {
        const { latitude, longitude, ...properties } = exportRecord(dest)
        return {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [longitude, latitude] },
          properties,
        }
      }),
    },
    null,
    2
  )
}

function xmlEscape(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function toGPX(destinations: Destination[]): string {
  const waypoints = destinations
    .map((dest) => {
      const parts = [
        `  <wpt lat="${dest.latitude}" lon="${dest.longitude}">`,
        `    <name>${xmlEscape(dest.name)}</name>`,
      ]
      if (dest.notes) parts.push(`    <desc>${xmlEscape(dest.notes)}</desc>`)
      parts.push(`    <type>${xmlEscape(dest.type)}</type>`, '  </wpt>')
      return parts.join('\n')
    })
    .join('\n')
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<gpx version="1.1" creator="World Explorer" xmlns="http://www.topografix.com/GPX/1/1">',
    waypoints,
    '</gpx>',
    '',
  ].join('\n')
}

// Импорт от JSON експорта на приложението. Връща валидните записи,
// нормализирани до DestinationInput, и броя пропуснати
export function parseImport(json: string): { records: DestinationInput[]; skipped: number } {
  let data: unknown
  try {
    data = JSON.parse(json)
  } catch {
    return { records: [], skipped: 0 }
  }
  if (!Array.isArray(data)) return { records: [], skipped: 0 }

  const records: DestinationInput[] = []
  let skipped = 0

  for (const item of data) {
    const raw = item as Record<string, unknown>
    const name = typeof raw?.name === 'string' ? raw.name.trim() : ''
    const latitude = Number(raw?.latitude)
    const longitude = Number(raw?.longitude)
    const validCoords =
      Number.isFinite(latitude) && Math.abs(latitude) <= 90 &&
      Number.isFinite(longitude) && Math.abs(longitude) <= 180

    if (!name || !validCoords) {
      skipped++
      continue
    }

    const type = DESTINATION_TYPE_KEYS.includes(raw.type as never)
      ? (raw.type as DestinationInput['type'])
      : 'other'
    const visits = (Array.isArray(raw.visits) ? raw.visits : [])
      .filter(
        (visit): visit is Visit =>
          typeof (visit as Visit)?.start === 'string' &&
          ((visit as Visit).end == null || typeof (visit as Visit).end === 'string')
      )
      .map((visit) => ({ start: visit.start, end: visit.end ?? null }))
    const rating = Number(raw.rating)
    const strings = (value: unknown) =>
      Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === 'string') : []
    const text = (value: unknown) => (typeof value === 'string' && value ? value : null)

    records.push({
      name,
      latitude,
      longitude,
      type,
      visited: raw.visited === true,
      visits,
      notes: text(raw.notes),
      rating: Number.isInteger(rating) && rating >= 1 && rating <= 5 ? rating : null,
      tags: strings(raw.tags),
      photos: strings(raw.photos),
      country: text(raw.country),
      country_code: text(raw.country_code),
      city: text(raw.city),
      continent: text(raw.continent) as DestinationInput['continent'],
    })
  }

  return { records, skipped }
}
