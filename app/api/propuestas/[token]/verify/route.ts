import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const sb = getSupabase()
  if (!sb) return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 })

  const { telefono } = await req.json()
  if (!telefono) return NextResponse.json({ valid: false }, { status: 400 })

  const { data } = await sb
    .from('propuestas')
    .select('*')
    .eq('token', token)
    .single()

  if (!data) return NextResponse.json({ valid: false }, { status: 404 })

  // Normalize: remove spaces, dashes, plus signs for comparison
  const normalize = (n: string) => n.replace(/[\s\-\+]/g, '')
  const stored = normalize(data.cliente_telefono ?? '')
  const input  = normalize(telefono)

  if (!stored) {
    // No phone stored — grant access (proposal created before verification was added)
    return NextResponse.json({ valid: true, propuesta: data })
  }

  // Try exact match, then last-8-digits match (handles country code differences)
  const last8 = (n: string) => n.slice(-8)
  const matches = stored === input || last8(stored) === last8(input)

  if (!matches) {
    const hint = stored.length >= 4 ? `···${stored.slice(-4)}` : '····'
    return NextResponse.json({ valid: false, hint })
  }

  // Mark as viewed
  if (!data.visto_at) {
    await sb.from('propuestas').update({ visto_at: new Date().toISOString() }).eq('token', token)
  }

  return NextResponse.json({ valid: true, propuesta: data })
}
