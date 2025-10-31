// components/consolidation-button.tsx
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"

interface ConsolidationButtonProps {
  candidateId: number
}

export function ConsolidationButton({ candidateId }: ConsolidationButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleConsolidation = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/candidates/${candidateId}/consolidation`, {
        method: 'POST'
      })
      if (response.ok) {
        // Rafraîchir la page
        window.location.reload()
      } else {
        const errorData = await response.json()
        alert(`Erreur: ${errorData.error || "Erreur lors de la consolidation"}`)
      }
    } catch (error) {
      console.error("Erreur:", error)
      alert("Erreur de connexion au serveur")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button 
      onClick={handleConsolidation}
      disabled={loading}
      className="bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6"
      size="lg"
    >
      {loading ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          Traitement...
        </>
      ) : (
        <>
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Appliquer la Consolidation Automatique
        </>
      )}
    </Button>
  )
}