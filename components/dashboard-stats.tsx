// components/dashboard-stats.tsx
'use client'

import { useState } from 'react'
import { Metier } from '@prisma/client'

interface DashboardStatsProps {
  stats: {
    totalCandidates: number
    totalSessions: number
    activeSessions: number
    totalJuryMembers: number
    recruitedCount: number
    pendingEvaluations: number
    metierStats: Array<{
      metier: Metier
      count: number
      recruited: number
    }>
  }
}

export function DashboardStats({ stats }: DashboardStatsProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'all'>('month')

  return (
    <div className="space-y-6">
      {/* Filtre période */}
      <div className="flex justify-end">
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setSelectedPeriod('week')}
            className={`px-3 py-1 text-sm rounded-md ${
              selectedPeriod === 'week'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            7 jours
          </button>
          <button
            onClick={() => setSelectedPeriod('month')}
            className={`px-3 py-1 text-sm rounded-md ${
              selectedPeriod === 'month'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            30 jours
          </button>
          <button
            onClick={() => setSelectedPeriod('all')}
            className={`px-3 py-1 text-sm rounded-md ${
              selectedPeriod === 'all'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Tout
          </button>
        </div>
      </div>

      {/* Cartes de statistiques principales */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Candidats</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalCandidates}</p>
            </div>
          </div>
        </div>

        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Recrutés</p>
              <p className="text-2xl font-bold text-gray-900">{stats.recruitedCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Sessions Actives</p>
              <p className="text-2xl font-bold text-gray-900">{stats.activeSessions}</p>
            </div>
          </div>
        </div>

        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Membres Jury</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalJuryMembers}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Statistiques par métier */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Répartition par Métier</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stats.metierStats.map(metierStat => (
            <div key={metierStat.metier} className="border rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-medium text-gray-900">{metierStat.metier}</h4>
                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                  {metierStat.count}
                </span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Recrutés:</span>
                <span className="font-medium text-green-600">{metierStat.recruited}</span>
              </div>
              <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full" 
                  style={{ width: `${(metierStat.recruited / metierStat.count) * 100}%` }}
                ></div>
              </div>
              <div className="text-xs text-gray-500 mt-1 text-right">
                {((metierStat.recruited / metierStat.count) * 100).toFixed(1)}% de réussite
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Graphique de progression (simplifié) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Taux de Recrutement</h3>
          <div className="flex items-end justify-between h-32">
            <div className="flex flex-col items-center">
              <div className="w-8 bg-green-500 rounded-t" style={{ height: '60%' }}></div>
              <span className="text-xs mt-1">Call Center</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-8 bg-green-400 rounded-t" style={{ height: '45%' }}></div>
              <span className="text-xs mt-1">Agences</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-8 bg-yellow-500 rounded-t" style={{ height: '30%' }}></div>
              <span className="text-xs mt-1">Bo Réclam</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-8 bg-green-400 rounded-t" style={{ height: '50%' }}></div>
              <span className="text-xs mt-1">Télévente</span>
            </div>
          </div>
        </div>

        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Évaluations en Attente</h3>
          <div className="text-center py-8">
            <div className="text-3xl font-bold text-yellow-600">{stats.pendingEvaluations}</div>
            <p className="text-gray-600 mt-2">Évaluations à compléter</p>
            <div className="mt-4">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Phase 1</span>
                <span>65%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '65%' }}></div>
              </div>
            </div>
            <div className="mt-2">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Phase 2</span>
                <span>35%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: '35%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}