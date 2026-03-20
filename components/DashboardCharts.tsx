'use client'
import { useRouter } from 'next/navigation'
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, LabelList,
} from 'recharts'

type PieData = { name: string; value: number; color: string; estado?: string }
type BarData = { name: string; value: number; color: string; fuente?: string }

function CustomTooltipPie({ active, payload }: any) {
  if (active && payload?.length) {
    return (
      <div className="bg-white border border-gray-100 rounded-xl shadow-lg px-4 py-3">
        <p className="font-semibold text-sm text-gray-800">{payload[0].name}</p>
        <p className="text-2xl font-bold" style={{ color: payload[0].payload.color }}>{payload[0].value}</p>
        <p className="text-xs text-gray-400 mt-1">Click para filtrar</p>
      </div>
    )
  }
  return null
}

function CustomTooltipBar({ active, payload, label }: any) {
  if (active && payload?.length) {
    return (
      <div className="bg-white border border-gray-100 rounded-xl shadow-lg px-4 py-3">
        <p className="font-semibold text-sm text-gray-800">{label}</p>
        <p className="text-2xl font-bold" style={{ color: payload[0].fill }}>{payload[0].value}</p>
        <p className="text-xs text-gray-400 mt-1">Click para filtrar</p>
      </div>
    )
  }
  return null
}

function PieSection({ title, data, subtitle, onSliceClick }: {
  title: string; data: PieData[]; subtitle?: string
  onSliceClick?: (entry: PieData) => void
}) {
  const total = data.reduce((s, d) => s + d.value, 0)
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="mb-4">
        <h2 className="font-semibold text-gray-800">{title}</h2>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
      {total === 0 ? (
        <div className="h-64 flex items-center justify-center text-gray-300 text-sm">Sin datos</div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={data} cx="50%" cy="50%"
                innerRadius={60} outerRadius={100} paddingAngle={3} dataKey="value"
                onClick={onSliceClick ? (e) => onSliceClick(e as PieData) : undefined}
                style={onSliceClick ? { cursor: 'pointer' } : undefined}
              >
                {data.map((entry, i) => <Cell key={i} fill={entry.color} stroke="transparent" />)}
              </Pie>
              <Tooltip content={<CustomTooltipPie />} />
              <Legend formatter={(v) => <span className="text-xs text-gray-600">{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-2 mt-2">
            {data.map(d => (
              <button key={d.name} onClick={() => onSliceClick?.(d)}
                className={`flex items-center gap-1.5 ${onSliceClick ? 'hover:opacity-70 transition cursor-pointer' : ''}`}>
                <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: d.color }} />
                <span className="text-xs text-gray-500">{d.name}: <strong>{d.value}</strong></span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function HBarSection({ title, data, subtitle, onBarClick }: {
  title: string; data: BarData[]; subtitle?: string
  onBarClick?: (entry: BarData) => void
}) {
  const total = data.reduce((s, d) => s + d.value, 0)

  // Custom bar shape with per-bar color
  const ColoredBar = (props: any) => {
    const { x, y, width, height, index } = props
    const color = data[index]?.color ?? '#6b7280'
    return <rect x={x} y={y} width={width} height={height} fill={color} rx={4} ry={4} style={{ cursor: onBarClick ? 'pointer' : 'default' }} />
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 lg:col-span-2">
      <div className="mb-6">
        <h2 className="font-semibold text-gray-800">{title}</h2>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
      {total === 0 ? (
        <div className="h-40 flex items-center justify-center text-gray-300 text-sm">Sin datos</div>
      ) : (
        <ResponsiveContainer width="100%" height={data.length * 64 + 40}>
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 0, right: 60, left: 20, bottom: 0 }}
            onClick={onBarClick ? (e) => { if (e?.activePayload?.[0]) onBarClick(e.activePayload[0].payload) } : undefined}
            style={onBarClick ? { cursor: 'pointer' } : undefined}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
            <XAxis type="number" tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
            <YAxis
              type="category" dataKey="name"
              tick={{ fontSize: 13, fill: '#374151', fontWeight: 500 }}
              tickLine={false} axisLine={false} width={90}
            />
            <Tooltip content={<CustomTooltipBar />} cursor={{ fill: '#f9fafb' }} />
            <Bar dataKey="value" shape={<ColoredBar />} maxBarSize={40}>
              <LabelList dataKey="value" position="right" style={{ fontSize: 13, fontWeight: 600, fill: '#374151' }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

export default function DashboardCharts({
  byEstado, byIdioma, byFuente,
}: {
  byEstado: PieData[]
  byIdioma: PieData[]
  byFuente: BarData[]
}) {
  const router = useRouter()

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <PieSection
        title="Oportunidades por estado"
        subtitle="Haz clic en un estado para filtrar"
        data={byEstado}
        onSliceClick={(e) => { if (e.estado) router.push(`/leads?estado=${e.estado}`) }}
      />
      <PieSection
        title="Leads por idioma"
        subtitle="Haz clic en un idioma para filtrar"
        data={byIdioma}
        onSliceClick={(e) => router.push(`/leads?idioma=${encodeURIComponent(e.name)}`)}
      />
      <HBarSection
        title="Oportunidades por fuente"
        subtitle="Canal de origen de cada lead"
        data={byFuente}
        onBarClick={(e) => router.push(`/leads?fuente=${e.fuente ?? e.name}`)}
      />
    </div>
  )
}
