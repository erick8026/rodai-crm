import { redirect } from 'next/navigation'
import { unstable_noStore as noStore } from 'next/cache'
import { getSession } from '@/lib/auth'
import { getSupabase } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'
import LeadsTable from '@/components/LeadsTable'
import NewLeadModal from '@/components/NewLeadModal'

export const dynamic = 'force-dynamic'

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string; idioma?: string }>
}) {
  const session = await getSession()
  if (!session) redirect('/')

  noStore()
  const { estado, idioma, fuente } = await searchParams

  let leads: any[] = []
  try {
    const sb = getSupabase()
    if (sb) {
      const { data } = await sb.from('leads').select('*').order('created_at', { ascending: false })
      leads = data ?? []
    }
  } catch (_) {}

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8 overflow-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Oportunidades</h1>
            <p className="text-gray-500 text-sm mt-1">{leads.length} leads registrados</p>
          </div>
          <NewLeadModal />
        </div>
        <LeadsTable leads={leads} initialEstado={estado ?? ''} initialIdioma={idioma ?? ''} initialFuente={fuente ?? ''} />
      </main>
    </div>
  )
}
