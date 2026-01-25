import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { updateDestinationSchema, formatZodError } from '@/lib/validations'
import { z } from 'zod'

// UUID validation schema
const uuidSchema = z.string().uuid('Invalid destination ID')

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Validate UUID format
    const idResult = uuidSchema.safeParse(id)
    if (!idResult.success) {
      return NextResponse.json(
        { error: 'Invalid destination ID format' },
        { status: 400 }
      )
    }

    const supabase = await createSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Validate input with Zod
    const result = updateDestinationSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: formatZodError(result.error) },
        { status: 400 }
      )
    }

    const validatedData = result.data

    const { data: destination, error } = await supabase
      .from('destinations')
      .update({
        ...validatedData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', user.id) // Ensure user can only update their own destinations
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: 'Failed to update destination' }, { status: 500 })
    }

    if (!destination) {
      return NextResponse.json({ error: 'Destination not found' }, { status: 404 })
    }

    return NextResponse.json(destination)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Validate UUID format
    const idResult = uuidSchema.safeParse(id)
    if (!idResult.success) {
      return NextResponse.json(
        { error: 'Invalid destination ID format' },
        { status: 400 }
      )
    }

    const supabase = await createSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { error } = await supabase
      .from('destinations')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id) // Ensure user can only delete their own destinations

    if (error) {
      return NextResponse.json({ error: 'Failed to delete destination' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
