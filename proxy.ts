// proxy.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getCurrentSession } from '@/lib/session'

const protectedWFMRoutes = ['/wfm', '/api/wfm']
const protectedJuryRoutes = ['/jury', '/api/jury']

// ⭐ IMPORTANT: Next.js 16 requiert une fonction nommée "proxy"
export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // ⭐ CRUCIAL: Laisser passer TOUTES les routes /api/auth
  if (pathname.startsWith('/api/auth')) {
    console.log('🔓 Auth route bypassed:', pathname)
    return NextResponse.next()
  }

  try {
    const session = await getCurrentSession()

    // Routes publiques
    if (pathname.startsWith('/auth') || pathname === '/') {
      return NextResponse.next()
    }

    // Vérification de session
    if (!session?.user) {
      console.log('❌ No session for:', pathname)
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }

    const userRole = session.user.role

    console.log(`✅ Proxy: ${pathname} - Role: ${userRole}`)

    // Protection routes WFM
    if (protectedWFMRoutes.some(route => pathname.startsWith(route)) && userRole !== 'WFM') {
      return NextResponse.redirect(new URL('/unauthorized', request.url))
    }

    // Protection routes Jury
    if (protectedJuryRoutes.some(route => pathname.startsWith(route)) && userRole !== 'JURY') {
      return NextResponse.redirect(new URL('/unauthorized', request.url))
    }

    return NextResponse.next()
  } catch (error) {
    console.error('❌ Proxy error:', error)
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }
}

export const config = {
  matcher: [
    '/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ]
}