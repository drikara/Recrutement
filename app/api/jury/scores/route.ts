import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { Decimal } from "@prisma/client/runtime/library"

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session || session.user.role !== "JURY") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const data = await request.json()

    // Validation des données
    if (!data.candidate_id || !data.jury_member_id || !data.phase || data.score === undefined) {
      return NextResponse.json({ error: "Données manquantes" }, { status: 400 })
    }

    // Validation du phase (1 ou 2)
    if (data.phase !== 1 && data.phase !== 2) {
      return NextResponse.json({ error: "Phase doit être 1 ou 2" }, { status: 400 })
    }

    // Validation du score (entre 0 et 5)
    const scoreValue = parseFloat(data.score)
    if (isNaN(scoreValue) || scoreValue < 0 || scoreValue > 5) {
      return NextResponse.json({ error: "Score doit être entre 0 et 5" }, { status: 400 })
    }

    // Vérifier que le jury membre appartient à l'utilisateur connecté
    const juryMember = await prisma.juryMember.findUnique({
      where: { 
        id: data.jury_member_id,
        userId: session.user.id // S'assurer que le jury membre appartient à l'utilisateur
      }
    })

    if (!juryMember) {
      return NextResponse.json({ error: "Membre du jury non trouvé" }, { status: 404 })
    }

    // Vérifier que le candidat existe
    const candidate = await prisma.candidate.findUnique({
      where: { id: data.candidate_id }
    })

    if (!candidate) {
      return NextResponse.json({ error: "Candidat non trouvé" }, { status: 404 })
    }

    const score = await prisma.faceToFaceScore.upsert({
      where: {
        candidateId_juryMemberId_phase: {
          candidateId: data.candidate_id,
          juryMemberId: data.jury_member_id,
          phase: data.phase,
        },
      },
      update: {
        score: new Decimal(scoreValue),
        comments: data.comments || null, // Champ optionnel
      },
      create: {
        candidateId: data.candidate_id,
        juryMemberId: data.jury_member_id,
        phase: data.phase,
        score: new Decimal(scoreValue),
        comments: data.comments || null, // Champ optionnel
      },
      include: {
        candidate: {
          select: {
            fullName: true,
            metier: true,
          }
        },
        juryMember: {
          select: {
            fullName: true,
            roleType: true,
          }
        }
      }
    })

    return NextResponse.json(score)
  } catch (error) {
    console.error("Error saving jury score:", error)
    
    // Gestion d'erreurs plus spécifique
    if (error instanceof Error) {
      if (error.message.includes("Foreign key constraint failed")) {
        return NextResponse.json({ error: "Candidat ou membre du jury invalide" }, { status: 400 })
      }
      if (error.message.includes("Unique constraint failed")) {
        return NextResponse.json({ error: "Score déjà existant pour cette combinaison" }, { status: 400 })
      }
    }
    
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}