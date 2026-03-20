import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

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
  nuevo:               { label: 'Nuevo',               color: '#3b82f6' },
  en_seguimiento:      { label: 'En seguimiento',      color: '#f59e0b' },
  cotizacion_enviada:  { label: 'Cotización enviada',  color: '#8b5cf6' },
  cerrado_ganado:      { label: 'Cerrado (ganado)',     color: '#10b981' },
  cerrado_perdido:     { label: 'Cerrado (perdido)',    color: '#ef4444' },
}
