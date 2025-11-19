// proxy.ts - VERSION SIMPLIFIÉE
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getCurrentSession } from '@/lib/session'

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  console.log('🔍 PROXY - Pathname:', pathname, 'Method:', request.method)

  // ⭐ CORRECTION : Laisser passer les routes API sans redirection
  if (pathname.startsWith('/api')) {
    // Laisser passer les routes auth
    if (pathname.startsWith('/api/auth')) {
      return NextResponse.next()
    }

    try {
      const session = await getCurrentSession()

      if (!session?.user) {
        console.log('❌ No session for API route:', pathname)
        // Pour les APIs, retourner une erreur JSON au lieu de rediriger
        return NextResponse.json(
          { error: "Non authentifié" }, 
          { status: 401 }
        )
      }

      console.log(`✅ API Proxy: ${pathname} - Role: ${(session.user as any).role}`)

      // Vérification des rôles pour les routes protégées
      if (pathname.startsWith('/api/wfm') && (session.user as any).role !== 'WFM') {
        return NextResponse.json(
          { error: "Accès non autorisé" }, 
          { status: 403 }
        )
      }

      return NextResponse.next()
    } catch (error) {
      console.error('❌ Proxy API error:', error)
      return NextResponse.json(
        { error: "Erreur d'authentification" }, 
        { status: 500 }
      )
    }
  }

  // Redirection depuis /unauthorized
  if (pathname === '/unauthorized') {
    console.log('🔄 Redirecting from /unauthorized')
    const session = await getCurrentSession()
    
    if (session?.user) {
      const redirectPath = (session.user as any).role === 'WFM' 
        ? '/wfm/dashboard' 
        : '/jury/dashboard'
      console.log(`🎯 Redirecting to: ${redirectPath}`)
      return NextResponse.redirect(new URL(redirectPath, request.url))
    }
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  try {
    const session = await getCurrentSession()

    // Routes publiques
    if (pathname.startsWith('/auth') || pathname === '/') {
      return NextResponse.next()
    }

    // Vérification de session pour les routes protégées
    if (!session?.user) {
      console.log('❌ No session for:', pathname)
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }

    const userRole = (session.user as any).role

    console.log(`✅ Proxy: ${pathname} - Role: ${userRole}`)

    // Protection routes WFM
    if (pathname.startsWith('/wfm') && userRole !== 'WFM') {
      console.log(`🚫 WFM route access denied for role: ${userRole}`)
      return NextResponse.redirect(new URL('/unauthorized', request.url))
    }

    // Protection routes Jury
    if (pathname.startsWith('/jury') && userRole !== 'JURY') {
      console.log(`🚫 Jury route access denied for role: ${userRole}`)
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
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ]
}