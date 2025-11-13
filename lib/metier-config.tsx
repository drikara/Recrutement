import { Metier } from '@prisma/client'

export interface MetierConfig {
  label: string
  requiredTests: {
    typing?: boolean
    excel?: boolean
    dictation?: boolean
    salesSimulation?: boolean
    psychotechnical?: boolean
    analysisExercise?: boolean
  }
  criteria: {
    minPhase1: number
    requiresPhase2: boolean
    minPhase2: number
    minTypingSpeed?: number
    minTypingAccuracy?: number
    minExcel?: number
    minDictation?: number
    minSalesSimulation?: number
    minPsychotechnical?: number
    minAnalysis?: number
  }
}

export const metierConfig: Record<Metier, MetierConfig> = {
  [Metier.CALL_CENTER]: {
    label: 'Call Center',
    requiredTests: {
      typing: true,
      excel: true,
      dictation: true
    },
    criteria: {
      minPhase1: 3,
      requiresPhase2: true,
      minPhase2: 3,
      minTypingSpeed: 17,
      minTypingAccuracy: 85,
      minExcel: 3,
      minDictation: 16
    }
  },
  
  [Metier.AGENCES]: {
    label: 'Agences',
    requiredTests: {
      typing: true,
      dictation: true,
      salesSimulation: true
    },
    criteria: {
      minPhase1: 3,
      requiresPhase2: true,
      minPhase2: 3,
      minTypingSpeed: 17,
      minTypingAccuracy: 85,
      minDictation: 16,
      minSalesSimulation: 3
    }
  },
  
  [Metier.BO_RECLAM]: {
    label: 'Back Office Réclamations',
    requiredTests: {
      typing: true,
      excel: true,
      dictation: true,
      psychotechnical: true
    },
    criteria: {
      minPhase1: 3,
      requiresPhase2: false, // Pas de jury Phase 2, mais tests techniques Phase 2
      minPhase2: 0,
      minTypingSpeed: 17,
      minTypingAccuracy: 85,
      minExcel: 3,
      minDictation: 16,
      minPsychotechnical: 8
    }
  },
  
  [Metier.TELEVENTE]: {
    label: 'Télévente',
    requiredTests: {
      typing: true,
      dictation: true,
      salesSimulation: true
    },
    criteria: {
      minPhase1: 3,
      requiresPhase2: true,
      minPhase2: 3,
      minTypingSpeed: 17,
      minTypingAccuracy: 85,
      minDictation: 16,
      minSalesSimulation: 3
    }
  },
  
  [Metier.RESEAUX_SOCIAUX]: {
    label: 'Réseaux Sociaux',
    requiredTests: {
      typing: true,
      dictation: true
    },
    criteria: {
      minPhase1: 3,
      requiresPhase2: true,
      minPhase2: 3,
      minTypingSpeed: 17,
      minTypingAccuracy: 85,
      minDictation: 16
    }
  },
  
  [Metier.SUPERVISION]: {
    label: 'Supervision',
    requiredTests: {
      typing: true,
      excel: true,
      dictation: true
    },
    criteria: {
      minPhase1: 3,
      requiresPhase2: true,
      minPhase2: 3,
      minTypingSpeed: 17,
      minTypingAccuracy: 85,
      minExcel: 3,
      minDictation: 16
    }
  },
  
  [Metier.BOT_COGNITIVE_TRAINER]: {
    label: 'Bot Cognitive Trainer',
    requiredTests: {
      excel: true,
      dictation: true,
      analysisExercise: true
    },
    criteria: {
      minPhase1: 3,
      requiresPhase2: true,
      minPhase2: 3,
      minExcel: 3,
      minDictation: 16,
      minAnalysis: 6
    }
  },
  
  [Metier.SMC_FIXE]: {
    label: 'SMC Fixe',
    requiredTests: {
      typing: true,
      excel: true,
      dictation: true
    },
    criteria: {
      minPhase1: 3,
      requiresPhase2: true,
      minPhase2: 3,
      minTypingSpeed: 17,
      minTypingAccuracy: 85,
      minExcel: 3,
      minDictation: 16
    }
  },
  
  [Metier.SMC_MOBILE]: {
    label: 'SMC Mobile',
    requiredTests: {
      typing: true,
      excel: true,
      dictation: true
    },
    criteria: {
      minPhase1: 3,
      requiresPhase2: true,
      minPhase2: 3,
      minTypingSpeed: 17,
      minTypingAccuracy: 85,
      minExcel: 3,
      minDictation: 16
    }
  }
}

export function getMetierConfig(metier: Metier): MetierConfig {
  return metierConfig[metier]
}

export function getRequiredTests(metier: Metier) {
  return metierConfig[metier].requiredTests
}