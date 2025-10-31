// app/wfm/candidates/[id]/consolidation/page.tsx
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { prisma } from "@/lib/prisma"
import { DashboardHeader } from "@/components/dashboard-header"
import { TechnicalTestsForm } from "@/components/technical-tests-form"
import { ConsolidationResult } from "@/components/consolidation-result"

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
      <DashboardHeader user={session.user} role="WFM" />
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

            {/* Décision Finale */}
            <div className="bg-white rounded-lg border p-6">
              <h2 className="text-xl font-semibold mb-4">Décision Finale</h2>
              <button 
                onClick={async () => {
                  // Appel API pour calculer la consolidation
                  const response = await fetch(`/api/candidates/${candidate.id}/consolidation`, {
                    method: 'POST'
                  })
                  if (response.ok) {
                    // Rafraîchir la page
                    window.location.reload()
                  }
                }}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                Appliquer la Consolidation Automatique
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}