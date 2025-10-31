// app/api/candidates/route.ts - Version corrigée
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { Metier, CallStatus } from "@prisma/client"

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session || (session.user as any).role !== "WFM") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const data = await request.json()

    // Validation des données requises
    const requiredFields = ['full_name', 'phone', 'birth_date', 'email', 'metier']
    const missingFields = requiredFields.filter(field => !data[field])
    
    if (missingFields.length > 0) {
      return NextResponse.json({ 
        error: "Champs manquants", 
        missing: missingFields 
      }, { status: 400 })
    }

    // Conversion et validation du métier
    const metierValue = data.metier as keyof typeof Metier
    if (!Metier[metierValue]) {
      return NextResponse.json({ 
        error: "Métier invalide",
        validMetiers: Object.keys(Metier) 
      }, { status: 400 })
    }

    // Calcul de l'âge automatique
    const birthDate = new Date(data.birth_date)
    const today = new Date()
    const age = today.getFullYear() - birthDate.getFullYear()
    
    // Vérifier si l'anniversaire est déjà passé cette année
    const hasBirthdayPassed = today.getMonth() > birthDate.getMonth() || 
      (today.getMonth() === birthDate.getMonth() && today.getDate() >= birthDate.getDate())
    
    const finalAge = hasBirthdayPassed ? age : age - 1

    // CORRECTION : Préparer les données avec la bonne structure pour Prisma
    const candidateData: any = {
      fullName: data.full_name,
      phone: data.phone,
      birthDate: birthDate,
      age: finalAge,
      diploma: data.diploma,
      institution: data.institution,
      email: data.email,
      location: data.location,
      smsSentDate: data.sms_sent_date ? new Date(data.sms_sent_date) : null,
      availability: data.availability,
      interviewDate: data.interview_date ? new Date(data.interview_date) : null,
      metier: Metier[metierValue],
      notes: data.notes || null,
    }

    // CORRECTION : Gérer la session différemment
    if (data.session_id) {
      // Vérifier que la session existe
      const existingSession = await prisma.recruitmentSession.findUnique({
        where: { id: data.session_id }
      })

      if (!existingSession) {
        return NextResponse.json({ error: "Session introuvable" }, { status: 400 })
      }

      candidateData.session = {
        connect: { id: data.session_id }
      }
    }

    const candidate = await prisma.candidate.create({
      data: candidateData
    })

    // CORRECTION : Créer l'entrée scores séparément
    await prisma.score.create({
      data: {
        candidateId: candidate.id,
        callStatus: 'NON_CONTACTE',
        callAttempts: 0,
      }
    })

    return NextResponse.json(candidate, { status: 201 })
  } catch (error) {
    console.error("Error creating candidate:", error)
    
    // Gestion d'erreurs spécifiques
    if (error instanceof Error) {
      if (error.message.includes('Unique constraint')) {
        return NextResponse.json({ error: "Un candidat avec cet email ou téléphone existe déjà" }, { status: 400 })
      }
      if (error.message.includes('Foreign key constraint')) {
        return NextResponse.json({ error: "Session introuvable" }, { status: 400 })
      }
    }
    
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}