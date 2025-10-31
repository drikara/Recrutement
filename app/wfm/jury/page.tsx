// app/wfm/jury/page.tsx
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { prisma } from "@/lib/prisma"
import { DashboardHeader } from "@/components/dashboard-header"
import { JuryManagement } from "@/components/jury-management"

export default async function JuryManagementPage() {
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

  // Récupérer les membres du jury
  const juryMembers = await prisma.juryMember.findMany({
    include: {
      user: {
        select: {
          email: true,
          name: true,
          role: true,
          isActive: true,
          lastLogin: true,
        },
      },
      faceToFaceScores: {
        select: {
          id: true,
        },
      },
      juryPresences: {
        select: {
          id: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  })

  // Récupérer les utilisateurs disponibles (rôle JURY)
  const users = await prisma.user.findMany({
    where: {
      role: 'JURY',
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  })

  // Formater les données avec les statistiques
  const formattedJuryMembers = juryMembers.map(member => ({
    id: member.id,
    userId: member.userId,
    fullName: member.fullName,
    roleType: member.roleType,
    specialite: member.specialite,
    department: member.department,
    phone: member.phone,
    isActive: member.isActive,
    user: member.user,
    stats: {
      evaluationsCount: member.faceToFaceScores.length,
      presencesCount: member.juryPresences.length,
    },
  }))

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader user={session.user} role="WFM" />
      <main className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">Gestion des Membres du Jury</h1>
          <p className="text-muted-foreground mt-1">
            Ajouter et gérer les membres du jury pour les évaluations
          </p>
        </div>

        <JuryManagement 
          juryMembers={formattedJuryMembers} 
          users={users} 
        />

        {/* Informations sur les rôles */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">Types de Rôles du Jury</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-700">
            <div>
              <h4 className="font-medium mb-2">Rôles Disponibles</h4>
              <ul className="space-y-1">
                <li>• <strong>DRH</strong> : Directeur des Ressources Humaines</li>
                <li>• <strong>EPC</strong> : Équipe de Pilotage du Changement</li>
                <li>• <strong>REPRESENTANT_METIER</strong> : Expert du métier concerné</li>
                <li>• <strong>WFM_JURY</strong> : Membre WFM participant aux jurys</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Quorum Requis</h4>
              <ul className="space-y-1">
                <li>• Présence obligatoire du WFM</li>
                <li>• Présence du représentant du métier</li>
                <li>• Au moins 3 membres pour validation</li>
                <li>• Décision collégiale requise</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}