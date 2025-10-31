import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { Metier } from "@prisma/client"

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session || session.user.role !== "WFM") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const data = await request.json()

    // Vérifier que l'utilisateur existe
    const user = await prisma.user.findUnique({
      where: { id: data.user_id },
    })

    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 })
    }

    // Vérifier l'unicité
    const existing = await prisma.juryMember.findUnique({
      where: { userId: data.user_id },
    })

    if (existing) {
      return NextResponse.json({ error: "Cet utilisateur est déjà membre du jury" }, { status: 400 })
    }

    // Conversion du métier si fourni
    const specialite = data.specialite 
      ? (Metier[data.specialite as keyof typeof Metier])
      : null

    const juryMember = await prisma.juryMember.create({
      data: {
        userId: data.user_id,
        fullName: data.full_name,
        roleType: data.role_type,
        specialite: specialite, // Optionnel selon votre schéma
        department: data.department || null, // Optionnel
        phone: data.phone || null, // Optionnel
        notes: data.notes || null, // Optionnel
      },
      include: {
        user: {
          select: {
            email: true,
            name: true,
            role: true,
          },
        },
      },
    })

    return NextResponse.json(juryMember)
  } catch (error) {
    console.error("[v0] Error creating jury member:", error)
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

    // Formater la réponse avec des statistiques utiles
    const formattedMembers = juryMembers.map(member => ({
      id: member.id,
      userId: member.userId,
      fullName: member.fullName,
      roleType: member.roleType,
      specialite: member.specialite,
      department: member.department,
      phone: member.phone,
      isActive: member.isActive,
      notes: member.notes,
      user: member.user,
      stats: {
        evaluationsCount: member.faceToFaceScores.length,
        presencesCount: member.juryPresences.length,
      },
      createdAt: member.createdAt,
      updatedAt: member.updatedAt,
    }))

    return NextResponse.json(formattedMembers)
  } catch (error) {
    console.error("Error fetching jury members:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}