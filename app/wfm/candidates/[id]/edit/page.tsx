import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { prisma } from "@/lib/prisma"
import { DashboardHeader } from "@/components/dashboard-header"
import { CandidateEditForm } from "@/components/candidate-edit-form"

interface CandidateEditPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function CandidateEditPage({ params }: CandidateEditPageProps) {
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

  const { id } = await params

  // 1️⃣ Récupérer le candidat avec tous les champs nécessaires
  const candidate = await prisma.candidate.findUnique({
    where: { id: parseInt(id) },
    select: {
      id: true,
      nom: true,
      prenom: true,
      phone: true,
      birthDate: true,
      age: true,
      diploma: true,
      niveauEtudes: true,
      institution: true,
      email: true,
      location: true,
      smsSentDate: true,
      availability: true,
      interviewDate: true,
      signingDate: true,       // ⭐ date de signature
      metier: true,
      sessionId: true,
      notes: true,
    },
  })

  if (!candidate) {
    redirect("/wfm/candidates")
  }

  // 2️⃣ Récupérer les sessions actives (planifiées ou en cours)
  let sessions = await prisma.recruitmentSession.findMany({
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
      description: true,
      location: true,
    },
    orderBy: {
      date: 'asc'
    }
  })

  // 3️⃣ Si le candidat a une session, s'assurer qu'elle est dans la liste
  if (candidate.sessionId) {
    const sessionExists = sessions.some(s => s.id === candidate.sessionId)
    if (!sessionExists) {
      const candidateSession = await prisma.recruitmentSession.findUnique({
        where: { id: candidate.sessionId },
        select: {
          id: true,
          metier: true,
          date: true,
          jour: true,
          status: true,
          description: true,
          location: true,
        },
      })
      if (candidateSession) {
        sessions.push(candidateSession)
      }
    }
  }

  // 4️⃣ Formater les données du candidat pour le formulaire
  const formattedCandidate = {
    id: candidate.id,
    nom: candidate.nom,
    prenom: candidate.prenom,
    phone: candidate.phone,
    birthDate: candidate.birthDate.toISOString().split('T')[0],
    age: candidate.age,
    diploma: candidate.diploma,
    niveauEtudes: candidate.niveauEtudes,
    institution: candidate.institution,
    email: candidate.email ?? undefined,
    location: candidate.location,
    smsSentDate: candidate.smsSentDate ? candidate.smsSentDate.toISOString().split('T')[0] : '',
    availability: candidate.availability,
    interviewDate: candidate.interviewDate ? candidate.interviewDate.toISOString().split('T')[0] : '',
    signingDate: candidate.signingDate ? candidate.signingDate.toISOString().split('T')[0] : '', // ⭐ string vide si null
    metier: candidate.metier,
    sessionId: candidate.sessionId ? candidate.sessionId.toString() : 'none',
    notes: candidate.notes ?? undefined,
  }

  // 5️⃣ Sérialiser les sessions (IDs en string)
  const serializedSessions = sessions.map(s => ({
    id: s.id.toString(),
    metier: s.metier,
    date: s.date.toISOString(),
    jour: s.jour,
    status: s.status,
    description: s.description,
    location: s.location,
  }))

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader user={session.user} />
      <main className="container mx-auto p-6 max-w-5xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Modifier le Candidat : {candidate.nom} {candidate.prenom}
          </h1>
          <p className="text-gray-600 mt-2">
            Modifier les informations du candidat dans le système de recrutement
          </p>
        </div>

        <CandidateEditForm 
          candidate={formattedCandidate} 
          sessions={serializedSessions} 
        />
      </main>
    </div>
  )
}