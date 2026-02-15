import { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { Statut } from '@prisma/client'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session || (session.user as any).role !== "WFM") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const data = await request.json()
    console.log(" PATCH /api/scores/[id] - Données reçues:", data)

    const statut = data.statut as Statut
    const statutCommentaire = data.statutCommentaire || ''

    if (!statut || (statut !== 'PRESENT' && statut !== 'ABSENT')) {
      return NextResponse.json(
        { error: "Statut invalide. Doit être 'PRESENT' ou 'ABSENT'" },
        { status: 400 }
      )
    }

    // Vérifier que le candidat existe
    const candidate = await prisma.candidate.findUnique({
      where: { id: parseInt(id) }
    })

    if (!candidate) {
      return NextResponse.json(
        { error: "Candidat non trouvé" },
        { status: 404 }
      )
    }

    // UPSERT : Créer ou mettre à jour le score
    const score = await prisma.score.upsert({
      where: { candidateId: parseInt(id) },
      update: {
        statut,
        statutCommentaire,
        evaluatedBy: session.user.name || 'WFM_JURY',
        updatedAt: new Date(),
        // IMPORTANT : Pour un absent, on met toutes les décisions à null
        phase1FfDecision: statut === 'ABSENT' ? null : undefined,
        phase1Decision: statut === 'ABSENT' ? null : undefined,
        decisionTest: statut === 'ABSENT' ? null : undefined,
        finalDecision: statut === 'ABSENT' ? null : undefined, // null pour absent
      },
      create: {
        candidateId: parseInt(id),
        statut,
        statutCommentaire,
        //  IMPORTANT : Pour un nouveau score d'absent, toutes les décisions sont null
        phase1FfDecision: null,
        phase1Decision: null,
        decisionTest: null,
        finalDecision: null, //  null pour absent
        evaluatedBy: session.user.name || 'WFM_JURY',
      },
    })

    console.log("✅ Score mis à jour/créé pour statut:", score)

    return NextResponse.json({
      score,
      message: `Candidat marqué comme ${statut === 'PRESENT' ? 'Présent' : 'Absent'}`
    })

  } catch (error) {
    console.error("❌ Erreur PATCH /api/scores/[id]:", error)
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour du statut" },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const score = await prisma.score.findUnique({
      where: { candidateId: parseInt(id) },
      include: {
        candidate: {
          include: {
            session: true,
            faceToFaceScores: {
              include: {
                juryMember: true
              }
            }
          }
        }
      }
    })

    if (!score) {
      return NextResponse.json(null)
    }

    return NextResponse.json(score)

  } catch (error) {
    console.error("❌ Erreur GET /api/scores/[id]:", error)
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    )
  }
}