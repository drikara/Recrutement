// app/api/sessions/route.ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { Metier, SessionStatus } from "@prisma/client"

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session || (session.user as any).role !== "WFM") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const data = await request.json()

    // Validation des données
    if (!data.metier || !data.date || !data.jour) {
      return NextResponse.json({ error: "Champs manquants" }, { status: 400 })
    }

    // Conversion du métier
    const metierValue = data.metier as keyof typeof Metier
    if (!Metier[metierValue]) {
      return NextResponse.json({ error: "Métier invalide" }, { status: 400 })
    }

    const recruitmentSession = await prisma.recruitmentSession.create({
      data: {
        metier: Metier[metierValue],
        date: new Date(data.date),
        jour: data.jour,
        status: data.status || 'PLANIFIED',
        description: data.description || null,
        location: data.location || null,
      },
    })

    return NextResponse.json(recruitmentSession, { status: 201 })
  } catch (error) {
    console.error("Error creating session:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const recruitmentSessions = await prisma.recruitmentSession.findMany({
      include: {
        _count: {
          select: {
            candidates: true,
            juryPresences: true
          }
        },
        candidates: {
          select: {
            id: true,
            fullName: true,
            metier: true
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    })

    return NextResponse.json(recruitmentSessions)
  } catch (error) {
    console.error("Error fetching sessions:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}