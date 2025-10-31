// app/wfm/candidates/[id]/consolidation/page.tsx
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { prisma } from "@/lib/prisma"
import { DashboardHeader } from "@/components/dashboard-header"
import { TechnicalTestsForm } from "@/components/technical-tests-form"
import { ConsolidationResult } from "@/components/consolidation-result"
import { ConsolidationButton } from "@/components/consolidation-button" // AJOUT IMPORT

// CORRECTION : Ajouter les métadonnées
export const metadata = {
  title: "Consolidation des scores",
  description: "Consolidation des scores du candidat",
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  colorScheme: 'light',
}

export default async function CandidateConsolidationPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session || (session.user as any).role !== "WFM") {
    redirect("/auth/login")
  }

  // CORRECTION : Préparer les données user
  const userData = {
    name: session.user.name,
    email: session.user.email,
    role: (session.user as any).role || undefined
  }

  const candidate = await prisma.candidate.findUnique({
    where: { id: parseInt(id) },
    include: {
      scores: true,
      faceToFaceScores: {
        include: {
          juryMember: {
            select: {
              fullName: true,
              roleType: true,
              specialite: true
            }
          }
        }
      },
      session: true
    }
  })

  if (!candidate) {
    redirect("/wfm/candidates")
  }

  return (
    <div className="min-h-screen bg-background">
      {/* CORRECTION : Passer les données corrigées */}
      <DashboardHeader user={userData} role="WFM" />
      <main className="container mx-auto p-6 max-w-6xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Consolidation - {candidate.fullName}</h1>
          <p className="text-muted-foreground">
            {candidate.metier} • {candidate.email}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Tests Techniques (WFM uniquement) */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg border p-6">
              <h2 className="text-xl font-semibold mb-4">Tests Techniques</h2>
              <TechnicalTestsForm 
                candidateId={candidate.id}
                existingScores={candidate.scores}
              />
            </div>
          </div>

          {/* Résultats et Consolidation */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg border p-6">
              <h2 className="text-xl font-semibold mb-4">Résultats Face à Face</h2>
              <ConsolidationResult 
                candidate={candidate}
                faceToFaceScores={candidate.faceToFaceScores}
                technicalScores={candidate.scores}
              />
            </div>

            {/* Décision Finale - CORRECTION : Remplacer le bouton */}
            <div className="bg-white rounded-lg border p-6">
              <h2 className="text-xl font-semibold mb-4">Décision Finale</h2>
              {/* CORRECTION : Utiliser le composant Client au lieu du bouton direct */}
              <ConsolidationButton candidateId={candidate.id} />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}