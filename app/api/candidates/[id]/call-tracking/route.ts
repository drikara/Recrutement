// app/api/candidates/[id]/call-tracking/route.ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { CallStatus } from "@prisma/client"

export async function POST(
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

    // Mettre à jour le suivi d'appel dans la table scores
    const score = await prisma.score.upsert({
      where: { candidateId: Number.parseInt(id) },
      update: {
        callStatus: data.call_status as CallStatus,
        callAttempts: data.call_attempts,
        lastCallDate: data.last_call_date ? new Date(data.last_call_date) : null,
        callNotes: data.call_notes || null,
      },
      create: {
        candidateId: Number.parseInt(id),
        callStatus: data.call_status as CallStatus,
        callAttempts: data.call_attempts,
        lastCallDate: data.last_call_date ? new Date(data.last_call_date) : null,
        callNotes: data.call_notes || null,
      },
    })

    return NextResponse.json(score)
  } catch (error) {
    console.error("Error updating call tracking:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}