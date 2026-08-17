import { describe, expect, it } from 'vitest'
import { Destination } from '../types/destination'
import {
  overviewStats,
  ratingDistribution,
  topCountries,
  trips,
  tripsByMonth,
  tripsByYear,
  typeDistribution,
  visitDays,
} from './stats'

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

describe('visitDays', () => {
  it('брои единичната дата като 1 ден', () => {
    expect(visitDays({ start: '2026-05-12', end: null })).toBe(1)
    expect(visitDays({ start: '2026-05-12', end: '2026-05-12' })).toBe(1)
  })

  it('брои периода включително', () => {
    expect(visitDays({ start: '2026-05-12', end: '2026-05-15' })).toBe(4)
  })

  it('пази се от невалидни данни', () => {
    expect(visitDays({ start: '2026-05-12', end: '2026-05-01' })).toBe(1)
    expect(visitDays({ start: 'невалидна', end: '2026-05-15' })).toBe(1)
  })
})

describe('trips', () => {
  it('обединява застъпващи се и последователни дати в едно пътуване', () => {
    const result = trips([
      makeDestination({ visited: true, visits: [{ start: '2026-07-23', end: '2026-07-25' }] }),
      makeDestination({ visited: true, visits: [{ start: '2026-07-24', end: '2026-07-27' }] }),
      // Допираща се дата (26-и следва 25-и) също е част от същото пътуване
      makeDestination({ visited: true, visits: [{ start: '2026-07-28', end: null }] }),
    ])
    expect(result).toEqual([
      { start: '2026-07-23', end: '2026-07-28', days: 6, placeCount: 3 },
    ])
  })

  it('разделя посещения с поне един празен ден между тях', () => {
    const result = trips([
      makeDestination({
        visited: true,
        visits: [
          { start: '2025-08-09', end: '2025-08-14' },
          { start: '2026-07-23', end: '2026-07-29' },
        ],
      }),
    ])
    expect(result).toEqual([
      { start: '2025-08-09', end: '2025-08-14', days: 6, placeCount: 1 },
      { start: '2026-07-23', end: '2026-07-29', days: 7, placeCount: 1 },
    ])
  })

  it('пропуска непосетените дестинации и невалидните дати', () => {
    expect(
      trips([
        makeDestination({ visited: false, visits: [{ start: '2026-01-01', end: null }] }),
        makeDestination({ visited: true, visits: [{ start: 'невалидна', end: null }] }),
      ])
    ).toEqual([])
  })
})

describe('overviewStats', () => {
  it('връща нули при празна колекция', () => {
    const stats = overviewStats([])
    expect(stats.total).toBe(0)
    expect(stats.countryCount).toBe(0)
    expect(stats.averageRating).toBeNull()
  })

  it('смята обобщените показатели', () => {
    const stats = overviewStats([
      makeDestination({
        visited: true,
        country_code: 'BG',
        continent: 'europe',
        visits: [{ start: '2026-05-12', end: '2026-05-15' }],
        rating: 5,
        photos: ['a.jpg', 'b.jpg'],
        tags: ['море'],
      }),
      makeDestination({
        visited: true,
        country_code: 'JP',
        continent: 'asia',
        visits: [
          { start: '2025-04-01', end: null },
          { start: '2026-04-01', end: null },
        ],
        rating: 4,
        tags: ['храна', 'море'],
      }),
      makeDestination({ visited: false, country_code: 'FR', continent: 'europe' }),
    ])

    expect(stats.total).toBe(3)
    expect(stats.visitedCount).toBe(2)
    expect(stats.plannedCount).toBe(1)
    // Планираните не се броят за държави и континенти
    expect(stats.countryCount).toBe(2)
    expect(stats.continentCount).toBe(2)
    expect(stats.worldPercent).toBe(1)
    // Три посещения на различни дати = три отделни пътувания
    expect(stats.tripCount).toBe(3)
    expect(stats.travelDays).toBe(4 + 1 + 1)
    expect(stats.averageRating).toBe(4.5)
    expect(stats.photoCount).toBe(2)
    expect(stats.tagCount).toBe(2)
  })

  it('брои посетена дестинация без country_code в бройката, но не и в държавите', () => {
    const stats = overviewStats([makeDestination({ visited: true })])
    expect(stats.visitedCount).toBe(1)
    expect(stats.countryCount).toBe(0)
  })
})

describe('tripsByYear', () => {
  it('попълва празните години между първата и последната', () => {
    const result = tripsByYear([
      makeDestination({
        visited: true,
        visits: [
          { start: '2023-07-01', end: null },
          { start: '2026-01-05', end: null },
          { start: '2026-08-01', end: null },
        ],
      }),
    ])
    expect(result).toEqual([
      { year: 2023, count: 1 },
      { year: 2024, count: 0 },
      { year: 2025, count: 0 },
      { year: 2026, count: 2 },
    ])
  })

  it('брои обиколка с много места като едно пътуване в годината', () => {
    const result = tripsByYear([
      makeDestination({ visited: true, visits: [{ start: '2026-07-23', end: '2026-07-25' }] }),
      makeDestination({ visited: true, visits: [{ start: '2026-07-25', end: '2026-07-29' }] }),
    ])
    expect(result).toEqual([{ year: 2026, count: 1 }])
  })

  it('пропуска непосетените дестинации', () => {
    expect(
      tripsByYear([makeDestination({ visited: false, visits: [{ start: '2026-01-01', end: null }] })])
    ).toEqual([])
  })
})

describe('tripsByMonth', () => {
  it('агрегира по календарен месец за всички години', () => {
    const result = tripsByMonth([
      makeDestination({
        visited: true,
        visits: [
          { start: '2025-05-10', end: null },
          { start: '2026-05-01', end: null },
          { start: '2026-12-24', end: null },
        ],
      }),
    ])
    expect(result[4]).toBe(2) // май
    expect(result[11]).toBe(1) // декември
    expect(result.reduce((a, b) => a + b, 0)).toBe(3)
  })
})

describe('typeDistribution', () => {
  it('сортира низходящо по брой и включва планираните', () => {
    const result = typeDistribution([
      makeDestination({ type: 'museum' }),
      makeDestination({ type: 'city', visited: true }),
      makeDestination({ type: 'city' }),
    ])
    expect(result).toEqual([
      { type: 'city', count: 2 },
      { type: 'museum', count: 1 },
    ])
  })
})

describe('topCountries', () => {
  it('брои само посетените места и реже до лимита', () => {
    const result = topCountries(
      [
        makeDestination({ visited: true, country: 'България', country_code: 'BG' }),
        makeDestination({ visited: true, country: 'България', country_code: 'BG' }),
        makeDestination({ visited: true, country: 'Гърция', country_code: 'GR' }),
        makeDestination({ visited: true, country: 'Италия', country_code: 'IT' }),
        makeDestination({ visited: false, country: 'Франция', country_code: 'FR' }),
      ],
      2
    )
    expect(result).toEqual([
      { country: 'България', country_code: 'BG', count: 2 },
      { country: 'Гърция', country_code: 'GR', count: 1 },
    ])
  })
})

describe('ratingDistribution', () => {
  it('брои дестинациите по оценка 1…5', () => {
    const result = ratingDistribution([
      makeDestination({ rating: 5 }),
      makeDestination({ rating: 5 }),
      makeDestination({ rating: 3 }),
      makeDestination({ rating: null }),
    ])
    expect(result).toEqual([0, 0, 1, 0, 2])
  })
})
