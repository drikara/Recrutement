import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { prisma } from "@/lib/prisma" // Utilisez Prisma au lieu de sql direct
import { DashboardHeader } from "@/components/dashboard-header"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function JuryDashboard() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    redirect("/auth/login")
  }

  // Vérification du rôle - utilisez le type correct
  const userRole = (session.user as any).role || "JURY"
  if (userRole !== "JURY") {
    redirect("/auth/login")
  }

  // Get jury member info avec Prisma
  const juryMember = await prisma.juryMember.findFirst({
    where: { 
      userId: session.user.id 
    },
    include: {
      user: {
        select: {
          email: true,
          name: true,
        }
      }
    }
  })

  if (!juryMember) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader user={session.user} role="JURY" />
        <main className="container mx-auto p-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
            <h2 className="text-xl font-bold text-yellow-800 mb-2">Profil Incomplet</h2>
            <p className="text-yellow-700">
              Votre compte n'est pas encore configuré comme membre du jury. Veuillez contacter l'administrateur WFM.
            </p>
          </div>
        </main>
      </div>
    )
  }

  // Get evaluation statistics avec Prisma
  const evaluatedCount = await prisma.faceToFaceScore.groupBy({
    by: ['candidateId'],
    where: {
      juryMemberId: juryMember.id
    },
    _count: {
      candidateId: true
    }
  })

  // Get pending candidates avec Prisma
  const evaluatedCandidateIds = await prisma.faceToFaceScore.findMany({
    where: {
      juryMemberId: juryMember.id
    },
    select: {
      candidateId: true
    },
    distinct: ['candidateId']
  })

  const evaluatedIds = evaluatedCandidateIds.map(score => score.candidateId)

  const pendingCandidates = await prisma.candidate.findMany({
    where: {
      id: {
        notIn: evaluatedIds
      }
    },
    include: {
      session: {
        select: {
          metier: true,
          date: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: 5
  })

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader user={session.user} role="JURY" />
      <main className="container mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Tableau de Bord Jury</h1>
          <p className="text-muted-foreground mt-1">
            {juryMember.fullName} - {juryMember.roleType}
            {juryMember.specialite && ` - ${juryMember.specialite}`}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Évaluations Complétées</p>
                <p className="text-3xl font-bold text-foreground mt-2">{evaluatedCount.length}</p>
              </div>
              <div className="bg-primary/10 text-primary p-3 rounded-lg">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Candidats en Attente</p>
                <p className="text-3xl font-bold text-foreground mt-2">{pendingCandidates.length}</p>
              </div>
              <div className="bg-yellow-100 text-yellow-600 p-3 rounded-lg">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Rôle</p>
                <p className="text-lg font-bold text-foreground mt-2 capitalize">
                  {juryMember.roleType.toLowerCase().replace(/_/g, ' ')}
                </p>
              </div>
              <div className="bg-blue-100 text-blue-600 p-3 rounded-lg">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-foreground">Candidats à Évaluer</h2>
            <Link href="/jury/evaluations">
              <Button variant="outline" size="sm" className="border-border hover:bg-muted bg-transparent">
                Voir tout
              </Button>
            </Link>
          </div>
          <div className="space-y-3">
            {pendingCandidates.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">Aucun candidat en attente d'évaluation</p>
            ) : (
              pendingCandidates.map((candidate) => (
                <div key={candidate.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{candidate.fullName}</p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                      <span>{candidate.metier}</span>
                      <span>•</span>
                      <span>{candidate.age} ans</span>
                      <span>•</span>
                      <span>{candidate.diploma}</span>
                    </div>
                  </div>
                  <Link href={`/jury/evaluations/${candidate.id}`}>
                    <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                      Évaluer
                    </Button>
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Section informations rapides */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">Instructions d'Évaluation</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Évaluez chaque candidat sur une échelle de 0 à 5</li>
            <li>• Phase 1 : Entretien comportemental et motivation</li>
            <li>• Phase 2 : Évaluation technique et connaissances métier</li>
            <li>• Sauvegardez vos évaluations régulièrement</li>
          </ul>
        </div>
      </main>
    </div>
  )
}