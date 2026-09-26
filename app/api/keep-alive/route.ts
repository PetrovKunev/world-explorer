import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Дневен ping от Vercel Cron (vercel.json): безплатният план на Supabase
// паузира проекта след 7 дни без активност. Заявката е с anon ключа —
// RLS връща празен резултат, но тя пак стига до Postgres и се брои.

export async function GET(request: NextRequest) {
  // Vercel праща Authorization: Bearer <CRON_SECRET>. Без зададен секрет
  // endpoint-ът е затворен за всички
  const secret = process.env.CRON_SECRET
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )

  const { error } = await supabase.from('destinations').select('id').limit(1)
  if (error) {
    // 500 се вижда в Vercel → Logs като неуспешно изпълнение на cron-а
    console.error('keep-alive: заявката към Supabase се провали', error)
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, at: new Date().toISOString() })
}
