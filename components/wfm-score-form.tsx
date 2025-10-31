"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ConsolidationButton } from "@/components/consolidation-button"
import { Metier } from "@prisma/client"
import { calculateAutoDecisions, shouldShowTest } from "../lib/metier-utils"


type WFMScoreFormProps = {
  candidate: any
  score: any
  faceToFaceScores: any[]
}

export function WFMScoreForm({ candidate, score, faceToFaceScores }: WFMScoreFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [autoCalculated, setAutoCalculated] = useState(false)

  const [formData, setFormData] = useState({
    // Phase 1 - Ajout de visual_presentation
    visual_presentation: score?.visual_presentation?.toString() || "",
    voice_quality: score?.voice_quality?.toString() || "",
    verbal_communication: score?.verbal_communication?.toString() || "",
    phase1_ff_decision: score?.phase1_ff_decision || "",
    psychotechnical_test: score?.psychotechnical_test?.toString() || "",
    phase1_decision: score?.phase1_decision || "",

    // Phase 2 - Technical scores
    typing_speed: score?.typing_speed?.toString() || "",
    typing_accuracy: score?.typing_accuracy?.toString() || "",
    excel_test: score?.excel_test?.toString() || "",
    dictation: score?.dictation?.toString() || "",
    sales_simulation: score?.sales_simulation?.toString() || "",
    analysis_exercise: score?.analysis_exercise?.toString() || "",
    phase2_date: score?.phase2_date || "",
    phase2_ff_decision: score?.phase2_ff_decision || "",
    final_decision: score?.final_decision || "",
    comments: score?.comments || "",
  })

  // Calcul automatique des décisions quand les scores changent
  useEffect(() => {
    const hasPhase1Scores = formData.visual_presentation || formData.verbal_communication || formData.voice_quality
    const hasPhase2Scores = formData.typing_speed || formData.excel_test || formData.dictation || 
                           formData.sales_simulation || formData.analysis_exercise

    if (hasPhase1Scores || hasPhase2Scores) {
      calculateAutoDecisionsHandler()
    }
  }, [
    formData.visual_presentation,
    formData.verbal_communication, 
    formData.voice_quality,
    formData.typing_speed,
    formData.typing_accuracy,
    formData.excel_test,
    formData.dictation,
    formData.sales_simulation,
    formData.analysis_exercise
  ])

  const calculateAutoDecisionsHandler = () => {
    const scores = {
      visual_presentation: parseFloat(formData.visual_presentation) || 0,
      verbal_communication: parseFloat(formData.verbal_communication) || 0,
      voice_quality: parseFloat(formData.voice_quality) || 0,
      psychotechnical_test: parseFloat(formData.psychotechnical_test) || 0,
      typing_speed: parseInt(formData.typing_speed) || 0,
      typing_accuracy: parseFloat(formData.typing_accuracy) || 0,
      excel_test: parseFloat(formData.excel_test) || 0,
      dictation: parseFloat(formData.dictation) || 0,
      sales_simulation: parseFloat(formData.sales_simulation) || 0,
      analysis_exercise: parseFloat(formData.analysis_exercise) || 0,
    }

    const phase1FF = faceToFaceScores.filter((s) => s.phase === 1)
    const faceToFacePhase1Avg = phase1FF.length > 0 
      ? phase1FF.reduce((sum, s) => sum + Number(s.score), 0) / phase1FF.length 
      : 0

    const decisions = calculateAutoDecisions(
      candidate.metier as Metier,
      scores,
      faceToFacePhase1Avg
    )

    setFormData(prev => ({
      ...prev,
      phase1_ff_decision: decisions.phase1FfDecision,
      phase1_decision: decisions.phase1Decision,
      phase2_ff_decision: decisions.phase2FfDecision || "",
      final_decision: decisions.finalDecision
    }))

    setAutoCalculated(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const response = await fetch(`/api/scores/${candidate.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error("Erreur lors de l'enregistrement")
      }

      router.refresh()
      alert("Notes enregistrées avec succès")
    } catch (err) {
      setError("Une erreur est survenue")
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  // Calculate average Face to Face scores
  const phase1FF = faceToFaceScores.filter((s) => s.phase === 1)
  const phase2FF = faceToFaceScores.filter((s) => s.phase === 2)
  const avgPhase1 =
    phase1FF.length > 0 ? (phase1FF.reduce((sum, s) => sum + Number(s.score), 0) / phase1FF.length).toFixed(2) : "N/A"
  const avgPhase2 =
    phase2FF.length > 0 ? (phase2FF.reduce((sum, s) => sum + Number(s.score), 0) / phase2FF.length).toFixed(2) : "N/A"

  // Déterminer quels tests afficher selon le métier
  const showTypingTest = shouldShowTest(candidate.metier as Metier, 'typing')
  const showExcelTest = shouldShowTest(candidate.metier as Metier, 'excel')
  const showDictationTest = shouldShowTest(candidate.metier as Metier, 'dictation')
  const showSalesSimulationTest = shouldShowTest(candidate.metier as Metier, 'salesSimulation')
  const showPsychotechnicalTest = shouldShowTest(candidate.metier as Metier, 'psychotechnical')
  const showAnalysisExerciseTest = shouldShowTest(candidate.metier as Metier, 'analysisExercise')

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Face to Face Scores Summary */}
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <CardTitle className="text-foreground">Notes Face à Face (Saisies par les Jurys)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-muted/50 p-4 rounded-lg">
              <h4 className="font-medium text-foreground mb-2">Phase 1</h4>
              {phase1FF.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucune note saisie</p>
              ) : (
                <div className="space-y-2">
                  {phase1FF.map((s) => (
                    <div key={s.id} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {s.jury_name} ({s.role_type})
                      </span>
                      <span className="font-medium text-foreground">{s.score}/5</span>
                    </div>
                  ))}
                  <div className="pt-2 border-t border-border flex justify-between font-bold">
                    <span className="text-foreground">Moyenne</span>
                    <span className="text-primary">{avgPhase1}/5</span>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-muted/50 p-4 rounded-lg">
              <h4 className="font-medium text-foreground mb-2">Phase 2</h4>
              {phase2FF.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucune note saisie</p>
              ) : (
                <div className="space-y-2">
                  {phase2FF.map((s) => (
                    <div key={s.id} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {s.jury_name} ({s.role_type})
                      </span>
                      <span className="font-medium text-foreground">{s.score}/5</span>
                    </div>
                  ))}
                  <div className="pt-2 border-t border-border flex justify-between font-bold">
                    <span className="text-foreground">Moyenne</span>
                    <span className="text-primary">{avgPhase2}/5</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Phase 1 - Initial Interview */}
      <Card className="border-2 border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Phase 1 - Entretien Initial</CardTitle>
          {autoCalculated && (
            <p className="text-sm text-green-600">✓ Décisions calculées automatiquement</p>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Présentation Visuelle - NOUVEAU CHAMP */}
            <div className="space-y-2">
              <Label htmlFor="visual_presentation" className="text-foreground">
                Présentation Visuelle (/5)
              </Label>
              <Input
                id="visual_presentation"
                type="number"
                step="0.01"
                min="0"
                max="5"
                value={formData.visual_presentation}
                onChange={(e) => handleChange("visual_presentation", e.target.value)}
                className="border-border focus:ring-primary"
                placeholder="0-5"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="verbal_communication" className="text-foreground">
                Communication Verbale (/5)
              </Label>
              <Input
                id="verbal_communication"
                type="number"
                step="0.01"
                min="0"
                max="5"
                value={formData.verbal_communication}
                onChange={(e) => handleChange("verbal_communication", e.target.value)}
                className="border-border focus:ring-primary"
                placeholder="0-5"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="voice_quality" className="text-foreground">
                Qualité de la Voix (/5)
              </Label>
              <Input
                id="voice_quality"
                type="number"
                step="0.01"
                min="0"
                max="5"
                value={formData.voice_quality}
                onChange={(e) => handleChange("voice_quality", e.target.value)}
                className="border-border focus:ring-primary"
                placeholder="0-5"
              />
            </div>

            {/* Test Psychotechnique - Conditionnel */}
            {showPsychotechnicalTest && (
              <div className="space-y-2">
                <Label htmlFor="psychotechnical_test" className="text-foreground">
                  Test Psychotechnique (/10)
                </Label>
                <Input
                  id="psychotechnical_test"
                  type="number"
                  step="0.01"
                  min="0"
                  max="10"
                  value={formData.psychotechnical_test}
                  onChange={(e) => handleChange("psychotechnical_test", e.target.value)}
                  className="border-border focus:ring-primary"
                  placeholder="0-10"
                />
              </div>
            )}

            {/* Décisions Phase 1 - Auto-calculées */}
            <div className="space-y-2">
              <Label htmlFor="phase1_ff_decision" className="text-foreground">
                Décision FF Phase 1 {autoCalculated && "✓"}
              </Label>
              <Select
                value={formData.phase1_ff_decision}
                onValueChange={(value) => handleChange("phase1_ff_decision", value)}
              >
                <SelectTrigger className="border-border focus:ring-primary bg-muted/50">
                  <SelectValue placeholder="Auto-calculé" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FAVORABLE">FAVORABLE</SelectItem>
                  <SelectItem value="DÉFAVORABLE">DÉFAVORABLE</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phase1_decision" className="text-foreground">
                Décision Phase 1 {autoCalculated && "✓"}
              </Label>
              <Select
                value={formData.phase1_decision}
                onValueChange={(value) => handleChange("phase1_decision", value)}
              >
                <SelectTrigger className="border-border focus:ring-primary bg-muted/50">
                  <SelectValue placeholder="Auto-calculé" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIS">ADMIS</SelectItem>
                  <SelectItem value="ÉLIMINÉ">ÉLIMINÉ</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Phase 2 - Technical Tests - Affichage conditionnel */}
      {(showTypingTest || showExcelTest || showDictationTest || showSalesSimulationTest || showAnalysisExerciseTest) && (
        <Card className="border-2 border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Phase 2 - Épreuves Techniques</CardTitle>
            <p className="text-sm text-muted-foreground">
              Tests requis pour {candidate.metier}
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Saisie - Conditionnel */}
              {showTypingTest && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="typing_speed" className="text-foreground">
                      Rapidité de Saisie (MPM)
                    </Label>
                    <Input
                      id="typing_speed"
                      type="number"
                      min="0"
                      value={formData.typing_speed}
                      onChange={(e) => handleChange("typing_speed", e.target.value)}
                      className="border-border focus:ring-primary"
                      placeholder="≥ 17 MPM"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="typing_accuracy" className="text-foreground">
                      Précision de Saisie (%)
                    </Label>
                    <Input
                      id="typing_accuracy"
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={formData.typing_accuracy}
                      onChange={(e) => handleChange("typing_accuracy", e.target.value)}
                      className="border-border focus:ring-primary"
                      placeholder="≥ 85%"
                    />
                  </div>
                </>
              )}

              {/* Excel - Conditionnel */}
              {showExcelTest && (
                <div className="space-y-2">
                  <Label htmlFor="excel_test" className="text-foreground">
                    Test Excel (/5)
                  </Label>
                  <Input
                    id="excel_test"
                    type="number"
                    step="0.01"
                    min="0"
                    max="5"
                    value={formData.excel_test}
                    onChange={(e) => handleChange("excel_test", e.target.value)}
                    className="border-border focus:ring-primary"
                    placeholder="≥ 3/5"
                  />
                </div>
              )}

              {/* Dictée - Conditionnel */}
              {showDictationTest && (
                <div className="space-y-2">
                  <Label htmlFor="dictation" className="text-foreground">
                    Dictée (/20)
                  </Label>
                  <Input
                    id="dictation"
                    type="number"
                    step="0.01"
                    min="0"
                    max="20"
                    value={formData.dictation}
                    onChange={(e) => handleChange("dictation", e.target.value)}
                    className="border-border focus:ring-primary"
                    placeholder="≥ 16/20"
                  />
                </div>
              )}

              {/* Simulation Vente - Conditionnel */}
              {showSalesSimulationTest && (
                <div className="space-y-2">
                  <Label htmlFor="sales_simulation" className="text-foreground">
                    Simulation Vente (/5)
                  </Label>
                  <Input
                    id="sales_simulation"
                    type="number"
                    step="0.01"
                    min="0"
                    max="5"
                    value={formData.sales_simulation}
                    onChange={(e) => handleChange("sales_simulation", e.target.value)}
                    className="border-border focus:ring-primary"
                    placeholder="≥ 3/5"
                  />
                </div>
              )}

              {/* Exercice Analyse - Conditionnel */}
              {showAnalysisExerciseTest && (
                <div className="space-y-2">
                  <Label htmlFor="analysis_exercise" className="text-foreground">
                    Exercice d'Analyse (/10)
                  </Label>
                  <Input
                    id="analysis_exercise"
                    type="number"
                    step="0.01"
                    min="0"
                    max="10"
                    value={formData.analysis_exercise}
                    onChange={(e) => handleChange("analysis_exercise", e.target.value)}
                    className="border-border focus:ring-primary"
                    placeholder="≥ 6/10"
                  />
                </div>
              )}

              {/* Champs communs Phase 2 */}
              <div className="space-y-2">
                <Label htmlFor="phase2_date" className="text-foreground">
                  Date Présence Phase 2
                </Label>
                <Input
                  id="phase2_date"
                  type="date"
                  value={formData.phase2_date}
                  onChange={(e) => handleChange("phase2_date", e.target.value)}
                  className="border-border focus:ring-primary"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phase2_ff_decision" className="text-foreground">
                  Décision FF Phase 2 {autoCalculated && "✓"}
                </Label>
                <Select
                  value={formData.phase2_ff_decision}
                  onValueChange={(value) => handleChange("phase2_ff_decision", value)}
                >
                  <SelectTrigger className="border-border focus:ring-primary bg-muted/50">
                    <SelectValue placeholder="Auto-calculé" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FAVORABLE">FAVORABLE</SelectItem>
                    <SelectItem value="DÉFAVORABLE">DÉFAVORABLE</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Final Decision */}
      <Card className="border-2 border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Décision Finale</CardTitle>
          {autoCalculated && (
            <p className="text-sm text-green-600">✓ Décision finale calculée automatiquement</p>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="final_decision" className="text-foreground">
                Décision Finale {autoCalculated && "✓"}
              </Label>
              <Select value={formData.final_decision} onValueChange={(value) => handleChange("final_decision", value)}>
                <SelectTrigger className="border-border focus:ring-primary bg-muted/50">
                  <SelectValue placeholder="Auto-calculé" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="RECRUTE">RECRUTE</SelectItem>
                  <SelectItem value="NON_RECRUTE">NON RECRUTE</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="comments" className="text-foreground">
              Commentaires
            </Label>
            <Textarea
              id="comments"
              value={formData.comments}
              onChange={(e) => handleChange("comments", e.target.value)}
              rows={4}
              className="border-border focus:ring-primary"
              placeholder="Commentaires supplémentaires..."
            />
          </div>
        </CardContent>
      </Card>

      {error && <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{error}</div>}

      <div className="flex gap-4 justify-end">
        <Button type="button" variant="outline" onClick={() => router.back()} className="border-border hover:bg-muted">
          Annuler
        </Button>
        <Button type="submit" className="bg-primary hover:bg-accent text-primary-foreground" disabled={loading}>
          {loading ? "Enregistrement..." : "Enregistrer les Notes"}
        </Button>
      </div>

      {/* Consolidation Automatique */}
      <Card className="border-2 border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="text-green-900">Consolidation Automatique</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-green-700 text-sm">
            Appliquez la consolidation automatique pour calculer la décision finale basée sur tous les scores saisis.
          </p>
          <ConsolidationButton candidateId={candidate.id} />
          <p className="text-green-600 text-xs">
            Cette action analysera tous les scores et appliquera automatiquement la décision finale.
          </p>
        </CardContent>
      </Card>
    </form>
  )
}