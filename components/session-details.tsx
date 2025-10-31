// components/session-details.tsx
'use client'

import { useState } from 'react'
import { Metier, SessionStatus } from '@prisma/client'
import Link from 'next/link'

interface SessionDetailsProps {
  session: {
    id: string
    metier: Metier
    date: Date
    jour: string
    status: SessionStatus
    description?: string | null
    location?: string | null
    candidates: Array<{
      id: number
      fullName: string
      email: string
      phone: string
      scores?: {
        finalDecision: string | null
        callStatus: string | null
      } | null
      faceToFaceScores: Array<{
        juryMember: {
          fullName: string
          roleType: string
        }
        phase: number
        score: any
      }>
    }>
    juryPresences: Array<{
      juryMember: {
        fullName: string
        roleType: string
        specialite: Metier | null
      }
      wasPresent: boolean
      absenceReason?: string | null
    }>
    _count: {
      candidates: number
      juryPresences: number
    }
  }
}

export function SessionDetails({ session }: SessionDetailsProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'candidates' | 'jury'>('overview')

  // Statistiques calculées
  const recruitedCount = session.candidates.filter(c => c.scores?.finalDecision === 'RECRUTE').length
  const contactedCount = session.candidates.filter(c => c.scores?.callStatus && c.scores.callStatus !== 'NON_CONTACTE').length
  const presentJuryCount = session.juryPresences.filter(jp => jp.wasPresent).length

  const getStatusColor = (status: SessionStatus) => {
    switch (status) {
      case 'PLANIFIED': return 'bg-blue-100 text-blue-800'
      case 'IN_PROGRESS': return 'bg-green-100 text-green-800'
      case 'COMPLETED': return 'bg-gray-100 text-gray-800'
      case 'CANCELLED': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold">{session.metier}</h1>
            <p className="text-gray-600 mt-1">
              Session du {new Date(session.date).toLocaleDateString('fr-FR')} ({session.jour})
            </p>
            {session.location && (
              <p className="text-gray-600">Lieu : {session.location}</p>
            )}
          </div>
          <div className="text-right">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(session.status)}`}>
              {session.status}
            </span>
            <div className="mt-2 space-x-2">
              <Link
                href={`/wfm/sessions/${session.id}/edit`}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm"
              >
                Modifier
              </Link>
              <Link
                href={`/api/export/session/${session.id}`}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-sm"
              >
                Exporter
              </Link>
            </div>
          </div>
        </div>

        {session.description && (
          <p className="text-gray-700 border-t pt-4">{session.description}</p>
        )}
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{session._count.candidates}</div>
          <div className="text-sm text-gray-600">Candidats</div>
        </div>
        <div className="bg-white border rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{recruitedCount}</div>
          <div className="text-sm text-gray-600">Recrutés</div>
        </div>
        <div className="bg-white border rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">{contactedCount}</div>
          <div className="text-sm text-gray-600">Contactés</div>
        </div>
        <div className="bg-white border rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-orange-600">{presentJuryCount}</div>
          <div className="text-sm text-gray-600">Jurys Présents</div>
        </div>
      </div>

      {/* Navigation par onglets */}
      <div className="bg-white border rounded-lg">
        <div className="border-b">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Aperçu
            </button>
            <button
              onClick={() => setActiveTab('candidates')}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                activeTab === 'candidates'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Candidats ({session.candidates.length})
            </button>
            <button
              onClick={() => setActiveTab('jury')}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                activeTab === 'jury'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Jury ({session.juryPresences.length})
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* Onglet Aperçu */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">Progression des Évaluations</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded">
                    <h4 className="font-medium mb-2">Évaluations Face à Face</h4>
                    <div className="space-y-2">
                      {session.candidates.map(candidate => {
                        const evaluatedPhases = new Set(candidate.faceToFaceScores.map(s => s.phase))
                        return (
                          <div key={candidate.id} className="flex justify-between items-center text-sm">
                            <span>{candidate.fullName}</span>
                            <span className="text-gray-600">
                              Phase {Array.from(evaluatedPhases).join(', ')}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded">
                    <h4 className="font-medium mb-2">Décisions Finales</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Recrutés</span>
                        <span className="text-green-600 font-medium">{recruitedCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Non recrutés</span>
                        <span className="text-red-600 font-medium">
                          {session.candidates.length - recruitedCount}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>En attente</span>
                        <span className="text-yellow-600 font-medium">
                          {session.candidates.filter(c => !c.scores?.finalDecision).length}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Onglet Candidats */}
          {activeTab === 'candidates' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Liste des Candidats</h3>
                <Link
                  href="/wfm/candidates/new"
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm"
                >
                  + Ajouter un Candidat
                </Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Candidat</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Contact</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Statut Appel</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Décision</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {session.candidates.map(candidate => (
                      <tr key={candidate.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="font-medium">{candidate.fullName}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm">
                            <div>{candidate.email}</div>
                            <div className="text-gray-500">{candidate.phone}</div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            candidate.scores?.callStatus === 'CONFIRME' ? 'bg-green-100 text-green-800' :
                            candidate.scores?.callStatus === 'REFUS' ? 'bg-red-100 text-red-800' :
                            candidate.scores?.callStatus === 'CONTACTE' ? 'bg-blue-100 text-blue-800' :
                            candidate.scores?.callStatus === 'RESISTANT' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {candidate.scores?.callStatus || 'Non contacté'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            candidate.scores?.finalDecision === 'RECRUTE' ? 'bg-green-100 text-green-800' :
                            candidate.scores?.finalDecision === 'NON_RECRUTE' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {candidate.scores?.finalDecision || 'En attente'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <Link
                              href={`/wfm/candidates/${candidate.id}`}
                              className="text-blue-600 hover:text-blue-800 text-sm"
                            >
                              Voir
                            </Link>
                            <Link
                              href={`/wfm/candidates/${candidate.id}/consolidation`}
                              className="text-green-600 hover:text-green-800 text-sm"
                            >
                              Scores
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Onglet Jury */}
          {activeTab === 'jury' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Membres du Jury Présents</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {session.juryPresences.map((presence, index) => (
                  <div
                    key={index}
                    className={`border rounded-lg p-4 ${
                      presence.wasPresent ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{presence.juryMember.fullName}</div>
                        <div className="text-sm text-gray-600">
                          {presence.juryMember.roleType}
                          {presence.juryMember.specialite && ` - ${presence.juryMember.specialite}`}
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        presence.wasPresent ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {presence.wasPresent ? 'Présent' : 'Absent'}
                      </span>
                    </div>
                    {!presence.wasPresent && presence.absenceReason && (
                      <div className="mt-2 text-sm text-gray-600">
                        <strong>Raison :</strong> {presence.absenceReason}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}