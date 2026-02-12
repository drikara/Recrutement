import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { AuditService, getRequestInfo } from '@/lib/audit-service'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    console.log(`🎯 GET /api/sessions/${id}`)

    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const recruitmentSession = await prisma.recruitmentSession.findUnique({
      where: { id },
      include: {
        candidates: {
          include: {
            scores: true
          }
        },
        juryPresences: true
      }
    })

    if (!recruitmentSession) {
      return NextResponse.json({ error: "Session non trouvée" }, { status: 404 })
    }

    // Audit de consultation
    const requestInfo = getRequestInfo(request)
    await AuditService.log({
      userId: session.user.id,
      userName: session.user.name || 'Utilisateur',
      userEmail: session.user.email,
      action: 'READ',
      entity: 'SESSION',
      entityId: id,
      description: `Consultation de la session ${recruitmentSession.metier} du ${new Date(recruitmentSession.date).toLocaleDateString('fr-FR')}`,
      metadata: {
        sessionDate: recruitmentSession.date,
        sessionMetier: recruitmentSession.metier,
        sessionStatus: recruitmentSession.status,
        candidatesCount: recruitmentSession.candidates.length,
        juryPresencesCount: recruitmentSession.juryPresences.length
      },
      ...requestInfo
    })

    // ✅ Retourne tous les champs, y compris agenceType
    return NextResponse.json(recruitmentSession)
    
  } catch (error) {
    console.error("❌ Erreur GET session:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    console.log(`🎯 PUT /api/sessions/${id}`)

    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session || (session.user as any).role !== "WFM") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const data = await request.json()
    console.log("📦 Données reçues:", data)

    // Validation
    if (!data.metier || !data.date) {
      return NextResponse.json({ 
        error: "Champs manquants" 
      }, { status: 400 })
    }

    // Récupérer l'ancienne version pour l'audit
    const oldSession = await prisma.recruitmentSession.findUnique({
      where: { id }
    })

    if (!oldSession) {
      return NextResponse.json({ 
        error: "Session non trouvée" 
      }, { status: 404 })
    }

    // Calcul du jour si absent
    let jour = data.jour
    if (!jour && data.date) {
      const date = new Date(data.date + 'T00:00:00')
      const frenchDays = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
      jour = frenchDays[date.getDay()]
    }

    // ✅ Mise à jour incluant agenceType
    const recruitmentSession = await prisma.recruitmentSession.update({
      where: { id },
      data: {
        metier: data.metier,
        date: new Date(data.date + 'T00:00:00'),
        jour: jour,
        status: data.status || 'PLANIFIED',
        description: data.description || null,
        location: data.location || null,
        // ✅ Ajout de la gestion du type d'agence
        agenceType: data.metier === 'AGENCES' ? data.agenceType : null,
      },
    })

    // Audit de modification
    const requestInfo = getRequestInfo(request)
    const changes: any = {}
    
    if (oldSession.metier !== data.metier) {
      changes.metier = { old: oldSession.metier, new: data.metier }
    }
    if (oldSession.date.toISOString() !== new Date(data.date + 'T00:00:00').toISOString()) {
      changes.date = { 
        old: new Date(oldSession.date).toLocaleDateString('fr-FR'), 
        new: new Date(data.date).toLocaleDateString('fr-FR') 
      }
    }
    if (oldSession.status !== (data.status || 'PLANIFIED')) {
      changes.status = { old: oldSession.status, new: data.status || 'PLANIFIED' }
    }
    if (oldSession.description !== (data.description || null)) {
      changes.description = { old: oldSession.description, new: data.description || null }
    }
    if (oldSession.location !== (data.location || null)) {
      changes.location = { old: oldSession.location, new: data.location || null }
    }
    // ✅ Audit du changement de type d'agence
    if (oldSession.agenceType !== (data.metier === 'AGENCES' ? data.agenceType : null)) {
      changes.agenceType = { 
        old: oldSession.agenceType, 
        new: data.metier === 'AGENCES' ? data.agenceType : null 
      }
    }

    await AuditService.log({
      userId: session.user.id,
      userName: session.user.name || 'Utilisateur',
      userEmail: session.user.email,
      action: 'UPDATE',
      entity: 'SESSION',
      entityId: id,
      description: `Modification de la session ${recruitmentSession.metier}`,
      metadata: {
        changes,
        sessionDate: recruitmentSession.date,
        sessionStatus: recruitmentSession.status
      },
      ...requestInfo
    })

    console.log("✅ Session modifiée:", recruitmentSession.id)
    return NextResponse.json(recruitmentSession)
    
  } catch (error) {
    console.error("❌ Erreur PUT:", error)
    
    if (error instanceof Error && error.message.includes('Record to update not found')) {
      return NextResponse.json({ 
        error: "Session non trouvée" 
      }, { status: 404 })
    }
    
    return NextResponse.json({ 
      error: "Erreur serveur" 
    }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // ... (inchangé, déjà correct)
  try {
    const { id } = await params
    console.log(`🎯 DELETE /api/sessions/${id} - Début`)
    
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session || (session.user as any).role !== "WFM") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const existingSession = await prisma.recruitmentSession.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            candidates: true,
            juryPresences: true,
            exportLogs: true
          }
        }
      }
    })

    if (!existingSession) {
      return NextResponse.json({ error: "Session non trouvée" }, { status: 404 })
    }

    // Transaction de suppression
    const result = await prisma.$transaction(async (tx) => {
      await tx.faceToFaceScore.deleteMany({
        where: { candidate: { sessionId: id } }
      })
      await tx.score.deleteMany({
        where: { candidate: { sessionId: id } }
      })
      await tx.candidate.deleteMany({
        where: { sessionId: id }
      })
      await tx.juryPresence.deleteMany({
        where: { sessionId: id }
      })
      await tx.exportLog.deleteMany({
        where: { sessionId: id }
      })
      const deletedSession = await tx.recruitmentSession.delete({
        where: { id }
      })
      return deletedSession
    })

    const requestInfo = getRequestInfo(request)
    await AuditService.log({
      userId: session.user.id,
      userName: session.user.name || 'Utilisateur',
      userEmail: session.user.email,
      action: 'DELETE',
      entity: 'SESSION',
      entityId: id,
      description: `Suppression de la session ${existingSession.metier} du ${new Date(existingSession.date).toLocaleDateString('fr-FR')}`,
      metadata: {
        sessionMetier: existingSession.metier,
        sessionDate: existingSession.date,
        sessionStatus: existingSession.status,
        deletedData: {
          candidates: existingSession._count.candidates,
          juryPresences: existingSession._count.juryPresences,
          exportLogs: existingSession._count.exportLogs
        }
      },
      ...requestInfo
    })

    console.log("✅ Session et données associées supprimées:", id)
    return NextResponse.json({ success: true, deletedId: id })

  } catch (error) {
    console.error("❌ Erreur DELETE:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}