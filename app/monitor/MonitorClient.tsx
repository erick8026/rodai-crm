'use client'
import { useEffect, useState, useRef } from 'react'

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

type ChatbotHealth = {
  id: string
  name: string
  canal: string
  workflowActivo: boolean
  waState: string
  waConectado: boolean
  lastMsgAgo: number | null
  status: 'ok' | 'warning' | 'error'
  problemas: string[]
}

const WORKFLOWS_MONITOREADOS: WorkflowStat[] = [
  { name: 'RODAI AGENTE', id: 'ICNcYJoaRZTqarIE', hoy: 0, errores: 0, activo: true },
  { name: 'MAESTRORODAI', id: 'ulLJOb6ThtbhuTiR', hoy: 0, errores: 0, activo: true },
  { name: 'Health Check', id: 'POPunBI94nnVANLo', hoy: 0, errores: 0, activo: true },
  { name: 'Sesiones Atascadas', id: '7N991ItWRQckpn5U', hoy: 0, errores: 0, activo: true },
  { name: 'Error Monitor', id: 'MrWLoKBThCS7bN3Q', hoy: 0, errores: 0, activo: true },
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
  const [conversaciones, setConversaciones] = useState<Conversacion[]>([])
  const [incidentes, setIncidentes] = useState<Incidente[]>([])
  const [chatbots, setChatbots] = useState<ChatbotHealth[]>([])
  const [connected, setConnected] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [pulsing, setPulsing] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const feedRef = useRef<HTMLDivElement>(null)
  const prevCountRef = useRef(0)

  const horaSV = new Date().toLocaleString('es-SV', {
    timeZone: 'America/El_Salvador', hour: '2-digit', hour12: false
  })
  const horaActual = parseInt(horaSV)
  const esPico = [20, 21, 23, 10, 13].includes(horaActual)
  const esBajoTrafico = horaActual >= 0 && horaActual <= 8

  const hoy = new Date().toISOString().split('T')[0]
  const convHoy = conversaciones.filter(c => c.created_at.startsWith(hoy)).length
  const erroresHoy = incidentes.filter(i => i.created_at.startsWith(hoy)).length
  const convExitosas = conversaciones.filter(c => c.estado === 'success').length
  const tasaExito = conversaciones.length > 0
    ? Math.round((convExitosas / conversaciones.length) * 100) : 100

  function triggerPulse() {
    setPulsing(true)
    setTimeout(() => setPulsing(false), 600)
  }

  async function fetchData() {
    try {
      const res = await fetch('/api/monitor', { cache: 'no-store' })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setFetchError(body.error ?? `Error ${res.status}`)
        setConnected(false)
        return
      }
      const data = await res.json()
      const newCount = (data.conversaciones ?? []).length
      if (newCount > prevCountRef.current) triggerPulse()
      prevCountRef.current = newCount
      setConversaciones(data.conversaciones ?? [])
      setIncidentes(data.incidentes ?? [])
      setChatbots(data.chatbots ?? [])
      setLastUpdate(new Date())
      setConnected(true)
      setFetchError(null)
    } catch {
      setConnected(false)
      setFetchError('Error de conexión al servidor')
    }
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 5000)
    return () => clearInterval(interval)
  }, [])

  const maxTrafico = Math.max(...TRAFICO_HORAS, 1)

  if (fetchError) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="bg-red-950 border border-red-800 rounded-xl p-8 text-center">
          <p className="text-4xl mb-3">⚠️</p>
          <p className="text-red-300 font-semibold">{fetchError}</p>
          <p className="text-slate-400 text-sm mt-2">Verifica la configuración de Supabase en las variables de entorno de Vercel.</p>
          <button
            onClick={fetchData}
            className="mt-4 px-4 py-2 bg-red-800 hover:bg-red-700 text-white rounded-lg text-sm"
          >
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Monitor de Agente</h1>
          <p className="text-slate-400 text-sm">
            {connected
              ? <span className="text-emerald-400">● Actualización cada 5s</span>
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

      {/* Panel salud de chatbots */}
      {chatbots.length > 0 && (
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">
            Estado de Chatbots
          </h2>
          <div className="space-y-3">
            {chatbots.map(bot => (
              <div key={bot.id} className={`rounded-lg border p-4 ${
                bot.status === 'ok' ? 'bg-emerald-950/40 border-emerald-800' :
                bot.status === 'warning' ? 'bg-yellow-950/40 border-yellow-800' :
                'bg-red-950/40 border-red-800'
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className={`w-3 h-3 rounded-full ${
                      bot.status === 'ok' ? 'bg-emerald-400 animate-pulse' :
                      bot.status === 'warning' ? 'bg-yellow-400 animate-pulse' :
                      'bg-red-500'
                    }`} />
                    <span className="text-white font-semibold">{bot.name}</span>
                    <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded">{bot.canal}</span>
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded ${
                    bot.status === 'ok' ? 'bg-emerald-900 text-emerald-300' :
                    bot.status === 'warning' ? 'bg-yellow-900 text-yellow-300' :
                    'bg-red-900 text-red-300'
                  }`}>
                    {bot.status === 'ok' ? '✓ OPERATIVO' : bot.status === 'warning' ? '⚠ ADVERTENCIA' : '✗ NO RESPONDE'}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div className={`rounded p-2 text-center ${bot.workflowActivo ? 'bg-emerald-900/40' : 'bg-red-900/40'}`}>
                    <p className="text-slate-400 mb-1">Workflow n8n</p>
                    <p className={`font-semibold ${bot.workflowActivo ? 'text-emerald-400' : 'text-red-400'}`}>
                      {bot.workflowActivo ? '✓ Activo' : '✗ Inactivo'}
                    </p>
                  </div>
                  <div className={`rounded p-2 text-center ${bot.waConectado ? 'bg-emerald-900/40' : 'bg-red-900/40'}`}>
                    <p className="text-slate-400 mb-1">WhatsApp</p>
                    <p className={`font-semibold ${bot.waConectado ? 'text-emerald-400' : 'text-red-400'}`}>
                      {bot.waConectado ? '✓ Conectado' : `✗ ${bot.waState}`}
                    </p>
                  </div>
                  <div className={`rounded p-2 text-center ${
                    bot.lastMsgAgo === null ? 'bg-slate-800' :
                    bot.lastMsgAgo <= 60 ? 'bg-emerald-900/40' : 'bg-yellow-900/40'
                  }`}>
                    <p className="text-slate-400 mb-1">Último mensaje</p>
                    <p className={`font-semibold ${
                      bot.lastMsgAgo === null ? 'text-slate-400' :
                      bot.lastMsgAgo <= 60 ? 'text-emerald-400' : 'text-yellow-400'
                    }`}>
                      {bot.lastMsgAgo === null ? 'Sin datos' :
                       bot.lastMsgAgo < 60 ? `Hace ${bot.lastMsgAgo}m` :
                       `Hace ${Math.floor(bot.lastMsgAgo/60)}h`}
                    </p>
                  </div>
                </div>
                {bot.problemas.length > 0 && (
                  <div className="mt-3 space-y-1">
                    {bot.problemas.map((p, i) => (
                      <p key={i} className="text-xs text-red-300 flex items-center gap-1">
                        <span>⚠</span> {p}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

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
                <p className="text-xs mt-1">Se mostrarán aquí cuando lleguen mensajes</p>
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
                      {(() => {
                        const raw = c.cliente_telefono || ''
                        if (raw.includes('@lid')) return `ID:${raw.replace('@lid','').slice(-8)}`
                        return raw.replace('@s.whatsapp.net','') || 'Desconocido'
                      })()}
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
    </div>
  )
}
