// components/dashboard-header.tsx
'use client'

import { signOut } from '@/lib/auth-client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

interface DashboardHeaderProps {
  user: {
    name: string
    email: string
    role?: string | null // CORRECTION : Accepter null
  }
  role: string | null // CORRECTION : Accepter null
}

export function DashboardHeader({ user, role }: DashboardHeaderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isProfileOpen, setIsProfileOpen] = useState(false)

  // CORRECTION : Utiliser une valeur par défaut pour le rôle
  const displayRole = role || "Utilisateur"

  const handleLogout = async () => {
    try {
      await signOut({
        fetchOptions: {
          onSuccess: () => {
            router.push('/auth/login')
            router.refresh()
          },
          onError: () => {
            window.location.href = '/auth/login'
          }
        }
      })
    } catch (error) {
      console.error('Erreur déconnexion:', error)
      window.location.href = '/auth/login'
    }
  }

  // Déterminer les liens disponibles selon le rôle
  const getNavigationLinks = () => {
    const baseLinks = [
      { href: '/wfm/dashboard', label: 'Tableau de bord', icon: '📊' },
      { href: '/wfm/candidates', label: 'Candidats', icon: '👥' }
    ]

    // Liens spécifiques au rôle WFM
    if (displayRole === 'WFM') { // CORRECTION : Utiliser displayRole
      return [
        ...baseLinks,
        { href: '/wfm/jury', label: 'Jury', icon: '🎯' },
        { href: '/wfm/sessions', label: 'Sessions', icon: '📅' },
        { href: '/wfm/export', label: 'Exports', icon: '📤' }
      ]
    }

    // Liens spécifiques au rôle JURY
    if (displayRole === 'JURY') { // CORRECTION : Utiliser displayRole
      return [
        ...baseLinks,
        { href: '/jury/evaluations', label: 'Évaluations', icon: '⭐' },
        { href: '/jury/face-to-face', label: 'Présentiel', icon: '👔' }
      ]
    }

    return baseLinks
  }

  const navigationLinks = getNavigationLinks()

  // Fonction pour vérifier si le lien est actif
  const isActiveLink = (href: string) => {
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <header className="border-b-2 border-orange-400 bg-white shadow-lg">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Partie gauche : Logo et navigation */}
          <div className="flex items-center space-x-6 flex-1 min-w-0">
            {/* Logo seul */}
            <Link href="/dashboard" className="flex-shrink-0">
              <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg flex items-center justify-center shadow-md hover:shadow-lg transition-shadow">
                <span className="text-white font-bold text-lg">R</span>
              </div>
            </Link>

            {/* Navigation horizontale avec scroll */}
            <nav className="flex items-center space-x-1 flex-1 min-w-0 overflow-x-auto scrollbar-hide">
              {navigationLinks.map((link) => {
                const isActive = isActiveLink(link.href)
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`
                      flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap flex-shrink-0
                      ${isActive 
                        ? 'bg-orange-500 text-white shadow-md' 
                        : 'text-gray-700 hover:bg-orange-50 hover:text-orange-600 border border-transparent hover:border-orange-200'
                      }
                    `}
                  >
                    <span className="text-base">{link.icon}</span>
                    <span>{link.label}</span>
                  </Link>
                )
              })}
            </nav>
          </div>

          {/* Partie droite : Profile et déconnexion */}
          <div className="flex items-center space-x-3 flex-shrink-0">
            {/* Menu profile */}
            <div className="relative">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center space-x-2 p-2 rounded-lg hover:bg-orange-50 transition-colors"
              >
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center border border-orange-200">
                  <span className="text-orange-600 text-sm font-semibold">
                    {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </span>
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-black truncate max-w-[120px]">
                    {user.name}
                  </p>
                  {/* CORRECTION : Utiliser displayRole au lieu de role */}
                  <p className="text-xs text-gray-600">{displayRole}</p>
                </div>
                <span className="text-gray-400">▼</span>
              </button>

              {/* Dropdown menu */}
              {isProfileOpen && (
                <div className="absolute right-0 top-12 mt-1 w-48 bg-white rounded-lg shadow-lg border border-orange-200 py-2 z-50 cursor-pointer">
                  {/* Informations utilisateur */}
                  <div className="px-4 py-2 border-b border-orange-100">
                    <p className="text-sm font-medium text-black">{user.name}</p>
                    <p className="text-xs text-gray-600 truncate">{user.email}</p>
                    {/* CORRECTION : Utiliser displayRole au lieu de role */}
                    <p className="text-xs text-orange-600 font-medium">{displayRole}</p>
                  </div>
                  
                  {/* Changer mot de passe */}
                  <Link
                    href="/change-password"
                    onClick={() => setIsProfileOpen(false)}
                    className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors"
                  >
                    <span>🔒</span>
                    <span>Changer mot de passe</span>
                  </Link>

                  {/* Déconnexion */}
                  <button
                    onClick={() => {
                      setIsProfileOpen(false)
                      handleLogout()
                    }}
                    className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors w-full text-left"
                  >
                    <span>🚪</span>
                    <span>Déconnexion</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Style pour cacher la scrollbar */}
      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </header>
  )
}