import { createClient, SupabaseClient } from '@supabase/supabase-js'

let _supabase: SupabaseClient | null = null

export function getSupabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  if (typeof window === 'undefined') return createClient(url, key)
  if (!_supabase) _supabase = createClient(url, key)
  return _supabase
}

export type Producto = {
  id: string
  sku: string
  nombre: string
  descripcion: string
  costo: number
  precio_mensual: number
  precio_anual: number
  activo: boolean
  created_at: string
}

export type PaqueteAsignado = {
  id: string
  sku: string
  nombre: string
  precio_mensual: number
  precio_anual: number
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
  fuente: 'whatsapp' | 'web' | 'crm'
  notas: string
  paquetes_contratados: string   // JSON: PaqueteAsignado[]
  frecuencia_pago: 'mensual' | 'anual'
  valor_oportunidad: number
  fecha_cierre_esperada: string | null
  probabilidad: number
  created_at: string
  updated_at: string
}

export const PROBABILIDAD_POR_ESTADO: Record<Lead['estado'], number> = {
  nuevo: 10,
  en_seguimiento: 30,
  cotizacion_enviada: 60,
  cerrado_ganado: 100,
  cerrado_perdido: 0,
}

export const ESTADOS: Record<Lead['estado'], { label: string; color: string }> = {
  nuevo:               { label: 'Nuevo',              color: '#3b82f6' },
  en_seguimiento:      { label: 'En seguimiento',     color: '#f59e0b' },
  cotizacion_enviada:  { label: 'Cotizacion enviada', color: '#8b5cf6' },
  cerrado_ganado:      { label: 'Cerrado ganado',     color: '#10b981' },
  cerrado_perdido:     { label: 'Cerrado perdido',    color: '#ef4444' },
}

export function parsePaquetes(json: string): PaqueteAsignado[] {
  try { return JSON.parse(json || '[]') } catch { return [] }
}

export function calcularValor(paquetes: PaqueteAsignado[], frecuencia: 'mensual' | 'anual'): number {
  return paquetes.reduce((sum, p) => {
    const precio = frecuencia === 'anual'
      ? (p.precio_anual > 0 ? p.precio_anual : p.precio_mensual * 12)
      : p.precio_mensual
    return sum + precio
  }, 0)
}
