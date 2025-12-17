// app/api/auth/change-password/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { hash, verify } from '@node-rs/argon2'
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
    const { currentPassword, newPassword } = body

    // Validation
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Tous les champs sont requis' },
        { status: 400 }
      )
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'Le nouveau mot de passe doit contenir au moins 8 caractères' },
        { status: 400 }
      )
    }

    // Récupérer l'utilisateur depuis Better Auth
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

    // Vérifier l'ancien mot de passe
    const isValidPassword = await verify(account.password, currentPassword, {
      memoryCost: 19456,
      timeCost: 2,
      outputLen: 32,
      parallelism: 1
    })

    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Mot de passe actuel incorrect' },
        { status: 400 }
      )
    }

    // Hasher le nouveau mot de passe
    const hashedPassword = await hash(newPassword, {
      memoryCost: 19456,
      timeCost: 2,
      outputLen: 32,
      parallelism: 1
    })

    // Mettre à jour le mot de passe dans la base de données
    await prisma.account.update({
      where: {
        id: account.id
      },
      data: {
        password: hashedPassword
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Mot de passe modifié avec succès'
    })

  } catch (error) {
    console.error('❌ Erreur lors du changement de mot de passe:', error)
    return NextResponse.json(
      { error: 'Erreur lors du changement de mot de passe' },
      { status: 500 }
    )
  }
}