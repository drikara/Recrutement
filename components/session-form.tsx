// components/session-form.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Metier, SessionStatus } from '@prisma/client'

interface SessionFormProps {
  session?: {
    id: string
    metier: Metier
    date: string
    jour: string
    status: SessionStatus
    description?: string | null
    location?: string | null
  }
}

export function SessionForm({ session }: SessionFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    metier: session?.metier || '',
    date: session?.date ? new Date(session.date).toISOString().split('T')[0] : '',
    jour: session?.jour || '',
    status: session?.status || 'PLANIFIED',
    description: session?.description || '',
    location: session?.location || '',
  })

  const jours = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = session ? `/api/sessions/${session.id}` : '/api/sessions'
      const method = session ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        router.push('/wfm/sessions')
        router.refresh()
      } else {
        const error = await response.json()
        alert(`Erreur: ${error.error}`)
      }
    } catch (error) {
      console.error('Error saving session:', error)
      alert('Erreur lors de la sauvegarde')
    } finally {
      setLoading(false)
    }
  }

  const handleDateChange = (date: string) => {
    setFormData(prev => ({ ...prev, date }))
    
    // Calcul automatique du jour de la semaine
    if (date) {
      const selectedDate = new Date(date)
      const dayIndex = selectedDate.getDay()
      // Convertir l'index (0=dimanche, 1=lundi, etc.) vers nos jours
      const frenchDays = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
      setFormData(prev => ({ ...prev, jour: frenchDays[dayIndex] }))
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg border p-6 space-y-6">
      {/* Métier */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Métier <span className="text-red-500">*</span>
        </label>
        <select
          value={formData.metier}
          onChange={(e) => setFormData(prev => ({ ...prev, metier: e.target.value }))}
          className="w-full p-2 border rounded"
          required
        >
          <option value="">Sélectionnez un métier</option>
          {Object.values(Metier).map(metier => (
            <option key={metier} value={metier}>{metier}</option>
          ))}
        </select>
      </div>

      {/* Date */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Date de la session <span className="text-red-500">*</span>
        </label>
        <input
          type="date"
          value={formData.date}
          onChange={(e) => handleDateChange(e.target.value)}
          className="w-full p-2 border rounded"
          required
        />
      </div>

      {/* Jour (calculé automatiquement) */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Jour de la semaine
        </label>
        <input
          type="text"
          value={formData.jour}
          readOnly
          className="w-full p-2 border rounded bg-gray-50"
        />
        <p className="text-sm text-gray-600 mt-1">
          Calculé automatiquement à partir de la date
        </p>
      </div>

      {/* Statut */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Statut <span className="text-red-500">*</span>
        </label>
        <select
          value={formData.status}
          onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as SessionStatus }))}
          className="w-full p-2 border rounded"
          required
        >
          <option value="PLANIFIED">Planifié</option>
          <option value="IN_PROGRESS">En cours</option>
          <option value="COMPLETED">Terminé</option>
          <option value="CANCELLED">Annulé</option>
        </select>
      </div>

      {/* Lieu */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Lieu
        </label>
        <input
          type="text"
          value={formData.location}
          onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
          className="w-full p-2 border rounded"
          placeholder="Ex: Siège social, Salle de réunion A..."
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Description
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          rows={3}
          className="w-full p-2 border rounded"
          placeholder="Informations supplémentaires sur cette session..."
        />
      </div>

      {/* Boutons */}
      <div className="flex gap-4 pt-4">
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Sauvegarde...' : (session ? 'Modifier' : 'Créer')} la Session
        </button>
        <button
          type="button"
          onClick={() => router.push('/wfm/sessions')}
          className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600"
        >
          Annuler
        </button>
      </div>

      {/* Informations de validation */}
      {!formData.metier || !formData.date && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-700">
            <strong>Champs obligatoires :</strong> Métier et Date
          </p>
        </div>
      )}
    </form>
  )
}