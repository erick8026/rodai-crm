import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'
import { getSession } from '@/lib/auth'
import { randomBytes } from 'crypto'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const sb = getSupabase()
  if (!sb) return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 })

  const body = await req.json()
  const { lead_id, cliente_nombre, cliente_empresa, plan_sku, notas_propuesta, cliente_telefono } = body

  if (!cliente_nombre) return NextResponse.json({ error: 'cliente_nombre requerido' }, { status: 400 })

  const token = randomBytes(16).toString('hex')

  const { data, error } = await sb.from('propuestas').insert({
    token,
    lead_id: lead_id ?? null,
    cliente_nombre,
    cliente_empresa: cliente_empresa ?? '',
    plan_sku: plan_sku ?? 'ROD-PLN-ST-01',
    notas_propuesta: notas_propuesta ?? '',
    cliente_telefono: cliente_telefono ?? '',
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ token: data.token, id: data.id })
}
