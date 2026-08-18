import { describe, expect, it } from 'vitest'
import { Destination, DestinationType } from '../types/destination'
import { badges } from './badges'

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

function badge(destinations: Destination[], id: string) {
  const found = badges(destinations).find((entry) => entry.id === id)
  if (!found) throw new Error(`няма значка ${id}`)
  return found
}

describe('badges', () => {
  it('празната колекция не носи значки, но показва напредък 0', () => {
    for (const entry of badges([])) {
      expect(entry.earned).toBe(false)
      expect(entry.progress.current).toBe(0)
    }
  })

  it('„Първи стъпки“ се печели с първото посетено място', () => {
    expect(badge([makeDestination({ visited: true })], 'first-visit').earned).toBe(true)
    expect(badge([makeDestination({ visited: false })], 'first-visit').earned).toBe(false)
  })

  it('„Междуконтиненталец“ изисква два континента', () => {
    const oneContinent = [
      makeDestination({ visited: true, country_code: 'IT', continent: 'europe' }),
      makeDestination({ visited: true, country_code: 'FR', continent: 'europe' }),
    ]
    expect(badge(oneContinent, 'intercontinental').earned).toBe(false)

    const twoContinents = [
      ...oneContinent,
      makeDestination({ visited: true, country_code: 'JP', continent: 'asia' }),
    ]
    expect(badge(twoContinents, 'intercontinental').earned).toBe(true)
  })

  it('„Дълъг път“ гледа обединеното пътуване, не отделните записи', () => {
    // Две застъпващи се посещения по 8 дни = едно пътуване от 14 дни
    const collection = [
      makeDestination({ visited: true, visits: [{ start: '2026-07-01', end: '2026-07-08' }] }),
      makeDestination({ visited: true, visits: [{ start: '2026-07-07', end: '2026-07-14' }] }),
    ]
    expect(badge(collection, 'long-trip').earned).toBe(true)
  })

  it('„Всеки сезон“ брои сезоните на началните дати', () => {
    const collection = [
      makeDestination({
        visited: true,
        visits: [
          { start: '2026-01-10', end: null }, // зима
          { start: '2026-04-10', end: null }, // пролет
          { start: '2026-07-10', end: null }, // лято
          { start: '2026-10-10', end: null }, // есен
        ],
      }),
    ]
    expect(badge(collection, 'all-seasons').earned).toBe(true)
    expect(badge(collection.slice(0, 0), 'all-seasons').earned).toBe(false)
  })

  it('„Всички типове“ изисква посетено място от всеки тип', () => {
    const types: DestinationType[] = ['city', 'landmark', 'restaurant', 'hotel', 'museum', 'park', 'other']
    const collection = types.map((type) => makeDestination({ visited: true, type }))
    expect(badge(collection, 'all-types').earned).toBe(true)
    expect(badge(collection.slice(1), 'all-types').earned).toBe(false)
  })

  it('напредъкът се ограничава до целта', () => {
    const collection = Array.from({ length: 3 }, () => makeDestination({ visited: true }))
    expect(badge(collection, 'first-visit').progress).toEqual({ current: 1, target: 1 })
  })
})
