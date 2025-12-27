// app/wfm/jury/page.tsx
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { prisma } from "@/lib/prisma"
import { DashboardHeader } from "@/components/dashboard-header"
import { JuryManagement } from "@/components/jury-management"

interface SearchParams {
  page?: string
}

export default async function JuryManagementPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
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

  const params = await searchParams
  const currentPage = params.page ? parseInt(params.page) : 1
  const itemsPerPage = 5

  // Compter le total de membres du jury
  const totalJuryMembers = await prisma.juryMember.count()
  const totalPages = Math.ceil(totalJuryMembers / itemsPerPage)

  // Récupérer les membres du jury avec pagination
  const juryMembers = await prisma.juryMember.findMany({
    skip: (currentPage - 1) * itemsPerPage,
    take: itemsPerPage,
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
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader 
        user={{
          name: session.user?.name || 'Utilisateur',
          email: session.user?.email || '',
          role: userRole
        }}
      />
      <main className="container mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Gestion des Membres du Jury</h1>
          <p className="text-gray-600 mt-2">
            Ajouter et gérer les membres du jury pour les évaluations
          </p>
        </div>

        <JuryManagement 
          juryMembers={formattedJuryMembers} 
          users={users}
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalJuryMembers}
        />
      </main>

      {/* Footer avec copyright */}
      <footer className="border-t mt-8 py-4">
        <div className="container mx-auto px-6 text-center text-muted-foreground text-sm">
           © {new Date().getFullYear()} Orange Côte d'Ivoire. Developed by okd_dev. All rights reserved.
        </div>
      </footer>
    </div>
  )
}

export function generateViewport() {
  return {
    width: "device-width",
    initialScale: 1,
    colorScheme: "light",
  }
}

export const metadata = {
  title: "Gestion des Jurys - WFM",
  description: "Gestion des membres du jury",
}