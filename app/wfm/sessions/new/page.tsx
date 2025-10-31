// app/wfm/sessions/new/page.tsx
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { DashboardHeader } from "@/components/dashboard-header"
import { SessionForm } from "@/components/session-form"

export default async function NewSessionPage() {
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

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader user={session.user} role="WFM" />
      <main className="container mx-auto p-6 max-w-2xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">Nouvelle Session</h1>
          <p className="text-muted-foreground mt-1">
            Créer une nouvelle session de recrutement
          </p>
        </div>

        <SessionForm />

        {/* Informations */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">À propos des sessions</h3>
          <div className="text-sm text-blue-700 space-y-2">
            <p>
              <strong>Une session de recrutement</strong> regroupe des candidats pour un même métier 
              à une date spécifique. Elle permet d'organiser le processus d'évaluation et de générer 
              des rapports consolidés.
            </p>
            <p>
              <strong>Statuts possibles :</strong>
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li><strong>Planifié</strong> : Session à venir</li>
              <li><strong>En cours</strong> : Session active avec évaluations en cours</li>
              <li><strong>Terminé</strong> : Session complétée</li>
              <li><strong>Annulé</strong> : Session annulée</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  )
}