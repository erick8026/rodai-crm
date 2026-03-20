'use client'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, LabelList,
} from 'recharts'

function fmt(n: number) {
  return n.toLocaleString('es-CR', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

function StatCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color: string }) {
  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-6`}>
      <p className="text-sm text-gray-500 font-medium">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  )
}

function MonthTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-lg px-4 py-3">
      <p className="text-sm font-semibold text-gray-700">{label}</p>
      <p className="text-xl font-bold text-emerald-600">{fmt(payload[0].value)}</p>
    </div>
  )
}

function FunnelTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-lg px-4 py-3">
      <p className="text-sm font-semibold text-gray-700">{label}</p>
      <p className="text-xl font-bold" style={{ color: payload[0].payload.color }}>{fmt(payload[0].value)}</p>
      <p className="text-xs text-gray-400">{payload[0].payload.count} oportunidad{payload[0].payload.count !== 1 ? 'es' : ''}</p>
    </div>
  )
}

export type FunnelItem = { name: string; value: number; count: number; color: string }
export type MonthItem  = { mes: string; ganado: number }
export type ForecastItem = {
  id: string; nombre: string; empresa: string
  valor: number; probabilidad: number; valorPonderado: number
  fechaCierre: string; diasRestantes: number
}

export default function DashboardFinanciero({
  ganado, ganadoMes, pipeline, ponderado, perdidoMes, tasaCierre,
  funnel, porMes, forecast,
}: {
  ganado: number
  ganadoMes: number
  pipeline: number
  ponderado: number
  perdidoMes: number
  tasaCierre: number
  funnel: FunnelItem[]
  porMes: MonthItem[]
  forecast: ForecastItem[]
}) {
  return (
    <div className="space-y-6">

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard label="Ganado (total)" value={fmt(ganado)} color="text-emerald-600" />
        <StatCard label="Ganado este mes" value={fmt(ganadoMes)} color="text-emerald-500" />
        <StatCard label="Pipeline activo" value={fmt(pipeline)} sub="Oportunidades abiertas" color="text-blue-600" />
        <StatCard label="Pipeline ponderado" value={fmt(ponderado)} sub="Ajustado por probabilidad" color="text-indigo-600" />
        <StatCard label="Perdido este mes" value={fmt(perdidoMes)} color="text-red-500" />
        <StatCard label="Tasa de cierre" value={`${tasaCierre}%`} sub="Ganados / (Ganados + Perdidos)" color="text-purple-600" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Funnel por etapa */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-800 mb-1">Pipeline por etapa</h2>
          <p className="text-xs text-gray-400 mb-5">Valor total de oportunidades por estado</p>
          {funnel.every(f => f.value === 0) ? (
            <div className="h-48 flex items-center justify-center text-gray-300 text-sm">Sin datos</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={funnel} layout="vertical" margin={{ top: 0, right: 80, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={false}
                  tickFormatter={v => v >= 1000 ? `$${(v/1000).toFixed(0)}k` : `$${v}`} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: '#374151', fontWeight: 500 }}
                  tickLine={false} axisLine={false} width={120} />
                <Tooltip content={<FunnelTooltip />} cursor={{ fill: '#f9fafb' }} />
                <Bar dataKey="value" maxBarSize={32} radius={[0, 6, 6, 0]}>
                  {funnel.map((e, i) => <Cell key={i} fill={e.color} />)}
                  <LabelList dataKey="value" position="right"
                    formatter={(v: number) => v > 0 ? fmt(v) : ''}
                    style={{ fontSize: 12, fontWeight: 700, fill: '#374151' }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Revenue mensual */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-800 mb-1">Revenue ganado por mes</h2>
          <p className="text-xs text-gray-400 mb-5">Oportunidades cerradas-ganadas (últimos 6 meses)</p>
          {porMes.every(m => m.ganado === 0) ? (
            <div className="h-48 flex items-center justify-center text-gray-300 text-sm">Sin cierres registrados</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={porMes} margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="mes" tick={{ fontSize: 12, fill: '#6b7280' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={false}
                  tickFormatter={v => v >= 1000 ? `$${(v/1000).toFixed(0)}k` : `$${v}`} />
                <Tooltip content={<MonthTooltip />} cursor={{ fill: '#f0fdf4' }} />
                <Bar dataKey="ganado" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={48}>
                  <LabelList dataKey="ganado" position="top"
                    formatter={(v: number) => v > 0 ? fmt(v) : ''}
                    style={{ fontSize: 11, fontWeight: 600, fill: '#059669' }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Forecast table */}
      {forecast.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800">Forecast — próximos 60 días</h2>
            <p className="text-xs text-gray-400 mt-0.5">Oportunidades con fecha de cierre próxima</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-xs text-gray-500 uppercase tracking-wider">
                  <th className="px-6 py-3 font-medium">Cliente</th>
                  <th className="px-6 py-3 font-medium">Valor</th>
                  <th className="px-6 py-3 font-medium">Prob.</th>
                  <th className="px-6 py-3 font-medium">Valor ponderado</th>
                  <th className="px-6 py-3 font-medium">Cierre esperado</th>
                  <th className="px-6 py-3 font-medium">Días</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {forecast.map(f => (
                  <tr key={f.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-3">
                      <p className="font-medium text-gray-800">{f.nombre || '—'}</p>
                      <p className="text-xs text-gray-400">{f.empresa || ''}</p>
                    </td>
                    <td className="px-6 py-3 font-medium text-gray-800">{fmt(f.valor)}</td>
                    <td className="px-6 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        f.probabilidad >= 60 ? 'bg-emerald-100 text-emerald-700' :
                        f.probabilidad >= 30 ? 'bg-amber-100 text-amber-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>{f.probabilidad}%</span>
                    </td>
                    <td className="px-6 py-3 font-semibold text-indigo-700">{fmt(f.valorPonderado)}</td>
                    <td className="px-6 py-3 text-gray-600">{f.fechaCierre}</td>
                    <td className="px-6 py-3">
                      <span className={`font-semibold ${
                        f.diasRestantes <= 7 ? 'text-red-600' :
                        f.diasRestantes <= 30 ? 'text-amber-600' :
                        'text-gray-500'
                      }`}>{f.diasRestantes}d</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-3 border-t border-gray-50 bg-gray-50 flex justify-between text-sm">
            <span className="text-gray-500">Total ponderado forecast:</span>
            <span className="font-bold text-indigo-700">{fmt(forecast.reduce((s, f) => s + f.valorPonderado, 0))}</span>
          </div>
        </div>
      )}
    </div>
  )
}
