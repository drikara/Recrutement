import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { prisma } from "@/lib/prisma"
import { DashboardHeader } from "@/components/dashboard-header"
import { CandidateForm } from "@/components/candidate-form"

export default async function NewCandidatePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    redirect("/auth/login")
  }

  // Vérification du rôle
  const userRole = (session.user as any).role || "JURY"
  if (userRole !== "WFM") {
    redirect("/auth/login")
  }

  // Récupérer les sessions disponibles pour l'association
  const sessions = await prisma.recruitmentSession.findMany({
    where: {
      OR: [
        { status: 'PLANIFIED' },
        { status: 'IN_PROGRESS' }
      ]
    },
    select: {
      id: true,
      metier: true,
      date: true,
      jour: true,
      status: true,
      description: true
    },
    orderBy: {
      date: 'asc'
    }
  })

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader user={session.user} role="WFM" />
      <main className="container mx-auto p-6 max-w-4xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">Nouveau Candidat</h1>
          <p className="text-muted-foreground mt-1">
            Enregistrer un nouveau candidat dans le système de recrutement
          </p>
          
          {/* Informations sur les sessions disponibles */}
          {sessions.length > 0 && (
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-700">
                <strong>{sessions.length} session(s) disponible(s)</strong> pour associer ce candidat
              </p>
            </div>
          )}
        </div>

        {/* Passez les sessions au formulaire */}
        <CandidateForm sessions={sessions} />
        
        {/* Guide de création */}
        <div className="mt-8 p-6 bg-green-50 border border-green-200 rounded-lg">
          <h3 className="text-lg font-semibold text-green-800 mb-3">Guide de création</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-green-700">
            <div>
              <h4 className="font-medium mb-2">Champs obligatoires</h4>
              <ul className="space-y-1">
                <li>• Nom et Prénom</li>
                <li>• Numéro de téléphone</li>
                <li>• Date de naissance</li>
                <li>• Email</li>
                <li>• Diplôme</li>
                <li>• Établissement</li>
                <li>• Lieu d'habitation</li>
                <li>• Métier</li>
                <li>• Disponibilité</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Champs optionnels</h4>
              <ul className="space-y-1">
                <li>• Date envoi SMS</li>
                <li>• Date entretien</li>
                <li>• Session de recrutement</li>
              </ul>
            </div>
          </div>
          <div className="mt-4 text-xs text-green-600">
            <p><strong>Astuce :</strong> L'âge est calculé automatiquement à partir de la date de naissance.</p>
          </div>
        </div>

        {/* Informations importantes */}
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">Processus après création</h3>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• Le candidat sera visible dans la liste des candidats</li>
            <li>• Le statut d'appel sera défini sur "Non contacté" par défaut</li>
            <li>• Les membres du jury pourront évaluer le candidat</li>
            <li>• Vous pourrez modifier les informations à tout moment</li>
            <li>• Le suivi d'appel pourra être mis à jour</li>
          </ul>
        </div>
      </main>
    </div>
  )
}