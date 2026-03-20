import Link from 'next/link'
import { redirect } from 'next/navigation'
import { unstable_noStore as noStore } from 'next/cache'
import { getSession } from '@/lib/auth'
import { getSupabase, ESTADOS, Lead } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'
import DashboardCharts from '@/components/DashboardCharts'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  noStore()
  const session = await getSession()
  if (!session) redirect('/')

  let all: Lead[] = []
  try {
    const sb = getSupabase()
    if (sb) {
      const { data } = await sb.from('leads').select('*').order('created_at', { ascending: false })
      all = data ?? []
    }
  } catch (_) {}

  const total = all.length
  const nuevos = all.filter(l => l.estado === 'nuevo').length
  const enSeguimiento = all.filter(l => l.estado === 'en_seguimiento').length
  const ganados = all.filter(l => l.estado === 'cerrado_ganado').length
  const convRate = total > 0 ? Math.round((ganados / total) * 100) : 0

  const byEstado = Object.entries(ESTADOS).map(([key, val]) => ({
    name: val.label,
    estado: key,
    value: all.filter(l => l.estado === key).length,
    color: val.color,
  })).filter(d => d.value > 0)

  const idiomaCount: Record<string, number> = {}
  all.forEach(l => {
    const lang = l.idioma ?? 'desconocido'
    idiomaCount[lang] = (idiomaCount[lang] ?? 0) + 1
  })
  const byIdioma = Object.entries(idiomaCount).map(([name, value], i) => ({
    name, value, color: ['#3b82f6','#10b981','#f59e0b','#8b5cf6','#ef4444'][i % 5]
  }))

  const recientes = all.slice(0, 5)
  const stats = [
    { label: 'Total leads', value: total, color: 'blue' },
    { label: 'Nuevos', value: nuevos, color: 'indigo' },
    { label: 'En seguimiento', value: enSeguimiento, color: 'amber' },
    { label: 'Tasa conversion', value: `${convRate}%`, color: 'emerald' },
  ]

  const notConfigured = !process.env.NEXT_PUBLIC_SUPABASE_URL

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8 overflow-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Resumen de oportunidades RODAI</p>
        </div>

        {notConfigured && (
          <div className="mb-6 bg-amber-50 border border-amber-200 rounded-2xl p-5 flex gap-3 items-start">
            <svg className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="font-semibold text-amber-800 text-sm">Supabase no configurado</p>
              <p className="text-amber-700 text-sm mt-0.5">Agrega NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY en Vercel Settings &rarr; Environment Variables y redespliega.</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map(s => (
            <div key={s.label} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <p className="text-sm text-gray-500 font-medium">{s.label}</p>
              <p className={`text-3xl font-bold mt-1 text-${s.color}-600`}>{s.value}</p>
            </div>
          ))}
        </div>

        <DashboardCharts byEstado={byEstado} byIdioma={byIdioma} />

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mt-8">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-800">Leads recientes</h2>
            <Link href="/leads" className="text-xs text-blue-600 hover:underline">Ver todos →</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {recientes.length === 0 && (
              <p className="px-6 py-8 text-center text-gray-400 text-sm">
                {notConfigured ? 'Configura Supabase para ver los leads' : 'No hay leads aun'}
              </p>
            )}
            {recientes.map(lead => (
              <Link key={lead.id} href={`/leads?estado=${lead.estado}`}
                className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition block">
                <div>
                  <p className="font-medium text-sm text-gray-800">{lead.nombre || '-'}</p>
                  <p className="text-xs text-gray-400">{lead.empresa || lead.telefono}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-400">{lead.fuente === 'web' ? '🌐 Web' : '📱 WhatsApp'}</span>
                  <span className="px-2.5 py-1 rounded-full text-xs font-medium text-white"
                    style={{ backgroundColor: ESTADOS[lead.estado]?.color ?? '#6b7280' }}>
                    {ESTADOS[lead.estado]?.label ?? lead.estado}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
