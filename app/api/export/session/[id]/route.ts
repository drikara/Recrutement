// app/api/sessions/[id]/route.ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { Metier, SessionStatus } from "@prisma/client"

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session || (session.user as any).role !== "WFM") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const data = await request.json()

    // Vérifier que la session existe
    const existingSession = await prisma.recruitmentSession.findUnique({
      where: { id }
    })

    if (!existingSession) {
      return NextResponse.json({ error: "Session non trouvée" }, { status: 404 })
    }

    // Conversion du métier si fourni
    const metier = data.metier 
      ? (Metier[data.metier as keyof typeof Metier])
      : undefined

    // Calcul du jour si la date change
    let jour = data.jour
    if (data.date && data.date !== existingSession.date.toISOString().split('T')[0]) {
      const selectedDate = new Date(data.date)
      const dayIndex = selectedDate.getDay()
      const frenchDays = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
      jour = frenchDays[dayIndex]
    }

    const updatedSession = await prisma.recruitmentSession.update({
      where: { id },
      data: {
        metier,
        date: data.date ? new Date(data.date) : undefined,
        jour,
        status: data.status as SessionStatus,
        description: data.description !== undefined ? data.description : undefined,
        location: data.location !== undefined ? data.location : undefined,
      },
    })

    return NextResponse.json(updatedSession)
  } catch (error) {
    console.error("Error updating session:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session || (session.user as any).role !== "WFM") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    // Vérifier que la session existe
    const existingSession = await prisma.recruitmentSession.findUnique({
      where: { id },
      include: {
        candidates: {
          select: { id: true }
        }
      }
    })

    if (!existingSession) {
      return NextResponse.json({ error: "Session non trouvée" }, { status: 404 })
    }

    // Empêcher la suppression si des candidats sont associés
    if (existingSession.candidates.length > 0) {
      return NextResponse.json({ 
        error: "Impossible de supprimer une session avec des candidats associés" 
      }, { status: 400 })
    }

    await prisma.recruitmentSession.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting session:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}