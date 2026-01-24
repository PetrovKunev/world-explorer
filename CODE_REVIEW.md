# Code Review: World Explorer

This document provides a comprehensive review of the World Explorer codebase with actionable improvement suggestions organized by priority.

---

## Critical Issues

### 1. Excessive Console Logging in Production Code

**Files affected:**
- `hooks/useDestinations.ts` (lines 23, 35, 51-58, 89-96)
- `lib/supabase.ts` (lines 7-9, 36-41)
- `components/MapComponent.tsx` (lines 97-99, 127-132, 149-151, 415-419)

**Problem:** Debug console.log statements throughout the codebase will expose sensitive data (user IDs, coordinates) in production browser consoles and create performance overhead.

**Recommendation:** Remove or wrap in a debug utility:
```typescript
// lib/debug.ts
export const debug = {
  log: (...args: unknown[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(...args)
    }
  }
}
```

---

### 2. API Route Authentication Issue

**Files affected:**
- `app/api/destinations/route.ts`
- `app/api/destinations/[id]/route.ts`

**Problem:** The API routes use `supabase.auth.getUser()` with a singleton client. This won't work correctly in Next.js API routes because the Supabase client needs access to cookies/headers from the request.

**Current code:**
```typescript
const { data: { user }, error: authError } = await supabase.auth.getUser()
```

**Recommendation:** Use `@supabase/ssr` package for server-side auth:
```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )
  // ... rest of handler
}
```

---

### 3. React Hook Dependency Warning

**File:** `hooks/useDestinations.ts` (line 185)

**Problem:** The `useEffect` that calls `fetchDestinations` is missing the function in its dependency array.

**Current code:**
```typescript
useEffect(() => {
  fetchDestinations()
}, [userId])
```

**Recommendation:** Use `useCallback` for the fetch function:
```typescript
const fetchDestinations = useCallback(async () => {
  // ... implementation
}, [userId])

useEffect(() => {
  fetchDestinations()
}, [fetchDestinations])
```

---

## High Priority

### 4. Unused Prisma Setup

**Files affected:**
- `prisma/schema.prisma`
- `lib/prisma.ts`
- `package.json` (prisma dependencies)

**Problem:** Prisma is configured but never used. The app uses Supabase client directly.

**Recommendation:** Either:
- Remove Prisma entirely (`npm uninstall prisma @prisma/client`, delete `prisma/` directory)
- OR use Prisma for server-side operations for better type safety

---

### 5. No Input Validation on API Routes

**File:** `app/api/destinations/route.ts` (line 41)

**Problem:** Limited validation on POST request. No validation on PUT.

**Current validation:**
```typescript
if (!body.name || typeof body.latitude !== 'number' || typeof body.longitude !== 'number') {
  return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
}
```

**Missing validations:**
- Latitude range (-90 to 90)
- Longitude range (-180 to 180)
- Name length limits
- Rating range (1-5)
- Type enum validation
- XSS sanitization for notes/tags

**Recommendation:** Use Zod for schema validation:
```typescript
import { z } from 'zod'

const destinationSchema = z.object({
  name: z.string().min(1).max(255),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  type: z.enum(['city', 'landmark', 'restaurant', 'hotel', 'museum', 'park', 'other']),
  visited: z.boolean().optional(),
  rating: z.number().min(1).max(5).optional(),
  // ...
})
```

---

### 6. No Test Coverage

**Problem:** No testing framework is configured. No unit, integration, or E2E tests.

**Recommendation:** Add testing:
```json
// package.json
{
  "devDependencies": {
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.0.0",
    "vitest": "^1.0.0"
  }
}
```

Priority test cases:
- `useDestinations` hook (CRUD operations)
- API route handlers (auth, validation)
- `DestinationForm` component (form validation)

---

## Medium Priority

### 7. Mixed Language UI

**Files affected:**
- `components/MapComponent.tsx` - Bulgarian UI text (lines 245, 261, 268, 278, 288-294, 311, 322, 327, 343, 353)
- Other components use English

**Examples:**
- "Добави нова дестинация" (Add new destination)
- "Координати на местоположението" (Location coordinates)
- "Отказ" (Cancel)

**Recommendation:** Implement i18n or standardize on one language. Consider `next-intl` for internationalization.

---

### 8. Inconsistent Error Handling

**Problem:** Error handling varies across the codebase:
- Some places set error state
- Some places just console.log
- API routes have different error response formats

**Recommendation:** Create unified error handling:
```typescript
// lib/errors.ts
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message)
  }
}

// Usage in hooks
const [error, setError] = useState<AppError | null>(null)
```

---

### 9. Missing Loading States for Individual Operations

**File:** `hooks/useDestinations.ts`

**Problem:** Only global `loading` state exists. No way to show loading for individual add/update/delete operations.

**Recommendation:** Add operation-specific loading states:
```typescript
const [operationLoading, setOperationLoading] = useState<{
  add: boolean
  update: string | null  // destination ID being updated
  delete: string | null  // destination ID being deleted
}>({ add: false, update: null, delete: null })
```

---

### 10. Deprecated `onKeyPress` Handler

**File:** `components/DestinationForm.tsx` (line 229)

**Problem:** `onKeyPress` is deprecated in React 17+.

**Current code:**
```typescript
onKeyPress={handleKeyPress}
```

**Recommendation:** Use `onKeyDown` instead:
```typescript
onKeyDown={handleKeyDown}
```

---

## Low Priority / Nice to Have

### 11. Type Import Inconsistency

**File:** `app/page.tsx` (line 9)

**Problem:** Imports `Destination` from `@/types/database` but the type is defined in `@/types/destination`.

**Current:**
```typescript
import { Destination } from '@/types/database'
```

**Should be:**
```typescript
import { Destination } from '@/types/destination'
```

---

### 12. Environment Variable Runtime Validation

**File:** `lib/supabase.ts`

**Problem:** Non-null assertions (`!`) used for env vars without runtime validation until after use.

**Recommendation:** Validate at build/startup:
```typescript
// lib/env.ts
const envSchema = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
}

Object.entries(envSchema).forEach(([key, value]) => {
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`)
  }
})

export const env = envSchema as Record<keyof typeof envSchema, string>
```

---

### 13. No Rate Limiting on API Routes

**Problem:** API routes have no rate limiting, making them vulnerable to abuse.

**Recommendation:** Add rate limiting middleware using `@upstash/ratelimit` or similar.

---

### 14. Photo Upload Not Implemented

**Problem:** `photos` field exists in schema but there's no UI or logic to upload photos.

**Recommendation:** Either implement photo upload with Supabase Storage or remove the field to avoid confusion.

---

### 15. Real-time Subscriptions Not Used

**Problem:** Supabase real-time is configured (`lib/supabase.ts` line 28-32) but not used.

**Recommendation:** Either implement real-time updates for multi-device sync or remove the configuration to reduce complexity.

---

## Performance Suggestions

### 16. Map Marker Rendering

**File:** `components/MapComponent.tsx` (line 414)

**Problem:** Console.log inside map iteration logs for every marker on every render.

**Impact:** Significant performance overhead with many destinations.

---

### 17. Consider Virtual Scrolling for Sidebar

**File:** `components/Sidebar.tsx`

**Problem:** All destination cards render at once in the sidebar.

**Recommendation:** For large lists (100+ destinations), implement virtualization using `@tanstack/react-virtual`.

---

## Dependencies to Update

Current versions with known issues or major updates available:

| Package | Current | Recommendation |
|---------|---------|----------------|
| `next` | 14.2.35 | Consider updating to 15.x when stable |
| `autoprefixer` | ^10.4.16 | Move to devDependencies |
| `postcss` | ^8.4.32 | Move to devDependencies |
| `tailwindcss` | ^3.3.6 | Move to devDependencies |
| `node-fetch` | ^3.3.2 | Remove if not used (Next.js has built-in fetch) |

---

## Security Checklist

- [ ] Remove debug console.log statements
- [ ] Add input validation/sanitization
- [ ] Implement rate limiting
- [ ] Add CSRF protection if using forms with API routes
- [ ] Validate coordinate ranges
- [ ] Sanitize user notes/tags for XSS
- [ ] Review RLS policies in Supabase

---

## Summary

| Priority | Issues |
|----------|--------|
| Critical | 3 |
| High | 3 |
| Medium | 4 |
| Low | 5 |

**Recommended first steps:**
1. Remove excessive console.log statements
2. Fix API route authentication
3. Add input validation with Zod
4. Set up basic testing framework
5. Standardize UI language
