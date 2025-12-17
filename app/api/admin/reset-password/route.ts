// app/api/admin/reset-password/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { hash } from '@node-rs/argon2'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    // Vérifier que l'utilisateur est WFM
    const session = await auth.api.getSession({
      headers: await headers()
    })

    if (!session || session.user.role !== 'WFM') {
      return NextResponse.json(
        { error: 'Non autorisé - réservé aux administrateurs WFM' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { userId, newPassword } = body

    // Validation
    if (!userId || !newPassword) {
      return NextResponse.json(
        { error: 'Tous les champs sont requis' },
        { status: 400 }
      )
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'Le mot de passe doit contenir au moins 8 caractères' },
        { status: 400 }
      )
    }

    // Vérifier que l'utilisateur existe
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Utilisateur introuvable' },
        { status: 404 }
      )
    }

    // Récupérer le compte
    const account = await prisma.account.findFirst({
      where: {
        userId: userId,
        providerId: 'credential'
      }
    })

    if (!account) {
      return NextResponse.json(
        { error: 'Compte introuvable' },
        { status: 404 }
      )
    }

    // Hasher le nouveau mot de passe
    const hashedPassword = await hash(newPassword, {
      memoryCost: 19456,
      timeCost: 2,
      outputLen: 32,
      parallelism: 1
    })

    // Mettre à jour le mot de passe
    await prisma.account.update({
      where: { id: account.id },
      data: { password: hashedPassword }
    })

    console.log(`✅ Admin ${session.user.email} a réinitialisé le mot de passe de ${user.email}`)

    return NextResponse.json({
      success: true,
      message: `Mot de passe réinitialisé avec succès pour ${user.email}`
    })

  } catch (error) {
    console.error('❌ Erreur lors de la réinitialisation du mot de passe:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la réinitialisation du mot de passe' },
      { status: 500 }
    )
  }
}