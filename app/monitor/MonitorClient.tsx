'use client'
import { useEffect, useState, useRef } from 'react'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

type Conversacion = {
  id: number
  created_at: string
  workflow_id: string
  workflow_name: string
  exec_id: string
  cliente_telefono: string
  tipo_mensaje: string
  estado: string
  duracion_ms: number
}

type Incidente = {
  id: number
  created_at: string
  workflow_name: string
  node_name: string
  error_message: string
  cliente_telefono: string
  estado: string
  fix_descripcion: string
  tipo_fix: string
}

type WorkflowStat = {
  name: string
  id: string
  hoy: number
  errores: number
  activo: boolean
}

const WORKFLOWS_MONITOREADOS: WorkflowStat[] = [
  { name: 'RODAI AGENTE', id: '51OJSi9yYwgdUdAN', hoy: 0, errores: 0, activo: true },
  { name: 'MAESTRORODAI', id: 'eiOSOwVau1uQJOPF', hoy: 0, errores: 0, activo: true },
  { name: 'Health Check', id: 'kpSCUPFJS3iMRIdw', hoy: 0, errores: 0, activo: true },
  { name: 'Sesiones Atascadas', id: 'PPOSmVW9pMSBFCur', hoy: 0, errores: 0, activo: true },
  { name: 'Error Monitor', id: 'dX2VH2L1BNuj4glq', hoy: 0, errores: 0, activo: true },
]

// Traffic data from real n8n analysis (El Salvador, UTC-6)
const TRAFICO_HORAS = [0,0,0,0,0,0,0,0,1,13,36,0,1,32,27,2,0,13,14,0,41,16,8,46]

function fmt(d: string) {
  return new Date(d).toLocaleTimeString('es-SV', {
    hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'America/El_Salvador'
  })
}

function fmtFecha(d: string) {
  return new Date(d).toLocaleString('es-SV', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'America/El_Salvador'
  })
}

function Dot({ ok }: { ok: boolean }) {
  return (
    <span className={`inline-block w-2 h-2 rounded-full ${ok ? 'bg-emerald-400 animate-pulse' : 'bg-red-500'}`} />
  )
}

function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color: string }) {
  return (
    <div className={`rounded-xl p-5 border ${color}`}>
      <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-3xl font-bold text-white">{value}</p>
      {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
    </div>
  )
}

export default function MonitorClient() {
  const sb = createClient(SUPABASE_URL, SUPABASE_ANON)
  const [conversaciones, setConversaciones] = useState<Conversacion[]>([])
  const [incidentes, setIncidentes] = useState<Incidente[]>([])
  const [connected, setConnected] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [pulsing, setPulsing] = useState(false)
  const feedRef = useRef<HTMLDivElement>(null)

  // Hora actual El Salvador
  const horaSV = new Date().toLocaleString('es-SV', {
    timeZone: 'America/El_Salvador', hour: '2-digit', hour12: false
  })
  const horaActual = parseInt(horaSV)
  const esPico = [20, 21, 23, 10, 13].includes(horaActual)
  const esBajoTrafico = horaActual >= 0 && horaActual <= 8

  // Stats derivados
  const hoy = new Date().toISOString().split('T')[0]
  const convHoy = conversaciones.filter(c => c.created_at.startsWith(hoy)).length
  const erroresHoy = incidentes.filter(i => i.created_at.startsWith(hoy)).length
  const convExitosas = conversaciones.filter(c => c.estado === 'success').length
  const tasaExito = conversaciones.length > 0
    ? Math.round((convExitosas / conversaciones.length) * 100) : 100

  // Pulse animation on new data
  function triggerPulse() {
    setPulsing(true)
    setTimeout(() => setPulsing(false), 600)
  }

  useEffect(() => {
    // Carga inicial
    async function load() {
      const [{ data: conv }, { data: inc }] = await Promise.all([
        sb.from('conversaciones_log').select('*').order('created_at', { ascending: false }).limit(50),
        sb.from('incidentes').select('*').order('created_at', { ascending: false }).limit(20),
      ])
      setConversaciones((conv as Conversacion[]) ?? [])
      setIncidentes((inc as Incidente[]) ?? [])
    }
    load()

    // Suscripción Realtime — conversaciones
    const chanConv = sb
      .channel('conversaciones_live')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'conversaciones_log',
      }, (payload) => {
        setConversaciones(prev => [payload.new as Conversacion, ...prev].slice(0, 50))
        setLastUpdate(new Date())
        triggerPulse()
      })
      .subscribe((status) => {
        setConnected(status === 'SUBSCRIBED')
      })

    // Suscripción Realtime — incidentes
    const chanInc = sb
      .channel('incidentes_live')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'incidentes',
      }, (payload) => {
        setIncidentes(prev => [payload.new as Incidente, ...prev].slice(0, 20))
        setLastUpdate(new Date())
        triggerPulse()
      })
      .subscribe()

    return () => {
      sb.removeChannel(chanConv)
      sb.removeChannel(chanInc)
    }
  }, [])

  const maxTrafico = Math.max(...TRAFICO_HORAS, 1)

  return (
    <div className="max-w-7xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Monitor de Agente</h1>
          <p className="text-slate-400 text-sm">
            {connected
              ? <span className="text-emerald-400">● Tiempo real activo</span>
              : <span className="text-yellow-400">○ Conectando...</span>}
            {' · '}
            <span className="text-slate-500">
              Última actualización: {lastUpdate.toLocaleTimeString('es-SV', { timeZone: 'America/El_Salvador' })}
            </span>
          </p>
        </div>
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all duration-300
          ${esPico
            ? 'bg-red-950 border-red-800 text-red-300'
            : esBajoTrafico
            ? 'bg-emerald-950 border-emerald-800 text-emerald-300'
            : 'bg-slate-800 border-slate-700 text-slate-300'}`}>
          <span className={`w-2 h-2 rounded-full ${esPico ? 'bg-red-400 animate-pulse' : esBajoTrafico ? 'bg-emerald-400' : 'bg-yellow-400'}`} />
          {esPico ? `🔴 Hora pico — ${horaActual}h`
            : esBajoTrafico ? `🟢 Ventana mantenimiento — ${horaActual}h`
            : `🟡 Tráfico normal — ${horaActual}h`}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Conversaciones hoy"
          value={convHoy}
          sub="mensajes procesados"
          color="bg-slate-900 border-slate-700"
        />
        <StatCard
          label="Tasa de éxito"
          value={`${tasaExito}%`}
          sub={`${convExitosas} exitosas`}
          color={tasaExito >= 95
            ? 'bg-emerald-950 border-emerald-800'
            : tasaExito >= 80
            ? 'bg-yellow-950 border-yellow-800'
            : 'bg-red-950 border-red-800'}
        />
        <StatCard
          label="Errores hoy"
          value={erroresHoy}
          sub={erroresHoy === 0 ? 'sin incidentes' : 'requieren revisión'}
          color={erroresHoy === 0
            ? 'bg-slate-900 border-slate-700'
            : 'bg-red-950 border-red-800'}
        />
        <StatCard
          label="Total conversaciones"
          value={conversaciones.length}
          sub="últimas 50 registradas"
          color="bg-slate-900 border-slate-700"
        />
      </div>

      {/* Estado de workflows + Heatmap */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Workflows */}
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">
            Estado de Workflows
          </h2>
          <div className="space-y-3">
            {WORKFLOWS_MONITOREADOS.map(wf => (
              <div key={wf.id} className="flex items-center justify-between py-2 border-b border-slate-800 last:border-0">
                <div className="flex items-center gap-3">
                  <Dot ok={wf.activo} />
                  <span className="text-white text-sm font-medium">{wf.name}</span>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-400">
                  <span>{wf.activo ? '✓ Activo' : '✗ Inactivo'}</span>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-600 mt-3">
            Contadores de hoy se registran cuando n8n comience a loguear conversaciones
          </p>
        </div>

        {/* Heatmap tráfico por hora */}
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">
            Patrón de Tráfico (El Salvador)
          </h2>
          <div className="flex items-end gap-1 h-24">
            {TRAFICO_HORAS.map((val, h) => {
              const pct = val / maxTrafico
              const isCurrent = h === horaActual
              const isPeak = [20, 23, 10, 13].includes(h)
              const isSafe = h >= 0 && h <= 8
              return (
                <div key={h} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className={`w-full rounded-sm transition-all ${
                      isCurrent ? 'bg-blue-400'
                      : isPeak ? 'bg-red-500/70'
                      : isSafe ? 'bg-emerald-600/60'
                      : 'bg-slate-600'
                    }`}
                    style={{ height: `${Math.max(pct * 88, val > 0 ? 4 : 1)}px` }}
                    title={`${h}h: ${val} msgs`}
                  />
                  {h % 4 === 0 && (
                    <span className="text-slate-600 text-[9px]">{h}h</span>
                  )}
                </div>
              )
            })}
          </div>
          <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-blue-400 inline-block"/> Ahora</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-red-500/70 inline-block"/> Pico</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-emerald-600/60 inline-block"/> Mantenimiento seguro</span>
          </div>
          <p className="text-xs text-slate-600 mt-2">
            Ventana de mantenimiento: <span className="text-emerald-500">00h–08h (0 usuarios)</span>
          </p>
        </div>
      </div>

      {/* Feed en tiempo real + Incidentes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Feed conversaciones */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-700 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
              Feed en tiempo real
            </h2>
            <span className={`text-xs px-2 py-1 rounded-full transition-all duration-300 ${
              pulsing ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-400'
            }`}>
              {connected ? '● LIVE' : '○ Conectando'}
            </span>
          </div>
          <div ref={feedRef} className="space-y-2 max-h-80 overflow-y-auto">
            {conversaciones.length === 0 ? (
              <div className="text-center py-12 text-slate-600">
                <p className="text-4xl mb-3">📡</p>
                <p className="text-sm">Esperando conversaciones...</p>
                <p className="text-xs mt-1">Se mostrarán aquí en tiempo real cuando lleguen mensajes</p>
              </div>
            ) : conversaciones.map(c => (
              <div
                key={c.id}
                className={`flex items-start gap-3 p-3 rounded-lg border transition-all ${
                  c.estado === 'error'
                    ? 'bg-red-950/50 border-red-900'
                    : 'bg-slate-800/50 border-slate-700/50'
                }`}
              >
                <span className="text-lg mt-0.5">
                  {c.estado === 'error' ? '❌' : c.tipo_mensaje === 'audio' ? '🎵' : '💬'}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-white text-sm font-medium truncate">
                      {c.cliente_telefono?.replace('@s.whatsapp.net','') || 'Desconocido'}
                    </p>
                    <span className="text-slate-500 text-xs shrink-0">{fmt(c.created_at)}</span>
                  </div>
                  <p className="text-slate-400 text-xs mt-0.5 truncate">
                    {c.workflow_name} · {c.tipo_mensaje || 'mensaje'}
                    {c.duracion_ms ? ` · ${c.duracion_ms}ms` : ''}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Incidentes */}
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
              Incidentes
            </h2>
            {erroresHoy > 0 && (
              <span className="text-xs bg-red-900 text-red-300 px-2 py-0.5 rounded-full">
                {erroresHoy} hoy
              </span>
            )}
          </div>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {incidentes.length === 0 ? (
              <div className="text-center py-12 text-slate-600">
                <p className="text-4xl mb-3">✅</p>
                <p className="text-sm">Sin incidentes</p>
              </div>
            ) : incidentes.map(i => (
              <div key={i.id} className="p-3 bg-slate-800/50 border border-slate-700/50 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                    i.estado === 'resuelto'
                      ? 'bg-emerald-900 text-emerald-300'
                      : i.estado === 'en_revision'
                      ? 'bg-yellow-900 text-yellow-300'
                      : 'bg-red-900 text-red-300'
                  }`}>
                    {i.estado}
                  </span>
                  <span className="text-slate-600 text-xs">{fmtFecha(i.created_at)}</span>
                </div>
                <p className="text-white text-xs font-medium">{i.workflow_name}</p>
                <p className="text-slate-400 text-xs">Nodo: {i.node_name}</p>
                {i.fix_descripcion && (
                  <p className="text-blue-400 text-xs mt-1 italic">
                    🔧 {i.fix_descripcion?.substring(0, 80)}
                  </p>
                )}
                {i.tipo_fix === 'maintenance' && (
                  <p className="text-yellow-500 text-xs mt-1">⏰ Programado 3AM</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SQL info */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
        <p className="text-xs text-slate-500">
          <span className="text-slate-400 font-medium">Nota:</span> Para activar el feed en tiempo real, ejecuta el SQL de creación de tablas en Supabase Dashboard y activa Realtime en las tablas{' '}
          <code className="text-blue-400">conversaciones_log</code> e{' '}
          <code className="text-blue-400">incidentes</code>.
          Los datos llegarán automáticamente cuando n8n registre cada conversación.
        </p>
      </div>
    </div>
  )
}
