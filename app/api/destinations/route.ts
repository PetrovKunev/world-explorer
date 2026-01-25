import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: destinations, error } = await supabase
      .from('destinations')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch destinations' }, { status: 500 })
    }

    return NextResponse.json(destinations || [])
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Validate required fields
    if (!body.name || typeof body.latitude !== 'number' || typeof body.longitude !== 'number') {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const { data: destination, error } = await supabase
      .from('destinations')
      .insert([{
        ...body,
        user_id: user.id,
        photos: body.photos || [],
        tags: body.tags || []
      }])
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: 'Failed to create destination' }, { status: 500 })
    }

    return NextResponse.json(destination)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
