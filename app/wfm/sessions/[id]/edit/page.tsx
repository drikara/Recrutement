// app/wfm/session/[id]/edit/page.tsx
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { prisma } from "@/lib/prisma"
import { DashboardHeader } from "@/components/dashboard-header"
import { SessionForm } from "@/components/session-form"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditSessionPage({ params }: PageProps) {
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
    where: { id },
    // ✅ Sélectionner explicitement tous les champs nécessaires, y compris agenceType
    select: {
      id: true,
      metier: true,
      date: true,
      jour: true,
      status: true,
      description: true,
      location: true,
      agenceType: true, // <-- AJOUT OBLIGATOIRE
    }
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
    agenceType: recruitmentSession.agenceType || null, // <-- AJOUT
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader user={session.user} />
      <main className="container mx-auto p-6 max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Modifier la Session</h1>
          <p className="text-gray-600 mt-2">
            {recruitmentSession.metier} - {recruitmentSession.jour} {recruitmentSession.date.toLocaleDateString('fr-FR')}
          </p>
        </div>

        <div className="bg-white rounded-xl border-2 border-gray-200 p-6 shadow-sm">
          <SessionForm session={sessionData} />
        </div>
      </main>
    </div>
  )
}