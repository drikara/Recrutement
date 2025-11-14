// app/api/export/session/route.ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { generateSessionExportXLSX } from "@/lib/export-utils"

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session || (session.user as any).role !== "WFM") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')

    if (!sessionId) {
      return NextResponse.json({ error: "sessionId requis" }, { status: 400 })
    }

    // Récupérer la session avec les candidats
    const recruitmentSession = await prisma.recruitmentSession.findUnique({
      where: { id: sessionId },
      include: {
        candidates: {
          include: {
            scores: true,
            faceToFaceScores: {
              include: {
                juryMember: {
                  select: {
                    fullName: true,
                    roleType: true
                  }
                }
              }
            }
          }
        }
      }
    })

    if (!recruitmentSession) {
      return NextResponse.json({ error: "Session non trouvée" }, { status: 404 })
    }

    // Générer l'export
    const exportResult = await generateSessionExportXLSX(recruitmentSession)

    // Retourner le fichier Excel
    return new NextResponse(exportResult.buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${exportResult.filename}"`,
      },
    })
  } catch (error) {
    console.error("Session export error:", error)
    return NextResponse.json({ error: "Erreur lors de l'export de session" }, { status: 500 })
  }
}