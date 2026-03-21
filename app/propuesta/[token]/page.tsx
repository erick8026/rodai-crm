import PropuestaClient from './PropuestaClient'

export const dynamic = 'force-dynamic'

export default async function PropuestaPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  return <PropuestaClient token={token} />
}
