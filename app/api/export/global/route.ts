// app/api/export/global/route.ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { Metier } from "@prisma/client"
import JSZip from "jszip"

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session || (session.user as any).role !== "WFM") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const metier = searchParams.get('metier') as Metier | null
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')

    // Construire les filtres
    const where: any = {}

    if (metier) {
      where.metier = metier
    }

    if (dateFrom || dateTo) {
      where.date = {}
      if (dateFrom) where.date.gte = new Date(dateFrom)
      if (dateTo) where.date.lte = new Date(dateTo)
    }

    // Récupérer les sessions avec filtres
    const recruitmentSessions = await prisma.recruitmentSession.findMany({
      where,
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
      },
      orderBy: {
        date: 'asc'
      }
    })

    if (recruitmentSessions.length === 0) {
      return NextResponse.json({ error: "Aucune donnée à exporter" }, { status: 404 })
    }

    // Créer un ZIP avec tous les fichiers
    const zip = new JSZip()

    // Fichier par session
    for (const session of recruitmentSessions) {
      const csvData = generateSessionExport(session)
      const fileName = `${session.metier}_Session_${session.jour}_${session.date.toISOString().split('T')[0]}.csv`
      zip.file(fileName, csvData)
    }

    // Fichier consolidé global
    const globalData = generateGlobalExport(recruitmentSessions)
    zip.file('export_global_consolide.csv', globalData)

    // Générer le ZIP
    const zipContent = await zip.generateAsync({ type: 'blob' })

    return new NextResponse(zipContent, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="export_global_${new Date().toISOString().split('T')[0]}.zip"`,
      },
    })
  } catch (error) {
    console.error("Global export error:", error)
    return NextResponse.json({ error: "Erreur lors de l'export" }, { status: 500 })
  }
}

function generateGlobalExport(sessions: any[]): string {
  // Implémentation simplifiée pour l'export global consolidé
  const headers = [
    'Session', 'Métier', 'Date', 'Candidat', 'Email', 'Téléphone',
    'Moyenne Phase 1', 'Moyenne Phase 2', 'Décision Finale'
  ]

  const rows = sessions.flatMap(session => 
    session.candidates.map((candidate: any) => {
      const phase1Scores = candidate.faceToFaceScores.filter((s: any) => s.phase === 1)
      const phase2Scores = candidate.faceToFaceScores.filter((s: any) => s.phase === 2)
      
      const avgPhase1 = phase1Scores.length > 0 
        ? phase1Scores.reduce((sum: number, s: any) => sum + Number(s.score), 0) / phase1Scores.length 
        : null
      
      const avgPhase2 = phase2Scores.length > 0 
        ? phase2Scores.reduce((sum: number, s: any) => sum + Number(s.score), 0) / phase2Scores.length 
        : null

      return [
        `${session.metier} - ${session.jour}`,
        candidate.metier,
        session.date.toISOString().split('T')[0],
        candidate.fullName,
        candidate.email,
        candidate.phone,
        avgPhase1 !== null ? avgPhase1.toFixed(2) : '',
        avgPhase2 !== null ? avgPhase2.toFixed(2) : '',
        candidate.scores?.finalDecision || ''
      ]
    })
  )

  const csv = [headers.join(','), ...rows.map((row: any) => row.join(','))].join('\n')
  const bom = "\uFEFF"
  return bom + csv
}