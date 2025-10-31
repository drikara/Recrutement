// lib/export-utils.ts
import { RecruitmentSession, Metier } from "@prisma/client"

export function generateSessionExport(session: any) {
  const columns = getColumnsForMetier(session.metier)
  
  const headers = columns.map(col => `"${col}"`).join(',')
  
  const rows = session.candidates.map((candidate: any, index: number) => {
    const phase1Scores = candidate.faceToFaceScores.filter((s: any) => s.phase === 1)
    const phase2Scores = candidate.faceToFaceScores.filter((s: any) => s.phase === 2)
    
    const avgPhase1 = phase1Scores.length > 0 
      ? phase1Scores.reduce((sum: number, s: any) => sum + Number(s.score), 0) / phase1Scores.length 
      : null
    
    const avgPhase2 = phase2Scores.length > 0 
      ? phase2Scores.reduce((sum: number, s: any) => sum + Number(s.score), 0) / phase2Scores.length 
      : null

    // Détails des jurys
    const juryDetailsPhase1 = phase1Scores.map((score: any) => 
      `${score.juryMember.fullName} (${score.juryMember.roleType}): ${score.score}`
    ).join('; ')

    const juryDetailsPhase2 = phase2Scores.map((score: any) => 
      `${score.juryMember.fullName} (${score.juryMember.roleType}): ${score.score}`
    ).join('; ')

    const rowData: any = {
      // Informations de base
      "Numéro": index + 1,
      "Noms et Prénoms": candidate.fullName,
      "Téléphone": candidate.phone,
      "Email": candidate.email,
      "Métier": candidate.metier,
      "Session": `${session.metier} - ${session.jour} ${session.date.toISOString().split('T')[0]}`,
      
      // Scores face à face
      "Moyenne FF Phase 1": avgPhase1 !== null ? avgPhase1.toFixed(2) : "",
      "Moyenne FF Phase 2": avgPhase2 !== null ? avgPhase2.toFixed(2) : "",
      "Détail Phase 1": juryDetailsPhase1,
      "Détail Phase 2": juryDetailsPhase2,
      
      // Décision finale
      "Décision Finale": candidate.scores?.finalDecision || "",
      "Commentaires": candidate.scores?.comments || "",
    }

    // Ajout des colonnes spécifiques au métier
    addMetierSpecificColumns(rowData, session.metier, candidate)

    return columns.map(col => `"${escapeCsvValue(rowData[col] || '')}"`).join(',')
  })

  return [headers, ...rows].join('\n')
}

function getColumnsForMetier(metier: Metier): string[] {
  const baseColumns = [
    "Numéro", "Noms et Prénoms", "Téléphone", "Email", "Métier", "Session",
    "Moyenne FF Phase 1", "Moyenne FF Phase 2", "Détail Phase 1", "Détail Phase 2"
  ]

  const metierColumns: { [key in Metier]: string[] } = {
    [Metier.CALL_CENTER]: ["Rapidité saisie (MPM)", "Précision saisie (%)", "Test Excel", "Dictée"],
    [Metier.AGENCES]: ["Rapidité saisie (MPM)", "Précision saisie (%)", "Dictée", "Simulation Vente"],
    [Metier.BO_RECLAM]: ["Rapidité saisie (MPM)", "Précision saisie (%)", "Test Excel", "Dictée", "Test Psychotechnique"],
    [Metier.TELEVENTE]: ["Rapidité saisie (MPM)", "Précision saisie (%)", "Dictée", "Simulation Vente"],
    [Metier.RESEAUX_SOCIAUX]: ["Rapidité saisie (MPM)", "Précision saisie (%)", "Dictée"],
    [Metier.SUPERVISION]: ["Rapidité saisie (MPM)", "Précision saisie (%)", "Test Excel", "Dictée"],
    [Metier.BOT_COGNITIVE_TRAINER]: ["Test Excel", "Dictée", "Exercice Analyse"],
    [Metier.SMC_FIXE]: ["Rapidité saisie (MPM)", "Précision saisie (%)", "Test Excel", "Dictée"],
    [Metier.SMC_MOBILE]: ["Rapidité saisie (MPM)", "Précision saisie (%)", "Test Excel", "Dictée"]
  }

  return [...baseColumns, ...metierColumns[metier], "Décision Finale", "Commentaires"]
}

function addMetierSpecificColumns(rowData: any, metier: Metier, candidate: any) {
  const scores = candidate.scores

  switch (metier) {
    case Metier.CALL_CENTER:
      rowData["Rapidité saisie (MPM)"] = scores?.typingSpeed || ""
      rowData["Précision saisie (%)"] = scores?.typingAccuracy ? Number(scores.typingAccuracy) : ""
      rowData["Test Excel"] = scores?.excelTest ? Number(scores.excelTest) : ""
      rowData["Dictée"] = scores?.dictation ? Number(scores.dictation) : ""
      break

    case Metier.BOT_COGNITIVE_TRAINER:
      // Pas de saisie pour ce métier
      rowData["Test Excel"] = scores?.excelTest ? Number(scores.excelTest) : ""
      rowData["Dictée"] = scores?.dictation ? Number(scores.dictation) : ""
      rowData["Exercice Analyse"] = scores?.analysisExercise ? Number(scores.analysisExercise) : ""
      break

    // ... autres cas pour chaque métier
  }
}

function escapeCsvValue(value: any): string {
  if (value === null || value === undefined) return ''
  const stringValue = String(value)
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n') || stringValue.includes('\r')) {
    return stringValue.replace(/"/g, '""')
  }
  return stringValue
}