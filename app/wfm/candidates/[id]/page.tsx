import { notFound, redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { prisma } from "@/lib/prisma"
import { DashboardHeader } from "@/components/dashboard-header"
import { CandidateDetails } from "@/components/candidates-details"
import { serializeForClient } from "@/lib/server-utils"

interface CandidateDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function CandidateDetailPage({ params }: CandidateDetailPageProps) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session || (session.user as any).role !== "WFM") {
    redirect("/auth/login")
  }

  const { id } = await params

  try {
    // Récupérer le candidat avec TOUTES les données nécessaires
    const candidate = await prisma.candidate.findUnique({
      where: {
        id: parseInt(id),
      },
      include: {
        scores: true,
        session: {
          include: {
            juryPresences: {
              where: { wasPresent: true },
              include: {
                juryMember: {
                  select: { id: true }
                }
              }
            }
          }
        },
        faceToFaceScores: {
          include: {
            juryMember: {
              select: {
                fullName: true,
                roleType: true,
                specialite: true
              }
            }
          },
          orderBy: {
            evaluatedAt: 'desc'
          }
        }
      }
    })

    if (!candidate) {
      notFound()
    }

    // ⭐⭐ CALCULER LE NOMBRE DE JURYS ATTENDUS (présents)
    const expectedJuryCount = candidate.session?.juryPresences.length || 0
    
    // ⭐⭐ RÉCUPÉRER LES IDS DES JURYS PRÉSENTS
    const presentJuryIds = candidate.session?.juryPresences.map(p => p.juryMember.id) || []
    
    // ⭐⭐ COMPTER LE NOMBRE DE JURYS QUI ONT NOTÉ LA PHASE 1
    const phase1Scores = candidate.faceToFaceScores.filter(score => score.phase === 1)
    const uniqueJuryIds = [...new Set(phase1Scores.map(score => score.juryMemberId))]
    const hasAllJuryScores = uniqueJuryIds.length === expectedJuryCount

    console.log('📊 Informations jurys:', {
      candidatId: candidate.id,
      expectedJuryCount,
      presentJuryIds,
      phase1ScoresCount: phase1Scores.length,
      uniqueJuryIds,
      hasAllJuryScores
    })

    // Sérialiser les données
    const serializedCandidate = serializeForClient(candidate)

    // Récupérer les scores existants et les sérialiser
    const existingScores = await prisma.score.findUnique({
      where: { candidateId: parseInt(id) }
    })

    // ⭐ CORRECTION: Sérialiser existingScores aussi
    const serializedExistingScores = existingScores ? serializeForClient(existingScores) : null

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20">
        <DashboardHeader user={session.user} role="WFM" />
        
        <main className="container mx-auto p-6 max-w-7xl">
          <CandidateDetails 
            candidate={serializedCandidate} 
            expectedJuryCount={expectedJuryCount}
            hasAllJuryScores={hasAllJuryScores}
            existingScores={serializedExistingScores}
          />
        </main>
      </div>
    )
  } catch (error) {
    console.error("Error loading candidate details:", error)
    notFound()
  }
}