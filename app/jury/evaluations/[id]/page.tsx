import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { prisma } from "@/lib/prisma"
import { DashboardHeader } from "@/components/dashboard-header"
import { JuryScoreForm } from "@/components/jury-score-form"

export default async function JuryEvaluationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    redirect("/auth/login")
  }

  // Vérification du rôle
  const userRole = (session.user as any).role || "JURY"
  if (userRole !== "JURY") {
    redirect("/auth/login")
  }

  // Récupérer le membre du jury avec Prisma
  const juryMember = await prisma.juryMember.findFirst({
    where: { 
      userId: session.user.id 
    }
  })

  if (!juryMember) {
    redirect("/jury/dashboard")
  }

  // Récupérer le candidat avec Prisma
  const candidate = await prisma.candidate.findUnique({
    where: { 
      id: parseInt(id) 
    },
    include: {
      session: {
        select: {
          metier: true,
          date: true,
          jour: true
        }
      },
      scores: {
        select: {
          finalDecision: true
        }
      }
    }
  })

  if (!candidate) {
    redirect("/jury/evaluations")
  }

  // Récupérer les scores existants avec Prisma
  const existingScores = await prisma.faceToFaceScore.findMany({
    where: {
      candidateId: parseInt(id),
      juryMemberId: juryMember.id
    },
    orderBy: {
      phase: 'asc'
    }
  })

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader user={session.user} role="JURY" />
      <main className="container mx-auto p-6 max-w-3xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">Évaluation Face à Face</h1>
          <p className="text-muted-foreground mt-1">
            {candidate.fullName} - {candidate.metier}
          </p>
          {candidate.session && (
            <p className="text-sm text-muted-foreground">
              Session: {candidate.session.metier} - {candidate.session.jour} {candidate.session.date.toLocaleDateString('fr-FR')}
            </p>
          )}
          {candidate.scores?.finalDecision && (
            <p className="text-sm font-medium text-blue-600 mt-1">
              Décision finale: {candidate.scores.finalDecision}
            </p>
          )}
        </div>
        <JuryScoreForm 
          candidate={candidate} 
          juryMember={juryMember} 
          existingScores={existingScores} 
        />
      </main>
    </div>
  )
}