// types/jury.ts
import { Metier, Candidate as PrismaCandidate, FaceToFaceScore, Score, RecruitmentSession } from "@prisma/client"

export type JuryCandidate = {
  id: number
  fullName: string
  metier: Metier
  age: number
  diploma: string
  location: string
  availability: string
  interviewDate: Date | null
  session: {
    date: Date
    metier: Metier
  } | null
  scores: {
    finalDecision: string | null
    callStatus: string | null
  } | null
  myScore: {
    score: number
    phase: number
    evaluatedAt: Date
  } | null
  evaluationStatus: 'not_evaluated' | 'phase1_only' | 'both_phases'
}

// Fonction de conversion
export function formatCandidateForJury(
  candidate: PrismaCandidate & {
    session: { date: Date; metier: Metier } | null
    scores: { finalDecision: string | null; callStatus: string | null } | null
    faceToFaceScores: FaceToFaceScore[]
  },
  juryMemberId: number
): JuryCandidate {
  const myScores = candidate.faceToFaceScores.filter(score => score.juryMemberId === juryMemberId)
  const phase1Score = myScores.find(score => score.phase === 1)
  const phase2Score = myScores.find(score => score.phase === 2)

  const myScore = phase1Score || phase2Score ? {
    score: phase1Score?.score ? Number(phase1Score.score) : 
           phase2Score?.score ? Number(phase2Score.score) : 0,
    phase: phase1Score ? 1 : 2,
    evaluatedAt: phase1Score?.evaluatedAt || phase2Score?.evaluatedAt || new Date()
  } : null

  return {
    id: candidate.id,
    fullName: candidate.fullName,
    metier: candidate.metier,
    age: candidate.age,
    diploma: candidate.diploma,
    location: candidate.location,
    availability: candidate.availability,
    interviewDate: candidate.interviewDate,
    session: candidate.session,
    scores: candidate.scores,
    myScore,
    evaluationStatus: myScores.length === 0 ? 'not_evaluated' : 
                     myScores.length === 1 ? 'phase1_only' : 
                     'both_phases'
  }
}