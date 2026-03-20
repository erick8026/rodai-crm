import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { supabase, ESTADOS, Lead } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'
import LeadsTable from '@/components/LeadsTable'

export const dynamic = 'force-dynamic'

export default async function LeadsPage() {
  const session = await getSession()
  if (!session) redirect('/')

  const { data } = await supabase
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8 overflow-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Oportunidades</h1>
            <p className="text-gray-500 text-sm mt-1">{data?.length ?? 0} leads registrados</p>
          </div>
        </div>
        <LeadsTable leads={data ?? []} />
      </main>
    </div>
  )
}
