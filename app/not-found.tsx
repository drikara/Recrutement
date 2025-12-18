// app/not-found.tsx
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

export const metadata = {
  title: "Page non trouvée | Orange CI",
  description: "La page que vous recherchez n'existe pas ou a été déplacée.",
}

export default function NotFound() {
  const router = useRouter()

  useEffect(() => {
    // Logger l'accès à la page 404 en production
    if (process.env.NODE_ENV === 'production') {
      console.log('404 Page Accessed:', {
        path: window.location.pathname,
        referrer: document.referrer,
        timestamp: new Date().toISOString()
      })
    }
  }, [])

  const handleGoBack = () => {
    if (window.history.length > 1) {
      router.back()
    } else {
      router.push('/wfm/dashboard')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col items-center justify-center p-6">
      <div className="max-w-3xl w-full mx-auto">
        {/* Logo Orange */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full mb-4">
            <span className="text-white text-2xl font-bold">O</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Orange Workflow Manager</h1>
        </div>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
          <div className="md:flex">
            {/* Section visuelle */}
            <div className="md:w-2/5 bg-gradient-to-br from-orange-50 to-amber-50 p-8 md:p-12 flex flex-col items-center justify-center">
              <div className="relative w-48 h-48 mb-6">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-100 to-amber-100 rounded-full"></div>
                <div className="absolute inset-8 bg-gradient-to-br from-orange-200 to-amber-200 rounded-full flex items-center justify-center">
                  <svg 
                    className="w-24 h-24 text-orange-600" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={1.5} 
                      d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                    />
                  </svg>
                </div>
                <div className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-12 h-12 flex items-center justify-center text-2xl font-bold">
                  404
                </div>
              </div>
              
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Oups !</h2>
                <p className="text-gray-600">Cette page s'est envolée</p>
              </div>
            </div>

            {/* Section contenu */}
            <div className="md:w-3/5 p-8 md:p-12">
              <div className="mb-8">
                <h1 className="text-4xl font-bold text-gray-900 mb-4">
                  Page non trouvée
                </h1>
                <p className="text-lg text-gray-600 mb-6">
                  La page que vous recherchez n'existe pas, a été déplacée ou est temporairement inaccessible.
                </p>
                
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6">
                  <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                    Que s'est-il passé ?
                  </h3>
                  <ul className="text-blue-800 text-sm space-y-1">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-0.5">•</span>
                      <span>L'URL peut contenir une erreur de frappe</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-0.5">•</span>
                      <span>La page a été déplacée ou supprimée</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-0.5">•</span>
                      <span>Votre session a peut-être expiré</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={handleGoBack}
                    className="flex-1 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white px-6 py-3.5 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 font-semibold text-center"
                  >
                    ← Retour en arrière
                  </button>
                  
                  <Link
                    href="/wfm/dashboard"
                    className="flex-1 bg-white border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 text-gray-800 px-6 py-3.5 rounded-lg shadow-sm hover:shadow transition-all duration-200 font-semibold text-center"
                  >
                    Tableau de bord
                  </Link>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Link
                    href="/"
                    className="flex-1 bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700 px-6 py-3 rounded-lg transition-all duration-200 font-medium text-center text-sm"
                  >
                    Page d'accueil
                  </Link>
                  
                  <button
                    onClick={() => window.location.reload()}
                    className="flex-1 bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700 px-6 py-3 rounded-lg transition-all duration-200 font-medium text-sm"
                  >
                    Actualiser la page
                  </button>
                </div>
              </div>

              {/* Recherche ou aide */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 mb-2">
                      Vous ne trouvez toujours pas ce que vous cherchez ?
                    </p>
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                      </svg>
                      <input
                        type="text"
                        placeholder="Rechercher dans l'application..."
                        className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            router.push(`/search?q=${encodeURIComponent(e.currentTarget.value)}`)
                          }
                        }}
                      />
                    </div>
                  </div>
                  
                  <div className="text-center md:text-right">
                    <Link
                      href="/contact"
                      className="inline-flex items-center gap-2 text-orange-600 hover:text-orange-700 font-medium text-sm"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                        <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                      </svg>
                      Contacter le support
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pied de page */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Besoin d'aide ? Contactez-nous au{' '}
            <a href="tel:+2250703964789" className="text-orange-600 hover:text-orange-700 font-semibold">
              +225 07 03 96 47 89
            </a>
            {' '}ou par email à{' '}
            <a href="mailto:support@orange.ci" className="text-orange-600 hover:text-orange-700 font-semibold">
              support@orange.ci
            </a>
          </p>
          <p className="text-xs text-gray-400 mt-2">
            Erreur 404 • URL: {typeof window !== 'undefined' ? window.location.pathname : 'Chargement...'} • {new Date().toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  )
}