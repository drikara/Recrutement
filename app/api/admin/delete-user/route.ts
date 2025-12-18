// app/api/admin/delete-user/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { prisma } from '@/lib/prisma'

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    })

    if (!session || session.user.role !== 'WFM') {
      console.log('❌ Non autorisé')
      return NextResponse.json(
        { error: 'Non autorisé - réservé aux administrateurs WFM' },
        { status: 403 }
      )
    }

    console.log('✅ API /api/admin/delete-user authorized')

    const body = await request.json()
    const { userId } = body

    console.log('📋 Body reçu:', body)
    console.log('🆔 userId:', userId)

    // Validation
    if (!userId) {
      console.log('❌ userId manquant')
      return NextResponse.json(
        { error: 'ID utilisateur requis' },
        { status: 400 }
      )
    }

    // Empêcher de supprimer son propre compte
    if (userId === session.user.id) {
      console.log('❌ Tentative de suppression de son propre compte')
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
      console.log('❌ Utilisateur introuvable:', userId)
      return NextResponse.json(
        { error: 'Utilisateur introuvable' },
        { status: 404 }
      )
    }

    console.log('👤 Utilisateur trouvé:', user.email)

    // Chercher le juryMember associé
    const juryMember = await prisma.juryMember.findUnique({
      where: { userId: userId },
      include: {
        faceToFaceScores: true,
        juryPresences: true
      }
    })

    console.log('👥 JuryMember:', juryMember ? `trouvé (${juryMember.id})` : 'non trouvé')

    // Vérifier s'il y a des données associées
    const hasScores = juryMember?.faceToFaceScores && juryMember.faceToFaceScores.length > 0
    const hasPresences = juryMember?.juryPresences && juryMember.juryPresences.length > 0

    console.log('📊 Données associées:', { 
      hasScores, 
      scoresCount: juryMember?.faceToFaceScores?.length || 0,
      hasPresences,
      presencesCount: juryMember?.juryPresences?.length || 0
    })

    if (hasScores || hasPresences) {
      console.log('❌ Utilisateur a des données associées')
      return NextResponse.json(
        { 
          error: 'Impossible de supprimer cet utilisateur car il a des données associées (évaluations ou présences). Vous pouvez désactiver le compte à la place.',
          hasAssociatedData: true
        },
        { status: 400 }
      )
    }

    console.log('🗑️ Début de la suppression...')

    // 1. Supprimer le juryMember s'il existe
    if (juryMember) {
      await prisma.juryMember.delete({
        where: { id: juryMember.id }
      })
      console.log('✅ JuryMember supprimé')
    }

    // 2. Supprimer les sessions
    const deletedSessions = await prisma.session.deleteMany({
      where: { userId: userId }
    })
    console.log(`✅ ${deletedSessions.count} sessions supprimées`)

    // 3. Supprimer les comptes
    const deletedAccounts = await prisma.account.deleteMany({
      where: { userId: userId }
    })
    console.log(`✅ ${deletedAccounts.count} comptes supprimés`)

    // 4. Supprimer l'utilisateur
    await prisma.user.delete({
      where: { id: userId }
    })
    console.log('✅ Utilisateur supprimé')

    console.log(`✅ Admin ${session.user.email} a supprimé l'utilisateur ${user.email}`)

    return NextResponse.json({
      success: true,
      message: `Utilisateur ${user.email} supprimé avec succès`
    })

  } catch (error) {
    console.error('❌ Erreur lors de la suppression:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la suppression de l\'utilisateur' },
      { status: 500 }
    )
  }
}