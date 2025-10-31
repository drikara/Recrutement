// components/export-panel.tsx
'use client'

import { useState } from 'react'
import { Metier } from '@prisma/client'

interface Session {
  id: string
  metier: Metier
  date: Date
  jour: string
  status: string
}

interface MetierStats {
  metier: Metier
  _count: {
    id: number
  }
}

interface ExportPanelProps {
  sessions: Session[]
  metiers: MetierStats[]
}

export function ExportPanel({ sessions, metiers }: ExportPanelProps) {
  const [exportType, setExportType] = useState<'session' | 'multiple' | 'global'>('session')
  const [selectedSessions, setSelectedSessions] = useState<string[]>([])
  const [selectedMetier, setSelectedMetier] = useState<Metier | 'all'>('all')
  const [dateRange, setDateRange] = useState({
    start: '',
    end: ''
  })
  const [loading, setLoading] = useState(false)

  const handleSessionToggle = (sessionId: string) => {
    setSelectedSessions(prev =>
      prev.includes(sessionId)
        ? prev.filter(id => id !== sessionId)
        : [...prev, sessionId]
    )
  }

  const handleExport = async () => {
    setLoading(true)
    try {
      let url = '/api/export/'
      
      switch (exportType) {
        case 'session':
          if (selectedSessions.length !== 1) {
            alert('Veuillez sélectionner une seule session')
            return
          }
          url += `session/${selectedSessions[0]}`
          break
        
        case 'multiple':
          if (selectedSessions.length === 0) {
            alert('Veuillez sélectionner au moins une session')
            return
          }
          url += `sessions?sessionIds=${selectedSessions.join(',')}`
          break
        
        case 'global':
          const params = new URLSearchParams()
          if (selectedMetier !== 'all') params.append('metier', selectedMetier)
          if (dateRange.start) params.append('dateFrom', dateRange.start)
          if (dateRange.end) params.append('dateTo', dateRange.end)
          url += `global?${params.toString()}`
          break
      }

      const response = await fetch(url)
      if (!response.ok) throw new Error('Erreur lors de l\'export')
      
      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = downloadUrl
      
      // Nom du fichier selon le type d'export
      let filename = 'export'
      if (exportType === 'session' && selectedSessions.length === 1) {
        const session = sessions.find(s => s.id === selectedSessions[0])
        if (session) {
          filename = `${session.metier}_Session_${session.jour}_${session.date.toISOString().split('T')[0]}`
        }
      } else if (exportType === 'global') {
        filename = `export_global_${new Date().toISOString().split('T')[0]}`
      } else {
        filename = `export_multiple_${new Date().toISOString().split('T')[0]}`
      }
      
      a.download = `${filename}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(downloadUrl)

    } catch (error) {
      console.error('Export error:', error)
      alert('Erreur lors de l\'export')
    } finally {
      setLoading(false)
    }
  }

  const filteredSessions = sessions.filter(session => {
    if (selectedMetier !== 'all' && session.metier !== selectedMetier) return false
    if (dateRange.start && new Date(session.date) < new Date(dateRange.start)) return false
    if (dateRange.end && new Date(session.date) > new Date(dateRange.end)) return false
    return true
  })

  return (
    <div className="bg-white rounded-lg border p-6 space-y-6">
      {/* Sélection du type d'export */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Type d'Export</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => setExportType('session')}
            className={`p-4 border-2 rounded-lg text-left transition-colors ${
              exportType === 'session'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="font-medium">Session Unique</div>
            <div className="text-sm text-gray-600 mt-1">
              Fichier Excel pour une session spécifique
            </div>
          </button>

          <button
            onClick={() => setExportType('multiple')}
            className={`p-4 border-2 rounded-lg text-left transition-colors ${
              exportType === 'multiple'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="font-medium">Sessions Multiples</div>
            <div className="text-sm text-gray-600 mt-1">
              ZIP avec fichiers Excel par session
            </div>
          </button>

          <button
            onClick={() => setExportType('global')}
            className={`p-4 border-2 rounded-lg text-left transition-colors ${
              exportType === 'global'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="font-medium">Export Global</div>
            <div className="text-sm text-gray-600 mt-1">
              Toutes les données sur une période
            </div>
          </button>
        </div>
      </div>

      {/* Filtres */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Filtre par métier */}
        <div>
          <label className="block text-sm font-medium mb-2">Métier</label>
          <select
            value={selectedMetier}
            onChange={(e) => setSelectedMetier(e.target.value as Metier | 'all')}
            className="w-full p-2 border rounded"
          >
            <option value="all">Tous les métiers</option>
            {metiers.map(metier => (
              <option key={metier.metier} value={metier.metier}>
                {metier.metier} ({metier._count.id})
              </option>
            ))}
          </select>
        </div>

        {/* Filtre date de début */}
        <div>
          <label className="block text-sm font-medium mb-2">Date de début</label>
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
            className="w-full p-2 border rounded"
          />
        </div>

        {/* Filtre date de fin */}
        <div>
          <label className="block text-sm font-medium mb-2">Date de fin</label>
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
            className="w-full p-2 border rounded"
          />
        </div>
      </div>

      {/* Sélection des sessions */}
      {(exportType === 'session' || exportType === 'multiple') && (
        <div>
          <h4 className="font-medium mb-3">
            Sélectionnez les sessions {exportType === 'session' ? '(1 seule)' : '(une ou plusieurs)'}
          </h4>
          <div className="max-h-60 overflow-y-auto border rounded">
            {filteredSessions.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                Aucune session correspondante
              </div>
            ) : (
              filteredSessions.map(session => (
                <label
                  key={session.id}
                  className="flex items-center p-3 border-b last:border-b-0 hover:bg-gray-50"
                >
                  <input
                    type={exportType === 'session' ? 'radio' : 'checkbox'}
                    name="sessions"
                    checked={selectedSessions.includes(session.id)}
                    onChange={() => {
                      if (exportType === 'session') {
                        setSelectedSessions([session.id])
                      } else {
                        handleSessionToggle(session.id)
                      }
                    }}
                    className="mr-3"
                  />
                  <div className="flex-1">
                    <div className="font-medium">{session.metier}</div>
                    <div className="text-sm text-gray-600">
                      {session.jour} - {new Date(session.date).toLocaleDateString('fr-FR')}
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    session.status === 'IN_PROGRESS' ? 'bg-green-100 text-green-800' :
                    session.status === 'COMPLETED' ? 'bg-gray-100 text-gray-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {session.status}
                  </span>
                </label>
              ))
            )}
          </div>
        </div>
      )}

      {/* Bouton d'export */}
      <div className="flex justify-end">
        <button
          onClick={handleExport}
          disabled={loading || (exportType === 'session' && selectedSessions.length !== 1) || (exportType === 'multiple' && selectedSessions.length === 0)}
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block"></div>
              Export en cours...
            </>
          ) : (
            `Exporter ${exportType === 'global' ? 'les données' : `(${selectedSessions.length}) sessions`}`
          )}
        </button>
      </div>
    </div>
  )
}