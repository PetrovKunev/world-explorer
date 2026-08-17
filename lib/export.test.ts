import { describe, expect, it } from 'vitest'
import { Destination } from '../types/destination'
import { parseImport, toCSV, toGeoJSON, toGPX, toJSON } from './export'

let nextId = 0

function makeDestination(overrides: Partial<Destination> = {}): Destination {
  nextId++
  return {
    id: `id-${nextId}`,
    user_id: 'user-1',
    name: `Място ${nextId}`,
    latitude: 42.7,
    longitude: 23.3,
    type: 'city',
    visited: false,
    visits: [],
    notes: null,
    rating: null,
    photos: [],
    tags: [],
    country: null,
    country_code: null,
    city: null,
    continent: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

describe('toJSON', () => {
  it('изпуска служебните полета', () => {
    const parsed = JSON.parse(toJSON([makeDestination()]))
    expect(parsed).toHaveLength(1)
    expect(parsed[0]).not.toHaveProperty('id')
    expect(parsed[0]).not.toHaveProperty('user_id')
    expect(parsed[0]).not.toHaveProperty('created_at')
    expect(parsed[0].name).toMatch(/^Място/)
  })
})

describe('toCSV', () => {
  it('екранира запетаи и кавички и кодира посещенията', () => {
    const csv = toCSV([
      makeDestination({
        name: 'Име, с "кавички"',
        visited: true,
        visits: [
          { start: '2026-07-23', end: '2026-07-29' },
          { start: '2026-08-01', end: null },
        ],
      }),
    ])
    const [header, row] = csv.split('\r\n')
    expect(header.startsWith('name,latitude')).toBe(true)
    expect(row).toContain('"Име, с ""кавички"""')
    expect(row).toContain('2026-07-23/2026-07-29|2026-08-01')
    expect(row).toContain('да')
  })
})

describe('toGeoJSON', () => {
  it('строи FeatureCollection с [lng, lat] координати', () => {
    const geo = JSON.parse(toGeoJSON([makeDestination({ latitude: 42.7, longitude: 23.3 })]))
    expect(geo.type).toBe('FeatureCollection')
    expect(geo.features[0].geometry.coordinates).toEqual([23.3, 42.7])
    expect(geo.features[0].properties).not.toHaveProperty('latitude')
  })
})

describe('toGPX', () => {
  it('строи валидни waypoint-и с екраниран текст', () => {
    const gpx = toGPX([makeDestination({ name: 'A & B <тест>', notes: 'бележка' })])
    expect(gpx).toContain('<wpt lat="42.7" lon="23.3">')
    expect(gpx).toContain('<name>A &amp; B &lt;тест&gt;</name>')
    expect(gpx).toContain('<desc>бележка</desc>')
  })
})

describe('parseImport', () => {
  it('връща записите от собствения JSON експорт (кръгово)', () => {
    const original = makeDestination({
      name: 'Рим',
      visited: true,
      visits: [{ start: '2025-08-09', end: '2025-08-14' }],
      rating: 5,
      tags: ['история'],
      country: 'Италия',
      country_code: 'IT',
      continent: 'europe',
    })
    const { records, skipped } = parseImport(toJSON([original]))
    expect(skipped).toBe(0)
    expect(records).toHaveLength(1)
    expect(records[0].name).toBe('Рим')
    expect(records[0].visits).toEqual([{ start: '2025-08-09', end: '2025-08-14' }])
    expect(records[0].country_code).toBe('IT')
  })

  it('пропуска невалидните записи и нормализира стойностите', () => {
    const { records, skipped } = parseImport(
      JSON.stringify([
        { name: '', latitude: 1, longitude: 2 },
        { name: 'Без координати' },
        { name: 'Валиден', latitude: '42.7', longitude: '23.3', type: 'непознат', rating: 9 },
      ])
    )
    expect(skipped).toBe(2)
    expect(records).toHaveLength(1)
    expect(records[0].type).toBe('other')
    expect(records[0].rating).toBeNull()
    expect(records[0].visited).toBe(false)
  })

  it('не се чупи от невалиден JSON', () => {
    expect(parseImport('не е json')).toEqual({ records: [], skipped: 0 })
    expect(parseImport('{"а":1}')).toEqual({ records: [], skipped: 0 })
  })
})
