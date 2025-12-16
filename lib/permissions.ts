import { Metier, JuryRoleType, SessionStatus } from "@prisma/client"
import { prisma } from "@/lib/prisma"

/**
 * ⭐ Vérifie si un jury est assigné à la session d'un candidat
 */
export async function isJuryAssignedToCandidateSession(
  juryMemberId: number, 
  candidateSessionId: string
): Promise<boolean> {
  if (!candidateSessionId) {
    console.log('❌ Session ID non défini pour le candidat')
    return false
  }

  const presence = await prisma.juryPresence.findUnique({
    where: {
      juryMemberId_sessionId: {
        juryMemberId,
        sessionId: candidateSessionId
      }
    }
  })

  const isAssigned = !!presence
  console.log(`🔍 Assignation jury ${juryMemberId} à session ${candidateSessionId}:`, 
    isAssigned ? '✅ Assigné' : '❌ Non assigné')
  
  return isAssigned
}

/**
 * ⭐ Vérifie si un jury peut accéder à un candidat
 * 
 * NOUVELLES RÈGLES:
 * 1. Les candidats NON disponibles ne sont JAMAIS visibles
 * 2. Le jury doit être ASSIGNÉ à la session du candidat
 * 3. DRH, EPC, WFM_JURY, FORMATEUR voient TOUS les candidats disponibles
 * 4. REPRESENTANT_METIER ne voit QUE les candidats de sa spécialité
 */
export async function canJuryMemberAccessCandidate(juryMember: any, candidate: any): Promise<boolean> {
  // ⭐⭐ RÈGLE 1: Les jurys ne peuvent voir que les candidats disponibles
  if (candidate.availability === 'NON') {
    console.log(`❌ Jury ${juryMember.fullName} - Candidat ${candidate.id} NON disponible`)
    return false
  }

  // ⭐⭐ RÈGLE 2: Le jury doit être assigné à la session du candidat
  if (candidate.sessionId) {
    const isAssigned = await isJuryAssignedToCandidateSession(
      juryMember.id, 
      candidate.sessionId
    )
    
    if (!isAssigned) {
      console.log(`❌ Jury ${juryMember.fullName} n'est pas assigné à la session ${candidate.sessionId}`)
      return false
    }
    console.log(`✅ Jury ${juryMember.fullName} assigné à la session`)
  } else {
    console.log(`⚠️ Candidat ${candidate.id} n'a pas de session`)
    return false
  }

  // ⭐⭐ RÈGLE 3: DRH, EPC, WFM_JURY, FORMATEUR voient TOUS les candidats disponibles
  if (["DRH", "EPC", "FORMATEUR", "WFM_JURY"].includes(juryMember.roleType)) {
    console.log(`✅ Jury ${juryMember.fullName} (${juryMember.roleType}) - Accès autorisé (rôle global)`)
    return true
  }

  // ⭐⭐ RÈGLE 4: REPRESENTANT_METIER ne voit QUE les candidats de sa spécialité
  if (juryMember.roleType === "REPRESENTANT_METIER") {
    const jurySpecialite = juryMember.specialite
    const candidateMetier = candidate.metier
    
    // ⚠️ VÉRIFICATION: S'assurer que specialite n'est pas null/undefined
    if (!jurySpecialite) {
      console.warn(`⚠️ Jury ${juryMember.fullName} n'a pas de spécialité définie!`)
      return false
    }
    
    // Comparaison stricte
    const hasAccess = jurySpecialite === candidateMetier
    
    if (hasAccess) {
      console.log(`✅ REPRESENTANT_METIER ${juryMember.fullName} - Accès autorisé (${jurySpecialite} === ${candidateMetier})`)
    } else {
      console.log(`❌ REPRESENTANT_METIER ${juryMember.fullName} - Accès refusé (${jurySpecialite} !== ${candidateMetier})`)
    }
    
    return hasAccess
  }

  // Par défaut, refuser l'accès
  console.log(`❌ Jury ${juryMember.fullName} (${juryMember.roleType}) - Type de jury non reconnu`)
  return false
}

/**
 * Vérifie si une session est active (peut recevoir des évaluations)
 */
export function isSessionActive(session: any): boolean {
  if (!session) {
    console.log('❌ Session non définie')
    return false
  }
  
  const isActive = session.status === "PLANIFIED" || session.status === "IN_PROGRESS"
  
  if (!isActive) {
    console.log(`❌ Session ${session.id} inactive (status: ${session.status})`)
  }
  
  return isActive
}

/**
 * Vérifie si un jury peut évaluer dans une session
 */
export function canJuryEvaluate(session: any): boolean {
  if (!session) return false
  // Les jurys ne peuvent noter que pendant les sessions PLANIFIED ou IN_PROGRESS
  return session.status === "PLANIFIED" || session.status === "IN_PROGRESS"
}

/**
 * ⭐ Filtre les candidats qu'un jury peut voir
 * 
 * Cette fonction applique TOUS les filtres:
 * - Disponibilité du candidat (OUI uniquement)
 * - Session active (PLANIFIED ou IN_PROGRESS)
 * - Règles spécifiques au type de jury (REPRESENTANT_METIER)
 * - Assignation à la session
 */
export async function filterCandidatesForJury(candidates: any[], juryMember: any): Promise<any[]> {
  console.log('\n' + '='.repeat(80))
  console.log(`🎯 FILTRAGE POUR JURY: ${juryMember.fullName} (${juryMember.roleType})`)
  console.log(`📊 Spécialité: ${juryMember.specialite || 'Aucune'}`)
  console.log(`📊 Candidats avant filtrage: ${candidates.length}`)
  console.log('='.repeat(80))
  
  // Utiliser Promise.all pour les vérifications asynchrones
  const filteredResults = await Promise.all(
    candidates.map(async (candidate) => {
      const hasAccess = await canJuryMemberAccessCandidate(juryMember, candidate)
      const sessionActive = isSessionActive(candidate.session)
      
      const included = hasAccess && sessionActive
      
      if (!included) {
        console.log(`❌ Candidat ${candidate.id} (${candidate.prenom} ${candidate.nom}) exclu:`, {
          hasAccess,
          sessionActive,
          availability: candidate.availability,
          metier: candidate.metier
        })
      }
      
      return included ? candidate : null
    })
  )
  
  const filtered = filteredResults.filter(Boolean)
  
  console.log('='.repeat(80))
  console.log(`✅ RÉSULTAT: ${filtered.length} candidats accessibles`)
  
  // Afficher la liste des candidats filtrés par métier
  const byMetier = filtered.reduce((acc: any, c: any) => {
    acc[c.metier] = (acc[c.metier] || 0) + 1
    return acc
  }, {})
  console.log(`📊 Répartition par métier:`, byMetier)
  console.log('='.repeat(80) + '\n')
  
  return filtered
}