// app/api/jury/check-session/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { canJuryMemberAccessCandidate, canJuryEvaluate } from '@/lib/permissions'

// ✅ Type correct pour Next.js 15
interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // ✅ CORRECTION : Await params (obligatoire dans Next.js 15)
    const { id } = await params
    const candidateId = parseInt(id)

    // Validation de l'ID
    if (isNaN(candidateId)) {
      return NextResponse.json({ error: 'ID invalide' }, { status: 400 })
    }

    // Vérifier la session utilisateur
    const session = await auth.api.getSession({
      headers: await headers()
    })

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Récupérer l'utilisateur et son profil jury
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { juryMember: true }
    })

    if (!user || !user.juryMember) {
      return NextResponse.json({ error: 'Jury non trouvé' }, { status: 404 })
    }

    // Récupérer le candidat avec sa session
    const candidate = await prisma.candidate.findUnique({
      where: { id: candidateId },
      include: {
        session: true
      }
    })

    if (!candidate) {
      return NextResponse.json({ error: 'Candidat non trouvé' }, { status: 404 })
    }

    // Vérifier les permissions d'accès
    if (!canJuryMemberAccessCandidate(user.juryMember, candidate)) {
      return NextResponse.json({ 
        canEvaluate: false,
        sessionStatus: candidate.session?.status || 'NO_SESSION',
        message: 'Vous n\'avez pas accès à ce candidat'
      })
    }

    // Vérifier si le candidat a une session
    if (!candidate.session) {
      return NextResponse.json({ 
        canEvaluate: false,
        sessionStatus: 'NO_SESSION',
        message: 'Ce candidat n\'est pas associé à une session'
      })
    }

    // Vérifier si la session permet l'évaluation
    const canEvaluate = canJuryEvaluate(candidate.session)

    return NextResponse.json({
      canEvaluate: canEvaluate,
      sessionStatus: candidate.session.status,
      sessionDate: candidate.session.date,
      message: canEvaluate 
        ? 'Session active - Évaluation autorisée' 
        : 'Session non active - Évaluation non autorisée'
    })

  } catch (error) {
    console.error('Error checking session:', error)
    return NextResponse.json({ 
      error: 'Erreur serveur',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}