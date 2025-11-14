// lib/export-utils.ts
import { Metier } from '@prisma/client'
import { metierConfig } from './metier-config'
import type * as XLSX from 'xlsx'

// ✅ Définir les colonnes spécifiques à chaque métier
const metierColumns: Record<Metier, string[]> = {
  [Metier.CALL_CENTER]: [
    'Rapidité de saisie (MPM)',
    'Précision de saisie (%)',
    'Test Excel (/5)',
    'Dictée (/20)',
    'Date de présence Phase 2'
  ],
  [Metier.AGENCES]: [
    'Rapidité de saisie (MPM)',
    'Précision de saisie (%)',
    'Dictée (/20)',
    'Date de présence Phase 2',
    'Simulation de Vente (/5)'
  ],
  [Metier.BO_RECLAM]: [
    'Test Psychotechnique (/10)',
    'Rapidité de saisie (MPM)',
    'Précision de saisie (%)',
    'Test Excel (/5)',
    'Dictée (/20)',
    'Date de présence Phase 2'
  ],
  [Metier.TELEVENTE]: [
    'Rapidité de saisie (MPM)',
    'Précision de saisie (%)',
    'Dictée (/20)',
    'Date de présence Phase 2',
    'Simulation de Vente (/5)'
  ],
  [Metier.RESEAUX_SOCIAUX]: [
    'Rapidité de saisie (MPM)',
    'Précision de saisie (%)',
    'Dictée (/20)',
    'Date de présence Phase 2'
  ],
  [Metier.SUPERVISION]: [
    'Rapidité de saisie (MPM)',
    'Précision de saisie (%)',
    'Test Excel (/5)',
    'Dictée (/20)',
    'Date de présence Phase 2'
  ],
  [Metier.BOT_COGNITIVE_TRAINER]: [
    'Test Excel (/5)',
    'Dictée (/20)',
    'Date de présence Phase 2',
    'Exercice d\'Analyse (/10)'
  ],
  [Metier.SMC_FIXE]: [
    'Rapidité de saisie (MPM)',
    'Précision de saisie (%)',
    'Test Excel (/5)',
    'Dictée (/20)',
    'Date de présence Phase 2'
  ],
  [Metier.SMC_MOBILE]: [
    'Rapidité de saisie (MPM)',
    'Précision de saisie (%)',
    'Test Excel (/5)',
    'Dictée (/20)',
    'Date de présence Phase 2'
  ]
}

// ✅ Fonction pour obtenir la valeur d'une colonne selon le métier
function getColumnValue(candidate: any, columnName: string): string {
  const scores = candidate.scores
  
  switch (columnName) {
    case 'Test Psychotechnique (/10)':
      return scores?.psychotechnicalTest?.toString() || ''
    case 'Rapidité de saisie (MPM)':
      return scores?.typingSpeed?.toString() || ''
    case 'Précision de saisie (%)':
      return scores?.typingAccuracy?.toString() || ''
    case 'Test Excel (/5)':
      return scores?.excelTest?.toString() || ''
    case 'Dictée (/20)':
      return scores?.dictation?.toString() || ''
    case 'Date de présence Phase 2':
      return scores?.phase2Date ? new Date(scores.phase2Date).toLocaleDateString('fr-FR') : ''
    case 'Simulation de Vente (/5)':
      return scores?.salesSimulation?.toString() || ''
    case 'Exercice d\'Analyse (/10)':
      return scores?.analysisExercise?.toString() || ''
    default:
      return ''
  }
}

// ✅ Fonction pour formater les détails des jurys
function formatJuryDetails(faceToFaceScores: any[], phase: number): string {
  const phaseScores = faceToFaceScores.filter(s => s.phase === phase)
  
  if (phaseScores.length === 0) return ''
  
  return phaseScores.map(score => {
    const juryName = score.juryMember?.fullName || 'Inconnu'
    const roleType = score.juryMember?.roleType || ''
    
    // Pour Phase 1, calculer la moyenne des 3 critères
    if (phase === 1) {
      const pres = Number(score.presentationVisuelle) || 0
      const verbal = Number(score.verbalCommunication) || 0
      const voice = Number(score.voiceQuality) || 0
      const avg = ((pres + verbal + voice) / 3).toFixed(2)
      return `${juryName} (${roleType}): ${avg}/5`
    }
    
    // Pour Phase 2, utiliser le score direct
    return `${juryName} (${roleType}): ${score.score}/5`
  }).join('; ')
}

// ✅ Fonction pour calculer la moyenne Phase 1
function calculatePhase1Average(faceToFaceScores: any[]): string {
  const phase1Scores = faceToFaceScores.filter(s => s.phase === 1)
  
  if (phase1Scores.length === 0) return ''
  
  const avg = phase1Scores.reduce((sum, score) => {
    const pres = Number(score.presentationVisuelle) || 0
    const verbal = Number(score.verbalCommunication) || 0
    const voice = Number(score.voiceQuality) || 0
    return sum + ((pres + verbal + voice) / 3)
  }, 0) / phase1Scores.length
  
  return avg.toFixed(2)
}

// ✅ Fonction pour calculer la moyenne Phase 2
function calculatePhase2Average(faceToFaceScores: any[]): string {
  const phase2Scores = faceToFaceScores.filter(s => s.phase === 2)
  
  if (phase2Scores.length === 0) return ''
  
  const avg = phase2Scores.reduce((sum, score) => sum + (Number(score.score) || 0), 0) / phase2Scores.length
  
  return avg.toFixed(2)
}

// ✅ Export XLSX par session
export async function generateSessionExportXLSX(session: any): Promise<{ buffer: ArrayBuffer, filename: string }> {
  const XLSX = await import('xlsx')
  
  const metier = session.metier
  const sessionDate = new Date(session.date).toISOString().split('T')[0]
  
  // En-têtes de base (ordre spécifié)
  const baseHeaders = [
    'Numéro', 'Noms et Prénoms', 'Numéro de Téléphone', 'Date de naissance', 'Âge',
    'Diplôme', 'Établissement fréquenté', 'Email', 'Lieu d\'habitation',
    'Date d\'envoi SMS', 'Disponibilité candidat', 'Date de présence entretien',
    'Métier Candidat', 'Session Métier', 'Date de Session', 'Jour de Session',
    'Statut de Session', 'Détail Jurys Phase 1', 'Moyenne FF Phase 1',
    'Décision FF Phase 1', 'Décision Phase 1', 'Détail Jurys Phase 2', 
    'Moyenne FF Phase 2', 'Décision FF Phase 2', 'Statut Appel', 
    'Décision Finale', 'Commentaire'
  ]
  
  const metierSpecificColumns = metierColumns[metier as Metier] || []
  const headers = [...baseHeaders, ...metierSpecificColumns]
  
  // Générer les données
  const data = [headers]
  
  session.candidates.forEach((candidate: any, index: number) => {
    const baseRow = [
      index + 1,
      candidate.fullName || '',
      candidate.phone || '',
      candidate.birthDate ? new Date(candidate.birthDate).toLocaleDateString('fr-FR') : '',
      candidate.age || '',
      candidate.diploma || '',
      candidate.institution || '',
      candidate.email || '',
      candidate.location || '',
      candidate.smsSentDate ? new Date(candidate.smsSentDate).toLocaleDateString('fr-FR') : '',
      candidate.availability || '',
      candidate.interviewDate ? new Date(candidate.interviewDate).toLocaleDateString('fr-FR') : '',
      candidate.metier || '',
      session.metier || '',
      sessionDate,
      session.jour || '',
      session.status || '',
      formatJuryDetails(candidate.faceToFaceScores || [], 1),
      calculatePhase1Average(candidate.faceToFaceScores || []),
      candidate.scores?.phase1FfDecision || '',
      candidate.scores?.phase1Decision || '',
      formatJuryDetails(candidate.faceToFaceScores || [], 2),
      calculatePhase2Average(candidate.faceToFaceScores || []),
      candidate.scores?.phase2FfDecision || '',
      candidate.scores?.callStatus || '',
      candidate.scores?.finalDecision || '',
      candidate.scores?.comments || ''
    ]
    
    const metierSpecificValues = metierSpecificColumns.map(col => getColumnValue(candidate, col))
    data.push([...baseRow, ...metierSpecificValues])
  })
  
  // Créer le workbook
  const ws = XLSX.utils.aoa_to_sheet(data)
  
  // Ajuster la largeur des colonnes
  const colWidths = headers.map(() => ({ wch: 20 }))
  ws['!cols'] = colWidths
  
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Session')
  
  const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  const filename = `session_${metier}_${sessionDate}_${session.jour}.xlsx`
  
  return { buffer, filename }
}

// ✅ Export XLSX consolidé
export async function generateConsolidatedExportXLSX(sessions: any[]): Promise<{ buffer: ArrayBuffer, filename: string }> {
  const XLSX = await import('xlsx')
  
  const metiersPresent = Array.from(new Set(
    sessions.flatMap(s => s.candidates.map((c: any) => c.metier))
  )) as Metier[]
  
  // En-têtes de base (ordre spécifié)
  const baseHeaders = [
    'Numéro', 'Noms et Prénoms', 'Numéro de Téléphone', 'Date de naissance', 'Âge',
    'Diplôme', 'Établissement fréquenté', 'Email', 'Lieu d\'habitation',
    'Date d\'envoi SMS', 'Disponibilité candidat', 'Date de présence entretien',
    'Métier Candidat', 'Session Métier', 'Date de Session', 'Jour de Session',
    'Statut de Session', 'Lieu de Session', 'Détail Jurys Phase 1', 
    'Moyenne FF Phase 1', 'Décision FF Phase 1', 'Décision Phase 1', 
    'Détail Jurys Phase 2', 'Moyenne FF Phase 2', 'Décision FF Phase 2', 
    'Statut Appel', 'Décision Finale', 'Commentaire'
  ]
  
  const allMetierColumns = new Set<string>()
  metiersPresent.forEach(metier => {
    metierColumns[metier]?.forEach(col => allMetierColumns.add(col))
  })
  
  const headers = [...baseHeaders, ...Array.from(allMetierColumns)]
  const data = [headers]
  
  let candidateNumber = 1
  
  for (const session of sessions) {
    for (const candidate of session.candidates) {
      const candidateMetier = candidate.metier as Metier
      const sessionDate = new Date(session.date).toISOString().split('T')[0]
      
      const baseRow = [
        candidateNumber,
        candidate.fullName || '',
        candidate.phone || '',
        candidate.birthDate ? new Date(candidate.birthDate).toLocaleDateString('fr-FR') : '',
        candidate.age || '',
        candidate.diploma || '',
        candidate.institution || '',
        candidate.email || '',
        candidate.location || '',
        candidate.smsSentDate ? new Date(candidate.smsSentDate).toLocaleDateString('fr-FR') : '',
        candidate.availability || '',
        candidate.interviewDate ? new Date(candidate.interviewDate).toLocaleDateString('fr-FR') : '',
        candidate.metier || '',
        session.metier || '',
        sessionDate,
        session.jour || '',
        session.status || '',
        session.location || '',
        formatJuryDetails(candidate.faceToFaceScores || [], 1),
        calculatePhase1Average(candidate.faceToFaceScores || []),
        candidate.scores?.phase1FfDecision || '',
        candidate.scores?.phase1Decision || '',
        formatJuryDetails(candidate.faceToFaceScores || [], 2),
        calculatePhase2Average(candidate.faceToFaceScores || []),
        candidate.scores?.phase2FfDecision || '',
        candidate.scores?.callStatus || '',
        candidate.scores?.finalDecision || '',
        candidate.scores?.comments || ''
      ]
      
      const metierSpecificValues = Array.from(allMetierColumns).map(col => {
        const candidateMetierColumns = metierColumns[candidateMetier] || []
        if (candidateMetierColumns.includes(col)) {
          return getColumnValue(candidate, col)
        }
        return ''
      })
      
      data.push([...baseRow, ...metierSpecificValues])
      candidateNumber++
    }
  }
  
  // Créer le workbook
  const ws = XLSX.utils.aoa_to_sheet(data)
  
  // Ajuster la largeur des colonnes
  const colWidths = headers.map(() => ({ wch: 20 }))
  ws['!cols'] = colWidths
  
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Consolidé')
  
  const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  
  let filename = 'export_consolide'
  if (sessions.length === 1) {
    const session = sessions[0]
    const sessionDate = new Date(session.date).toISOString().split('T')[0]
    filename = `metier_${session.metier}_${sessionDate}_${session.status.toLowerCase()}_consolide`
  } else if (metiersPresent.length === 1) {
    filename = `metier_${metiersPresent[0]}_${new Date().toISOString().split('T')[0]}_consolide`
  } else {
    filename = `export_complet_${new Date().toISOString().split('T')[0]}_consolide`
  }
  
  filename += '.xlsx'
  
  return { buffer, filename }
}