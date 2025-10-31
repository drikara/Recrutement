// app/wfm/sessions/page.tsx
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { prisma } from "@/lib/prisma"
import { DashboardHeader } from "@/components/dashboard-header"
import { SessionsList } from "@/components/sessions-list"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function SessionsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    redirect("/auth/login")
  }

  const userRole = (session.user as any).role || "JURY"
  if (userRole !== "WFM") {
    redirect("/auth/login")
  }

  const recruitmentSessions = await prisma.recruitmentSession.findMany({
    include: {
      _count: {
        select: {
          candidates: true,
          juryPresences: true
        }
      },
      candidates: {
        select: {
          id: true,
          fullName: true,
          metier: true,
          scores: {
            select: {
              finalDecision: true
            }
          }
        }
      }
    },
    orderBy: {
      date: 'desc'
    }
  })

  // Calcul des statistiques
  const totalSessions = recruitmentSessions.length
  const activeSessions = recruitmentSessions.filter(s => s.status === 'IN_PROGRESS').length
  const completedSessions = recruitmentSessions.filter(s => s.status === 'COMPLETED').length

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader user={session.user} role="WFM" />
      <main className="container mx-auto p-6 space-y-6">
        {/* En-tête */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Gestion des Sessions</h1>
            <p className="text-muted-foreground mt-1">
              Créer et gérer les sessions de recrutement
            </p>
          </div>
          <Link href="/wfm/sessions/new">
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nouvelle Session
            </Button>
          </Link>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-card border border-border rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-foreground">{totalSessions}</div>
            <div className="text-sm text-muted-foreground">Total Sessions</div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{activeSessions}</div>
            <div className="text-sm text-muted-foreground">Sessions Actives</div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{completedSessions}</div>
            <div className="text-sm text-muted-foreground">Sessions Terminées</div>
          </div>
        </div>

        {/* Liste des sessions */}
        <SessionsList sessions={recruitmentSessions} />

        {/* Informations */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">Gestion des Sessions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-700">
            <div>
              <h4 className="font-medium mb-2">Statuts des Sessions</h4>
              <ul className="space-y-1">
                <li>• <span className="font-medium text-blue-800">Planifié</span> : Session à venir</li>
                <li>• <span className="font-medium text-green-800">En cours</span> : Session active</li>
                <li>• <span className="font-medium text-gray-800">Terminé</span> : Session complétée</li>
                <li>• <span className="font-medium text-red-800">Annulé</span> : Session annulée</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Actions Disponibles</h4>
              <ul className="space-y-1">
                <li>• <strong>Modifier</strong> : Mettre à jour les informations</li>
                <li>• <strong>Gérer les présences</strong> : Ajouter/retirer des jurys</li>
                <li>• <strong>Voir les candidats</strong> : Liste des candidats associés</li>
                <li>• <strong>Exporter</strong> : Générer un rapport Excel</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}