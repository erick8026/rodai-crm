import { createClient, SupabaseClient } from '@supabase/supabase-js'

let _supabase: SupabaseClient | null = null

export function getSupabase() {
  if (!_supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) throw new Error('Missing Supabase environment variables')
    _supabase = createClient(url, key)
  }
  return _supabase
}

export type Lead = {
  id: string
  nombre: string
  telefono: string
  correo: string
  empresa: string
  faq_respuestas: string
  idioma: string
  fecha: string
  estado: 'nuevo' | 'en_seguimiento' | 'cotizacion_enviada' | 'cerrado_ganado' | 'cerrado_perdido'
  fuente: 'whatsapp' | 'web'
  notas: string
  created_at: string
  updated_at: string
}

export const ESTADOS: Record<Lead['estado'], { label: string; color: string }> = {
  nuevo:               { label: 'Nuevo',              color: '#3b82f6' },
  en_seguimiento:      { label: 'En seguimiento',     color: '#f59e0b' },
  cotizacion_enviada:  { label: 'Cotizacion enviada', color: '#8b5cf6' },
  cerrado_ganado:      { label: 'Cerrado ganado',     color: '#10b981' },
  cerrado_perdido:     { label: 'Cerrado perdido',    color: '#ef4444' },
}
