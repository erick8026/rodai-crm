import { NextRequest, NextResponse } from 'next/server'
import { verifySession, COOKIE } from '@/lib/auth'

const PUBLIC = ['/', '/api/auth', '/api/leads']

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Allow login page and public API routes
  if (pathname === '/' || pathname.startsWith('/api/auth')) return NextResponse.next()
  // Allow n8n POST to /api/leads (checked by API key inside the handler)
  if (pathname === '/api/leads' && req.method === 'POST') return NextResponse.next()
  // Allow public proposal pages (phone verification acts as the key)
  if (pathname.startsWith('/propuesta/')) return NextResponse.next()
  if (pathname.startsWith('/api/propuestas/')) return NextResponse.next()

  const token = req.cookies.get(COOKIE)?.value
  if (!token) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  const session = await verifySession(token)
  if (!session) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
