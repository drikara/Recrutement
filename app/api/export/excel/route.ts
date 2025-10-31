import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { Metier } from "@prisma/client"

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session || session.user.role !== "WFM") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const candidates = await prisma.candidate.findMany({
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
        },
        session: {
          select: {
            metier: true,
            date: true,
            jour: true
          }
        }
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    if (candidates.length === 0) {
      return new NextResponse("Aucune donnée à exporter", { status: 404 })
    }

    const results = candidates.map((candidate, index) => {
      const phase1Scores = candidate.faceToFaceScores.filter((s) => s.phase === 1)
      const phase2Scores = candidate.faceToFaceScores.filter((s) => s.phase === 2)

      const avgPhase1 = phase1Scores.length > 0 
        ? phase1Scores.reduce((sum, s) => sum + Number(s.score), 0) / phase1Scores.length 
        : null

      const avgPhase2 = phase2Scores.length > 0 
        ? phase2Scores.reduce((sum, s) => sum + Number(s.score), 0) / phase2Scores.length 
        : null

      // Détails des jurys pour le debug
      const juryDetailsPhase1 = phase1Scores.map(score => 
        `${score.juryMember.fullName} (${score.juryMember.roleType}): ${score.score}`
      ).join('; ')

      const juryDetailsPhase2 = phase2Scores.map(score => 
        `${score.juryMember.fullName} (${score.juryMember.roleType}): ${score.score}`
      ).join('; ')

      return {
        // Colonnes A-L: Informations candidat
        "A - Numéro": index + 1,
        "B - Noms et Prénoms": candidate.fullName,
        "C - Numéro de Tél": candidate.phone,
        "D - Date de naissance": candidate.birthDate.toISOString().split("T")[0],
        "E - Âge": candidate.age,
        "F - Diplôme": candidate.diploma,
        "G - Établissement fréquenté": candidate.institution,
        "H - Mail": candidate.email,
        "I - Lieu d'habitation": candidate.location,
        "J - Date envoi SMS": candidate.smsSentDate ? candidate.smsSentDate.toISOString().split("T")[0] : "",
        "K - Disponibilité candidat": candidate.availability,
        "L - Date présence entretien": candidate.interviewDate ? candidate.interviewDate.toISOString().split("T")[0] : "",

        // Colonnes M-Q: Phase 1 - Entretien Initial
        "M - Qualité de la voix (/20)": candidate.scores?.voiceQuality ? Number(candidate.scores.voiceQuality) : "",
        "N - Communication verbale (/20)": candidate.scores?.verbalCommunication ? Number(candidate.scores.verbalCommunication) : "",
        "O - Décision FF Phase 1": candidate.scores?.phase1FfDecision || "",
        "P - Test Psychotechnique (/10)": candidate.scores?.psychotechnicalTest ? Number(candidate.scores.psychotechnicalTest) : "",
        "Q - Décision Phase 1": candidate.scores?.phase1Decision || "",

        // Colonnes R-Y: Phase 2 - Épreuves Techniques
        "R - Rapidité de saisie (MPM)": candidate.scores?.typingSpeed || "",
        "S - Précision de saisie (%)": candidate.scores?.typingAccuracy ? Number(candidate.scores.typingAccuracy) : "",
        "T - Test Excel (/5)": candidate.scores?.excelTest ? Number(candidate.scores.excelTest) : "",
        "U - Dictée (/20)": candidate.scores?.dictation ? Number(candidate.scores.dictation) : "",
        "V - Simulation Vente (/5)": candidate.scores?.salesSimulation ? Number(candidate.scores.salesSimulation) : "",
        "W - Exercice Analyse (/10)": candidate.scores?.analysisExercise ? Number(candidate.scores.analysisExercise) : "",
        "X - Date présence Phase 2": candidate.scores?.phase2Date ? candidate.scores.phase2Date.toISOString().split("T")[0] : "",
        "Y - Décision FF Phase 2": candidate.scores?.phase2FfDecision || "",

        // Colonnes Z-AB: Décision finale et métier
        "Z - Décision Finale": candidate.scores?.finalDecision || "",
        "AA - Commentaire": candidate.scores?.comments || "",
        "AB - Métier": candidate.metier,

        // Colonnes AC-AD: Moyennes Face à Face
        "AC - Moyenne FF Phase 1": avgPhase1 !== null ? avgPhase1.toFixed(2) : "",
        "AD - Moyenne FF Phase 2": avgPhase2 !== null ? avgPhase2.toFixed(2) : "",

        // Colonnes AE-AF: Détails des jurys (optionnel - pour debug)
        "AE - Détail Jurys Phase 1": juryDetailsPhase1,
        "AF - Détail Jurys Phase 2": juryDetailsPhase2,

        // Suivi d'appel
        "AG - Statut Appel": candidate.scores?.callStatus || "",
        "AH - Tentatives Appel": candidate.scores?.callAttempts || "",
        "AH - Date Dernier Appel": candidate.scores?.lastCallDate ? candidate.scores.lastCallDate.toISOString().split("T")[0] : "",
        "AI - Notes Appel": candidate.scores?.callNotes || "",
      }
    })

    // Conversion en CSV
    const headers_row = Object.keys(results[0]).join(",")
    const data_rows = results.map((row: any) => {
      return Object.values(row)
        .map((value) => {
          if (value === null || value === undefined || value === "") return ""
          const stringValue = String(value)
          if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n") || stringValue.includes("\r")) {
            return `"${stringValue.replace(/"/g, '""')}"`
          }
          return stringValue
        })
        .join(",")
    })

    const csv = [headers_row, ...data_rows].join("\n")

    // BOM pour Excel UTF-8
    const bom = "\uFEFF"
    const csvWithBom = bom + csv

    return new NextResponse(csvWithBom, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="export_consolidation_${new Date().toISOString().split("T")[0]}.csv"`,
      },
    })
  } catch (error) {
    console.error("Error exporting to CSV:", error)
    return NextResponse.json({ error: "Erreur lors de l'export" }, { status: 500 })
  }
}