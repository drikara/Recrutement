import { Metier, FFDecision } from '@prisma/client'
import { prisma } from '@/lib/prisma'

export interface SimulationUnlockStatus {
  unlocked: boolean
  unlockedPhase2: boolean
  conditions: {
    allJurysEvaluatedPhase1: boolean
    allAveragesAboveThreshold: boolean
    allDecisionsFavorable: boolean
    isCorrectMetier: boolean
  }
  missingJurys: Array<{
    juryMemberId: number
    fullName: string
    roleType: string
  }>
  phase1Averages: {
    presentationVisuelle?: number
    verbalCommunication: number
    voiceQuality: number
  }
  phase1Decisions: Array<{
    juryMemberId: number
    fullName: string
    decision: FFDecision
  }>
  missingConditions: string[]
}

/**
 * Vérifie si la simulation (Phase 2) peut être débloquée pour un candidat
 */
export async function checkSimulationUnlockStatus(
  candidateId: number,
  metier: Metier
): Promise<SimulationUnlockStatus> {
  // Par défaut, non débloqué
  const defaultStatus: SimulationUnlockStatus = {
    unlocked: false,
    unlockedPhase2: false,
    conditions: {
      allJurysEvaluatedPhase1: false,
      allAveragesAboveThreshold: false,
      allDecisionsFavorable: false,
      isCorrectMetier: false
    },
    missingJurys: [],
    phase1Averages: {
      verbalCommunication: 0,
      voiceQuality: 0
    },
    phase1Decisions: [],
    missingConditions: []
  }

  try {
    // Vérifier si le métier nécessite une simulation
    const needsSimulation = metier === 'AGENCES' || metier === 'TELEVENTE'
    
    if (!needsSimulation) {
      return {
        ...defaultStatus,
        conditions: {
          ...defaultStatus.conditions,
          isCorrectMetier: false
        },
        missingConditions: [`Le métier ${metier} ne nécessite pas de simulation`]
      }
    }

    // Récupérer tous les scores des jurys pour la phase 1
    const juryScores = await prisma.faceToFaceScore.findMany({
      where: {
        candidateId,
        phase: 1
      },
      include: {
        juryMember: {
          select: {
            id: true,
            fullName: true,
            roleType: true
          }
        }
      }
    })

    // Si aucun jury n'a noté
    if (juryScores.length === 0) {
      return {
        ...defaultStatus,
        conditions: {
          ...defaultStatus.conditions,
          isCorrectMetier: true
        },
        missingConditions: ['Aucun jury n\'a noté la phase 1']
      }
    }

    // Récupérer tous les jurys assignés à la session
    const candidate = await prisma.candidate.findUnique({
      where: { id: candidateId },
      select: { sessionId: true }
    })

    let totalAssignedJurys = 0
    if (candidate?.sessionId) {
      const assignedJurys = await prisma.juryPresence.findMany({
        where: { sessionId: candidate.sessionId },
        include: {
          juryMember: {
            select: {
              id: true,
              fullName: true,
              roleType: true
            }
          }
        }
      })
      totalAssignedJurys = assignedJurys.length
      
      // Trouver les jurys manquants (assignés mais n'ayant pas noté)
      const evaluatedJuryIds = juryScores.map(s => s.juryMemberId)
      const missingJurys = assignedJurys
        .filter(jp => !evaluatedJuryIds.includes(jp.juryMemberId))
        .map(jp => ({
          juryMemberId: jp.juryMemberId,
          fullName: jp.juryMember.fullName,
          roleType: jp.juryMember.roleType
        }))
      
      defaultStatus.missingJurys = missingJurys
    }

    // Calculer les moyennes
    const totalScores = {
      presentationVisuelle: 0,
      verbalCommunication: 0,
      voiceQuality: 0
    }

    let count = 0
    const decisions: Array<{
      juryMemberId: number
      fullName: string
      decision: FFDecision
    }> = []

    juryScores.forEach(score => {
      if (score.presentationVisuelle) {
        totalScores.presentationVisuelle += Number(score.presentationVisuelle)
      }
      if (score.verbalCommunication) {
        totalScores.verbalCommunication += Number(score.verbalCommunication)
      }
      if (score.voiceQuality) {
        totalScores.voiceQuality += Number(score.voiceQuality)
      }
      
      if (score.decision) {
        decisions.push({
          juryMemberId: score.juryMemberId,
          fullName: score.juryMember.fullName,
          decision: score.decision
        })
      }
      
      count++
    })

    // Calcul des moyennes
    const averages = {
      presentationVisuelle: metier === 'AGENCES' ? 
        totalScores.presentationVisuelle / count : undefined,
      verbalCommunication: totalScores.verbalCommunication / count,
      voiceQuality: totalScores.voiceQuality / count
    }

    // Vérifier les conditions
    const allJurysEvaluatedPhase1 = totalAssignedJurys > 0 && count === totalAssignedJurys
    const allAveragesAboveThreshold = (
      (metier !== 'AGENCES' || (averages.presentationVisuelle || 0) >= 3) &&
      averages.verbalCommunication >= 3 &&
      averages.voiceQuality >= 3
    )
    const allDecisionsFavorable = decisions.length > 0 && decisions.every(d => d.decision === 'FAVORABLE')
    const isCorrectMetier = needsSimulation

    // Vérifier si la simulation est débloquée
    const unlocked = allJurysEvaluatedPhase1 && 
                    allAveragesAboveThreshold && 
                    allDecisionsFavorable && 
                    isCorrectMetier

    // Identifier les conditions manquantes
    const missingConditions: string[] = []
    
    if (!allJurysEvaluatedPhase1) {
      if (totalAssignedJurys === 0) {
        missingConditions.push('Aucun jury assigné à la session')
      } else {
        missingConditions.push(`${count}/${totalAssignedJurys} jurys ont noté`)
      }
    }
    
    if (!allAveragesAboveThreshold) {
      const failedCriteria: string[] = []
      if (metier === 'AGENCES' && (averages.presentationVisuelle || 0) < 3) {
        failedCriteria.push(`Présentation visuelle (${(averages.presentationVisuelle || 0).toFixed(2)}/5)`)
      }
      if (averages.verbalCommunication < 3) {
        failedCriteria.push(`Communication verbale (${averages.verbalCommunication.toFixed(2)}/5)`)
      }
      if (averages.voiceQuality < 3) {
        failedCriteria.push(`Qualité vocale (${averages.voiceQuality.toFixed(2)}/5)`)
      }
      missingConditions.push(`Moyennes insuffisantes: ${failedCriteria.join(', ')}`)
    }
    
    if (!allDecisionsFavorable) {
      const unfavorableJurys = decisions
        .filter(d => d.decision !== 'FAVORABLE')
        .map(d => d.fullName)
      missingConditions.push(`Décisions défavorables: ${unfavorableJurys.join(', ')}`)
    }

    return {
      unlocked,
      unlockedPhase2: unlocked,
      conditions: {
        allJurysEvaluatedPhase1,
        allAveragesAboveThreshold,
        allDecisionsFavorable,
        isCorrectMetier
      },
      missingJurys: defaultStatus.missingJurys,
      phase1Averages: averages,
      phase1Decisions: decisions,
      missingConditions
    }

  } catch (error) {
    console.error('Erreur lors de la vérification du déblocage:', error)
    return {
      ...defaultStatus,
      missingConditions: ['Erreur technique lors de la vérification']
    }
  }
}

/**
 * Formate le statut de déblocage pour l'affichage
 */
export function formatUnlockStatus(status: SimulationUnlockStatus) {
  if (status.unlocked) {
    return {
      icon: '🔓',
      color: 'green',
      message: 'SIMULATION DÉBLOQUÉE',
      details: 'Toutes les conditions sont remplies. La phase 2 (simulation) est accessible.'
    }
  } else {
    return {
      icon: '🔒',
      color: 'orange',
      message: 'SIMULATION VERROUILLÉE',
      details: status.missingConditions.join('\n• ')
    }
  }
}