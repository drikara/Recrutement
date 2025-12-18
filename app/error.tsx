// app/error.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const router = useRouter()
  const [isResetting, setIsResetting] = useState(false)
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    // Logger l'erreur
    console.error('Error:', {
      message: error.message,
      digest: error.digest,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV
    })
  }, [error])

  const handleReset = async () => {
    setIsResetting(true)
    setRetryCount(prev => prev + 1)
    
    try {
      await reset()
      // Si reset() réussit, le composant se re-rend
    } catch (error) {
      console.error('Reset failed:', error)
      // Si reset échoue après plusieurs tentatives, forcer le rechargement
      if (retryCount >= 2) {
        window.location.reload()
      }
    } finally {
      setIsResetting(false)
    }
  }

  const handleHomeRedirect = () => {
    // Utiliser le router pour une navigation côté client
    router.push('/')
    // Forcer le rechargement si nécessaire
    setTimeout(() => {
      router.refresh()
    }, 100)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8 md:p-12 border border-gray-200">
        <div className="text-center">
          {/* Icône d'erreur */}
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-red-50 to-red-100 rounded-full flex items-center justify-center mb-6">
            <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center">
              <svg 
                className="w-8 h-8 text-white" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.856-.833-2.464 0L4.732 16.5c-.77.833.192 2.5 1.732 2.5z" 
                />
              </svg>
            </div>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Une erreur est survenue
          </h1>
          
          <p className="text-lg text-gray-600 mb-8 leading-relaxed">
            Nous rencontrons des difficultés techniques. Notre équipe a été informée et travaille à la résolution du problème.
          </p>

          {/* Afficher les détails en développement */}
          {process.env.NODE_ENV === 'development' && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-8 text-left">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                Détails de l'erreur (Mode développement)
              </h3>
              <div className="space-y-2">
                <p className="text-sm font-mono text-red-600 break-words bg-red-50 p-3 rounded">
                  {error.message}
                </p>
                {error.digest && (
                  <p className="text-xs text-gray-500 font-mono">
                    Digest: <span className="text-gray-700">{error.digest}</span>
                  </p>
                )}
                <p className="text-xs text-gray-500">
                  Nombre de tentatives: <span className="font-semibold">{retryCount}</span>
                </p>
              </div>
            </div>
          )}

          {/* Actions principales */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <button
              onClick={handleReset}
              disabled={isResetting}
              className={`
                bg-gradient-to-r from-blue-600 to-blue-700 
                hover:from-blue-700 hover:to-blue-800 
                text-white px-8 py-3.5 rounded-lg 
                shadow-md hover:shadow-lg 
                transition-all duration-200 
                font-semibold text-base
                disabled:opacity-70 disabled:cursor-not-allowed
                flex items-center justify-center gap-2
                min-w-[180px]
              `}
            >
              {isResetting ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Réessai en cours...
                </>
              ) : 'Réessayer'}
            </button>
            
            <button
              onClick={handleHomeRedirect}
              className="
                bg-white 
                border-2 border-gray-300 
                hover:border-gray-400 
                hover:bg-gray-50
                text-gray-800 
                px-8 py-3.5 
                rounded-lg 
                shadow-sm hover:shadow 
                transition-all duration-200 
                font-semibold text-base
                min-w-[180px]
              "
            >
              Retour à l'accueil
            </button>
          </div>

          {/* Solutions alternatives */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-5">
              <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                Solutions rapides
              </h3>
              <ul className="space-y-2 text-blue-800 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>Actualisez la page (Ctrl + R)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>Videz le cache du navigateur</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>Vérifiez votre connexion internet</span>
                </li>
              </ul>
            </div>

            <div className="bg-green-50 border border-green-100 rounded-xl p-5">
              <h3 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
                Contacter le support
              </h3>
              <div className="space-y-2 text-green-800 text-sm">
                <p className="font-medium">Notre équipe est disponible pour vous aider</p>
                <div className="space-y-1">
                  <a 
                    href="mailto:support@orange.ci" 
                    className="block text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    support@orange.ci
                  </a>
                  <a 
                    href="tel:+2250703964789" 
                    className="block text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    +225 07 03 96 47 89
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation secondaire */}
          <div className="pt-6 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link 
                href="/"
                className="text-blue-600 hover:text-blue-800 font-medium text-sm hover:underline"
                onClick={(e) => {
                  e.preventDefault()
                  router.push('/')
                  router.refresh()
                }}
              >
                ← Retourner à l'accueil
              </Link>
              <span className="hidden sm:block text-gray-300">|</span>
              <button
                onClick={() => window.location.reload()}
                className="text-blue-600 hover:text-blue-800 font-medium text-sm hover:underline"
              >
                Recharger la page complète
              </button>
              <span className="hidden sm:block text-gray-300">|</span>
              <Link 
                href="/contact" 
                className="text-blue-600 hover:text-blue-800 font-medium text-sm hover:underline"
              >
                Contacter le support
              </Link>
            </div>
            <p className="text-xs text-gray-400 text-center mt-4">
              Code d'erreur: {error.digest || 'N/A'} • {new Date().toLocaleTimeString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}