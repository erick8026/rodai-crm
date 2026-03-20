'use client'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'

type PieData = { name: string; value: number; color: string }

function CustomTooltip({ active, payload }: any) {
  if (active && payload?.length) {
    return (
      <div className="bg-white border border-gray-100 rounded-xl shadow-lg px-4 py-3">
        <p className="font-semibold text-sm text-gray-800">{payload[0].name}</p>
        <p className="text-2xl font-bold" style={{ color: payload[0].payload.color }}>
          {payload[0].value}
        </p>
      </div>
    )
  }
  return null
}

function PieSection({ title, data, subtitle }: { title: string; data: PieData[]; subtitle?: string }) {
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
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={3}
                dataKey="value"
              >
                {data.map((entry, i) => (
                  <Cell key={i} fill={entry.color} stroke="transparent" />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                formatter={(value) => <span className="text-xs text-gray-600">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
          {/* Center total */}
          <div className="flex flex-wrap gap-2 mt-2">
            {data.map(d => (
              <div key={d.name} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: d.color }} />
                <span className="text-xs text-gray-500">{d.name}: <strong>{d.value}</strong></span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default function DashboardCharts({ byEstado, byIdioma }: { byEstado: PieData[]; byIdioma: PieData[] }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <PieSection
        title="Oportunidades por estado"
        subtitle="Distribución del pipeline actual"
        data={byEstado}
      />
      <PieSection
        title="Leads por idioma"
        subtitle="Origen de conversaciones"
        data={byIdioma}
      />
    </div>
  )
}
