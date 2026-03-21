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

  if (!stored || stored !== input) {
    return NextResponse.json({ valid: false })
  }

  // Mark as viewed
  if (!data.visto_at) {
    await sb.from('propuestas').update({ visto_at: new Date().toISOString() }).eq('token', token)
  }

  return NextResponse.json({ valid: true, propuesta: data })
}
