// app/api/admin/delete-user/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { prisma } from '@/lib/prisma'

export async function DELETE(request: NextRequest) {
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
    const { userId } = body

    // Validation
    if (!userId) {
      return NextResponse.json(
        { error: 'ID utilisateur requis' },
        { status: 400 }
      )
    }

    // Empêcher de supprimer son propre compte
    if (userId === session.user.id) {
      return NextResponse.json(
        { error: 'Vous ne pouvez pas supprimer votre propre compte' },
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

    // Chercher le juryMember associé
    const juryMember = await prisma.juryMember.findUnique({
      where: { userId: userId },
      include: {
        faceToFaceScores: true,
        juryPresences: true
      }
    })

    // Vérifier s'il y a des données associées
    const hasScores = juryMember?.faceToFaceScores && juryMember.faceToFaceScores.length > 0
    const hasPresences = juryMember?.juryPresences && juryMember.juryPresences.length > 0

    if (hasScores || hasPresences) {
      return NextResponse.json(
        { 
          error: 'Impossible de supprimer cet utilisateur car il a des données associées (évaluations ou présences). Vous pouvez désactiver le compte à la place.',
          hasAssociatedData: true
        },
        { status: 400 }
      )
    }

    // Supprimer l'utilisateur et toutes ses données associées
    // L'ordre est important à cause des contraintes de clé étrangère
    
    // 1. Supprimer le juryMember s'il existe (cascade supprimera les relations)
    if (juryMember) {
      await prisma.juryMember.delete({
        where: { id: juryMember.id }
      })
    }

    // 2. Supprimer les sessions
    await prisma.session.deleteMany({
      where: { userId: userId }
    })

    // 3. Supprimer les comptes (accounts)
    await prisma.account.deleteMany({
      where: { userId: userId }
    })

    // 4. Supprimer l'utilisateur
    await prisma.user.delete({
      where: { id: userId }
    })

    console.log(`✅ Admin ${session.user.email} a supprimé l'utilisateur ${user.email}`)

    return NextResponse.json({
      success: true,
      message: `Utilisateur ${user.email} supprimé avec succès`
    })

  } catch (error) {
    console.error('❌ Erreur lors de la suppression de l\'utilisateur:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la suppression de l\'utilisateur' },
      { status: 500 }
    )
  }
}