// app/api/sessions/route.ts - VERSION CORRIGÉE
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"

// GET - Récupérer toutes les sessions
export async function GET(request: Request) {
  try {
    console.log("🔍 GET /api/sessions - Début")
    
    // ⭐ CORRECTION : Récupération des headers
    const headersList = await headers()
    
    const session = await auth.api.getSession({
      headers: headersList,
    })

    console.log("🔐 Session status:", {
      hasSession: !!session,
      userEmail: session?.user?.email,
      userRole: (session?.user as any)?.role
    })

    if (!session) {
      console.log("❌ Non autorisé")
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    console.log("👤 Utilisateur autorisé:", session.user?.email)

    // ⭐ CORRECTION : Requête Prisma simplifiée et sécurisée
    const recruitmentSessions = await prisma.recruitmentSession.findMany({
      include: {
        candidates: {
          include: {
            scores: {
              select: {
                finalDecision: true,
                callStatus: true,
              }
            }
          }
        },
        _count: {
          select: {
            candidates: true,
            juryPresences: true
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    })

    console.log(`✅ ${recruitmentSessions.length} sessions trouvées`)
    
    return NextResponse.json(recruitmentSessions)
    
  } catch (error) {
    console.error("❌ Erreur GET /api/sessions:", error)
    return NextResponse.json({ 
      error: "Erreur lors de la récupération des sessions",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

// POST - Créer une nouvelle session
export async function POST(request: Request) {
  try {
    console.log("🎯 POST /api/sessions - Début")
    
    const headersList = await headers()
    const session = await auth.api.getSession({
      headers: headersList,
    })

    if (!session) {
      console.log("❌ Non autorisé")
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const userRole = (session.user as any).role
    console.log("👤 Utilisateur:", session.user?.email, "- Role:", userRole)

    if (userRole !== "WFM") {
      console.log("❌ Non autorisé - Role insuffisant")
      return NextResponse.json({ 
        error: "Seuls les utilisateurs WFM peuvent créer des sessions" 
      }, { status: 403 })
    }

    const data = await request.json()
    console.log("📦 Données reçues:", data)

    // Validation des champs requis
    if (!data.metier || !data.date) {
      console.log("❌ Champs manquants")
      return NextResponse.json({ 
        error: "Les champs métier et date sont obligatoires" 
      }, { status: 400 })
    }

    // Calcul du jour de la semaine
    const selectedDate = new Date(data.date)
    const dayIndex = selectedDate.getDay()
    const frenchDays = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
    const jour = frenchDays[dayIndex]

    console.log("📅 Date:", selectedDate.toISOString(), "- Jour:", jour)

    // Créer la session
    const newSession = await prisma.recruitmentSession.create({
      data: {
        metier: data.metier,
        date: selectedDate,
        jour: jour,
        status: data.status || 'PLANIFIED',
        description: data.description?.trim() || null,
        location: data.location?.trim() || null,
      }
    })

    console.log("✅ Session créée avec succès:", newSession.id)
    return NextResponse.json(newSession, { status: 201 })
    
  } catch (error) {
    console.error("❌ Erreur création session:", error)
    return NextResponse.json({ 
      error: "Erreur lors de la création de la session",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

// ⭐ AJOUTER la méthode OPTIONS pour CORS
export async function OPTIONS(request: Request) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}