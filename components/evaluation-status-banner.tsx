// components/evaluation-status-banner.tsx
'use client'

import { CheckCircle, AlertCircle } from 'lucide-react'

interface EvaluationStatusBannerProps {
  isFullyEvaluated: boolean
  phase1Complete: boolean
  phase2Score: boolean
  needsSimulation: boolean
  canDoPhase2: boolean
}

export function EvaluationStatusBanner({
  isFullyEvaluated,
  phase1Complete,
  phase2Score,
  needsSimulation,
  canDoPhase2
}: EvaluationStatusBannerProps) {
  
  // Message de complétion
  if (isFullyEvaluated) {
    return (
      <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-6 shadow-sm animate-in fade-in slide-in-from-top-4 duration-500">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
            <CheckCircle className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-green-900 mb-2">
              ✅ Évaluation complétée
            </h3>
            <p className="text-green-700">
              Vous avez terminé toutes les phases d'évaluation pour ce candidat.
              {needsSimulation 
                ? " Les phases Face-à-Face et Simulation ont été complétées avec succès."
                : " La phase Face-à-Face a été complétée avec succès."
              }
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Message de progression
  const getProgressMessage = () => {
    if (!phase1Complete) {
      return "Veuillez compléter la phase Face-à-Face pour ce candidat."
    }
    
    if (needsSimulation && !phase2Score) {
      if (canDoPhase2) {
        return "🎉 La phase Simulation est maintenant disponible ! Veuillez la compléter pour finaliser votre évaluation."
      }
      return "⏳ En attente du déblocage de la phase Simulation. Toutes les moyennes de la Phase Face-à-Face doivent être validées par tous les jurys."
    }
    
    return "Continuez l'évaluation du candidat."
  }

  const getProgressIcon = () => {
    if (needsSimulation && phase1Complete && !phase2Score && !canDoPhase2) {
      return "⏳"
    }
    if (needsSimulation && phase1Complete && canDoPhase2) {
      return "🎉"
    }
    return "📝"
  }

  return (
    <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-6 shadow-sm animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
          <AlertCircle className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-blue-900 mb-2 flex items-center gap-2">
            <span>{getProgressIcon()}</span>
            <span>Évaluation en cours</span>
          </h3>
          <p className="text-blue-700">
            {getProgressMessage()}
          </p>
          
          {/* Barre de progression */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-blue-600 mb-2">
              <span className="font-medium">Progression</span>
              <span className="font-semibold">
                {phase1Complete && phase2Score 
                  ? "2/2 phases" 
                  : phase1Complete 
                    ? needsSimulation ? "1/2 phases" : "1/1 phase"
                    : "0/1 phase"
                }
              </span>
            </div>
            <div className="w-full bg-blue-200 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-blue-500 to-blue-600 h-full rounded-full transition-all duration-500 ease-out"
                style={{
                  width: needsSimulation 
                    ? phase1Complete && phase2Score 
                      ? '100%' 
                      : phase1Complete 
                        ? '50%' 
                        : '0%'
                    : phase1Complete 
                      ? '100%' 
                      : '0%'
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}