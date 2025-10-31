// components/sessions-list.tsx
'use client'

import { useState } from 'react'
import { Metier, SessionStatus } from '@prisma/client'
import Link from 'next/link'

interface Session {
  id: string
  metier: Metier
  date: Date
  jour: string
  status: SessionStatus
  description?: string | null
  location?: string | null
  _count: {
    candidates: number
    juryPresences: number
  }
  candidates: Array<{
    id: number
    fullName: string
    metier: Metier
    scores?: {
      finalDecision: string | null
    } | null
  }>
}

interface SessionsListProps {
  sessions: Session[]
}

export function SessionsList({ sessions }: SessionsListProps) {
  const [filterStatus, setFilterStatus] = useState<SessionStatus | 'all'>('all')
  const [filterMetier, setFilterMetier] = useState<Metier | 'all'>('all')

  const filteredSessions = sessions.filter(session => {
    if (filterStatus !== 'all' && session.status !== filterStatus) return false
    if (filterMetier !== 'all' && session.metier !== filterMetier) return false
    return true
  })

  const getStatusColor = (status: SessionStatus) => {
    switch (status) {
      case 'PLANIFIED': return 'bg-blue-100 text-blue-800'
      case 'IN_PROGRESS': return 'bg-green-100 text-green-800'
      case 'COMPLETED': return 'bg-gray-100 text-gray-800'
      case 'CANCELLED': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getRecruitedCount = (session: Session) => {
    return session.candidates.filter(c => c.scores?.finalDecision === 'RECRUTE').length
  }

  return (
    <div className="space-y-4">
      {/* Filtres */}
      <div className="flex flex-wrap gap-4 items-center">
        <div>
          <label className="text-sm font-medium mr-2">Statut:</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as SessionStatus | 'all')}
            className="p-2 border rounded text-sm"
          >
            <option value="all">Tous</option>
            <option value="PLANIFIED">Planifié</option>
            <option value="IN_PROGRESS">En cours</option>
            <option value="COMPLETED">Terminé</option>
            <option value="CANCELLED">Annulé</option>
          </select>
        </div>

        <div>
          <label className="text-sm font-medium mr-2">Métier:</label>
          <select
            value={filterMetier}
            onChange={(e) => setFilterMetier(e.target.value as Metier | 'all')}
            className="p-2 border rounded text-sm"
          >
            <option value="all">Tous</option>
            {Object.values(Metier).map(metier => (
              <option key={metier} value={metier}>{metier}</option>
            ))}
          </select>
        </div>

        <div className="text-sm text-gray-600">
          {filteredSessions.length} session(s) trouvée(s)
        </div>
      </div>

      {/* Liste des sessions */}
      <div className="space-y-3">
        {filteredSessions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Aucune session correspondante
          </div>
        ) : (
          filteredSessions.map(session => (
            <div
              key={session.id}
              className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold">{session.metier}</h3>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(session.status)}`}>
                      {session.status}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 mb-3">
                    <div>
                      <strong>Date:</strong> {new Date(session.date).toLocaleDateString('fr-FR')}
                    </div>
                    <div>
                      <strong>Jour:</strong> {session.jour}
                    </div>
                    <div>
                      <strong>Lieu:</strong> {session.location || 'Non spécifié'}
                    </div>
                  </div>

                  {session.description && (
                    <p className="text-sm text-gray-600 mb-3">{session.description}</p>
                  )}

                  {/* Statistiques */}
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="bg-gray-50 px-3 py-1 rounded">
                      <strong>{session._count.candidates}</strong> candidats
                    </div>
                    <div className="bg-gray-50 px-3 py-1 rounded">
                      <strong>{getRecruitedCount(session)}</strong> recrutés
                    </div>
                    <div className="bg-gray-50 px-3 py-1 rounded">
                      <strong>{session._count.juryPresences}</strong> jurys présents
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 ml-4">
                  <Link
                    href={`/wfm/sessions/${session.id}`}
                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 text-center"
                  >
                    Voir
                  </Link>
                  <Link
                    href={`/api/export/session/${session.id}`}
                    className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 text-center"
                  >
                    Exporter
                  </Link>
                  <Link
                    href={`/wfm/sessions/${session.id}/edit`}
                    className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 text-center"
                  >
                    Modifier
                  </Link>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}