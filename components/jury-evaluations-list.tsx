// components/jury-evaluations-list.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'

interface Candidate {
  id: number
  fullName: string
  metier: string
  age: number
  diploma: string
  location: string
  availability: string
  interviewDate: Date | null
  session: {
    metier: string
    date: Date
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

interface JuryEvaluationsListProps {
  candidates: Candidate[]
  juryMemberId: number
}

export function JuryEvaluationsList({ candidates, juryMemberId }: JuryEvaluationsListProps) {
  const [filter, setFilter] = useState<'all' | 'evaluated' | 'pending'>('all')

  const filteredCandidates = candidates.filter(candidate => {
    if (filter === 'evaluated') return candidate.myScore
    if (filter === 'pending') return !candidate.myScore
    return true
  })

  const getEvaluationBadge = (candidate: Candidate) => {
    switch (candidate.evaluationStatus) {
      case 'not_evaluated':
        return { label: 'À évaluer', color: 'bg-yellow-100 text-yellow-800' }
      case 'phase1_only':
        return { label: 'Phase 1', color: 'bg-blue-100 text-blue-800' }
      case 'both_phases':
        return { label: 'Complète', color: 'bg-green-100 text-green-800' }
      default:
        return { label: 'À évaluer', color: 'bg-yellow-100 text-yellow-800' }
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 4) return 'text-green-600'
    if (score >= 3) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className="bg-white border rounded-lg">
      {/* Filtres */}
      <div className="p-4 border-b">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-full text-sm ${
              filter === 'all'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Tous ({candidates.length})
          </button>
          <button
            onClick={() => setFilter('evaluated')}
            className={`px-3 py-1 rounded-full text-sm ${
              filter === 'evaluated'
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Évalués ({candidates.filter(c => c.myScore).length})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-3 py-1 rounded-full text-sm ${
              filter === 'pending'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            En attente ({candidates.filter(c => !c.myScore).length})
          </button>
        </div>
      </div>

      {/* Liste */}
      <div className="divide-y divide-gray-200">
        {filteredCandidates.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Aucun candidat correspondant
          </div>
        ) : (
          filteredCandidates.map(candidate => {
            const evaluationBadge = getEvaluationBadge(candidate)
            
            return (
              <div key={candidate.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">{candidate.fullName}</h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${evaluationBadge.color}`}>
                        {evaluationBadge.label}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 mb-2">
                      <div>
                        <strong>Métier:</strong> {candidate.metier}
                      </div>
                      <div>
                        <strong>Âge:</strong> {candidate.age} ans
                      </div>
                      <div>
                        <strong>Diplôme:</strong> {candidate.diploma}
                      </div>
                    </div>

                    <div className="text-sm text-gray-600">
                      <strong>Lieu:</strong> {candidate.location} • 
                      <strong> Disponibilité:</strong> {candidate.availability}
                    </div>

                    {candidate.session && (
                      <div className="text-sm text-gray-500 mt-1">
                        Session: {candidate.session.metier} - {candidate.session.date.toLocaleDateString('fr-FR')}
                      </div>
                    )}

                    {candidate.myScore && (
                      <div className="mt-2">
                        <div className="text-sm">
                          <strong>Votre évaluation:</strong>{' '}
                          <span className={`font-semibold ${getScoreColor(candidate.myScore.score)}`}>
                            {candidate.myScore.score}/5
                          </span>{' '}
                          (Phase {candidate.myScore.phase}) • 
                          <span className="text-gray-500 ml-2">
                            {candidate.myScore.evaluatedAt.toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 ml-4">
                    <Link
                      href={`/jury/evaluate/${candidate.id}`}
                      className={`px-4 py-2 rounded text-sm font-medium text-center ${
                        candidate.myScore
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-green-600 text-white hover:bg-green-700'
                      }`}
                    >
                      {candidate.myScore ? 'Modifier' : 'Évaluer'}
                    </Link>
                    
                    {candidate.scores?.finalDecision && (
                      <span className={`px-2 py-1 rounded-full text-xs font-medium text-center ${
                        candidate.scores.finalDecision === 'RECRUTE'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {candidate.scores.finalDecision}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}