import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Proxy към Nominatim: браузърът не може да прати идентифициращ
// User-Agent (изискване на usage policy), а тук добавяме и кеш —
// еднаквите заявки не стигат повторно до Nominatim цяло денонощие.

const USER_AGENT = 'world-explorer (github.com/PetrovKunev/world-explorer)'

export async function GET(request: NextRequest) {
  // Само за влезли потребители — иначе публичният endpoint може да се
  // ползва като отворен proxy към Nominatim
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const params = request.nextUrl.searchParams
  const query = params.get('q')
  const lat = Number(params.get('lat'))
  const lng = Number(params.get('lng'))

  let target: string
  if (query?.trim()) {
    target = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&accept-language=bg&q=${encodeURIComponent(query.trim())}`
  } else if (Number.isFinite(lat) && Number.isFinite(lng)) {
    target = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&accept-language=bg&zoom=18&lat=${lat}&lon=${lng}`
  } else {
    return NextResponse.json({ error: 'bad request' }, { status: 400 })
  }

  try {
    const response = await fetch(target, {
      headers: { 'User-Agent': USER_AGENT },
      next: { revalidate: 86_400 },
      signal: AbortSignal.timeout(8000),
    })
    if (!response.ok) {
      return NextResponse.json({ error: 'geocoding failed' }, { status: 502 })
    }
    return NextResponse.json(await response.json())
  } catch {
    return NextResponse.json({ error: 'geocoding failed' }, { status: 502 })
  }
}
