// app/wfm/sessions/[id]/edit/page.tsx
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { prisma } from "@/lib/prisma"
import { DashboardHeader } from "@/components/dashboard-header"
import { SessionForm } from "@/components/session-form"

export default async function EditSessionPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params
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

  const recruitmentSession = await prisma.recruitmentSession.findUnique({
    where: { id }
  })

  if (!recruitmentSession) {
    redirect("/wfm/sessions")
  }

  // Formater les données pour le formulaire
  const sessionData = {
    id: recruitmentSession.id,
    metier: recruitmentSession.metier,
    date: recruitmentSession.date.toISOString().split('T')[0],
    jour: recruitmentSession.jour,
    status: recruitmentSession.status,
    description: recruitmentSession.description || '',
    location: recruitmentSession.location || '',
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader user={session.user} role="WFM" />
      <main className="container mx-auto p-6 max-w-2xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">Modifier la Session</h1>
          <p className="text-muted-foreground mt-1">
            {recruitmentSession.metier} - {recruitmentSession.jour} {recruitmentSession.date.toLocaleDateString('fr-FR')}
          </p>
        </div>

        <SessionForm session={sessionData} />

        {/* Informations importantes */}
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-yellow-900 mb-3">Modification d'une session</h3>
          <ul className="text-sm text-yellow-700 space-y-2">
            <li>• La modification de la date recalcule automatiquement le jour de la semaine</li>
            <li>• Le changement de statut affecte les évaluations en cours</li>
            <li>• Les candidats associés à cette session seront impactés</li>
            <li>• Les exports refléteront les nouvelles informations</li>
          </ul>
        </div>
      </main>
    </div>
  )
}