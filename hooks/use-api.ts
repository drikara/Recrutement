// ========================================
// 3. HOOK PERSONNALISÉ POUR LES APPELS API
// hooks/use-api.ts
// ========================================

import { useState } from 'react'
import { toast } from 'react-hot-toast'

interface UseApiOptions {
  onSuccess?: (data: any) => void
  onError?: (error: Error) => void
  successMessage?: string
  showErrorToast?: boolean
}

export function useApi<T = any>(options: UseApiOptions = {}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [data, setData] = useState<T | null>(null)

  const execute = async (
    url: string, 
    fetchOptions: RequestInit = {}
  ): Promise<T | null> => {
    setLoading(true)
    setError(null)
    
    const loadingToast = toast.loading('⏳ Chargement en cours...')

    try {
      const response = await fetch(url, fetchOptions)

      // Gérer les erreurs HTTP
      if (!response.ok) {
        await ApiErrorHandler.handleApiError(response)
      }

      // Parser la réponse
      const contentType = response.headers.get('content-type')
      let result: T
      
      if (contentType?.includes('application/json')) {
        result = await response.json()
      } else if (contentType?.includes('text/')) {
        result = await response.text() as T
      } else {
        result = await response.blob() as T
      }

      setData(result)
      toast.dismiss(loadingToast)

      // Message de succès
      if (options.successMessage) {
        toast.success(options.successMessage)
      }

      // Callback de succès
      if (options.onSuccess) {
        options.onSuccess(result)
      }

      return result

    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erreur inconnue')
      
      setError(error)
      toast.dismiss(loadingToast)

      // Afficher le toast d'erreur
      if (options.showErrorToast !== false) {
        toast.error(error.message, { duration: 5000 })
      }

      // Callback d'erreur
      if (options.onError) {
        options.onError(error)
      }

      return null
    } finally {
      setLoading(false)
    }
  }

  return { execute, loading, error, data }
}
