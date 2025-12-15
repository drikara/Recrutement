import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { checkSimulationUnlockStatus } from '@/lib/simulation-unlock'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { id } = await params
    const candidateId = parseInt(id)

    if (isNaN(candidateId)) {
      return NextResponse.json({ error: 'ID candidat invalide' }, { status: 400 })
    }

    // Récupérer le métier du candidat
    const { prisma } = await import('@/lib/prisma')
    const candidate = await prisma.candidate.findUnique({
      where: { id: candidateId },
      select: { metier: true }
    })

    if (!candidate) {
      return NextResponse.json({ error: 'Candidat non trouvé' }, { status: 404 })
    }

    const unlockStatus = await checkSimulationUnlockStatus(candidateId, candidate.metier)

    return NextResponse.json(unlockStatus)

  } catch (error) {
    console.error('Erreur vérification déblocage:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}