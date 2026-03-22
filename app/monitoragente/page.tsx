import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import Sidebar from '@/components/Sidebar'
import MonitorClient from './MonitorClient'

export const dynamic = 'force-dynamic'

export default async function MonitorAgentePage() {
  const session = await getSession()
  if (!session) redirect('/')

  return (
    <div className="flex min-h-screen bg-slate-950">
      <Sidebar />
      <main className="flex-1 p-6 overflow-auto">
        <MonitorClient />
      </main>
    </div>
  )
}
