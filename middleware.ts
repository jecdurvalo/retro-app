import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { AUTH_COOKIE_NAME } from '@/lib/auth'

// Telas públicas (não exigem login): "/" (landing), "/retro" (board pra responder
// pelo celular) e "/team" (entrada do time). Tudo o mais é cockpit de liderança.
const PUBLIC_PATHS = ['/', '/retro', '/team']

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some(path => pathname === path || pathname.startsWith(`${path}/`))
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (
    isPublicPath(pathname) ||
    pathname === '/login' ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next()
  }

  const isAuthenticated = request.cookies.get(AUTH_COOKIE_NAME)?.value === '1'
  if (isAuthenticated) return NextResponse.next()

  const loginUrl = new URL('/login', request.url)
  loginUrl.searchParams.set('next', pathname)
  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
