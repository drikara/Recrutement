"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, AlertCircle, Sparkles, ArrowRight } from "lucide-react"
import { FFDecision } from "@prisma/client"

interface JuryScoreFormProps {
  candidate: {
    id: number
    fullName: string
    metier: string
  }
  juryMember: {
    id: number
    fullName: string
    roleType: string
  }
  phase1Complete: boolean
  canDoPhase2: boolean
  // ✅ PROPS DE NAVIGATION
  nextCandidateId?: number | null
  previousCandidateId?: number | null
  currentPosition?: number | null
  totalCandidates?: number | null
}

export function JuryScoreForm({
  candidate,
  juryMember,
  phase1Complete,
  canDoPhase2,
  nextCandidateId,
  previousCandidateId,
  currentPosition,
  totalCandidates
}: JuryScoreFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [phase, setPhase] = useState<1 | 2>(phase1Complete && canDoPhase2 ? 2 : 1)

  // États pour Phase 1
  const [phase1Data, setPhase1Data] = useState({
    voiceQuality: "",
    verbalCommunication: "",
    presentationVisuelle: "",
    appetenceDigitale: "",
    comments: ""
  })

  // États pour Phase 2
  const [phase2Data, setPhase2Data] = useState({
    sensNegociation: "",
    capacitePersuasion: "",
    sensCombativite: "",
    comments: ""
  })

  const isAgences = candidate.metier === 'AGENCES'
  const isReseauxSociaux = candidate.metier === 'RESEAUX_SOCIAUX'
  const needsSimulation = candidate.metier === 'AGENCES' || candidate.metier === 'TELEVENTE'

  // Calcul automatique décision Phase 1
  const getPhase1Decision = (): FFDecision | null => {
    const voice = parseFloat(phase1Data.voiceQuality) || 0
    const verbal = parseFloat(phase1Data.verbalCommunication) || 0
    const presentation = parseFloat(phase1Data.presentationVisuelle) || 0

    if (isAgences) {
      return (voice >= 3 && verbal >= 3 && presentation >= 3) ? 'FAVORABLE' : 'DEFAVORABLE'
    } else {
      return (voice >= 3 && verbal >= 3) ? 'FAVORABLE' : 'DEFAVORABLE'
    }
  }

  // Calcul automatique décision Phase 2
  const getPhase2Decision = (): FFDecision | null => {
    const nego = parseFloat(phase2Data.sensNegociation) || 0
    const persuasion = parseFloat(phase2Data.capacitePersuasion) || 0
    const combativite = parseFloat(phase2Data.sensCombativite) || 0

    return (nego >= 3 && persuasion >= 3 && combativite >= 3) ? 'FAVORABLE' : 'DEFAVORABLE'
  }

  const currentDecision = phase === 1 ? getPhase1Decision() : getPhase2Decision()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const payload = phase === 1 ? {
        candidate_id: candidate.id,
        jury_member_id: juryMember.id,
        phase: 1,
        voice_quality: parseFloat(phase1Data.voiceQuality) || 0,
        verbal_communication: parseFloat(phase1Data.verbalCommunication) || 0,
        presentation_visuelle: isAgences ? (parseFloat(phase1Data.presentationVisuelle) || 0) : 0,
        appetence_digitale: isReseauxSociaux ? (parseFloat(phase1Data.appetenceDigitale) || 0) : null,
        decision: getPhase1Decision(),
        comments: phase1Data.comments || ""
      } : {
        candidate_id: candidate.id,
        jury_member_id: juryMember.id,
        phase: 2,
        simulation_sens_negociation: parseFloat(phase2Data.sensNegociation) || 0,
        simulation_capacite_persuasion: parseFloat(phase2Data.capacitePersuasion) || 0,
        simulation_sens_combativite: parseFloat(phase2Data.sensCombativite) || 0,
        decision: getPhase2Decision(),
        comments: phase2Data.comments || ""
      }

      const response = await fetch('/api/jury/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erreur lors de l\'enregistrement')
      }

      // ✅ NAVIGATION AUTOMATIQUE
      if (nextCandidateId) {
        router.push(`/jury/evaluations/${nextCandidateId}`)
        router.refresh()
      } else {
        alert("✅ Félicitations ! Vous avez évalué tous les candidats.")
        router.push("/jury/evaluations")
        router.refresh()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-64">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-orange-200 rounded-full"></div>
          <div className="w-20 h-20 border-4 border-orange-500 border-t-transparent rounded-full animate-spin absolute top-0"></div>
        </div>
        <p className="mt-6 text-gray-600 font-semibold">Enregistrement en cours...</p>
        <p className="text-sm text-gray-500 mt-2">
          {nextCandidateId ? 'Passage au candidat suivant...' : 'Finalisation...'}
        </p>
      </div>
    )
  }

  return (
    <Card className="border-2 border-orange-200 shadow-xl rounded-2xl overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-orange-100 via-amber-100 to-cyan-100 border-b-2 border-orange-200">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-3 text-orange-800">
            <Sparkles className="w-6 h-6 text-orange-600" />
            Évaluation {phase === 1 ? 'Face-à-Face' : 'Simulation'}
          </CardTitle>
          {!phase1Complete && needsSimulation && (
            <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border-2 border-orange-300 shadow-sm">
              <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-semibold text-orange-700">Phase 1 de 2</span>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-8">
        {/* Onglets Phase (si simulation nécessaire) */}
        {needsSimulation && (
          <div className="flex gap-3 mb-8">
            <button
              type="button"
              onClick={() => setPhase(1)}
              disabled={phase1Complete}
              className={`flex-1 py-4 px-6 rounded-xl font-bold transition-all duration-300 shadow-md ${
                phase === 1
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/30'
                  : phase1Complete
                    ? 'bg-green-100 text-green-700 border-2 border-green-300'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                {phase1Complete && <CheckCircle className="w-5 h-5" />}
                <span>Phase  Face à Face</span>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setPhase(2)}
              disabled={!canDoPhase2}
              className={`flex-1 py-4 px-6 rounded-xl font-bold transition-all duration-300 shadow-md ${
                phase === 2
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/30'
                  : canDoPhase2
                    ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    : 'bg-gray-50 text-gray-400 cursor-not-allowed opacity-50'
              }`}
            >
              Phase  Simulation
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Phase 1 */}
          
          {phase === 1 && (

            <div className="space-y-6">

               {/* Présentation Visuelle (AGENCES uniquement) */}
              {isAgences && (
                <div className="space-y-4">
                  <Label className="text-gray-800 font-bold text-lg flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                      <span className="text-white text-sm">1</span>
                    </div>
                    Présentation Visuelle (1-5) * 
                  </Label>
                  <div className="grid grid-cols-5 gap-3">
                    {[1, 2, 3, 4, 5].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setPhase1Data(prev => ({ ...prev, presentationVisuelle: num.toString() }))}
                        className={`py-5 rounded-2xl border-3 font-bold text-lg transition-all duration-300 transform hover:scale-105 ${
                          parseFloat(phase1Data.presentationVisuelle) === num
                            ? num >= 3
                              ? "bg-gradient-to-br from-green-500 to-emerald-500 text-white border-green-600 shadow-xl shadow-green-500/50 scale-110"
                              : "bg-gradient-to-br from-red-500 to-pink-500 text-white border-red-600 shadow-xl shadow-red-500/50 scale-110"
                            : "bg-white text-gray-700 border-gray-300 hover:border-purple-400 shadow-md"
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                  <div className="flex justify-between items-center px-2">
                    <span className={`text-sm font-semibold ${parseFloat(phase1Data.presentationVisuelle) >= 3 ? "text-green-600" : "text-gray-500"}`}>
                      {parseFloat(phase1Data.presentationVisuelle) >= 3 ? "✅ Seuil atteint" : "⚠️ Minimum 3/5 requis"}
                    </span>
                    <span className="text-sm font-bold text-purple-600">
                      Note: {phase1Data.presentationVisuelle || "0"}/5
                    </span>
                  </div>
                </div>
              )}
              {/* Qualité de la Voix */}
              <div className="space-y-4">
                <Label className="text-gray-800 font-bold text-lg flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-amber-500 rounded-lg flex items-center justify-center">
                    <span className="text-white text-sm">2</span>
                  </div>
                  Qualité de la Voix (1-5) *
                </Label>
                <div className="grid grid-cols-5 gap-3">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setPhase1Data(prev => ({ ...prev, voiceQuality: num.toString() }))}
                      className={`py-5 rounded-2xl border-3 font-bold text-lg transition-all duration-300 transform hover:scale-105 ${
                        parseFloat(phase1Data.voiceQuality) === num
                          ? num >= 3
                            ? "bg-gradient-to-br from-green-500 to-emerald-500 text-white border-green-600 shadow-xl shadow-green-500/50 scale-110"
                            : "bg-gradient-to-br from-red-500 to-pink-500 text-white border-red-600 shadow-xl shadow-red-500/50 scale-110"
                          : "bg-white text-gray-700 border-gray-300 hover:border-orange-400 shadow-md"
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
                <div className="flex justify-between items-center px-2">
                  <span className={`text-sm font-semibold ${parseFloat(phase1Data.voiceQuality) >= 3 ? "text-green-600" : "text-gray-500"}`}>
                    {parseFloat(phase1Data.voiceQuality) >= 3 ? "✅ Seuil atteint" : "⚠️ Minimum 3/5 requis"}
                  </span>
                  <span className="text-sm font-bold text-orange-600">
                    Note: {phase1Data.voiceQuality || "0"}/5
                  </span>
                </div>
              </div>

              {/* Communication Verbale */}
              <div className="space-y-4">
                <Label className="text-gray-800 font-bold text-lg flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center">
                    <span className="text-white text-sm">3</span>
                  </div>
                  Communication Verbale (1-5) *
                </Label>
                <div className="grid grid-cols-5 gap-3">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setPhase1Data(prev => ({ ...prev, verbalCommunication: num.toString() }))}
                      className={`py-5 rounded-2xl border-3 font-bold text-lg transition-all duration-300 transform hover:scale-105 ${
                        parseFloat(phase1Data.verbalCommunication) === num
                          ? num >= 3
                            ? "bg-gradient-to-br from-green-500 to-emerald-500 text-white border-green-600 shadow-xl shadow-green-500/50 scale-110"
                            : "bg-gradient-to-br from-red-500 to-pink-500 text-white border-red-600 shadow-xl shadow-red-500/50 scale-110"
                          : "bg-white text-gray-700 border-gray-300 hover:border-cyan-400 shadow-md"
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
                <div className="flex justify-between items-center px-2">
                  <span className={`text-sm font-semibold ${parseFloat(phase1Data.verbalCommunication) >= 3 ? "text-green-600" : "text-gray-500"}`}>
                    {parseFloat(phase1Data.verbalCommunication) >= 3 ? "✅ Seuil atteint" : "⚠️ Minimum 3/5 requis"}
                  </span>
                  <span className="text-sm font-bold text-cyan-600">
                    Note: {phase1Data.verbalCommunication || "0"}/5
                  </span>
                </div>
              </div>

             

              {/* Appétence Digitale (RESEAUX_SOCIAUX uniquement) */}
              {isReseauxSociaux && (
                <div className="space-y-4">
                  <Label className="text-gray-800 font-bold text-lg flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
                      <span className="text-white text-sm">🌐</span>
                    </div>
                    Appétence Digitale (1-5) * 
                  </Label>
                  <div className="grid grid-cols-5 gap-3">
                    {[1, 2, 3, 4, 5].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setPhase1Data(prev => ({ ...prev, appetenceDigitale: num.toString() }))}
                        className={`py-5 rounded-2xl border-3 font-bold text-lg transition-all duration-300 transform hover:scale-105 ${
                          parseFloat(phase1Data.appetenceDigitale) === num
                            ? num >= 3
                              ? "bg-gradient-to-br from-green-500 to-emerald-500 text-white border-green-600 shadow-xl shadow-green-500/50 scale-110"
                              : "bg-gradient-to-br from-red-500 to-pink-500 text-white border-red-600 shadow-xl shadow-red-500/50 scale-110"
                            : "bg-white text-gray-700 border-gray-300 hover:border-indigo-400 shadow-md"
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                  <div className="flex justify-between items-center px-2">
                    <span className={`text-sm font-semibold ${parseFloat(phase1Data.appetenceDigitale) >= 3 ? "text-green-600" : "text-gray-500"}`}>
                      {parseFloat(phase1Data.appetenceDigitale) >= 3 ? "✅ Seuil atteint" : "⚠️ Minimum 3/5 requis"}
                    </span>
                    <span className="text-sm font-bold text-indigo-600">
                      Note: {phase1Data.appetenceDigitale || "0"}/5
                    </span>
                  </div>
                </div>
              )}

              {/* Commentaires Phase 1 */}
              <div className="space-y-3">
                <Label className="text-gray-800 font-bold text-lg">
                  Commentaires (optionnel)
                </Label>
                <Textarea
                  value={phase1Data.comments}
                  onChange={(e) => setPhase1Data(prev => ({ ...prev, comments: e.target.value }))}
                  rows={4}
                  className="border-2 border-orange-200 focus:border-orange-400 rounded-xl p-4 resize-none"
                  placeholder="Vos observations sur le candidat..."
                />
              </div>
            </div>
          )}

          {/* Phase 2 - SIMULATION */}
          {phase === 2 && (
            <div className="space-y-6">
              {/* Sens Négociation */}
              <div className="space-y-4">
                <Label className="text-gray-800 font-bold text-lg flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center">
                    <span className="text-white text-sm">1</span>
                  </div>
                  Sens de la Négociation (1-5) *
                </Label>
                <div className="grid grid-cols-5 gap-3">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setPhase2Data(prev => ({ ...prev, sensNegociation: num.toString() }))}
                      className={`py-5 rounded-2xl border-3 font-bold text-lg transition-all duration-300 transform hover:scale-105 ${
                        parseFloat(phase2Data.sensNegociation) === num
                          ? num >= 3
                            ? "bg-gradient-to-br from-green-500 to-emerald-500 text-white border-green-600 shadow-xl shadow-green-500/50 scale-110"
                            : "bg-gradient-to-br from-red-500 to-pink-500 text-white border-red-600 shadow-xl shadow-red-500/50 scale-110"
                          : "bg-white text-gray-700 border-gray-300 hover:border-cyan-400 shadow-md"
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
                <div className="flex justify-between items-center px-2">
                  <span className={`text-sm font-semibold ${parseFloat(phase2Data.sensNegociation) >= 3 ? "text-green-600" : "text-gray-500"}`}>
                    {parseFloat(phase2Data.sensNegociation) >= 3 ? "✅ Seuil atteint" : "⚠️ Minimum 3/5 requis"}
                  </span>
                  <span className="text-sm font-bold text-cyan-600">
                    Note: {phase2Data.sensNegociation || "0"}/5
                  </span>
                </div>
              </div>

              {/* Capacité de Persuasion */}
              <div className="space-y-4">
                <Label className="text-gray-800 font-bold text-lg flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-amber-500 rounded-lg flex items-center justify-center">
                    <span className="text-white text-sm">2</span>
                  </div>
                  Capacité de Persuasion (1-5) *
                </Label>
                <div className="grid grid-cols-5 gap-3">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setPhase2Data(prev => ({ ...prev, capacitePersuasion: num.toString() }))}
                      className={`py-5 rounded-2xl border-3 font-bold text-lg transition-all duration-300 transform hover:scale-105 ${
                        parseFloat(phase2Data.capacitePersuasion) === num
                          ? num >= 3
                            ? "bg-gradient-to-br from-green-500 to-emerald-500 text-white border-green-600 shadow-xl shadow-green-500/50 scale-110"
                            : "bg-gradient-to-br from-red-500 to-pink-500 text-white border-red-600 shadow-xl shadow-red-500/50 scale-110"
                          : "bg-white text-gray-700 border-gray-300 hover:border-orange-400 shadow-md"
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
                <div className="flex justify-between items-center px-2">
                  <span className={`text-sm font-semibold ${parseFloat(phase2Data.capacitePersuasion) >= 3 ? "text-green-600" : "text-gray-500"}`}>
                    {parseFloat(phase2Data.capacitePersuasion) >= 3 ? "✅ Seuil atteint" : "⚠️ Minimum 3/5 requis"}
                  </span>
                  <span className="text-sm font-bold text-orange-600">
                    Note: {phase2Data.capacitePersuasion || "0"}/5
                  </span>
                </div>
              </div>

              {/* Sens de la Combativité */}
              <div className="space-y-4">
                <Label className="text-gray-800 font-bold text-lg flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                    <span className="text-white text-sm">3</span>
                  </div>
                  Sens de la Combativité (1-5) *
                </Label>
                <div className="grid grid-cols-5 gap-3">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setPhase2Data(prev => ({ ...prev, sensCombativite: num.toString() }))}
                      className={`py-5 rounded-2xl border-3 font-bold text-lg transition-all duration-300 transform hover:scale-105 ${
                        parseFloat(phase2Data.sensCombativite) === num
                          ? num >= 3
                            ? "bg-gradient-to-br from-green-500 to-emerald-500 text-white border-green-600 shadow-xl shadow-green-500/50 scale-110"
                            : "bg-gradient-to-br from-red-500 to-pink-500 text-white border-red-600 shadow-xl shadow-red-500/50 scale-110"
                          : "bg-white text-gray-700 border-gray-300 hover:border-purple-400 shadow-md"
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
                <div className="flex justify-between items-center px-2">
                  <span className={`text-sm font-semibold ${parseFloat(phase2Data.sensCombativite) >= 3 ? "text-green-600" : "text-gray-500"}`}>
                    {parseFloat(phase2Data.sensCombativite) >= 3 ? "✅ Seuil atteint" : "⚠️ Minimum 3/5 requis"}
                  </span>
                  <span className="text-sm font-bold text-purple-600">
                    Note: {phase2Data.sensCombativite || "0"}/5
                  </span>
                </div>
              </div>

              {/* Commentaires Phase 2 */}
              <div className="space-y-3">
                <Label className="text-gray-800 font-bold text-lg">
                  Commentaires (optionnel)
                </Label>
                <Textarea
                  value={phase2Data.comments}
                  onChange={(e) => setPhase2Data(prev => ({ ...prev, comments: e.target.value }))}
                  rows={4}
                  className="border-2 border-cyan-200 focus:border-cyan-400 rounded-xl p-4 resize-none"
                  placeholder="Vos observations sur la simulation..."
                />
              </div>
            </div>
          )}

          {/* Décision en temps réel */}
          {currentDecision && (
            <div className={`p-6 rounded-2xl border-3 transition-all duration-300 ${
              currentDecision === 'FAVORABLE' 
                ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-300 shadow-xl shadow-green-500/20' 
                : 'bg-gradient-to-br from-red-50 to-pink-50 border-red-300 shadow-xl shadow-red-500/20'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="font-bold text-xl text-gray-800 mb-1">Décision </h4>
                  <p className="text-sm text-gray-600">
                    Basée sur vos notes
                  </p>
                </div>
                <div className={`flex items-center gap-3 px-6 py-3 rounded-2xl font-bold text-xl shadow-lg ${
                  currentDecision === 'FAVORABLE' 
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white' 
                    : 'bg-gradient-to-r from-red-500 to-pink-500 text-white'
                }`}>
                  {currentDecision === 'FAVORABLE' ? (
                    <><CheckCircle className="w-6 h-6" /> FAVORABLE</>
                  ) : (
                    <><AlertCircle className="w-6 h-6" /> DÉFAVORABLE</>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Message d'erreur */}
          {error && (
            <div className="p-5 bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-300 rounded-2xl">
              <p className="text-red-700 font-semibold flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                {error}
              </p>
            </div>
          )}

          {/* Bouton de soumission */}
          <div className="pt-6">
            <Button
              type="submit"
              disabled={loading || !currentDecision}
              className="w-full py-6 text-lg font-bold rounded-2xl shadow-2xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-orange-500 via-amber-500 to-cyan-500 hover:from-orange-600 hover:via-amber-600 hover:to-cyan-600 text-white border-0 cursor-pointer"
            >
              <div className="flex items-center justify-center gap-3">
                {loading ? (
                  <>
                    <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Enregistrement...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-6 h-6" />
                    <span>
                      {nextCandidateId 
                        ? `Valider et passer au suivant` 
                        : `Valider (dernier candidat)`
                      }
                    </span>
                    {nextCandidateId && <ArrowRight className="w-6 h-6" />}
                  </>
                )}
              </div>
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}