// app/api/auth/change-email/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { verify } from '@node-rs/argon2'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    // Récupérer la session utilisateur
    const session = await auth.api.getSession({
      headers: await headers()
    })

    if (!session) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { newEmail, password } = body

    // Validation
    if (!newEmail || !password) {
      return NextResponse.json(
        { error: 'Tous les champs sont requis' },
        { status: 400 }
      )
    }

    // Validation format email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(newEmail)) {
      return NextResponse.json(
        { error: 'Format d\'email invalide' },
        { status: 400 }
      )
    }

    // Vérifier si l'email existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email: newEmail }
    })

    if (existingUser && existingUser.id !== session.user.id) {
      return NextResponse.json(
        { error: 'Cet email est déjà utilisé' },
        { status: 400 }
      )
    }

    // Récupérer le compte pour vérifier le mot de passe
    const account = await prisma.account.findFirst({
      where: {
        userId: session.user.id,
        providerId: 'credential'
      }
    })

    if (!account || !account.password) {
      return NextResponse.json(
        { error: 'Impossible de trouver les informations de connexion' },
        { status: 404 }
      )
    }

    // Vérifier le mot de passe
    const isValidPassword = await verify(account.password, password, {
      memoryCost: 19456,
      timeCost: 2,
      outputLen: 32,
      parallelism: 1
    })

    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Mot de passe incorrect' },
        { status: 400 }
      )
    }

    // Mettre à jour l'email
    await prisma.user.update({
      where: { id: session.user.id },
      data: { email: newEmail }
    })

    // Mettre à jour aussi dans account si nécessaire
    await prisma.account.updateMany({
      where: { userId: session.user.id },
      data: { accountId: newEmail }
    })

    return NextResponse.json({
      success: true,
      message: 'Email modifié avec succès',
      newEmail
    })

  } catch (error) {
    console.error('❌ Erreur lors du changement d\'email:', error)
    return NextResponse.json(
      { error: 'Erreur lors du changement d\'email' },
      { status: 500 }
    )
  }
}