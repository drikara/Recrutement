import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { prisma } from "@/lib/prisma"
import { DashboardHeader } from "@/components/dashboard-header"
import { JuryEvaluationsList } from "@/components/jury-evaluations-list"

export default async function JuryEvaluationsPage() {
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
    },
    include: {
      user: {
        select: {
          name: true,
          email: true
        }
      }
    }
  })

  if (!juryMember) {
    redirect("/jury/dashboard")
  }

  // Récupérer tous les candidats avec leurs scores pour ce jury
  const candidates = await prisma.candidate.findMany({
    include: {
      session: {
        select: {
          metier: true,
          date: true
        }
      },
      scores: {
        select: {
          finalDecision: true,
          callStatus: true
        }
      },
      faceToFaceScores: {
        where: {
          juryMemberId: juryMember.id
        },
        select: {
          phase: true,
          score: true,
          evaluatedAt: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  // Formater les données pour le composant avec conversion Decimal → Number
  const formattedCandidates = candidates.map(candidate => {
    const myScores = candidate.faceToFaceScores
    const phase1Score = myScores.find(score => score.phase === 1)
    const phase2Score = myScores.find(score => score.phase === 2)

    // Conversion correcte de Decimal en number avec gestion des valeurs nulles
    const myScore = phase1Score || phase2Score ? {
      score: phase1Score?.score ? Number(phase1Score.score) : 
             phase2Score?.score ? Number(phase2Score.score) : 0,
      phase: phase1Score ? 1 : 2,
      evaluatedAt: phase1Score?.evaluatedAt || phase2Score?.evaluatedAt || new Date()
    } : null

    return {
      id: candidate.id,
      fullName: candidate.fullName,
      metier: candidate.metier,
      age: candidate.age,
      diploma: candidate.diploma,
      location: candidate.location,
      availability: candidate.availability,
      interviewDate: candidate.interviewDate,
      session: candidate.session,
      scores: candidate.scores,
      myScore: myScore,
      evaluationStatus: myScores.length === 0 ? 'not_evaluated' : 
                       myScores.length === 1 ? 'phase1_only' : 
                       'both_phases'
    }
  })

  // Calcul des statistiques
  const totalCandidates = formattedCandidates.length
  const evaluatedCount = formattedCandidates.filter(c => c.myScore).length
  const pendingCount = formattedCandidates.filter(c => !c.myScore).length

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader user={session.user} role="JURY" />
      <main className="container mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Mes Évaluations</h1>
          <p className="text-muted-foreground mt-1">
            {juryMember.fullName} - {juryMember.roleType}
            {juryMember.specialite && ` - Spécialité: ${juryMember.specialite}`}
          </p>
        </div>
        
        {/* Statistiques rapides */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-card border border-border rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-foreground">
              {totalCandidates}
            </div>
            <div className="text-sm text-muted-foreground">Total Candidats</div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {evaluatedCount}
            </div>
            <div className="text-sm text-muted-foreground">Évaluations Complétées</div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {pendingCount}
            </div>
            <div className="text-sm text-muted-foreground">En Attente d'Évaluation</div>
          </div>
        </div>

        {/* Filtres rapides */}
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={() => {/* Implémentez la logique de filtrage si nécessaire */}}
            className="px-3 py-1 text-sm bg-primary text-primary-foreground rounded-full"
          >
            Tous ({totalCandidates})
          </button>
          <button 
            onClick={() => {/* Implémentez la logique de filtrage si nécessaire */}}
            className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-full"
          >
            Évalués ({evaluatedCount})
          </button>
          <button 
            onClick={() => {/* Implémentez la logique de filtrage si nécessaire */}}
            className="px-3 py-1 text-sm bg-yellow-100 text-yellow-700 rounded-full"
          >
            En attente ({pendingCount})
          </button>
        </div>

        {/* Liste des évaluations */}
        <JuryEvaluationsList 
          candidates={formattedCandidates} 
          juryMemberId={juryMember.id} 
        />

        {/* Instructions pour les jurys */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">Guide d'Évaluation</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-700">
            <div>
              <h4 className="font-medium mb-2">Phase 1 - Entretien Comportemental</h4>
              <ul className="space-y-1">
                <li>• Présentation et communication (20%)</li>
                <li>• Motivation et attitude (30%)</li>
                <li>• Réponses aux questions RH (50%)</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Phase 2 - Évaluation Technique</h4>
              <ul className="space-y-1">
                <li>• Connaissances techniques du métier (40%)</li>
                <li>• Résolution de cas pratiques (40%)</li>
                <li>• Compréhension des processus (20%)</li>
              </ul>
            </div>
          </div>
          <div className="mt-4 text-xs text-blue-600">
            <p><strong>Note :</strong> Chaque phase est notée sur 5 points. Utilisez des demi-points si nécessaire (ex: 3.5/5).</p>
          </div>
        </div>
      </main>
    </div>
  )
}