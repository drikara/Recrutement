// lib/consolidation.ts
import { Metier } from "@prisma/client"

export interface ConsolidationInput {
  faceToFaceScores: { score: number }[]
  typingSpeed?: number
  typingAccuracy?: number
  excel?: number
  dictation?: number
  salesSimulation?: number
  psychotechnical?: number
  analysisExercise?: number
}

export interface ConsolidationResult {
  isAdmitted: boolean
  details: {
    phase1Passed: boolean
    phase2Passed: boolean
    technicalTests: {
      [key: string]: { passed: boolean; value: any; required: any }
    }
  }
  averagePhase1: number
  averagePhase2: number
}

export function consolidateCandidate(metier: Metier, input: ConsolidationInput): ConsolidationResult {
  // Calcul des moyennes face à face
  const phase1Scores = input.faceToFaceScores // Tous les scores pour phase 1
  const phase2Scores = input.faceToFaceScores // Tous les scores pour phase 2
  
  const averagePhase1 = phase1Scores.length > 0 
    ? phase1Scores.reduce((sum, s) => sum + s.score, 0) / phase1Scores.length 
    : 0
  
  const averagePhase2 = phase2Scores.length > 0 
    ? phase2Scores.reduce((sum, s) => sum + s.score, 0) / phase2Scores.length 
    : 0

  // Application des critères par métier
  const criteria = getCriteriaForMetier(metier)
  
  const result: ConsolidationResult = {
    isAdmitted: true, // Par défaut true, on vérifie chaque critère
    details: {
      phase1Passed: averagePhase1 >= criteria.minPhase1,
      phase2Passed: !criteria.requiresPhase2 || averagePhase2 >= criteria.minPhase2,
      technicalTests: {}
    },
    averagePhase1,
    averagePhase2
  }

  // Vérification des tests techniques
  if (criteria.requiresTyping && input.typingSpeed !== undefined && input.typingAccuracy !== undefined) {
    const typingPassed = input.typingSpeed >= criteria.minTypingSpeed! && input.typingAccuracy >= criteria.minTypingAccuracy!
    result.details.technicalTests.typing = {
      passed: typingPassed,
      value: `${input.typingSpeed} MPM, ${input.typingAccuracy}%`,
      required: `${criteria.minTypingSpeed} MPM, ${criteria.minTypingAccuracy}%`
    }
    result.isAdmitted = result.isAdmitted && typingPassed
  }

  if (criteria.requiresExcel && input.excel !== undefined) {
    const excelPassed = input.excel >= criteria.minExcel!
    result.details.technicalTests.excel = {
      passed: excelPassed,
      value: input.excel,
      required: criteria.minExcel
    }
    result.isAdmitted = result.isAdmitted && excelPassed
  }

  if (criteria.requiresDictation && input.dictation !== undefined) {
    const dictationPassed = input.dictation >= criteria.minDictation!
    result.details.technicalTests.dictation = {
      passed: dictationPassed,
      value: input.dictation,
      required: criteria.minDictation
    }
    result.isAdmitted = result.isAdmitted && dictationPassed
  }

  if (criteria.requiresSalesSimulation && input.salesSimulation !== undefined) {
    const salesPassed = input.salesSimulation >= criteria.minSalesSimulation!
    result.details.technicalTests.salesSimulation = {
      passed: salesPassed,
      value: input.salesSimulation,
      required: criteria.minSalesSimulation
    }
    result.isAdmitted = result.isAdmitted && salesPassed
  }

  if (criteria.requiresPsychotechnical && input.psychotechnical !== undefined) {
    const psychoPassed = input.psychotechnical >= criteria.minPsychotechnical!
    result.details.technicalTests.psychotechnical = {
      passed: psychoPassed,
      value: input.psychotechnical,
      required: criteria.minPsychotechnical
    }
    result.isAdmitted = result.isAdmitted && psychoPassed
  }

  if (criteria.requiresAnalysis && input.analysisExercise !== undefined) {
    const analysisPassed = input.analysisExercise >= criteria.minAnalysis!
    result.details.technicalTests.analysisExercise = {
      passed: analysisPassed,
      value: input.analysisExercise,
      required: criteria.minAnalysis
    }
    result.isAdmitted = result.isAdmitted && analysisPassed
  }

  // Vérification finale des phases face à face
  result.isAdmitted = result.isAdmitted && 
    result.details.phase1Passed && 
    result.details.phase2Passed

  return result
}

function getCriteriaForMetier(metier: Metier) {
  const criteria = {
    // Call Center
    [Metier.CALL_CENTER]: {
      minPhase1: 3,
      requiresPhase2: true,
      minPhase2: 3,
      requiresTyping: true,
      minTypingSpeed: 17,
      minTypingAccuracy: 85,
      requiresExcel: true,
      minExcel: 3,
      requiresDictation: true,
      minDictation: 16
    },
    // Agences
    [Metier.AGENCES]: {
      minPhase1: 3,
      requiresPhase2: true,
      minPhase2: 3,
      requiresTyping: true,
      minTypingSpeed: 17,
      minTypingAccuracy: 85,
      requiresDictation: true,
      minDictation: 16,
      requiresSalesSimulation: true,
      minSalesSimulation: 3
    },
    // Bo Réclam
    [Metier.BO_RECLAM]: {
      minPhase1: 3,
      requiresPhase2: false,
      minPhase2: 0,
      requiresTyping: true,
      minTypingSpeed: 17,
      minTypingAccuracy: 85,
      requiresExcel: true,
      minExcel: 3,
      requiresDictation: true,
      minDictation: 16,
      requiresPsychotechnical: true,
      minPsychotechnical: 8
    },
    // Télévente
    [Metier.TELEVENTE]: {
      minPhase1: 3,
      requiresPhase2: true,
      minPhase2: 3,
      requiresTyping: true,
      minTypingSpeed: 17,
      minTypingAccuracy: 85,
      requiresDictation: true,
      minDictation: 16,
      requiresSalesSimulation: true,
      minSalesSimulation: 3
    },
    // Réseaux Sociaux
    [Metier.RESEAUX_SOCIAUX]: {
      minPhase1: 3,
      requiresPhase2: true,
      minPhase2: 3,
      requiresTyping: true,
      minTypingSpeed: 17,
      minTypingAccuracy: 85,
      requiresDictation: true,
      minDictation: 16
    },
    // Supervision
    [Metier.SUPERVISION]: {
      minPhase1: 3,
      requiresPhase2: true,
      minPhase2: 3,
      requiresTyping: true,
      minTypingSpeed: 17,
      minTypingAccuracy: 85,
      requiresExcel: true,
      minExcel: 3,
      requiresDictation: true,
      minDictation: 16
    },
    // Bot Cognitive Trainer
    [Metier.BOT_COGNITIVE_TRAINER]: {
      minPhase1: 3,
      requiresPhase2: true,
      minPhase2: 3,
      requiresExcel: true,
      minExcel: 3,
      requiresDictation: true,
      minDictation: 16,
      requiresAnalysis: true,
      minAnalysis: 6
    },
    // SMC Fixe
    [Metier.SMC_FIXE]: {
      minPhase1: 3,
      requiresPhase2: true,
      minPhase2: 3,
      requiresTyping: true,
      minTypingSpeed: 17,
      minTypingAccuracy: 85,
      requiresExcel: true,
      minExcel: 3,
      requiresDictation: true,
      minDictation: 16
    },
    // SMC Mobile
    [Metier.SMC_MOBILE]: {
      minPhase1: 3,
      requiresPhase2: true,
      minPhase2: 3,
      requiresTyping: true,
      minTypingSpeed: 17,
      minTypingAccuracy: 85,
      requiresExcel: true,
      minExcel: 3,
      requiresDictation: true,
      minDictation: 16
    }
  }

  return criteria[metier] || criteria[Metier.CALL_CENTER] // Fallback
}