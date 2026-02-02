'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

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
}

/* ===========================
   Composant de saisie décimale
   =========================== */
function ScoreInput({
  value,
  onChange,
  label,
}: {
  value: number | null
  onChange: (score: number) => void
  label: string
}) {
  const presets = [0, 1, 2, 3, 4, 5]

  const handleChange = (val: number) => {
    if (isNaN(val)) return
    if (val < 0 || val > 5) return
    onChange(Math.round(val * 10) / 10) // 1 décimale max
  }

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        {label} *
      </label>

      {/* Boutons rapides */}
      <div className="flex gap-2">
        {presets.map((score) => (
          <button
            key={score}
            type="button"
            onClick={() => handleChange(score)}
            className={`flex-1 py-2 rounded-lg font-semibold transition ${
              value === score
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            {score}
          </button>
        ))}
      </div>

      {/* Champ décimal */}
      <input
        type="number"
        min={0}
        max={5}
        step={0.1}
        inputMode="decimal"
        value={value ?? ''}
        onChange={(e) => handleChange(Number(e.target.value))}
        placeholder="Ex : 3.5"
        className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
      />

      {value !== null && (
        <p className="text-sm text-center text-gray-600">
          Note sélectionnée : <strong>{value.toFixed(1)} / 5</strong>
        </p>
      )}
    </div>
  )
}

export function JuryScoreForm({
  candidate,
  juryMember,
  phase1Complete,
  canDoPhase2,
}: JuryScoreFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [activePhase, setActivePhase] = useState<1 | 2>(1)

  /* ===========================
     États Phase 1
     =========================== */
  const [phase1Scores, setPhase1Scores] = useState({
    presentation_visuelle: null as number | null,
    verbal_communication: null as number | null,
    voice_quality: null as number | null,
    comments: '',
  })

  /* ===========================
     États Phase 2
     =========================== */
  const [phase2Scores, setPhase2Scores] = useState({
    sens_negociation: null as number | null,
    capacite_persuasion: null as number | null,
    sens_combativite: null as number | null,
    comments: '',
  })

  const isAgences = candidate.metier === 'AGENCES'
  const needsSimulation =
    candidate.metier === 'AGENCES' || candidate.metier === 'TELEVENTE'

  /* ===========================
     Règles métier
     =========================== */
  const validatePhase1 = () => {
    if (
      phase1Scores.verbal_communication === null ||
      phase1Scores.voice_quality === null
    )
      return false

    if (isAgences) {
      if (phase1Scores.presentation_visuelle === null) return false
      return (
        phase1Scores.presentation_visuelle >= 3 &&
        phase1Scores.verbal_communication >= 3 &&
        phase1Scores.voice_quality >= 3
      )
    }

    return (
      phase1Scores.verbal_communication >= 3 &&
      phase1Scores.voice_quality >= 3
    )
  }

  const validatePhase2 = () => {
    if (
      phase2Scores.sens_negociation === null ||
      phase2Scores.capacite_persuasion === null ||
      phase2Scores.sens_combativite === null
    )
      return false

    return (
      phase2Scores.sens_negociation >= 3 &&
      phase2Scores.capacite_persuasion >= 3 &&
      phase2Scores.sens_combativite >= 3
    )
  }

  const isPhase1Complete = () => {
    if (isAgences) {
      return (
        phase1Scores.presentation_visuelle !== null &&
        phase1Scores.verbal_communication !== null &&
        phase1Scores.voice_quality !== null
      )
    }
    return (
      phase1Scores.verbal_communication !== null &&
      phase1Scores.voice_quality !== null
    )
  }

  const isPhase2Complete = () => {
    return (
      phase2Scores.sens_negociation !== null &&
      phase2Scores.capacite_persuasion !== null &&
      phase2Scores.sens_combativite !== null
    )
  }

  /* ===========================
     Submit Phase 1
     =========================== */
  const handleSubmitPhase1 = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isPhase1Complete()) return alert('Veuillez remplir toutes les notes')

    setLoading(true)

    const decision = validatePhase1() ? 'FAVORABLE' : 'DEFAVORABLE'

    const payload = {
      candidate_id: candidate.id,
      phase: 1,
      verbal_communication: phase1Scores.verbal_communication,
      voice_quality: phase1Scores.voice_quality,
      ...(isAgences && {
        presentation_visuelle: phase1Scores.presentation_visuelle,
      }),
      decision,
      comments: phase1Scores.comments || null,
    }

    const res = await fetch('/api/jury/scores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    setLoading(false)

    if (!res.ok) return alert('Erreur lors de la sauvegarde')

    alert(`Phase Face à Face enregistrée (${decision})`)
    router.refresh()

    if (needsSimulation && decision === 'FAVORABLE') {
      setActivePhase(2)
    }
  }

  /* ===========================
     Submit Phase 2
     =========================== */
  const handleSubmitPhase2 = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canDoPhase2) return alert('Simulation non débloquée')
    if (!isPhase2Complete()) return alert('Veuillez remplir toutes les notes')

    setLoading(true)

    const decision = validatePhase2() ? 'FAVORABLE' : 'DEFAVORABLE'

    const payload = {
      candidate_id: candidate.id,
      phase: 2,
      simulation_sens_negociation: phase2Scores.sens_negociation,
      simulation_capacite_persuasion: phase2Scores.capacite_persuasion,
      simulation_sens_combativite: phase2Scores.sens_combativite,
      decision,
      comments: phase2Scores.comments || null,
    }

    const res = await fetch('/api/jury/scores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    setLoading(false)

    if (!res.ok) return alert('Erreur lors de la sauvegarde')

    alert(`Phase Simulation enregistrée (${decision})`)
    router.push('/jury/evaluations')
  }

  /* ===========================
     RENDER
     =========================== */
  return (
    <div className="space-y-8">
      {activePhase === 1 && (
        <form onSubmit={handleSubmitPhase1} className="space-y-6">
          {isAgences && (
            <ScoreInput
              label="Présentation Visuelle (/5)"
              value={phase1Scores.presentation_visuelle}
              onChange={(v) =>
                setPhase1Scores((p) => ({
                  ...p,
                  presentation_visuelle: v,
                }))
              }
            />
          )}

          <ScoreInput
            label="Communication Verbale (/5)"
            value={phase1Scores.verbal_communication}
            onChange={(v) =>
              setPhase1Scores((p) => ({
                ...p,
                verbal_communication: v,
              }))
            }
          />

          <ScoreInput
            label="Qualité de la Voix (/5)"
            value={phase1Scores.voice_quality}
            onChange={(v) =>
              setPhase1Scores((p) => ({ ...p, voice_quality: v }))
            }
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg"
          >
            Sauvegarder Phase Face à Face
          </button>
        </form>
      )}

      {activePhase === 2 && canDoPhase2 && (
        <form onSubmit={handleSubmitPhase2} className="space-y-6">
          <ScoreInput
            label="Sens de la négociation (/5)"
            value={phase2Scores.sens_negociation}
            onChange={(v) =>
              setPhase2Scores((p) => ({ ...p, sens_negociation: v }))
            }
          />

          <ScoreInput
            label="Capacité de persuasion (/5)"
            value={phase2Scores.capacite_persuasion}
            onChange={(v) =>
              setPhase2Scores((p) => ({
                ...p,
                capacite_persuasion: v,
              }))
            }
          />

          <ScoreInput
            label="Sens de la combativité (/5)"
            value={phase2Scores.sens_combativite}
            onChange={(v) =>
              setPhase2Scores((p) => ({ ...p, sens_combativite: v }))
            }
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white py-3 rounded-lg"
          >
            Sauvegarder Phase Simulation
          </button>
        </form>
      )}
    </div>
  )
}
