import { Metier, FFDecision, Decision, FinalDecision, Disponibilite, Statut } from '@prisma/client'
import { metierConfig } from './metier-config'

export interface AutoDecisionsResult {
  phase1FfDecision: FFDecision | null
  phase1Decision: Decision | null
  decisionTest: FFDecision | null
  finalDecision: FinalDecision | null
}

/**
 * Vérifie si le Face-à-Face (Phase 1) est validé
 */
function isFaceToFaceValid(
  metier: Metier,
  juryAverages: {
    voiceQuality: number
    verbalCommunication: number
    presentationVisuelle?: number
  }
): boolean {
  const config = metierConfig[metier].criteria.faceToFace
  
  // Vérifier Qualité de la voix
  if (config.voiceQuality && juryAverages.voiceQuality < 3) return false
  
  // Vérifier Communication Verbale
  if (config.verbalCommunication && juryAverages.verbalCommunication < 3) return false
  
  // Pour AGENCES uniquement : vérifier Présentation Visuelle
  if (config.presentationVisuelle) {
    if (!juryAverages.presentationVisuelle || juryAverages.presentationVisuelle < 3) {
      return false
    }
  }
  
  return true
}

/**
 * Vérifie si la Simulation (Phase 2) est validée (AGENCES et TÉLÉVENTE uniquement)
 */
function isSimulationValid(
  metier: Metier,
  simulationAverages?: {
    sensNegociation: number
    capacitePersuasion: number
    sensCombativite: number
  }
): boolean {
  const config = metierConfig[metier].criteria.simulation
  
  // Si le métier ne requiert pas de simulation, c'est valide par défaut
  if (!config?.required) return true
  
  // Si simulation requise mais pas de données, c'est invalide
  if (!simulationAverages) return false
  
  // Vérifier chaque critère ≥ 3
  if (simulationAverages.sensNegociation < 3) return false
  if (simulationAverages.capacitePersuasion < 3) return false
  if (simulationAverages.sensCombativite < 3) return false
  
  return true
}

/**
 * Vérifie si tous les tests techniques sont validés
 */
function areTechnicalTestsValid(
  metier: Metier,
  technicalScores: {
    typingSpeed?: number
    typingAccuracy?: number
    excelTest?: number
    dictation?: number
    psychoRaisonnementLogique?: number
    psychoAttentionConcentration?: number
    analysisExercise?: number
  }
): boolean {
  const config = metierConfig[metier].criteria
  
  // Validation saisie
  if (config.typing?.required) {
    if (!technicalScores.typingSpeed || technicalScores.typingSpeed < config.typing.minSpeed) return false
    if (!technicalScores.typingAccuracy || technicalScores.typingAccuracy < config.typing.minAccuracy) return false
  }
  
  // Validation Excel
  if (config.excel?.required) {
    if (!technicalScores.excelTest || technicalScores.excelTest < config.excel.minScore) return false
  }
  
  // Validation Dictée
  if (config.dictation?.required) {
    if (!technicalScores.dictation || technicalScores.dictation < config.dictation.minScore) return false
  }
  
  // Validation Psycho
  if (config.psycho?.required) {
    if (!technicalScores.psychoRaisonnementLogique || 
        technicalScores.psychoRaisonnementLogique < config.psycho.minRaisonnementLogique) return false
    if (!technicalScores.psychoAttentionConcentration || 
        technicalScores.psychoAttentionConcentration < config.psycho.minAttentionConcentration) return false
  }
  
  // Validation Analyse
  if (config.analysis?.required) {
    if (!technicalScores.analysisExercise || 
        technicalScores.analysisExercise < config.analysis.minScore) return false
  }
  
  return true
}

/**
 * Calcule toutes les décisions automatiques pour un candidat
 */
export function calculateDecisions(
  metier: Metier,
  availability: Disponibilite,
  statut: Statut | null,
  juryAverages: {
    voiceQuality: number
    verbalCommunication: number
    presentationVisuelle?: number
  } | null, // ⭐ Changé pour accepter null
  simulationAverages?: {
    sensNegociation: number
    capacitePersuasion: number
    sensCombativite: number
  },
  technicalScores?: {
    typingSpeed?: number
    typingAccuracy?: number
    excelTest?: number
    dictation?: number
    psychoRaisonnementLogique?: number
    psychoAttentionConcentration?: number
    analysisExercise?: number
  }
): AutoDecisionsResult {
  console.log('📊 calculateDecisions appelée avec:', {
    metier,
    availability,
    statut,
    juryAverages,
    hasSimulation: !!simulationAverages,
    hasTechnicalScores: !!technicalScores
  })

  // 🔴 RÈGLE 1: Si disponibilité = NON → NON_RECRUTÉ automatique avec toutes les notes à 0
  if (availability === 'NON') {
    console.log('📊 calculateDecisions: Candidat non disponible → NON_RECRUTE automatique')
    return {
      phase1FfDecision: 'DEFAVORABLE',
      phase1Decision: 'ELIMINE',
      decisionTest: 'DEFAVORABLE',
      finalDecision: 'NON_RECRUTE'
    }
  }
  
  // 🔴 RÈGLE 2: Si candidat ABSENT → Pas de décision finale
  if (statut === 'ABSENT') {
    console.log('📊 calculateDecisions: Candidat absent → pas de décision')
    return {
      phase1FfDecision: null,
      phase1Decision: null,
      decisionTest: null,
      finalDecision: null
    }
  }
  
  // ✅ RÈGLE 3: Vérifier Face à Face (Phase 1)
  // ⭐ IMPORTANT: Si pas de notes de jury, on ne peut pas décider
  if (!juryAverages) {
    console.log('📊 calculateDecisions: Pas de notes de jury → en attente')
    return {
      phase1FfDecision: null,
      phase1Decision: null,
      decisionTest: null,
      finalDecision: null
    }
  }

  const faceToFaceValid = isFaceToFaceValid(metier, juryAverages)
  
  if (!faceToFaceValid) {
    console.log('📊 calculateDecisions: Face-à-face non validé → NON_RECRUTE')
    return {
      phase1FfDecision: 'DEFAVORABLE',
      phase1Decision: 'ELIMINE',
      decisionTest: 'DEFAVORABLE',
      finalDecision: 'NON_RECRUTE'
    }
  }
  
  const phase1FfDecision: FFDecision = 'FAVORABLE'
  const phase1Decision: Decision = 'ADMIS'
  
  // ✅ RÈGLE 4: Vérifier Simulation (Phase 2) si AGENCES ou TÉLÉVENTE
  const needsSimulation = metier === 'AGENCES' || metier === 'TELEVENTE'
  
  if (needsSimulation) {
    const simulationValid = isSimulationValid(metier, simulationAverages)
    
    if (!simulationValid) {
      console.log('📊 calculateDecisions: Simulation non validée → NON_RECRUTE')
      return {
        phase1FfDecision,
        phase1Decision,
        decisionTest: 'DEFAVORABLE',
        finalDecision: 'NON_RECRUTE'
      }
    }
  }
  
  // ✅ RÈGLE 5: Vérifier les tests techniques
  if (!technicalScores) {
    // Pas encore de tests techniques → en attente
    console.log('📊 calculateDecisions: Pas de tests techniques → en attente')
    return {
      phase1FfDecision,
      phase1Decision,
      decisionTest: needsSimulation ? 'FAVORABLE' : null,
      finalDecision: null
    }
  }
  
  const technicalTestsValid = areTechnicalTestsValid(metier, technicalScores)
  const decisionTest: FFDecision = technicalTestsValid ? 'FAVORABLE' : 'DEFAVORABLE'
  const finalDecision: FinalDecision = technicalTestsValid ? 'RECRUTE' : 'NON_RECRUTE'
  
  console.log('📊 calculateDecisions: Décision finale:', {
    decisionTest,
    finalDecision,
    technicalTestsValid
  })
  
  return {
    phase1FfDecision,
    phase1Decision,
    decisionTest,
    finalDecision
  }
}

/**
 * Formate une décision pour l'affichage
 */
export function formatDecision(decision: string | null | undefined): string {
  if (!decision) return 'En attente'
  
  const map: Record<string, string> = {
    'FAVORABLE': '✅ Favorable',
    'DEFAVORABLE': '❌ Défavorable',
    'ADMIS': '✅ Admis',
    'ELIMINE': '❌ Éliminé',
    'RECRUTE': '🎯 Recruté',
    'NON_RECRUTE': '🚫 Non recruté',
    'PRESENT': '✅ Présent',
    'ABSENT': '❌ Absent',
    'OUI': '✅ Oui',
    'NON': '❌ Non'
  }
  
  return map[decision] || decision
}