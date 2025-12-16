
// components/error-boundary.tsx 

'use client'

import { Component, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: any) {
    // Logger l'erreur en production
    if (process.env.NODE_ENV === 'production') {
      // TODO: Intégrer avec votre service de logging (Sentry, etc.)
      console.error('Error caught by boundary:', {
        error: error.message,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString()
      })
    } else {
      // En développement, afficher les détails
      console.error('❌ Error Boundary caught:', error, errorInfo)
    }
  }

  render() {
    if (this.state.hasError) {
      // Utiliser le fallback personnalisé si fourni
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Sinon, afficher l'UI d'erreur par défaut
      return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center p-6">
          <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl p-8 border-2 border-orange-200">
            <div className="text-center">
              {/* Icône d'erreur */}
              <div className="mx-auto w-20 h-20 bg-gradient-to-br from-red-100 to-orange-100 rounded-full flex items-center justify-center mb-6">
                <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>

              <h1 className="text-3xl font-bold text-gray-900 mb-3">
                Oups ! Une erreur s'est produite
              </h1>
              
              <p className="text-lg text-gray-600 mb-6">
                Nous sommes désolés, quelque chose s'est mal passé. Ne vous inquiétez pas, nos équipes ont été notifiées.
              </p>

              {/* Détails en développement uniquement */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-6 text-left">
                  <h3 className="font-bold text-red-900 mb-2">🔧 Détails de l'erreur (dev only)</h3>
                  <p className="text-sm font-mono text-red-800 break-all">
                    {this.state.error.message}
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => window.location.reload()}
                  className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 font-semibold"
                >
                 Recharger la page
                </button>
                
                <button
                  onClick={() => window.history.back()}
                  className="bg-white border-2 border-orange-300 hover:border-orange-400 text-orange-700 px-6 py-3 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 font-semibold"
                >
                  Retour
                </button>
              </div>

              {/* Contact support */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-500">
                  Besoin d'aide ? Contactez le support : 
                  <a href="mailto:support@orange.ci" className="text-orange-600 hover:text-orange-700 font-semibold ml-1">
                    support@orange.ci
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}