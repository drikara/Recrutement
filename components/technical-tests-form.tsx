// components/technical-tests-form.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface TechnicalTestsFormProps {
  candidateId: number
  existingScores?: any
}

export function TechnicalTestsForm({ candidateId, existingScores }: TechnicalTestsFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [scores, setScores] = useState({
    typing_speed: existingScores?.typingSpeed || '',
    typing_accuracy: existingScores?.typingAccuracy || '',
    excel_test: existingScores?.excelTest || '',
    dictation: existingScores?.dictation || '',
    sales_simulation: existingScores?.salesSimulation || '',
    psychotechnical_test: existingScores?.psychotechnicalTest || '',
    analysis_exercise: existingScores?.analysisExercise || '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch(`/api/candidates/${candidateId}/scores`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(scores),
      })

      if (response.ok) {
        router.refresh()
        // Afficher un message de succès
      } else {
        console.error('Erreur lors de la sauvegarde')
      }
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Test de Saisie */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Test de Saisie</h3>
          <div>
            <label className="block text-sm font-medium mb-2">
              Rapidité (MPM)
            </label>
            <input
              type="number"
              value={scores.typing_speed}
              onChange={(e) => setScores(prev => ({ ...prev, typing_speed: e.target.value }))}
              className="w-full p-2 border rounded"
              min="0"
              max="100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              Précision (%)
            </label>
            <input
              type="number"
              value={scores.typing_accuracy}
              onChange={(e) => setScores(prev => ({ ...prev, typing_accuracy: e.target.value }))}
              className="w-full p-2 border rounded"
              min="0"
              max="100"
              step="0.1"
            />
          </div>
        </div>

        {/* Test Excel */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Test Excel</h3>
          <div>
            <label className="block text-sm font-medium mb-2">
              Note (/5)
            </label>
            <input
              type="number"
              value={scores.excel_test}
              onChange={(e) => setScores(prev => ({ ...prev, excel_test: e.target.value }))}
              className="w-full p-2 border rounded"
              min="0"
              max="5"
              step="0.5"
            />
          </div>
        </div>

        {/* Dictée */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Dictée</h3>
          <div>
            <label className="block text-sm font-medium mb-2">
              Note (/20)
            </label>
            <input
              type="number"
              value={scores.dictation}
              onChange={(e) => setScores(prev => ({ ...prev, dictation: e.target.value }))}
              className="w-full p-2 border rounded"
              min="0"
              max="20"
              step="0.5"
            />
          </div>
        </div>

        {/* Simulation Vente */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Simulation Vente</h3>
          <div>
            <label className="block text-sm font-medium mb-2">
              Note (/5)
            </label>
            <input
              type="number"
              value={scores.sales_simulation}
              onChange={(e) => setScores(prev => ({ ...prev, sales_simulation: e.target.value }))}
              className="w-full p-2 border rounded"
              min="0"
              max="5"
              step="0.5"
            />
          </div>
        </div>

        {/* Test Psychotechnique */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Test Psychotechnique</h3>
          <div>
            <label className="block text-sm font-medium mb-2">
              Note (/10)
            </label>
            <input
              type="number"
              value={scores.psychotechnical_test}
              onChange={(e) => setScores(prev => ({ ...prev, psychotechnical_test: e.target.value }))}
              className="w-full p-2 border rounded"
              min="0"
              max="10"
              step="0.5"
            />
          </div>
        </div>

        {/* Exercice d'Analyse */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Exercice d'Analyse</h3>
          <div>
            <label className="block text-sm font-medium mb-2">
              Note (/10)
            </label>
            <input
              type="number"
              value={scores.analysis_exercise}
              onChange={(e) => setScores(prev => ({ ...prev, analysis_exercise: e.target.value }))}
              className="w-full p-2 border rounded"
              min="0"
              max="10"
              step="0.5"
            />
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Sauvegarde...' : 'Sauvegarder les scores'}
      </button>
    </form>
  )
}