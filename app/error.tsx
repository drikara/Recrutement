
//app/error.tsx 

'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Logger l'erreur en production (ex: Sentry, LogRocket)
    if (process.env.NODE_ENV === 'production') {
      // TODO: Intégrer avec votre service de logging
      console.error('Production error:', {
        message: error.message,
        digest: error.digest,
        timestamp: new Date().toISOString()
      })
    } else {
      // En développement, afficher les détails dans la console
      console.error('❌ Erreur de développement:', error)
    }
  }, [error])

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl p-8 border-2 border-orange-200">
        <div className="text-center">
          {/* Icône d'erreur animée */}
          <div className="mx-auto w-24 h-24 bg-gradient-to-br from-red-100 to-orange-100 rounded-full flex items-center justify-center mb-6 animate-pulse">
            <svg className="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>

          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Une erreur s'est produite
          </h1>
          
          <p className="text-lg text-gray-600 mb-8">
            Nous sommes désolés pour ce désagrément. Notre équipe technique a été automatiquement notifiée et travaille à résoudre le problème.
          </p>

          {/* Afficher les détails UNIQUEMENT en développement */}
          {process.env.NODE_ENV === 'development' && (
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-6 text-left">
              <h3 className="font-bold text-red-900 mb-2">🔧 Mode Développement</h3>
              <p className="text-sm font-mono text-red-800 break-all">
                {error.message}
              </p>
              {error.digest && (
                <p className="text-xs text-red-600 mt-2">
                  Digest: {error.digest}
                </p>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <button
              onClick={() => reset()}
              className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 font-semibold text-lg"
            >
               Réessayer
            </button>
            
            <button
              onClick={() => window.location.href = '/'}
              className="bg-white border-2 border-orange-300 hover:border-orange-400 text-orange-700 px-8 py-4 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 font-semibold text-lg"
            >
             Retour à l'accueil
            </button>
          </div>

          {/* Conseils */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 text-left">
            <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              Que faire ?
            </h3>
            <ul className="space-y-2 text-blue-800">
              <li>• Vérifiez votre connexion internet</li>
              <li>• Actualisez la page (F5 ou Ctrl+R)</li>
              <li>• Videz le cache de votre navigateur</li>
              <li>• Si le problème persiste, contactez le support</li>
            </ul>
          </div>

          {/* Contact */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Support technique : 
              <a href="mailto:support@orange.ci" className="text-orange-600 hover:text-orange-700 font-semibold ml-1">
                support@orange.ci
              </a>
              {' | '}
              <a href="tel:+22503964789" className="text-orange-600 hover:text-orange-700 font-semibold">
                +225 07 03 96 47 89
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}