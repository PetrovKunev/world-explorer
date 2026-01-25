import { describe, it, expect } from 'vitest'
import {
  createDestinationSchema,
  updateDestinationSchema,
  destinationTypeSchema,
  formatZodError,
} from '@/lib/validations'

describe('destinationTypeSchema', () => {
  it('accepts valid destination types', () => {
    const validTypes = ['city', 'landmark', 'restaurant', 'hotel', 'museum', 'park', 'other']

    validTypes.forEach((type) => {
      const result = destinationTypeSchema.safeParse(type)
      expect(result.success).toBe(true)
    })
  })

  it('rejects invalid destination types', () => {
    const result = destinationTypeSchema.safeParse('invalid')
    expect(result.success).toBe(false)
  })
})

describe('createDestinationSchema', () => {
  const validDestination = {
    name: 'Eiffel Tower',
    latitude: 48.8584,
    longitude: 2.2945,
    type: 'landmark',
    visited: true,
  }

  it('accepts valid destination data', () => {
    const result = createDestinationSchema.safeParse(validDestination)
    expect(result.success).toBe(true)
  })

  it('applies default values', () => {
    const minimal = {
      name: 'Test Place',
      latitude: 0,
      longitude: 0,
    }
    const result = createDestinationSchema.safeParse(minimal)

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.type).toBe('other')
      expect(result.data.visited).toBe(false)
      expect(result.data.photos).toEqual([])
      expect(result.data.tags).toEqual([])
    }
  })

  it('trims name whitespace', () => {
    const result = createDestinationSchema.safeParse({
      ...validDestination,
      name: '  Eiffel Tower  ',
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.name).toBe('Eiffel Tower')
    }
  })

  it('rejects empty name', () => {
    const result = createDestinationSchema.safeParse({
      ...validDestination,
      name: '',
    })
    expect(result.success).toBe(false)
  })

  it('rejects name over 255 characters', () => {
    const result = createDestinationSchema.safeParse({
      ...validDestination,
      name: 'a'.repeat(256),
    })
    expect(result.success).toBe(false)
  })

  it('rejects latitude below -90', () => {
    const result = createDestinationSchema.safeParse({
      ...validDestination,
      latitude: -91,
    })
    expect(result.success).toBe(false)
  })

  it('rejects latitude above 90', () => {
    const result = createDestinationSchema.safeParse({
      ...validDestination,
      latitude: 91,
    })
    expect(result.success).toBe(false)
  })

  it('rejects longitude below -180', () => {
    const result = createDestinationSchema.safeParse({
      ...validDestination,
      longitude: -181,
    })
    expect(result.success).toBe(false)
  })

  it('rejects longitude above 180', () => {
    const result = createDestinationSchema.safeParse({
      ...validDestination,
      longitude: 181,
    })
    expect(result.success).toBe(false)
  })

  it('accepts boundary latitude values', () => {
    const resultMin = createDestinationSchema.safeParse({
      ...validDestination,
      latitude: -90,
    })
    const resultMax = createDestinationSchema.safeParse({
      ...validDestination,
      latitude: 90,
    })

    expect(resultMin.success).toBe(true)
    expect(resultMax.success).toBe(true)
  })

  it('accepts boundary longitude values', () => {
    const resultMin = createDestinationSchema.safeParse({
      ...validDestination,
      longitude: -180,
    })
    const resultMax = createDestinationSchema.safeParse({
      ...validDestination,
      longitude: 180,
    })

    expect(resultMin.success).toBe(true)
    expect(resultMax.success).toBe(true)
  })

  it('rejects rating below 1', () => {
    const result = createDestinationSchema.safeParse({
      ...validDestination,
      rating: 0,
    })
    expect(result.success).toBe(false)
  })

  it('rejects rating above 5', () => {
    const result = createDestinationSchema.safeParse({
      ...validDestination,
      rating: 6,
    })
    expect(result.success).toBe(false)
  })

  it('rejects non-integer rating', () => {
    const result = createDestinationSchema.safeParse({
      ...validDestination,
      rating: 3.5,
    })
    expect(result.success).toBe(false)
  })

  it('accepts valid rating values 1-5', () => {
    for (let rating = 1; rating <= 5; rating++) {
      const result = createDestinationSchema.safeParse({
        ...validDestination,
        rating,
      })
      expect(result.success).toBe(true)
    }
  })

  it('rejects notes over 5000 characters', () => {
    const result = createDestinationSchema.safeParse({
      ...validDestination,
      notes: 'a'.repeat(5001),
    })
    expect(result.success).toBe(false)
  })

  it('rejects more than 20 photos', () => {
    const result = createDestinationSchema.safeParse({
      ...validDestination,
      photos: Array(21).fill('https://example.com/photo.jpg'),
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid photo URLs', () => {
    const result = createDestinationSchema.safeParse({
      ...validDestination,
      photos: ['not-a-url'],
    })
    expect(result.success).toBe(false)
  })

  it('rejects more than 10 tags', () => {
    const result = createDestinationSchema.safeParse({
      ...validDestination,
      tags: Array(11).fill('tag'),
    })
    expect(result.success).toBe(false)
  })

  it('rejects tags over 50 characters', () => {
    const result = createDestinationSchema.safeParse({
      ...validDestination,
      tags: ['a'.repeat(51)],
    })
    expect(result.success).toBe(false)
  })
})

describe('updateDestinationSchema', () => {
  it('accepts partial updates', () => {
    const result = updateDestinationSchema.safeParse({
      name: 'Updated Name',
    })
    expect(result.success).toBe(true)
  })

  it('accepts empty object (no updates)', () => {
    const result = updateDestinationSchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it('validates fields when provided', () => {
    const result = updateDestinationSchema.safeParse({
      latitude: 200, // Invalid
    })
    expect(result.success).toBe(false)
  })
})

describe('formatZodError', () => {
  it('formats single error correctly', () => {
    const result = createDestinationSchema.safeParse({
      name: '',
      latitude: 0,
      longitude: 0,
    })

    if (!result.success) {
      const formatted = formatZodError(result.error)
      expect(formatted).toContain('name')
    }
  })

  it('formats multiple errors with comma separation', () => {
    const result = createDestinationSchema.safeParse({
      name: '',
      latitude: 200,
      longitude: 200,
    })

    if (!result.success) {
      const formatted = formatZodError(result.error)
      expect(formatted).toContain(',')
      expect(formatted).toContain('latitude')
      expect(formatted).toContain('longitude')
    }
  })
})
