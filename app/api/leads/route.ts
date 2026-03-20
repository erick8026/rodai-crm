import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'
import { getSession } from '@/lib/auth'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await getSupabase()
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const apiKey = req.headers.get('x-api-key')
  const validKey = process.env.CRM_API_KEY ?? 'rodai-n8n-key-2026'
  if (apiKey !== validKey) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { data, error } = await getSupabase().from('leads').upsert({
    telefono:       body.telefono ?? '',
    nombre:         body.nombre ?? '',
    correo:         body.correo ?? '',
    empresa:        body.empresa ?? '',
    faq_respuestas: body.faq_respuestas ?? '',
    idioma:         body.idioma ?? 'espanol',
    fecha:          body.fecha ?? new Date().toLocaleDateString('es-CR'),
    fuente:         body.fuente ?? 'whatsapp',
    estado:         'nuevo',
    notas:          '',
  }, { onConflict: 'telefono' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, data })
}
