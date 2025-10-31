import { Metier, FFDecision, Decision, FinalDecision } from '@prisma/client'
import { metierConfig } from './metier-config'

export interface ScoreData {
  visual_presentation?: number
  verbal_communication?: number
  voice_quality?: number
  psychotechnical_test?: number
  typing_speed?: number
  typing_accuracy?: number
  excel_test?: number
  dictation?: number
  sales_simulation?: number
  analysis_exercise?: number
}

export interface AutoDecisions {
  phase1FfDecision: FFDecision | null
  phase1Decision: Decision | null
  phase2FfDecision: FFDecision | null
  finalDecision: FinalDecision | null
}

export function calculateAutoDecisions(
  metier: Metier,
  scores: ScoreData,
  faceToFacePhase1Avg: number = 0
): AutoDecisions {
  const config = metierConfig[metier]
  
  // Initialiser avec des valeurs par défaut
  let phase1FfDecision: FFDecision | null = null
  let phase1Decision: Decision | null = null
  let phase2FfDecision: FFDecision | null = null
  let finalDecision: FinalDecision | null = null

  // Phase 1 - Calcul basé sur les 3 critères
  const phase1Scores = [
    scores.visual_presentation || 0,
    scores.verbal_communication || 0,
    scores.voice_quality || 0
  ]
  
  // Calculer la moyenne seulement si au moins un score est saisi
  const hasPhase1Scores = phase1Scores.some(score => score > 0)
  
  if (hasPhase1Scores) {
    const phase1Avg = phase1Scores.reduce((sum, score) => sum + score, 0) / 3
    
    // Utiliser les valeurs littérales exactes attendues par Prisma
    phase1FfDecision = phase1Avg >= config.criteria.minPhase1 ? 'FAVORABLE' : 'DEFAVORABLE'
    phase1Decision = phase1FfDecision === 'FAVORABLE' ? 'ADMIS' : 'ELIMINE'
  }

  // Phase 2 - Calcul basé sur les tests requis
  let phase2Pass = false

  // CORRECTION : Utiliser config.criteria.requiresPhase2 au lieu de config.requiresPhase2
  if (config.criteria.requiresPhase2) {
    const phase2Tests: boolean[] = []
    
    // Test de saisie
    if (config.requiredTests.typing) {
      const hasTypingScores = (scores.typing_speed || 0) > 0 || (scores.typing_accuracy || 0) > 0
      const typingPass = hasTypingScores && 
                        (scores.typing_speed || 0) >= (config.criteria.minTypingSpeed || 0) && 
                        (scores.typing_accuracy || 0) >= (config.criteria.minTypingAccuracy || 0)
      phase2Tests.push(typingPass)
    }
    
    // Test Excel
    if (config.requiredTests.excel) {
      const hasExcelScore = (scores.excel_test || 0) > 0
      const excelPass = hasExcelScore && (scores.excel_test || 0) >= (config.criteria.minExcel || 0)
      phase2Tests.push(excelPass)
    }
    
    // Test Dictée
    if (config.requiredTests.dictation) {
      const hasDictationScore = (scores.dictation || 0) > 0
      const dictationPass = hasDictationScore && (scores.dictation || 0) >= (config.criteria.minDictation || 0)
      phase2Tests.push(dictationPass)
    }
    
    // Test Simulation Vente
    if (config.requiredTests.salesSimulation) {
      const hasSalesScore = (scores.sales_simulation || 0) > 0
      const salesPass = hasSalesScore && (scores.sales_simulation || 0) >= (config.criteria.minSalesSimulation || 0)
      phase2Tests.push(salesPass)
    }
    
    // Test Exercice Analyse
    if (config.requiredTests.analysisExercise) {
      const hasAnalysisScore = (scores.analysis_exercise || 0) > 0
      const analysisPass = hasAnalysisScore && (scores.analysis_exercise || 0) >= (config.criteria.minAnalysis || 0)
      phase2Tests.push(analysisPass)
    }
    
    // Test Psychotechnique
    if (config.requiredTests.psychotechnical) {
      const hasPsychotechnicalScore = (scores.psychotechnical_test || 0) > 0
      const psychotechnicalPass = hasPsychotechnicalScore && (scores.psychotechnical_test || 0) >= (config.criteria.minPsychotechnical || 0)
      phase2Tests.push(psychotechnicalPass)
    }
    
    // Phase 2 est réussie si tous les tests requis sont passés
    const hasPhase2Scores = phase2Tests.length > 0
    phase2Pass = hasPhase2Scores && phase2Tests.every(test => test === true)
    phase2FfDecision = hasPhase2Scores ? (phase2Pass ? 'FAVORABLE' : 'DEFAVORABLE') : null
  }

  // Décision finale - CORRECTION : Utiliser config.criteria.requiresPhase2 ici aussi
  if (phase1FfDecision === 'FAVORABLE') {
    if (!config.criteria.requiresPhase2) {
      // Métiers sans Phase 2
      finalDecision = 'RECRUTE'
    } else if (phase2FfDecision === 'FAVORABLE') {
      // Métiers avec Phase 2 réussie
      finalDecision = 'RECRUTE'
    } else if (phase2FfDecision === 'DEFAVORABLE') {
      finalDecision = 'NON_RECRUTE'
    }
  } else if (phase1FfDecision === 'DEFAVORABLE') {
    finalDecision = 'NON_RECRUTE'
  }

  return {
    phase1FfDecision,
    phase1Decision,
    phase2FfDecision,
    finalDecision
  }
}

export function shouldShowTest(metier: Metier, testName: keyof typeof metierConfig[Metier]['requiredTests']): boolean {
  const config = metierConfig[metier]
  return config.requiredTests[testName] || false
}

export function getMetierTests(metier: Metier): string[] {
  const config = metierConfig[metier]
  const tests: string[] = []
  
  if (config.requiredTests.typing) tests.push('Saisie (17 MPM + 85%)')
  if (config.requiredTests.excel) tests.push('Excel (≥ 3/5)')
  if (config.requiredTests.dictation) tests.push('Dictée (≥ 16/20)')
  if (config.requiredTests.salesSimulation) tests.push('Simulation Vente (≥ 3/5)')
  if (config.requiredTests.psychotechnical) tests.push('Test Psychotechnique (≥ 8/10)')
  if (config.requiredTests.analysisExercise) tests.push('Exercice Analyse (≥ 6/10)')
  
  return tests
}

// Fonction utilitaire pour formater les décisions
export function formatDecision(decision: string | null): string {
  if (!decision) return 'Non calculé'
  
  const decisionMap: Record<string, string> = {
    'FAVORABLE': '✅ FAVORABLE',
    'DEFAVORABLE': '❌ DÉFAVORABLE', 
    'ADMIS': '✅ ADMIS',
    'ELIMINE': '❌ ÉLIMINÉ',
    'RECRUTE': '🎯 RECRUTE',
    'NON_RECRUTE': '🚫 NON RECRUTE'
  }
  
  return decisionMap[decision] || decision
}