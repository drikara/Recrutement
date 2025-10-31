// components/jury-management.tsx
'use client'

import { useState } from 'react'
import { Metier } from '@prisma/client'

interface JuryMember {
  id: number
  userId: string
  fullName: string
  roleType: string
  specialite: Metier | null
  department: string | null
  phone: string | null
  isActive: boolean
  user: {
    email: string
    name: string
    role: string
    isActive: boolean
    lastLogin: Date | null
  }
  stats: {
    evaluationsCount: number
    presencesCount: number
  }
}

interface JuryManagementProps {
  juryMembers: JuryMember[]
  users: Array<{
    id: string
    name: string
    email: string
    role: string
  }>
}

export function JuryManagement({ juryMembers, users }: JuryManagementProps) {
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    user_id: '',
    full_name: '',
    role_type: '',
    specialite: '',
    department: '',
    phone: '',
    notes: ''
  })

  const roleTypes = ['DRH', 'EPC', 'REPRESENTANT_METIER', 'WFM_JURY']

  const availableUsers = users.filter(user => 
    user.role === 'JURY' && 
    !juryMembers.some(jury => jury.userId === user.id)
  )

  const handleUserSelect = (userId: string) => {
    const user = users.find(u => u.id === userId)
    if (user) {
      setFormData(prev => ({
        ...prev,
        user_id: userId,
        full_name: user.name
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/jury-members', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setShowForm(false)
        setFormData({
          user_id: '',
          full_name: '',
          role_type: '',
          specialite: '',
          department: '',
          phone: '',
          notes: ''
        })
        // Recharger la page
        window.location.reload()
      } else {
        const error = await response.json()
        alert(`Erreur: ${error.error}`)
      }
    } catch (error) {
      console.error('Error creating jury member:', error)
      alert('Erreur lors de la création')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleActive = async (juryId: number, isActive: boolean) => {
    try {
      const response = await fetch(`/api/jury-members/${juryId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_active: !isActive }),
      })

      if (response.ok) {
        window.location.reload()
      }
    } catch (error) {
      console.error('Error updating jury member:', error)
    }
  }

  const handleDelete = async (juryId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce membre du jury ?')) {
      return
    }

    try {
      const response = await fetch(`/api/jury-members/${juryId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        window.location.reload()
      } else {
        const error = await response.json()
        alert(`Erreur: ${error.error}`)
      }
    } catch (error) {
      console.error('Error deleting jury member:', error)
    }
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec bouton d'ajout */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gestion des Membres du Jury</h2>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          + Ajouter un Membre
        </button>
      </div>

      {/* Formulaire d'ajout */}
      {showForm && (
        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Nouveau Membre du Jury</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Sélection de l'utilisateur */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Utilisateur <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.user_id}
                  onChange={(e) => handleUserSelect(e.target.value)}
                  className="w-full p-2 border rounded"
                  required
                >
                  <option value="">Sélectionnez un utilisateur</option>
                  {availableUsers.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </option>
                  ))}
                </select>
                {availableUsers.length === 0 && (
                  <p className="text-sm text-red-600 mt-1">
                    Aucun utilisateur disponible (tous sont déjà membres du jury ou ont le rôle WFM)
                  </p>
                )}
              </div>

              {/* Nom complet */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Nom complet <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>

              {/* Type de rôle */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Type de rôle <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.role_type}
                  onChange={(e) => setFormData(prev => ({ ...prev, role_type: e.target.value }))}
                  className="w-full p-2 border rounded"
                  required
                >
                  <option value="">Sélectionnez un rôle</option>
                  {roleTypes.map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </div>

              {/* Spécialité */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Spécialité (métier)
                </label>
                <select
                  value={formData.specialite}
                  onChange={(e) => setFormData(prev => ({ ...prev, specialite: e.target.value }))}
                  className="w-full p-2 border rounded"
                >
                  <option value="">Aucune spécialité</option>
                  {Object.values(Metier).map(metier => (
                    <option key={metier} value={metier}>{metier}</option>
                  ))}
                </select>
              </div>

              {/* Département */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Département
                </label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                  className="w-full p-2 border rounded"
                  placeholder="Ex: RH, Commercial, Technique..."
                />
              </div>

              {/* Téléphone */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Téléphone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full p-2 border rounded"
                  placeholder="+33 1 23 45 67 89"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
                className="w-full p-2 border rounded"
                placeholder="Informations supplémentaires..."
              />
            </div>

            {/* Boutons */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Création...' : 'Créer le Membre'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Liste des membres du jury */}
      <div className="bg-white border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Membre</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Rôle</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Spécialité</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Statistiques</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Statut</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {juryMembers.map((member) => (
              <tr key={member.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div>
                    <div className="font-medium">{member.fullName}</div>
                    <div className="text-sm text-gray-500">{member.user.email}</div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {member.roleType}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {member.specialite ? (
                    <span className="text-sm text-gray-700">{member.specialite}</span>
                  ) : (
                    <span className="text-sm text-gray-400">-</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm">
                    <div>{member.stats.evaluationsCount} évaluations</div>
                    <div>{member.stats.presencesCount} présences</div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => handleToggleActive(member.id, member.isActive)}
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                      member.isActive
                        ? 'bg-green-100 text-green-800 hover:bg-green-200'
                        : 'bg-red-100 text-red-800 hover:bg-red-200'
                    }`}
                  >
                    {member.isActive ? 'Actif' : 'Inactif'}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDelete(member.id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Supprimer
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {juryMembers.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            Aucun membre du jury enregistré
          </div>
        )}
      </div>
    </div>
  )
}