// proxy.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getCurrentSession } from '@/lib/session'

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const method = request.method

  console.log('🔍 PROXY - Pathname:', pathname, 'Method:', method)

  // Laisser passer les routes auth et API auth
  if (pathname.startsWith('/api/auth') || pathname.startsWith('/auth/')) {
    console.log('🔓 Auth route bypassed:', pathname)
    return NextResponse.next()
  }

  // Laisser passer les routes static
  if (pathname.startsWith('/_next') || pathname.includes('.')) {
    return NextResponse.next()
  }

  // Redirection depuis /unauthorized
  if (pathname === '/unauthorized') {
    console.log('🔄 Redirecting from /unauthorized')
    const session = await getCurrentSession()
    
    if (session?.user) {
      const redirectPath = session.user.role === 'WFM' 
        ? '/wfm/dashboard' 
        : '/jury/dashboard'
      console.log(`🎯 Redirecting to: ${redirectPath} (role: ${session.user.role})`)
      return NextResponse.redirect(new URL(redirectPath, request.url))
    }
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  try {
    const session = await getCurrentSession()

    // Routes publiques
    if (pathname.startsWith('/auth') || pathname === '/') {
      if (session?.user) {
        // Rediriger les utilisateurs connectés depuis les pages auth
        const redirectPath = session.user.role === 'WFM' 
          ? '/wfm/dashboard' 
          : '/jury/dashboard'
        console.log(`🔄 Redirection depuis auth vers: ${redirectPath}`)
        return NextResponse.redirect(new URL(redirectPath, request.url))
      }
      return NextResponse.next()
    }

    // Vérification de session pour les routes protégées
    if (!session?.user) {
      console.log('❌ No session for:', pathname)
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }

    const userRole = session.user.role

    console.log(`✅ Proxy: ${pathname} - Role: ${userRole} - Email: ${session.user.email}`)

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

    // ⭐ PROTECTION DES API ROUTES - ORDRE IMPORTANT !
    if (pathname.startsWith('/api/')) {
      // 1️⃣ Routes JURY (vérifier EN PREMIER les routes spécifiques)
      if (pathname.startsWith('/api/jury/scores') || pathname.startsWith('/api/jury/check-session')) {
        if (userRole !== 'JURY') {
          console.log(`🚫 API ${pathname} access denied for role: ${userRole}`)
          return NextResponse.json({ error: 'Accès réservé aux membres du jury' }, { status: 403 })
        }
        console.log(`✅ API ${pathname} authorized for JURY`)
        return NextResponse.next()
      }
      
      // 2️⃣ Routes WFM - Gestion des jurys (après avoir vérifié /jury/scores)
      if (pathname.startsWith('/api/jury') && userRole !== 'WFM') {
        console.log(`🚫 API /api/jury (gestion) access denied for role: ${userRole}`)
        return NextResponse.json({ error: 'Accès réservé aux WFM' }, { status: 403 })
      }
      
      // 3️⃣ Routes WFM - Sessions
      if (pathname.startsWith('/api/sessions') && userRole !== 'WFM') {
        console.log(`🚫 API /api/sessions access denied for role: ${userRole}`)
        return NextResponse.json({ error: 'Accès réservé aux WFM' }, { status: 403 })
      }
      
      // 4️⃣ Routes WFM - Candidats
      if (pathname.startsWith('/api/candidates') && userRole !== 'WFM') {
        console.log(`🚫 API /api/candidates access denied for role: ${userRole}`)
        return NextResponse.json({ error: 'Accès réservé aux WFM' }, { status: 403 })
      }
      
      // 5️⃣ Routes WFM - Scores (modification)
      if (pathname.startsWith('/api/scores') && userRole !== 'WFM') {
        console.log(`🚫 API /api/scores access denied for role: ${userRole}`)
        return NextResponse.json({ error: 'Accès réservé aux WFM' }, { status: 403 })
      }
      
      // 6️⃣ Routes WFM - Export
      if (pathname.startsWith('/api/export') && userRole !== 'WFM') {
        console.log(`🚫 API /api/export access denied for role: ${userRole}`)
        return NextResponse.json({ error: 'Accès réservé aux WFM' }, { status: 403 })
      }
      
      // 7️⃣ Routes WFM - Consolidation
      if (pathname.startsWith('/api/consolidation') && userRole !== 'WFM') {
        console.log(`🚫 API /api/consolidation access denied for role: ${userRole}`)
        return NextResponse.json({ error: 'Accès réservé aux WFM' }, { status: 403 })
      }
      
      console.log(`✅ API ${pathname} authorized`)
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