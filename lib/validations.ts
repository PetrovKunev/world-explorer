import { z } from 'zod'

// Destination type enum matching database schema
export const destinationTypeSchema = z.enum([
  'city',
  'landmark',
  'restaurant',
  'hotel',
  'museum',
  'park',
  'other'
])

// Schema for creating a new destination
export const createDestinationSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(255, 'Name must be 255 characters or less')
    .trim(),
  latitude: z
    .number()
    .min(-90, 'Latitude must be between -90 and 90')
    .max(90, 'Latitude must be between -90 and 90'),
  longitude: z
    .number()
    .min(-180, 'Longitude must be between -180 and 180')
    .max(180, 'Longitude must be between -180 and 180'),
  type: destinationTypeSchema.default('other'),
  visited: z.boolean().default(false),
  visit_date: z
    .string()
    .datetime()
    .nullable()
    .optional()
    .transform(val => val || undefined),
  notes: z
    .string()
    .max(5000, 'Notes must be 5000 characters or less')
    .nullable()
    .optional()
    .transform(val => val?.trim() || undefined),
  rating: z
    .number()
    .int('Rating must be a whole number')
    .min(1, 'Rating must be between 1 and 5')
    .max(5, 'Rating must be between 1 and 5')
    .nullable()
    .optional()
    .transform(val => val ?? undefined),
  photos: z
    .array(z.string().url('Invalid photo URL'))
    .max(20, 'Maximum 20 photos allowed')
    .default([]),
  tags: z
    .array(z.string().max(50, 'Tag must be 50 characters or less'))
    .max(10, 'Maximum 10 tags allowed')
    .default([]),
})

// Schema for updating a destination (all fields optional)
export const updateDestinationSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(255, 'Name must be 255 characters or less')
    .trim()
    .optional(),
  latitude: z
    .number()
    .min(-90, 'Latitude must be between -90 and 90')
    .max(90, 'Latitude must be between -90 and 90')
    .optional(),
  longitude: z
    .number()
    .min(-180, 'Longitude must be between -180 and 180')
    .max(180, 'Longitude must be between -180 and 180')
    .optional(),
  type: destinationTypeSchema.optional(),
  visited: z.boolean().optional(),
  visit_date: z
    .string()
    .datetime()
    .nullable()
    .optional(),
  notes: z
    .string()
    .max(5000, 'Notes must be 5000 characters or less')
    .nullable()
    .optional(),
  rating: z
    .number()
    .int('Rating must be a whole number')
    .min(1, 'Rating must be between 1 and 5')
    .max(5, 'Rating must be between 1 and 5')
    .nullable()
    .optional(),
  photos: z
    .array(z.string().url('Invalid photo URL'))
    .max(20, 'Maximum 20 photos allowed')
    .optional(),
  tags: z
    .array(z.string().max(50, 'Tag must be 50 characters or less'))
    .max(10, 'Maximum 10 tags allowed')
    .optional(),
})

// Type exports for use in components
export type CreateDestinationInput = z.infer<typeof createDestinationSchema>
export type UpdateDestinationInput = z.infer<typeof updateDestinationSchema>
export type DestinationType = z.infer<typeof destinationTypeSchema>

// Helper to format Zod errors for API responses
export function formatZodError(error: z.ZodError): string {
  return error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
}
