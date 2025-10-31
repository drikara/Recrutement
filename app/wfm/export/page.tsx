// app/wfm/export/page.tsx
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { prisma } from "@/lib/prisma"
import { DashboardHeader } from "@/components/dashboard-header"
import { ExportPanel } from "@/components/export-panel"

export default async function ExportPage() {
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

  // Récupérer les sessions pour les filtres
  const sessions = await prisma.recruitmentSession.findMany({
    select: {
      id: true,
      metier: true,
      date: true,
      jour: true,
      status: true
    },
    orderBy: {
      date: 'desc'
    }
  })

  // Récupérer les métiers disponibles
  const metiers = await prisma.candidate.groupBy({
    by: ['metier'],
    _count: {
      id: true
    }
  })

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader user={session.user} role="WFM" />
      <main className="container mx-auto p-6 max-w-4xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">Export des Données</h1>
          <p className="text-muted-foreground mt-1">
            Générer des rapports Excel pour l'analyse des résultats
          </p>
        </div>

        <ExportPanel sessions={sessions} metiers={metiers} />

        {/* Informations sur l'export */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">Fonctionnalités d'Export</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-700">
            <div>
              <h4 className="font-medium mb-2">Types d'Export</h4>
              <ul className="space-y-1">
                <li>• <strong>Par session</strong> : Fichier Excel pour une session spécifique</li>
                <li>• <strong>Multiple</strong> : ZIP avec fichiers par session</li>
                <li>• <strong>Global</strong> : Toutes les données sur une période</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Fonctionnalités</h4>
              <ul className="space-y-1">
                <li>• Colonnes adaptées à chaque métier</li>
                <li>• Détails complets des jurys</li>
                <li>• Format CSV compatible Excel</li>
                <li>• Encodage UTF-8 pour caractères français</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}